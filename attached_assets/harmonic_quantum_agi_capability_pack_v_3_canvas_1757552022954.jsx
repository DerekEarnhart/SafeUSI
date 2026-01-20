import React, { useEffect, useRef, useState } from "react";

// =============================================================
// Harmonic‑Quantum AGI — Capability Pack v3
// Ported to a single React component so it can run directly here.
// Tailwind is available in this canvas; no external scripts required.
// =============================================================

// ---- Provider persistence (localStorage) ----
const defaultProvider = {
  name: "Local Narrative (offline)",
  kind: "local", // allowed: local | openai | gemini | http
  endpoint: "",
  apiKey: "",
};

function loadProvider() {
  try {
    const raw = localStorage.getItem("hq_provider");
    if (!raw) return defaultProvider;
    const p = JSON.parse(raw);
    return { ...defaultProvider, ...p };
  } catch (e) {
    return defaultProvider;
  }
}
function saveProvider(p) {
  localStorage.setItem("hq_provider", JSON.stringify(p));
}

// ---- AGI Core (augmented) ----
class AGICore {
  constructor() {
    this.version = "3.0-cap-pack";
    this.memoryVault = {
      belief_state: { safety: 0.8, efficiency: 0.7, curiosity: 0.6 },
      audit_trail: [],
      programming_skills: {},
      attributes: { permanence: "harmonic_stable", degradation: "none" },
    };
    this.capabilities = {
      recursivePlanner: true,
      autoReflexion: true,
      selfImprover: true,
      toolRegistryBridge: true,
      sandbox: true,
      metaOperatorEngine: true,
      hyperOperatorLab: true,
      mooreMachineSim: true,
    };
    this.weights = { reflexion: 0.6, planning: 0.7, risk: 0.2 };
    this.rigorous = false;
  }

  toggle(name) {
    this.capabilities[name] = !this.capabilities[name];
    return this.capabilities[name];
  }
  setRigor(b) {
    this.rigorous = !!b;
    return this.rigorous;
  }

  // --- Recursive Planner (beam-ish) over internal operators
  recursivePlan(goal, options = { beam: 3, depth: 3 }) {
    const ops = [
      { name: "retrieveMemory", fn: (g) => this.retrieveMemory(g, 2), gain: 0.2 },
      { name: "spectralMultiply", fn: () => this.spectralMultiply(1, 1, 0, 2, 0.5, Math.PI / 4), gain: 0.1 },
      { name: "qft", fn: () => this.qft([{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }]), gain: 0.1 },
      { name: "updateValues", fn: () => this.updateValues(this.memoryVault.belief_state, { curiosity: 0.1 }, { efficiency: 0.05 }), gain: 0.15 },
    ];
    let frontier = [{ plan: [], score: 0, state: {} }];
    for (let d = 0; d < options.depth; d++) {
      const cand = [];
      for (const node of frontier) {
        for (const op of ops) {
          const out = op.fn(goal);
          const score = node.score + op.gain + Math.random() * 0.05;
          cand.push({ plan: [...node.plan, { op: op.name, out }], score });
        }
      }
      cand.sort((a, b) => b.score - a.score);
      frontier = cand.slice(0, options.beam);
    }
    const best = frontier[0];
    this.memoryVault.audit_trail.push({ t: Date.now(), action: "recursive_plan", goal, score: best.score });
    return { description: "Recursive plan synthesis (conceptual)", goal, score: best.score.toFixed(3), steps: best.plan.map((p) => p.op) };
  }

  // --- Auto‑Reflexion (reasoning trace summarizer)
  autoReflexionTrace(prompt) {
    const obs = [
      "parsed‑intent: " + (prompt.slice(0, 48) + (prompt.length > 48 ? "…" : "")),
      "retrieved: memory‑anchors=2",
      "constraints: safety≤1, latency≤600ms",
      "plan: {draft→check→revise→emit}",
    ];
    return { description: "Reflexion trace (conceptual)", trace: obs };
  }

  // --- Self‑Improver (RSI) — tiny weight nudger
  selfImprove(feedback = {}) {
    const before = { ...this.weights };
    this.weights.reflexion = Math.min(1, this.weights.reflexion + (feedback.reflect || 0.05));
    this.weights.planning = Math.min(1, this.weights.planning + (feedback.plan || 0.03));
    this.weights.risk = Math.max(0, this.weights.risk - (feedback.risk || 0.02));
    const after = { ...this.weights };
    this.memoryVault.audit_trail.push({ t: Date.now(), action: "rsi_update", before, after });
    return { description: "Self‑Improver updated heuristic weights", before, after };
  }

  // --- Tool Registry Bridge (Python side adapter; HTTP stub)
  async runRegistryTool({ endpoint, apiKey, tool, args }) {
    if (!endpoint) return { error: "No endpoint configured. Provide a URL like http://localhost:7001/run_tool" };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: apiKey ? `Bearer ${apiKey}` : "" },
        body: JSON.stringify({ tool, args }),
      });
      const json = await res.json();
      return { ok: true, response: json };
    } catch (e) {
      return { error: "Registry call failed: " + e.message };
    }
  }

  // --- Lightweight Sandbox with Web Worker (not a security boundary)
  async runSandbox(code, inputs = {}) {
    const workerSrc = `onmessage = async (e)=>{ const { code, inputs } = e.data; try{ const fn = new Function('inputs', code); const result = await fn(inputs); postMessage({ ok:true, result }); }catch(err){ postMessage({ ok:false, error: String(err) }); } }`;
    const blob = new Blob([workerSrc], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    return new Promise((resolve) => {
      worker.onmessage = (ev) => {
        URL.revokeObjectURL(url);
        worker.terminate();
        resolve(ev.data);
      };
      worker.postMessage({ code, inputs });
    });
  }

  // === Math/quantum helpers ===
  spectralMultiply(f1, a1, p1, f2, a2, p2, n = 64) {
    const t = Array.from({ length: n }, (_, i) => (i / n) * 2 * Math.PI);
    const f = t.map((v) => a1 * Math.sin(f1 * v + p1));
    const g = t.map((v) => a2 * Math.sin(f2 * v + p2));
    const r = f.map((x, i) => x * g[i]);
    return { mixed: [f1 + f2, Math.abs(f1 - f2)], preview: r.slice(0, 8).map((x) => +x.toFixed(3)) };
  }
  qft(state) {
    const N = state.length;
    const out = new Array(N).fill(0).map(() => ({ re: 0, im: 0 }));
    for (let k = 0; k < N; k++)
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        const c = { re: Math.cos(angle), im: Math.sin(angle) };
        const a = state[n].re ?? state[n];
        const b = state[n].im ?? 0;
        out[k].re += a * c.re - b * c.im;
        out[k].im += a * c.im + b * c.re;
      }
    const s = Math.sqrt(N);
    out.forEach((z) => {
      z.re /= s;
      z.im /= s;
    });
    return { out: out.map((z) => `(${z.re.toFixed(2)}+${z.im.toFixed(2)}i)`) };
  }
  updateValues(cur, fb, ws) {
    const beta = 0.7, gamma = 0.2, delta = 0.1;
    const nv = { ...cur };
    for (const k of Object.keys(nv)) nv[k] = beta * nv[k] + gamma * (fb[k] || 0) + delta * (ws[k] || 0);
    this.memoryVault.belief_state = nv;
    return { updated: nv };
  }
  retrieveMemory(q, K = 2) {
    const mem = [
      { t: "Harmonic Algebra is fundamental.", v: [0.8, 0.2, 0.1] },
      { t: "Entanglement uses Bell states.", v: [0.1, 0.7, 0.2] },
      { t: "Primes are building blocks.", v: [0.3, 0.1, 0.6] },
      { t: "Blockchain = decentralized ledger.", v: [0.2, 0.3, 0.5] },
    ];
    const qv = [(q.length % 10) / 10, (q.charCodeAt(0) % 10) / 10, (q.charCodeAt(q.length - 1) % 10) / 10];
    const dot = (x, y) => x.reduce((s, a, i) => s + a * y[i], 0);
    const norm = (v) => Math.sqrt(dot(v, v));
    const sims = mem.map((m) => ({ text: m.t, sim: dot(qv, m.v) / (norm(qv) * norm(m.v)) }));
    sims.sort((a, b) => b.sim - a.sim);
    return { query: q, top: sims.slice(0, K).map((s) => ({ text: s.text, sim: +s.sim.toFixed(3) })) };
  }

  // --- Conceptual Benchmarking (simulated) ---
  simulateARCBenchmark() {
    const score = +(0.7 + Math.random() * 0.2).toFixed(2);
    const latency = Math.floor(100 + Math.random() * 500);
    return { description: "ARC benchmark (simulated)", metric: "Conceptual Reasoning Score", score, unit: "0-1", simulated_latency_ms: latency, notes: "Illustrative only" };
  }
  simulateSWELancerBenchmark() {
    const completionRate = +(0.6 + Math.random() * 0.3).toFixed(2);
    const errorRate = +(0.01 + Math.random() * 0.05).toFixed(2);
    return { description: "SWELancer benchmark (simulated)", metric: "Task Completion Rate", score: completionRate, unit: "0-1", simulated_error_rate: errorRate, notes: "Illustrative only" };
  }

  // --- Meta‑Operator Engine ---
  metaAnalyzeFunc(code) {
    const metrics = {
      len: code.length,
      loops: (code.match(/for\s*\(|while\s*\(/g) || []).length,
      recursions: (code.match(/\bfunction\b|=>/g) || []).length,
      complexityHint: "O(n)",
    };
    if (/for\s*\(.*for\s*\(/s.test(code)) metrics.complexityHint = "O(n^2)";
    if (/recursively|self\s*\(|\barguments\.callee\b/.test(code)) metrics.recursive = true;
    return { description: "Meta‑level analysis of function source", metrics };
  }
  metaWrapWithLogging(code) {
    return `return (function(){\n  const __log=[];\n  const __orig = (${code});\n  const wrapped = function(...args){ __log.push({t:Date.now(), args}); const out = __orig.apply(this,args); __log.push({t:Date.now(), out}); return out; };\n  return {wrapped, __log};\n})();`;
  }

  // --- Hyperoperator Lab ---
  upArrow(a, b) { return Math.pow(a, b); }
  doubleUpArrow(a, h) { // tetration height h, tiny bounds
    if (h <= 0) return 1; let v = a; for (let i = 1; i < h; i++) { v = Math.pow(a, Math.min(v, 8)); if (!isFinite(v) || v > 1e8) return "overflow"; } return v;
  }

  // --- Moore Machine Simulator ---
  runMoore({ states, start, transitions, outputs }, input) {
    let s = start; const trace = [];
    for (const ch of input) { const key = s + ":" + ch; s = transitions[key] ?? s; trace.push({ ch, s }); }
    return { finalState: s, output: outputs[s], trace };
  }
}

// ---- UI Helpers ----
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center space-x-3 py-1">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ProviderPanel({ provider, setProvider }) {
  const [p, setP] = useState(provider);
  const [health, setHealth] = useState("");
  const checkHealth = async () => {
    try {
      if (!p.endpoint) { setHealth("Set endpoint"); return; }
      const base = p.endpoint.replace(/\/(chat|run_tool).*/, "").replace(/\/$/, "");
      const target = (base || p.endpoint).replace(/\/$/, "") + "/health";
      const r = await fetch(target);
      const txt = await r.text();
      setHealth(r.ok ? txt : `HTTP ${r.status}: ${txt}`);
    } catch (e) { setHealth("Error: " + e.message); }
  };
  useEffect(() => setP(provider), [provider]);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-300">Provider Kind</label>
          <select className="w-full bg-gray-700 rounded p-2" value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value })}>
            <option value="local">Local Narrative (offline)</option>
            <option value="openai">OpenAI API (proxy)</option>
            <option value="gemini">Gemini API (proxy)</option>
            <option value="http">Custom HTTP (compatible)</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300">Endpoint URL</label>
          <input className="w-full bg-gray-700 rounded p-2" placeholder="https://your-proxy/run" value={p.endpoint || ""} onChange={(e) => setP({ ...p, endpoint: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300">API Key (stored locally)</label>
          <input className="w-full bg-gray-700 rounded p-2" placeholder="sk-…" value={p.apiKey || ""} onChange={(e) => setP({ ...p, apiKey: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => { setProvider(p); saveProvider(p); }}>Save Provider</button>
        <button className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={checkHealth}>Check Health</button>
        {health && <span className="text-xs text-gray-300">Status: {health}</span>}
      </div>
      <p className="text-xs text-gray-400">Secrets are kept in your browser's localStorage. Use a proxy in production.</p>
    </div>
  );
}

function CapabilitiesPanel({ core }) {
  const [, bump] = useState(0);
  const t = (name) => () => { core.toggle(name); bump((x) => x + 1); };
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-purple-300">Capability Switchboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-3 rounded">
          <Toggle label="Recursive Planner" checked={core.capabilities.recursivePlanner} onChange={t("recursivePlanner")} />
          <Toggle label="Auto‑Reflexion" checked={core.capabilities.autoReflexion} onChange={t("autoReflexion")} />
          <Toggle label="Self‑Improver (RSI)" checked={core.capabilities.selfImprover} onChange={t("selfImprover")} />
          <Toggle label="Tool Registry Bridge" checked={core.capabilities.toolRegistryBridge} onChange={t("toolRegistryBridge")} />
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <Toggle label="Sandbox Runner" checked={core.capabilities.sandbox} onChange={t("sandbox")} />
          <Toggle label="Meta‑Operator Engine" checked={core.capabilities.metaOperatorEngine} onChange={t("metaOperatorEngine")} />
          <Toggle label="Hyperoperator Lab (↑, ↑↑)" checked={core.capabilities.hyperOperatorLab} onChange={t("hyperOperatorLab")} />
          <Toggle label="Moore Machine Simulator" checked={core.capabilities.mooreMachineSim} onChange={t("mooreMachineSim")} />
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold mb-2">Quick Demos</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => alert(JSON.stringify(core.recursivePlan("improve UI"), null, 2))}>Recursive Plan</button>
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => alert(JSON.stringify(core.selfImprove({ reflect: .1, plan: .05, risk: .02 }), null, 2))}>Self‑Improve</button>
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => alert(JSON.stringify(core.autoReflexionTrace("design a photoreal physics UI"), null, 2))}>Reflexion</button>
        </div>
      </div>
    </div>
  );
}

function OperatorsLab({ core }) {
  const [src, setSrc] = useState("function add(a,b){ return a+b }");
  const [meta, setMeta] = useState(null);
  const [wrapOut, setWrapOut] = useState(null);
  const [tetr, setTetr] = useState({ a: 3, h: 3 });
  const [tetrOut, setTetrOut] = useState("");
  const [mmIn, setMmIn] = useState("abbaab");
  const [mmOut, setMmOut] = useState(null);

  const moore = { states: ["S0", "S1"], start: "S0", transitions: { "S0:a": "S1", "S1:a": "S0", "S0:b": "S0", "S1:b": "S1" }, outputs: { S0: "even‑a", S1: "odd‑a" } };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-300">Operators Lab — meta / recursive / hyper / moore</h3>

      <div className="bg-gray-800 p-4 rounded space-y-2">
        <div className="text-sm text-gray-300">Meta‑Operator Engine</div>
        <textarea className="w-full bg-gray-700 rounded p-2 min-h-[100px]" value={src} onChange={(e) => setSrc(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => setMeta(core.metaAnalyzeFunc(src))}>Analyze</button>
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => setWrapOut(core.metaWrapWithLogging(src))}>Wrap w/ Logging</button>
        </div>
        {meta && <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{JSON.stringify(meta, null, 2)}</pre>}
        {wrapOut && <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{wrapOut}</pre>}
      </div>

      <div className="bg-gray-800 p-4 rounded space-y-2">
        <div className="text-sm text-gray-300">Hyperoperator Lab (safe ranges)</div>
        <div className="flex items-center gap-3">
          <label>a</label><input className="bg-gray-700 rounded p-2 w-20" value={tetr.a} onChange={(e) => setTetr({ ...tetr, a: +e.target.value })} />
          <label>height</label><input className="bg-gray-700 rounded p-2 w-20" value={tetr.h} onChange={(e) => setTetr({ ...tetr, h: +e.target.value })} />
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => setTetrOut(String(core.doubleUpArrow(tetr.a, tetr.h)))}>Compute a↑↑h</button>
        </div>
        {tetrOut !== "" && <div className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm">a↑↑h = {String(tetrOut)}</div>}
      </div>

      <div className="bg-gray-800 p-4 rounded space-y-2">
        <div className="text-sm text-gray-300">Moore Machine Simulator</div>
        <div className="flex items-center gap-3">
          <label>input</label><input className="bg-gray-700 rounded p-2" value={mmIn} onChange={(e) => setMmIn(e.target.value)} />
          <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => setMmOut(core.runMoore(moore, mmIn))}>Run</button>
        </div>
        {mmOut && <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{JSON.stringify(mmOut, null, 2)}</pre>}
      </div>
    </div>
  );
}

function BenchmarkingModule({ core }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const run = async (which) => {
    setLoading(true);
    try {
      const res = which === "ARC" ? core.simulateARCBenchmark() : core.simulateSWELancerBenchmark();
      setRows((r) => [...r, { title: which + " Benchmark", result: res }]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-xl font-bold text-purple-300 mb-2">Conceptual Benchmarking</h3>
      <p className="text-gray-300 mb-4">Illustrative scores to demo UI/flow.</p>
      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => run("ARC")} disabled={loading}>Run ARC</button>
        <button className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={() => run("SWELancer")} disabled={loading}>Run SWELancer</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {rows.length === 0 && <div className="text-gray-400">No results yet.</div>}
        {rows.map((row, i) => (<pre key={i} className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{JSON.stringify(row.result, null, 2)}</pre>))}
        {loading && <div className="bg-fuchsia-800 p-3 rounded animate-pulse">running…</div>}
      </div>
    </div>
  );
}

function SandboxPanel({ core, registryProvider }) {
  const [code, setCode] = useState(`// Return a result; you can use inputs.foo\nreturn { value: (inputs.foo||2) ** 3 }`);
  const [inputs, setInputs] = useState('{"foo": 3}');
  const [out, setOut] = useState(null);

  const [tool, setTool] = useState("geo_art");
  const [args, setArgs] = useState('{"prompt":"midpoint fractal"}');
  const [regOut, setRegOut] = useState(null);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-300">Sandbox & Registry Bridge</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded space-y-2">
          <div className="text-sm text-gray-300">Sandboxed JS (Web Worker) — not a true security boundary</div>
          <textarea className="w-full bg-gray-700 rounded p-2 min-h-[140px]" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="flex items-center gap-2">
            <label className="text-xs">inputs JSON</label>
            <input className="bg-gray-700 rounded p-2 flex-1" value={inputs} onChange={(e) => setInputs(e.target.value)} />
            <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={async () => {
              try { const res = await core.runSandbox(code, JSON.parse(inputs || "{}")); setOut(res); } catch (e) { setOut({ ok: false, error: String(e) }); }
            }}>Run</button>
          </div>
          {out && <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{JSON.stringify(out, null, 2)}</pre>}
        </div>

        <div className="bg-gray-800 p-4 rounded space-y-2">
          <div className="text-sm text-gray-300">Tool Registry Bridge (Python service)</div>
          <div className="grid grid-cols-1 gap-2">
            <input className="bg-gray-700 rounded p-2" placeholder="tool name" value={tool} onChange={(e) => setTool(e.target.value)} />
            <input className="bg-gray-700 rounded p-2" placeholder='{"arg":"val"}' value={args} onChange={(e) => setArgs(e.target.value)} />
            <button className="px-3 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={async () => {
              const payload = { endpoint: registryProvider.endpoint, apiKey: registryProvider.apiKey, tool, args: JSON.parse(args || "{}") };
              const res = await core.runRegistryTool(payload); setRegOut(res);
            }}>Run Tool</button>
          </div>
          <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{`curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"tool":"geo_art","args":{"prompt":"midpoint fractal"}}' \\
  http://localhost:7001/run_tool`}</pre>
          {regOut && <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{JSON.stringify(regOut, null, 2)}</pre>}
        </div>
      </div>
    </div>
  );
}

function Chat({ core, provider }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function callProvider(prompt) {
    if (provider.kind === "local" || !provider.endpoint) {
      // Offline narrative: synthesize using AGICore
      const plan = core.capabilities.recursivePlanner ? core.recursivePlan(prompt) : null;
      const refl = core.capabilities.autoReflexion ? core.autoReflexionTrace(prompt) : null;
      return `I parsed your intent and assembled a plan.\n\nPlan: ${plan ? JSON.stringify(plan) : "—"}\nReflexion: ${refl ? JSON.stringify(refl) : "—"}`;
    }
    try {
      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: provider.apiKey ? `Bearer ${provider.apiKey}` : "" },
        body: JSON.stringify({ messages: [
          { role: "system", content: "Harmonic‑Quantum AGI persona. Be precise, concise, safe." },
          { role: "user", content: prompt },
        ] }),
      });
      const json = await res.json();
      return json.output || json.content || JSON.stringify(json);
    } catch (e) {
      return `Provider error: ${e.message}. Using offline fallback.`;
    }
  }

  const send = async () => {
    if (!input.trim() || loading) return;
    const user = { role: "user", text: input };
    setMessages((m) => [...m, user]);
    setInput("");
    setLoading(true);
    try {
      const txt = await callProvider(user.text);
      const reasoning = core.capabilities.autoReflexion ? core.autoReflexionTrace(user.text) : null;
      const ai = { role: "ai", text: txt, reasoning };
      setMessages((m) => [...m, ai]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-lg bg-gray-800 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-3 rounded-lg shadow-md ${m.role === "user" ? "bg-blue-900" : "bg-fuchsia-800"}`}>
              <div className="whitespace-pre-wrap text-white">{m.text}</div>
              {m.role === "ai" && m.reasoning && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-200">Show reasoning</summary>
                  <pre className="bg-gray-900 p-3 rounded text-blue-200 border border-gray-700 text-sm whitespace-pre-wrap">{JSON.stringify(m.reasoning, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-fuchsia-800 p-3 rounded-lg shadow-md animate-pulse text-white">thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center p-2 bg-gray-700 rounded-lg">
        <input className="flex-1 p-3 rounded-l-lg bg-gray-600 text-white placeholder-gray-400 focus:outline-none" placeholder="Ask the AGI anything…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="px-6 py-3 rounded-r-lg text-white font-bold bg-pink-600 hover:bg-pink-500 disabled:bg-gray-500" onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}

// --- Tiny Test Harness (adds a Tests tab) ---
function TestsPanel({ core }) {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  async function runTests() {
    setRunning(true);
    const R = [];
    const push = (name, ok, info = "") => R.push({ name, ok, info });

    // Test 1: recursivePlan returns expected structure
    try {
      const plan = core.recursivePlan("hello");
      const ok = !!(plan && plan.steps && Array.isArray(plan.steps));
      push("recursivePlan structure", ok, JSON.stringify(plan));
    } catch (e) { push("recursivePlan structure", false, String(e)); }

    // Test 2: metaAnalyzeFunc basic metrics
    try {
      const meta = core.metaAnalyzeFunc("function f(x){ for(let i=0;i<x;i++){} return x }");
      const ok = meta && meta.metrics && typeof meta.metrics.len === "number";
      push("metaAnalyzeFunc metrics", ok, JSON.stringify(meta));
    } catch (e) { push("metaAnalyzeFunc metrics", false, String(e)); }

    // Test 3: sandbox computation
    try {
      const out = await core.runSandbox("return { n:(inputs.x||0)+1 }", { x: 4 });
      push("sandbox run", out && out.ok && out.result && out.result.n === 5, JSON.stringify(out));
    } catch (e) { push("sandbox run", false, String(e)); }

    // Test 4: Moore machine parity of 'a'
    try {
      const moore = { states: ["S0", "S1"], start: "S0", transitions: { "S0:a": "S1", "S1:a": "S0", "S0:b": "S0", "S1:b": "S1" }, outputs: { S0: "even‑a", S1: "odd‑a" } };
      const r1 = core.runMoore(moore, "abba"); // two 'a' => even
      const r2 = core.runMoore(moore, "abbaab"); // three 'a' => odd
      push("moore even-a", r1.output === "even‑a", JSON.stringify(r1));
      push("moore odd-a", r2.output === "odd‑a", JSON.stringify(r2));
    } catch (e) { push("moore parity", false, String(e)); }

    setResults(R);
    setRunning(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500" onClick={runTests} disabled={running}>{running ? "Running…" : "Run Tests"}</button>
        <span className="text-sm text-gray-300">Adds sanity checks without altering behavior.</span>
      </div>
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`p-2 rounded border ${r.ok ? "border-green-500 text-green-300" : "border-red-500 text-red-300"}`}>
              <div className="font-semibold">{r.ok ? "PASS" : "FAIL"} — {r.name}</div>
              <pre className="text-xs whitespace-pre-wrap opacity-80">{r.info}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HQCapabilityPack() {
  const [core] = useState(() => new AGICore());
  const [provider, setProvider] = useState(loadProvider());
  const [tab, setTab] = useState("chat");
  const [rigor, setRigor] = useState(false);

  useEffect(() => { core.setRigor(rigor); }, [rigor]);

  return (
    <div className="min-h-screen w-full py-6 px-4 bg-gray-900 text-gray-100">
      <div className="max-w-5xl mx-auto p-4 bg-gray-900 rounded-lg shadow-xl">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-extrabold text-purple-300">Harmonic‑Quantum AGI — Capability Pack v3</h1>
          <p className="text-purple-400 text-sm mt-1">Recursive • Meta • Hyper • Moore • Sandbox • Registry</p>
          <div className="inline-block bg-gray-700 text-gray-200 px-3 py-1 rounded mt-2 text-xs">Core v{core.version} • Rigor: {rigor ? "ON" : "OFF"}</div>
          <div className="flex items-center justify-center mt-2 gap-2 text-sm">
            <label className="text-gray-400">Mathematical Rigor Mode</label>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={rigor} onChange={(e) => setRigor(e.target.checked)} />
              <div className="w-10 h-5 bg-gray-600 rounded-full p-1">
                <div className={`h-3 w-3 bg-white rounded-full transition-transform ${rigor ? "translate-x-5" : ""}`}></div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-center mb-4 gap-2">
          {["chat", "capabilities", "operators", "benchmarking", "sandbox", "provider", "tests"].map((t) => (
            <button key={t} className={`px-4 py-2 rounded-t ${tab === t ? "bg-fuchsia-800" : "bg-gray-800 hover:bg-gray-700"}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-b p-4 min-h-[480px]">
          {tab === "chat" && <Chat core={core} provider={provider} />}
          {tab === "capabilities" && <CapabilitiesPanel core={core} />}
          {tab === "operators" && <OperatorsLab core={core} />}
          {tab === "benchmarking" && <BenchmarkingModule core={core} />}
          {tab === "sandbox" && <SandboxPanel core={core} registryProvider={provider} />}
          {tab === "provider" && <ProviderPanel provider={provider} setProvider={setProvider} />}
          {tab === "tests" && <TestsPanel core={core} />}
        </div>

        <div className="pt-4 text-xs text-gray-400">
          <p>
            Tool Registry Bridge expects a Python service exposing <code>/run_tool</code> with JSON 
            <span> &#123;&#123; tool, args &#125;&#125; </span>
            and returns 
            <span> &#123;&#123; ok, response &#125;&#125; </span>.
            Pair with your <em>geometric_prover.py</em>, <em>image_gen.py</em>, <em>registry.py</em>, <em>sandbox_runner.py</em>.
          </p>
          <p>Sandbox is illustrative and not a real security boundary. Use a server‑side sandbox (e.g., subprocess+AST filter) for production.</p>
        </div>
      </div>
    </div>
  );
}
