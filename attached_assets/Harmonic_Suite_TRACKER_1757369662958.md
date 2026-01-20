# Harmonic Suite — Intake Triaging & Action Board
_Date: 2025‑09‑07 (America/New_York)_

This tracker maps the latest uploaded artifacts to concrete engineering actions. Use it as the single source of truth for near‑term execution.

## 0) Repo unification (target layout)
```
harmonic-suite/
  docs/                                   # specs, theory, PDFs (WSM results, workflows)
  web/                                    # Cosmic Intelligence site + assets
  src/
    cosmic/                               # analyzers, decoders, datasets, metrics, viz
    wsm_ha/                               # WSM-HA core + status tools
    fileflow/                             # PerceptionSystem, QHPU, PHL, summaries
  notebooks/                              # runnable demos (cosmic, WSM metrics, fileflow)
  tests/                                  # unit tests for metrics, analyzers, fileflow
  scripts/                                # CLIs (analyze, summarize, status)
  LICENSE
  README.md
```

---

## 1) Coherent Unified Summary (extended)
**File:** `coherent_unified_summary_full 2.txt`  
**Do now:**
- [ ] Extract key canonical definitions (HA, HAP, HRA, RUIS, HRDE) into `docs/handbook.md`.
- [ ] Convert “simulation experiments” into `tests/` stubs and `notebooks/` demos.
- [ ] Link each module in `src/` to its definition section (docstrings + README anchors).

**Deliverables:** `docs/handbook.md`, `tests/test_simulations.py`, `notebooks/experiments_index.ipynb`.

---

## 2) Harmonic Cognition — File Processing Workflow
**File:** `Harmonic Cognition — File Processing Workflow (v1).docx`  
**Do now:**
- [ ] Implement `src/fileflow/perception.py` (mime sniff, hashes, HS builder).
- [ ] Implement `src/fileflow/qhpu.py` (embeddings, null‑state embedding, compression notes).
- [ ] Implement `src/fileflow/phl.py` (append‑only ledger, indexing).
- [ ] Schema‑validate `processing_summary` (pydantic/dataclasses).

**Deliverables:** working pipeline + `tests/test_fileflow.py` + `scripts/fileflow_summarize.py`.

---

## 3) Cosmic Intelligence Research Hub (v3)
**File:** `cosmic_intelligence 3.html`  
**Do now:**
- [ ] Move page to `web/` and split CSS/JS to assets.
- [ ] Extract Python blueprints into `src/cosmic/blackhole_decoder.py` and `src/cosmic/harmonic_analyzer.py`.
- [ ] Add `notebooks/cosmic_demo.ipynb` (synthetic spectrum → residuals → FFT/autocorr plots).
- [ ] Add “Epistemic Status” banner + citations section.

**Deliverables:** `web/` site + runnable demo notebook + small CLI: `scripts/cosmic_analyze.py`.

---

## 4) WSM‑HA Revolutionary System Test Results
**File:** `WSM-HA Revolutionary System Test Results.pdf`  
**Do now:**
- [ ] Parse metrics into `notebooks/wsm_metrics.ipynb` (coherence, states, timings, compression).
- [ ] Build `src/wsm_ha/status.py` that reads JSON summary and prints a one‑page report.
- [ ] Wire a dashboard cell to graph coherence over time (historical runs).

**Deliverables:** JSON metrics + status CLI + notebook visualization.

---

## 5) css-shapes.js (build/runtime artifact)
**File:** `css-shapes.js`  
**Do now:**
- [ ] Move to `web/vendor/` or remove if unused.
- [ ] If used, wrap behind a capability check and document why it’s needed.

**Deliverables:** reduced web bundle or documented vendor dep.

---

## 6) RECURSIVEMETAland.py
**File:** `RECURSIVEMETAland.py`  
**Do now:**
- [ ] Inspect module purpose (meta‑operators? recursive ops? pipeline glue).
- [ ] If core, refactor into `src/common/recursive_meta.py` with tests.
- [ ] If exploratory, park in `experiments/` with a README.

**Deliverables:** refactor or archived experiment with notes.

---

## 7) CKLMZNKY Manus Space Code Access 3.zip / Tzolkin_260_Matrix.csv
**Files:** ZIP + CSV  
**Do now:**
- [ ] Unpack ZIP, inventory contents, and decide destination (web assets, data, or code).
- [ ] For `Tzolkin_260_Matrix.csv`, add a dataset loader in `src/cosmic/datasets.py` if relevant.

**Deliverables:** inventory log + dataset loader (optional).

---

## 8) QA & Testing
- [ ] `tests/test_metrics.py` (entropy, harmonic peaks, recurrence).
- [ ] `tests/test_fileflow.py` (0‑byte HS, null‑state embedding, ledger append).
- [ ] `tests/test_wsm_status.py` (parse → report).

---

## 9) Shipping checklist (MVP)
- [ ] `README.md` top‑level with architecture diagram + quickstart.
- [ ] `scripts/setup_env.sh` (venv + pip install).
- [ ] `python -m scripts.cosmic_analyze synthetic.csv` produces `report.html`.
- [ ] `python -m scripts.fileflow_summarize /path/to/file` prints JSON summary.
- [ ] `python -m src.wsm_ha.status latest.json` prints run status.

---

**Owner:** Derek Earnhart  
**Maintainer:** (this doc)  
**Status:** Draft v0.1
