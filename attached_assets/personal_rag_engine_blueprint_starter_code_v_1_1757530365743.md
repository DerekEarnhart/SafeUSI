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
