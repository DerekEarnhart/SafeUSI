/*
  Harmonic Orchestrator — minimal runtime for your v2.6.2 AGI UI
  Features: harmonic scheduler, typed I/O ports, offline‑first state, JSON export
  Drop-in ES module. No deps. Works in the same page as your inline Babel app.

  Usage (quick):
    import { Orchestrator, Nodes } from './harmonic-orchestrator.min.js';
    const orch = new Orchestrator({ name: 'AGI-Orch', storageKey: 'agi_orch_v1' });
    // Optional: add a translate driver (bridged from your UI)
    orch.setDrivers({ translate: async ({text,to,from}) => window.__bridgeTranslate?.(text,to,from) });
    // Wire a demo Translate node
    orch.registerNode(new Nodes.TranslateNode({
      id: 'xlate', priority: 1.0, tags: ['translator','llm'],
      inPort: 'translate.request', outPort: 'translate.response',
    }));
    // Start loop
    orch.start();

    // Send a test message
    orch.send('translate.request', { text: 'Hello', to: 'Spanish', from: 'auto' });
    // Listen for responses
    orch.on('translate.response', (msg) => console.log('XLATE:', msg.data));

  MIT License
*/

// ————————————————————————————————————————————————————————————————————————
// Small utilities
// ————————————————————————————————————————————————————————————————————————
const now = () => Date.now();
const uid = (p='m') => `${p}_${Math.random().toString(36).slice(2,8)}_${(now()%1e8).toString(36)}`;
const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
const freeze = (o) => Object.freeze(o);
const deepClone = (x) => JSON.parse(JSON.stringify(x));

function downloadJSON(obj, fname = `orch_export_${new Date().toISOString().replace(/[:.]/g,'-')}.json`) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fname; a.click();
  URL.revokeObjectURL(url);
}

// ————————————————————————————————————————————————————————————————————————
// Offline‑first KV store (localStorage minimal)
// ————————————————————————————————————————————————————————————————————————
class LocalKV {
  constructor(ns='orch_kv') { this.ns = ns; }
  _k(k) { return `${this.ns}:${k}`; }
  get(k, fallback=null) { try { const v = localStorage.getItem(this._k(k)); return v==null? fallback : JSON.parse(v); } catch { return fallback; } }
  set(k, v) { try { localStorage.setItem(this._k(k), JSON.stringify(v)); } catch {} }
  del(k) { try { localStorage.removeItem(this._k(k)); } catch {} }
  keys() { return Object.keys(localStorage).filter(k=>k.startsWith(this.ns+':')).map(k=>k.slice(this.ns.length+1)); }
}

// ————————————————————————————————————————————————————————————————————————
// Type registry with runtime checks
// ————————————————————————————————————————————————————————————————————————
const Type = freeze({
  TEXT: 'text', JSON: 'json', VECTOR: 'vector', BINARY: 'binary', ANY: 'any', LANG: 'lang'
});

const Validators = {
  [Type.TEXT]: (d) => typeof d === 'string',
  [Type.JSON]: (d) => d !== null && typeof d === 'object' && !(d instanceof ArrayBuffer),
  [Type.VECTOR]: (d) => Array.isArray(d) && d.every(n => typeof n === 'number' && Number.isFinite(n)),
  [Type.BINARY]: (d) => d instanceof ArrayBuffer || ArrayBuffer.isView(d),
  [Type.LANG]: (d) => typeof d === 'string' && d.length > 0 && d.length <= 8,
  [Type.ANY]: (_) => true,
};

function ensureValid(type, data, schemaFn) {
  const ok = (Validators[type] || Validators.any)(data);
  if (!ok) throw new Error(`Type check failed for type ${type}`);
  if (schemaFn) {
    const s = schemaFn(data);
    if (s !== true) throw new Error(`Schema validation failed: ${s || 'false'}`);
  }
}

// ————————————————————————————————————————————————————————————————————————
// Message & Port
// ————————————————————————————————————————————————————————————————————————
class Message {
  constructor(port, data, meta={}) {
    this.id = uid('msg');
    this.port = port; // port name
    this.data = data;
    this.ts = now();
    this.meta = { ...meta };
  }
}

class Port {
  constructor({ name, direction='in', type=Type.ANY, schema=null, persist=false }) {
    this.name = name; this.direction = direction; this.type = type; this.schema = schema; this.persist = !!persist;
    this.queue = []; // for in‑ports
    this.subs = new Set();
  }
  send(data, meta) { ensureValid(this.type, data, this.schema); const msg = new Message(this.name, data, meta); this.subs.forEach(fn => fn(msg)); return msg; }
  enqueue(data, meta) { ensureValid(this.type, data, this.schema); const msg = new Message(this.name, data, meta); this.queue.push(msg); return msg; }
  dequeue() { return this.queue.shift(); }
  size() { return this.queue.length; }
  on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); }
}

// ————————————————————————————————————————————————————————————————————————
// Node base
// ————————————————————————————————————————————————————————————————————————
class NodeBase {
  constructor({ id, name, priority=1, tags=[] }) {
    this.id = id || uid('node');
    this.name = name || this.constructor.name;
    this.priority = priority; // 0..∞
    this.tags = Array.from(new Set(tags));
    this.stats = { processed: 0, errors: 0, lastRun: 0 };
    this.inputs = {}; // name -> Port
    this.outputs = {}; // name -> Port
  }
  // Attach orchestrator wires ports
  _attach(portsByName) {
    // override in subclass to declare ports
  }
  // Ready to run? default: if any input has items
  ready() { return Object.values(this.inputs).some(p => p.size() > 0); }
  // One step of work. Return true if did work.
  async tick(_ctx) { return false; }
}

// ————————————————————————————————————————————————————————————————————————
// Harmonic scheduler (score by demand, freshness, priority, resonance)
// ————————————————————————————————————————————————————————————————————————
class HarmonicScheduler {
  constructor({ intentTags = [], weights = { demand: 0.4, freshness: 0.2, priority: 0.2, resonance: 0.2 } } = {}) {
    this.intentTags = new Set(intentTags);
    this.weights = weights;
    this.lastSeen = new Map(); // nodeId -> ts
  }
  setIntentTags(tags=[]) { this.intentTags = new Set(tags); }
  score(node) {
    const nowTs = now();
    // demand: total queued inputs (0..N) → tanh‑scaled 0..1
    const demandRaw = Object.values(node.inputs).reduce((s,p)=>s+p.size(),0);
    const demand = Math.tanh(demandRaw / 3);
    // freshness: time since last run (0..∞) → 0..1
    const last = node.stats.lastRun || 0; const age = (nowTs - last)/1000; // s
    const freshness = Math.tanh(age / 5);
    // priority: normalize via 1‑exp(‑p)
    const pri = 1 - Math.exp(-clamp(node.priority, 0, 10));
    // resonance: Jaccard of tags vs intent
    const tags = new Set(node.tags);
    const inter = [...tags].filter(t => this.intentTags.has(t)).length;
    const union = new Set([...tags, ...this.intentTags]).size || 1;
    const resonance = inter / union;

    const w = this.weights;
    const score = w.demand*demand + w.freshness*freshness + w.priority*pri + w.resonance*resonance;
    return score;
  }
}

// ————————————————————————————————————————————————————————————————————————
// Orchestrator
// ————————————————————————————————————————————————————————————————————————
export class Orchestrator {
  constructor({ name='Orchestrator', storageKey='orch_v1', autosaveMs=1000, intentTags=[], weights } = {}) {
    this.name = name; this.storageKey = storageKey; this.kv = new LocalKV(storageKey);
    this.ports = new Map(); // name -> Port
    this.nodes = new Map(); // id -> NodeBase
    this.scheduler = new HarmonicScheduler({ intentTags, weights });
    this.loopHandle = null; this.running = false;
    this.log = []; this.logMax = 400;
    this.drivers = {}; // external functions e.g., translate

    // restore snapshot if any
    this._restore();
  }

  setDrivers(drivers) { this.drivers = { ...this.drivers, ...drivers }; }
  driver(name) { return this.drivers[name]; }

  // ——— Ports ———
  ensurePort(name, opts={}) { if (!this.ports.has(name)) this.ports.set(name, new Port({ name, ...opts })); return this.ports.get(name); }
  getPort(name) { return this.ports.get(name); }
  on(name, fn) { return this.ensurePort(name, { direction: 'out' }).on(fn); }
  send(name, data, meta) {
    const p = this.ensurePort(name, { direction: 'in' });
    const msg = p.enqueue(data, meta);
    if (p.persist) this._save();
    this._log('in', name, msg.id);
    return msg;
  }

  // ——— Nodes ———
  registerNode(node) {
    if (!(node instanceof NodeBase)) throw new Error('registerNode expects a Node');
    // Let node declare its ports via _attach
    node._attach({
      in: (name, opts) => this.ensurePort(name, { direction:'in', ...opts }),
      out: (name, opts) => this.ensurePort(name, { direction:'out', ...opts }),
    });
    this.nodes.set(node.id, node);
    return node.id;
  }

  removeNode(id) { this.nodes.delete(id); }

  // ——— Loop ———
  start() { if (this.running) return; this.running = true; const step = async () => { if (!this.running) return; await this._step(); this.loopHandle = setTimeout(step, 16); }; step(); }
  stop() { this.running = false; if (this.loopHandle) { clearTimeout(this.loopHandle); this.loopHandle = null; } this._save(); }

  async _step() {
    // find best ready node
    let best = null; let bestScore = -1;
    for (const n of this.nodes.values()) {
      if (!n.ready()) continue;
      const s = this.scheduler.score(n);
      if (s > bestScore) { bestScore = s; best = n; }
    }
    if (!best) return; // idle
    try {
      const did = await best.tick({ orch: this, drivers: this.drivers });
      best.stats.lastRun = now(); if (did) best.stats.processed++;
      this._log('run', best.name, { did });
    } catch (e) {
      best.stats.errors++; this._log('err', best.name, { error: String(e) });
    }
    // autosave lightweight
    this._autosave();
  }

  setIntentTags(tags=[]) { this.scheduler.setIntentTags(tags); this._log('intent', null, tags); }

  // ——— Export / Import ———
  snapshot() {
    return {
      meta: { name: this.name, ts: now() },
      nodes: [...this.nodes.values()].map(n => ({ id:n.id, name:n.name, priority:n.priority, tags:n.tags, stats:n.stats })),
      ports: [...this.ports.values()].map(p => ({ name:p.name, dir:p.direction, type:p.type, persist:p.persist, qlen:p.queue.length })),
      log: this.log.slice(-this.logMax),
    };
  }

  exportJSON(download=true) { const snap = this.snapshot(); if (download) downloadJSON(snap); return snap; }

  _restore() {
    const saved = this.kv.get('snapshot'); if (!saved) return;
    try {
      // we only restore persisted port queues & log; nodes are code‑defined
      const log = saved.log || []; this.log = log;
      const q = saved.portQueues || {};
      for (const [name, arr] of Object.entries(q)) {
        const p = this.ensurePort(name, { direction:'in', type:Type.ANY, persist:true });
        p.queue = arr.map(m => Object.assign(new Message(name, m.data, m.meta||{}), { id:m.id, ts:m.ts }));
      }
    } catch {}
  }

  _autosave() { if (this._asTimer) return; this._asTimer = setTimeout(()=>{ this._save(); this._asTimer=null; }, 1000); }

  _save() {
    const portQueues = {}; for (const p of this.ports.values()) if (p.persist) portQueues[p.name] = p.queue.map(m => ({ id:m.id, ts:m.ts, data:m.data, meta:m.meta }));
    this.kv.set('snapshot', { log: this.log.slice(-this.logMax), portQueues });
  }

  _log(kind, who, data) {
    const entry = { t: now(), kind, who, data };
    this.log.push(entry); if (this.log.length > this.logMax) this.log.shift();
  }
}

// ————————————————————————————————————————————————————————————————————————
// Built‑in Nodes
// ————————————————————————————————————————————————————————————————————————
class EchoNode extends NodeBase {
  constructor({ id, inPort='echo.in', outPort='echo.out', priority=0.5, tags=['debug'] }={}) {
    super({ id, name:'EchoNode', priority, tags }); this._in = inPort; this._out = outPort; }
  _attach({ in: IN, out: OUT }) {
    this.inputs.main = IN(this._in, { type: Type.ANY, persist:true });
    this.outputs.main = OUT(this._out, { type: Type.ANY });
  }
  async tick({ orch }) {
    const msg = this.inputs.main.dequeue(); if (!msg) return false;
    this.outputs.main.send({ echo: msg.data, ts: now() }, { via: this.id });
    return true;
  }
}

class TranslateNode extends NodeBase {
  constructor({ id, inPort='translate.request', outPort='translate.response', priority=1.0, tags=['translator','llm'] }={}) {
    super({ id, name:'TranslateNode', priority, tags }); this._in = inPort; this._out = outPort; }
  _attach({ in: IN, out: OUT }) {
    this.inputs.req = IN(this._in, { type: Type.JSON, persist:true, schema: (d)=> (d && typeof d.text==='string' && d.to) || 'expected {text,to,from?}' });
    this.outputs.res = OUT(this._out, { type: Type.JSON });
  }
  ready() { return this.inputs.req.size() > 0; }
  async tick({ drivers }) {
    const msg = this.inputs.req.dequeue(); if (!msg) return false;
    const { text, to, from='auto' } = msg.data;
    const fn = drivers.translate;
    if (!fn) { this.outputs.res.send({ error:'no driver', text, to, from }); return true; }
    const out = await fn({ text, to, from });
    this.outputs.res.send({ in: msg.data, out });
    return true;
  }
}

export const Nodes = { EchoNode, TranslateNode };

// Expose Type enum for convenience
export const Types = Type;
