# Personal RAG Engine — Blueprint & Starter Code (v1)

A self‑hosted Retrieval‑Augmented Generation stack for **your entire chat history** (ChatGPT exports + other apps). Designed for **huge datasets (500–600 GB+)**, offline‑first, and privacy‑preserving.

---

## What this gives you

- **Ingestion pipeline** for JSON/HTML exports (streaming, dedup, chunking, metadata).
- **Hybrid retrieval**: lexical (Postgres full‑text) + vector (Qdrant) + reranker (optional).
- **FastAPI search/RAG API** with endpoints: `/search`, `/nearby`, `/ask`, `/remind`.
- **Docker Compose** for infra (Qdrant + Postgres) and simple local dev.
- **Scale knobs** to handle 100M+ chunks (sharding, batching, compaction).

> You can start coarse‑grained (conversation‑level) then refine to message‑level and finally long‑message sub‑chunking.

---

## Architecture

```
          ┌──────────┐     stream/parse      ┌─────────────┐
  Exports │ JSON/ZIP │ ───────────────▶     │  Ingestor    │
 (GPT etc)│  HTML    │     + dedup + chunk   │(Python, mp)  │
          └──────────┘                        └──────┬──────┘
                                                      │
                                        metadata      │   vectors
                                      (messages,      │  (embeds)
                                     conv, roles)     │
                                  ┌─────────────┐     ▼
                                  │  Postgres   │ ◀── Qdrant ── HNSW
                                  │ (full-text) │     (ANN)
                                  └──────┬──────┘
                                         │ hybrid retrieve
                                         ▼
                                   RAG Orchestrator (FastAPI)
                                      ├─ /search (hybrid + rerank)
                                      ├─ /nearby (thread context)
                                      └─ /ask (retrieval + LLM, pluggable)
```

- **Postgres**: authoritative store for conversations/messages; BM25‑like search via `tsvector` + GIN.
- **Qdrant**: vector search at scale (disk‑backed HNSW). Payload holds message IDs for joins.
- **Reranker (optional)**: cross‑encoder (e.g., `bge-reranker-large`) for top‑K reranking.

---

## Quickstart

1. **Create project**

```
mkdir personal-rag && cd personal-rag
```

2. **Write files below** (`docker-compose.yml`, `requirements.txt`, etc.)

3. **Boot infra**

```
docker compose up -d
```

4. **Create tables & indexes**

```
psql postgresql://postgres:postgres@localhost:5432/ragdb -f schema.sql
```

5. **Install Python deps (host venv)**

```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

6. **Ingest your exports** (point to your actual files / folders)

```
python ingest.py \
  --input ./data/exports \
  --pg postgresql://postgres:postgres@localhost:5432/ragdb \
  --qdrant http://localhost:6333 \
  --collection personal_rag \
  --model BAAI/bge-base-en-v1.5 \
  --batch 512 --workers 6
```

7. **Run API**

```
uvicorn search_api:app --host 0.0.0.0 --port 8000
```

8. **Try it**

```
curl 'http://localhost:8000/search?q=remind+me+about+the+quantum+workflow' | jq
```

---

## docker-compose.yml

```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333", "6334:6334"]
    volumes:
      - qdrant_storage:/qdrant/storage
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334
      QDRANT__STORAGE__USE_MMAP: "true"

  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ragdb
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  qdrant_storage:
  pg_data:
```

---

## requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
orjson==3.10.0
pydantic==2.8.2
numpy==1.26.4
pandas==2.2.2
ijson==3.2.3
beautifulsoup4==4.12.3
html5lib==1.1
qdrant-client==1.9.1
psycopg2-binary==2.9.9
SQLAlchemy==2.0.29
sentence-transformers==2.7.0
scikit-learn==1.5.1
rank-bm25==0.2.2            # fallback rerank
python-dotenv==1.0.1
```

> For GPU acceleration, install `torch`/`onnxruntime-gpu` suitable for your system.

---

## schema.sql (Postgres)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  source TEXT NOT NULL,                -- 'chatgpt', 'claude', 'slack', etc.
  title TEXT,
  created_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('system','user','assistant','tool','other')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  token_count INT,
  sha256 TEXT UNIQUE,
  chunk_index INT DEFAULT 0,
  char_start INT DEFAULT 0,
  char_end INT DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb
);

-- Full‑text index (English default; adjust for multi‑lang)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tsv tsvector;
UPDATE messages SET tsv = to_tsvector('english', coalesce(content,''));
CREATE INDEX IF NOT EXISTS idx_messages_tsv ON messages USING GIN (tsv);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);

-- Trigger to keep tsv fresh
CREATE OR REPLACE FUNCTION messages_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english', coalesce(NEW.content,''));
  RETURN NEW;
END$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_tsv ON messages;
CREATE TRIGGER trg_messages_tsv BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION messages_tsv_update();
```

---

## ingest.py (streaming parser → Postgres + Qdrant)

```python
#!/usr/bin/env python3
import argparse, os, sys, json, hashlib, uuid, time
from datetime import datetime
import ijson
from bs4 import BeautifulSoup
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import numpy as np
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sentence_transformers import SentenceTransformer

# ---------- Utils ----------
def sha256(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8', errors='ignore')).hexdigest()

def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]

SPLIT_RE = r"(?<=[.!?]\s)|\n{2,}"

def smart_chunk(text: str, target_len=800, hard_max=2000):
    import re
    text = (text or '').strip()
    if not text:
        return []
    if len(text) <= target_len:
        return [text]
    parts = [p.strip() for p in re.split(SPLIT_RE, text) if p.strip()]
    out, cur = [], ''
    for p in parts:
        if len(cur) + len(p) <= target_len:
            cur = (cur + ' ' + p).strip()
        else:
            if cur: out.append(cur)
            if len(p) > hard_max:
                for i in range(0, len(p), hard_max):
                    out.append(p[i:i+hard_max])
                cur = ''
            else:
                cur = p
    if cur: out.append(cur)
    return out

# ---------- DB ----------
engine = None
meta = sa.MetaData()
conversations = sa.Table('conversations', meta,
    sa.Column('id', sa.Uuid, primary_key=True),
    sa.Column('source', sa.Text, nullable=False),
    sa.Column('title', sa.Text),
    sa.Column('created_at', sa.DateTime(timezone=True)),
    sa.Column('meta', sa.JSON))
messages = sa.Table('messages', meta,
    sa.Column('id', sa.Uuid, primary_key=True),
    sa.Column('conversation_id', sa.Uuid, sa.ForeignKey('conversations.id', ondelete='CASCADE')),
    sa.Column('role', sa.Text),
    sa.Column('content', sa.Text, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True)),
    sa.Column('token_count', sa.Integer),
    sa.Column('sha256', sa.Text, unique=True),
    sa.Column('chunk_index', sa.Integer),
    sa.Column('char_start', sa.Integer),
    sa.Column('char_end', sa.Integer),
    sa.Column('meta', sa.JSON),
    sa.Column('tsv', sa.Text))  # computed by trigger

# ---------- Ingestors ----------

def ingest_chatgpt_json(path, src, writer):
    with open(path, 'rb') as f:
        # root is either array or object with 'conversations'
        parser = ijson.parse(f)
        # Try to stream items regardless of layout
        # Collect minimal state
        buf = None
        for prefix, event, value in parser:
            if (prefix, event) == ('item', 'start_map'):
                buf = {}
            elif event == 'map_key' and buf is not None:
                cur_key = value
            elif buf is not None and event in ('string','number','boolean','null'):
                buf[cur_key] = value
            elif (prefix, event) == ('item', 'end_map') and buf is not None:
                # Heuristic: expect keys like 'id','title','create_time','mapping'
                conv_id = uuid.uuid4()
                title = buf.get('title') or 'Conversation'
                created = None
                if 'create_time' in buf:
                    try:
                        created = datetime.fromtimestamp(float(buf['create_time']))
                    except Exception:
                        created = None
                writer.write_conversation(conv_id, src, title, created, meta={k:v for k,v in buf.items() if k not in ('mapping','title','create_time')})
                mapping = buf.get('mapping') or {}
                for node in mapping.values():
                    msg = node.get('message') or {}
                    role = (msg.get('author') or {}).get('role') or 'other'
                    content = None
                    parts = (msg.get('content') or {}).get('parts')
                    if isinstance(parts, list) and parts:
                        content = '\n'.join(p for p in parts if isinstance(p,str))
                    if not content:
                        continue
                    created_at = None
                    try:
                        created_at = datetime.fromtimestamp(float(msg.get('create_time'))) if msg.get('create_time') else None
                    except Exception:
                        pass
                    writer.write_message(conv_id, role, content, created_at)
                buf = None


def ingest_html_thread(path, src, writer):
    html = open(path, 'r', encoding='utf-8', errors='ignore').read()
    soup = BeautifulSoup(html, 'html5lib')
    # Very generic fallback: collect text nodes inside plausible message containers
    # Customize per source if needed
    conv_id = uuid.uuid4()
    writer.write_conversation(conv_id, src, os.path.basename(
```


---

## search_api.py (FastAPI — hybrid search + RAG hooks)

```python
#!/usr/bin/env python3
from typing import List, Optional
from fastapi import FastAPI, Query
from pydantic import BaseModel
import sqlalchemy as sa
from sqlalchemy import text
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import os

PG_URL = os.getenv('PG_URL', 'postgresql://postgres:postgres@localhost:5432/ragdb')
QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
COLL = os.getenv('QDRANT_COLLECTION', 'personal_rag')
EMB = os.getenv('EMBED_MODEL', 'BAAI/bge-base-en-v1.5')

app = FastAPI(title='Personal RAG API')
engine = sa.create_engine(PG_URL, pool_pre_ping=True)
embedder = SentenceTransformer(EMB)
qd = QdrantClient(url=QDRANT_URL)

class Hit(BaseModel):
    message_id: str
    conversation_id: str
    role: str
    content: str
    created_at: Optional[str] = None
    score: float

class SearchResponse(BaseModel):
    hits: List[Hit]

@app.get('/health')
def health():
    return {'ok': True}

@app.get('/nearby', response_model=SearchResponse)
def nearby(message_id: str, radius: int = 3):
    with engine.begin() as conn:
        row = conn.execute(text('SELECT conversation_id, chunk_index FROM messages WHERE id = :id'), {'id': message_id}).first()
        if not row:
            return {'hits': []}
        conv, idx = row
        rows = conn.execute(text('''
            SELECT id, conversation_id, role, content, created_at, 1.0 as score
            FROM messages
            WHERE conversation_id = :c AND chunk_index BETWEEN :a AND :b
            ORDER BY chunk_index
        '''), {'c': conv, 'a': max(0, idx-radius), 'b': idx+radius}).fetchall()
        return {'hits': [Hit(message_id=str(r.id), conversation_id=str(r.conversation_id), role=r.role, content=r.content, created_at=str(r.created_at) if r.created_at else None, score=float(r.score)) for r in rows]}

@app.get('/search', response_model=SearchResponse)
def search(q: str = Query(..., min_length=1), k: int = 20, alpha: float = 0.5):
    """Hybrid: lexical (tsvector) + vector (Qdrant). alpha blends (0=lex,1=vec)."""
    # Vector branch
    v = embedder.encode([q], normalize_embeddings=True)[0]
    vres = qd.search(collection_name=COLL, query_vector=v.tolist(), limit=max(k, 100))
    vec_scores = { (hit.payload or {}).get('message_id') or str(hit.id): float(hit.score) for hit in vres }

    # Lexical branch (ts_rank)
    with engine.begin() as conn:
        lrows = conn.execute(text('''
            SELECT id::text as id, conversation_id::text as conversation_id, role, content, created_at,
                   ts_rank(tsv, plainto_tsquery('english', :q)) AS rank
            FROM messages
            WHERE tsv @@ plainto_tsquery('english', :q)
            ORDER BY rank DESC
            LIMIT :lim
        '''), {'q': q, 'lim': max(k, 100)}).fetchall()
    lex_scores = {r.id: float(r.rank) for r in lrows}

    # Normalize and merge
    def norm(d):
        if not d:
            return {}
        mx = max(d.values())
        return {k: (v/mx if mx>0 else 0.0) for k,v in d.items()}
    ln, vn = norm(lex_scores), norm(vec_scores)
    ids = set(ln) | set(vn)
    merged = [(mid, alpha*vn.get(mid,0.0) + (1-alpha)*ln.get(mid,0.0)) for mid in ids]
    merged.sort(key=lambda x: x[1], reverse=True)
    mids = [m for m,_ in merged[:k]]

    if not mids:
        return {'hits': []}
    with engine.begin() as conn:
        rows = conn.execute(text('''
            SELECT id::text as id, conversation_id::text as conversation_id, role, content, created_at
            FROM messages WHERE id = ANY(:ids)
        '''), {'ids': mids}).fetchall()
    lookup = {r.id: r for r in rows}

    hits = []
    for mid, score in merged:
        if mid in lookup and len(hits) < k:
            r = lookup[mid]
            hits.append(Hit(message_id=r.id, conversation_id=r.conversation_id, role=r.role, content=r.content, created_at=str(r.created_at) if r.created_at else None, score=float(score)))
    return {'hits': hits}

class AskRequest(BaseModel):
    q: str
    k: int = 12
    alpha: float = 0.5

@app.post('/ask')
def ask(body: AskRequest):
    """Retrieve top‑K and return a prompt‑ready context block.
    (Hook your favorite LLM client in the caller.)
    """
    res = search(body.q, k=body.k, alpha=body.alpha)
    context = "

".join([f"[{i+1}] ({h.role}) {h.content}" for i,h in enumerate(res['hits'])])
    prompt = f"""You are my memory assistant. Use ONLY the context snippets to answer the question.
If unsure, say you don't know.

Question: {body.q}
Context:
{context}
"""
    return { 'prompt': prompt, 'hits': res['hits'] }
```

---

## .env.sample

```
PG_URL=postgresql://postgres:postgres@localhost:5432/ragdb
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=personal_rag
EMBED_MODEL=BAAI/bge-base-en-v1.5
```

---

## Scale & ops notes (600 GB class)

- **Chunking**: start 700–900 chars; for long assistant dumps, allow 1500–2000.
- **Dedup**: sha256 per chunk → skips repeated boilerplate.
- **Qdrant**: use memmap (default above), set `hnsw_ef` to ~128–256 for queries; snapshot nightly; store on NVMe.
- **Postgres**: run `VACUUM (ANALYZE)` weekly, enable `pg_trgm`, consider partitioning `messages` by month for 100M+ rows.
- **Rerank (optional)**: add `bge-reranker-large` (cross-encoder) to rerank top‑200 from hybrid stage.
- **Backups**: pg_dump for Postgres; `qdrant snapshot create` for vectors.
- **PDFs**: add a `pdf_ingest.py` using `pymupdf` or `pdfminer.six` for text extraction; store page refs in `meta`.

