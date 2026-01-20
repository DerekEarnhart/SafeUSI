import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Harmonic Sovereign Console — v1.3 (single‑file, client‑only)
 * -----------------------------------------------------------------
 * What you get in one file:
 *  • Memory Vault (audit trail, JSON import/export, file ingest)
 *  • Quantum‑Harmonic Orchestrator (toy multi‑agent plan/app/creative)
 *  • Chat + Translation Bridge (LLM‑backed or local sim)
 *  • Utilities (toy Number‑Pipe, spectral multiply demo, benchmarks sim)
 *  • Settings (OpenAI/Gemini key storage+tests, provider switch, backups)
 *
 * Notes:
 *  • Keys are stored in localStorage for demo only. Use a backend in prod.
 *  • Remote calls may be blocked by CORS when served from file:// domains.
 *  • Pure React + Tailwind classes; no external UI imports.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tiny UI primitives (no external deps)
// ──────────────────────────────────────────────────────────────────────────────
const cx = (...s) => s.filter(Boolean).join(" ")
const Button = ({
  children,
  onClick,
  variant = "default",
  size = "md",
  disabled,
  className,
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cx(
      "rounded-2xl shadow-sm transition active:scale-[0.99] border",
      size === "sm" ? "text-xs px-3 py-1.5" : size === "xs" ? "text-[11px] px-2 py-1" : "px-4 py-2",
      variant === "secondary" && "bg-slate-900/40 border-slate-800 text-slate-100 hover:bg-slate-900/60",
      variant === "outline" && "bg-transparent border-slate-700 text-slate-100 hover:bg-slate-900/40",
      variant === "destructive" && "bg-red-600/90 border-red-700 text-white hover:bg-red-600",
      variant === "default" && "bg-cyan-500/90 border-cyan-600 text-slate-900 hover:bg-cyan-500",
      disabled && "opacity-60 cursor-not-allowed",
      className
    )}
    {...props}
  >
    {children}
  </button>
)
const Card = ({ children, className }) => (
  <div className={cx("rounded-3xl border border-slate-800/60 bg-slate-900/40", className)}>{children}</div>
)
const CardHeader = ({ children, className }) => (
  <div className={cx("px-4 pt-4 pb-2 border-b border-slate-800/60", className)}>{children}</div>
)
const CardTitle = ({ children }) => (
  <div className="text-base font-semibold tracking-wide flex items-center gap-2">{children}</div>
)
const CardContent = ({ children, className }) => (
  <div className={cx("p-4", className)}>{children}</div>
)
const Input = ({ className, ...props }) => (
  <input className={cx("w-full rounded-xl bg-slate-900/40 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40", className)} {...props} />
)
const Textarea = ({ className, ...props }) => (
  <textarea className={cx("w-full min-h-[90px] rounded-xl bg-slate-900/40 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40", className)} {...props} />
)
const Badge = ({ children, variant = "secondary", className }) => (
  <span className={cx(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] border",
    variant === "secondary" && "bg-slate-900/50 border-slate-800 text-slate-200",
    variant === "outline" && "bg-transparent border-slate-700 text-slate-300",
    variant === "destructive" && "bg-red-900/30 border-red-800 text-red-200",
    className
  )}>{children}</span>
)
const Pill = ({ children }) => (
  <span className="text-[11px] rounded-full border px-2 py-0.5 bg-slate-900/50 border-slate-800 text-slate-300 whitespace-nowrap">{children}</span>
)
const Progress = ({ value }) => (
  <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden border border-slate-800">
    <div className="h-full bg-cyan-500/80" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
  </div>
)

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function ts(ms) {
  try { const d = new Date(ms); if (isNaN(d.getTime())) return String(ms); return d.toLocaleString(); } catch { return String(ms) }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function seedRand(seed) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); const t = (h ^= h >>> 16) >>> 0; return t / 4294967296 }
}
function download(name, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
function textToBigIntString(s) { const enc = new TextEncoder().encode(s); let hex = ""; for (const b of enc) hex += b.toString(16).padStart(2, "0"); const big = BigInt("0x" + (hex || "00")); return big.toString(10) }
function bigIntStringToText(n) { let big = BigInt(n || "0"); let hex = big.toString(16); if (hex.length % 2) hex = "0" + hex; const bytes = new Uint8Array(hex.length / 2); for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16); return new TextDecoder().decode(bytes) }
function speak(text) { try { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)) } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// AGICore (local toy engine)
// ──────────────────────────────────────────────────────────────────────────────
class AGICore {
  constructor(opts = {}) {
    this.memoryVault = opts.memoryVault || {
      audit_trail: [],
      belief_state: { A: 1, B: 1, C: 1 },
      code_knowledge: {},
      programming_skills: {},
      attributes: { degradation: "none", permanence: "harmonic_stable", fading: "none" },
    }
    this.dreamState = opts.dreamState || { last_active: null, summary: "idle", core_beliefs: {} }
    this.mathematicalRigorMode = !!opts.mathematicalRigorMode
  }
  toggleMathematicalRigor() { this.mathematicalRigorMode = !this.mathematicalRigorMode; return this.mathematicalRigorMode }
  spectralMultiply(freq1, amp1, phase1, freq2, amp2, phase2, numSamples = 128) {
    const t = Array.from({ length: numSamples }, (_, i) => (i / numSamples) * 2 * Math.PI)
    const f_t = t.map(v => amp1 * Math.sin(freq1 * v + phase1))
    const g_t = t.map(v => amp2 * Math.sin(freq2 * v + phase2))
    const result = f_t.map((fv, i) => fv * g_t[i])
    const mixed = [freq1 + freq2, Math.abs(freq1 - freq2)]
    return { description: "Simulated spectral multiplication (direct method).", output_waveform_preview: result.slice(0, 12).map(x => Number(x.toFixed(3))), conceptual_mixed_frequencies: mixed }
  }
  simulateARCBenchmark() { const score = parseFloat((Math.random() * 0.2 + 0.74).toFixed(3)); return { description: "Simulated ARC benchmark", metric: "ReasoningScore", score, latency_ms: Math.round(Math.random() * 400 + 80) } }
  simulateSWELancerBenchmark() { const score = parseFloat((Math.random() * 0.3 + 0.6).toFixed(3)); return { description: "Simulated SWELancer benchmark", completion_rate: score, error_rate: parseFloat((Math.random() * 0.04 + 0.01).toFixed(3)) } }
  retrieveMemory(query) {
    const dummy = [
      { text: "Harmonic Algebra concept", embedding: [0.8, 0.2, 0.1] },
      { text: "Quantum entanglement note", embedding: [0.1, 0.7, 0.2] },
    ]
    const score = (s) => Math.max(0, 1 - Math.abs(s.length - query.length) / Math.max(10, query.length))
    const matches = dummy.map(d => ({ ...d, sim: Number(score(d.text).toFixed(3)) })).sort((a, b) => b.sim - a.sim)
    return { description: "Memory retrieval (demo)", query, top_matches: matches.slice(0, 2) }
  }
  generateConceptualReasoning(query, opts = {}) {
    const timestamp = Date.now()
    const steps = []
    steps.push(`Perception: detected intent in "${query.slice(0, 80)}".`)
    steps.push("Analysis: invoked harmonic primitives (simulated).")
    if (this.mathematicalRigorMode || opts.rigor) steps.push("Mathematical Rigor: attach formal steps where available.")
    steps.push("Synthesis: balanced clarity and depth.")
    const mix = /spectral|multiply|spectrum|sin/i.test(query)
      ? (() => { const m = this.spectralMultiply(1, 1, 0, 2, 0.5, Math.PI / 4); return `Spectral multiply → mixed ${m.conceptual_mixed_frequencies.join(", ")}` })()
      : /benchmark|arc|swe/i.test(query)
      ? (() => { const a = this.simulateARCBenchmark(); return `Benchmark (sim): ${a.metric}=${a.score} latency=${a.latency_ms}ms` })()
      : /memory|recall|remember/i.test(query)
      ? (() => { const m = this.retrieveMemory(query); return `Memory: ${m.top_matches.map(t => t.text+` (sim:${t.sim})`).join("; ")}` })()
      : `Plan for: "${query}" — 1) formalize ops; 2) simulate; 3) log artifacts.`
    this.memoryVault.audit_trail.push({ timestamp, action: "generate_response", cue: query })
    return { reply: mix, reasoning: steps.join("\n"), meta: { timestamp } }
  }
  async receiveFile(name, size, type) {
    const now = Date.now()
    const details = { fileName: name, fileSize: size, fileType: type || "application/octet-stream", ingestion: "Perception analyzed metadata & signature.", compression: "Harmonic embedding (toy).", large_io_handling: size > 5_000_000 ? "Routed via distributed pipeline." : "Standard path.", media_viewing: /^image\//.test(type||"") ? "Image-type (viewer available)." : "Not visual media.", memory_integration: "Embedded into Persistent Harmonic Ledger (sim)." }
    this.memoryVault.audit_trail.unshift({ timestamp: now, action: "file_received_and_processed", details })
    return details
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// LLM provider helpers (OpenAI/Gemini) + Translation Bridge
// ──────────────────────────────────────────────────────────────────────────────
async function testOpenAIKey(key) {
  try {
    const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } })
    if (!res.ok) return { ok: false, message: `OpenAI test failed: ${res.status} ${res.statusText}` }
    const json = await res.json();
    return { ok: true, message: `OpenAI OK — models: ${Array.isArray(json.data) ? json.data.length : "?"}` }
  } catch (e) { return { ok: false, message: `OpenAI test error (CORS/network): ${e.message}` } }
}
async function testGeminiKey(key) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`)
    if (!res.ok) return { ok: false, message: `Gemini test failed: ${res.status} ${res.statusText}` }
    const json = await res.json();
    const names = (json.models||[]).slice(0, 3).map(m=>m.name).join(", ")
    return { ok: true, message: `Gemini OK — sample: ${names || "(no list)"}` }
  } catch (e) { return { ok: false, message: `Gemini test error (CORS/network): ${e.message}` } }
}

async function openaiTranslate({ key, text, direction }) {
  const system = direction === "user_to_framework"
    ? "Translate the user's message into succinct, precise technical English optimized for an AGI framework. Keep semantics exact."
    : "Translate the framework's technical output back to the user's casual, friendly English without losing meaning."
  const body = { model: "gpt-4o-mini", messages: [ { role: "system", content: system }, { role: "user", content: text } ] }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`OpenAI translate error: ${res.status}`)
  const j = await res.json()
  return j.choices?.[0]?.message?.content?.trim() || text
}
async function geminiTranslate({ key, text, direction }) {
  const system = direction === "user_to_framework"
    ? "Translate the user's message into succinct, precise technical English optimized for an AGI framework. Keep semantics exact."
    : "Translate the framework's technical output back to the user's casual, friendly English without losing meaning."
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`
  const payload = { contents: [ { role: "user", parts: [ { text: `${system}\n\nTEXT:\n${text}` } ] } ] }
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`Gemini translate error: ${res.status}`)
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text
}

async function translationBridge({ provider, openaiKey, geminiKey, text, direction }) {
  if (provider === "openai" && openaiKey) return openaiTranslate({ key: openaiKey, text, direction })
  if (provider === "gemini" && geminiKey) return geminiTranslate({ key: geminiKey, text, direction })
  // Offline/local fallback: identity mapping (no change)
  return text
}

// ──────────────────────────────────────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────────────────────────────────────
export default function HarmonicSovereignConsole() {
  // Global tabs
  const [tab, setTab] = useState("console") // console | chat | settings

  // Memory Vault
  const seedVault = useMemo(() => ({
    audit_trail: [ { timestamp: Date.now(), action: "init", details: { fileName: "—", fileSize: 0, fileType: "meta", ingestion: "Console initialized.", compression: "N/A", large_io_handling: "standard", media_viewing: "N/A", memory_integration: "Ledger bootstrapped." } } ],
    supported_file_types: "all_known_formats_via_harmonic_embedding",
    attributes: { degradation: "none", permanence: "harmonic_stable", fading: "none" },
    belief_state: { A: 1, B: 1, C: 1 },
    large_io_capability: "harmonic_compression_and_distributed_processing_framework",
    code_knowledge: {}, programming_skills: {}
  }), [])
  const [vault, setVault] = useState(structuredClone(seedVault))
  const [vaultJson, setVaultJson] = useState(JSON.stringify(seedVault, null, 2))
  const [vaultOk, setVaultOk] = useState(true)
  const [alphaA, setAlphaA] = useState(vault.belief_state.A)
  const [alphaB, setAlphaB] = useState(vault.belief_state.B)
  const [alphaC, setAlphaC] = useState(vault.belief_state.C)
  const alphaSum = alphaA + alphaB + alphaC
  const probs = useMemo(() => ({ A: alphaA/alphaSum, B: alphaB/alphaSum, C: alphaC/alphaSum }), [alphaA,alphaB,alphaC,alphaSum])

  // Toy engine
  const [agi] = useState(() => new AGICore({}))
  const [rigor, setRigor] = useState(agi.mathematicalRigorMode)

  // KB stream
  const [kb, setKb] = useState(["Boot: Quantum Harmonic Principles + Agent Models loaded."]) 
  const addKB = (msg) => setKb(k => [...k, `[${new Date().toLocaleTimeString()}] ${msg}`])

  // Orchestrator
  const [task, setTask] = useState("")
  const [coherence, setCoherence] = useState(0)
  const [dissonance, setDissonance] = useState(false)
  const [busy, setBusy] = useState(false)
  const [appOut, setAppOut] = useState("")
  const [planOut, setPlanOut] = useState("")
  const [creaOut, setCreaOut] = useState("")
  const [finalOut, setFinalOut] = useState("Awaiting workflow completion…")
  const coherenceBar = Math.max(0, Math.min(100, coherence))

  // Chat + Bridge
  const [messages, setMessages] = useState(() => { try { return JSON.parse(localStorage.getItem("hagi:messages")||"[]") } catch { return [] } })
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showReasoningMap, setShowReasoningMap] = useState({})
  const [bridgeOn, setBridgeOn] = useState(true)
  const endRef = useRef(null)

  // Benchmarks
  const [bench, setBench] = useState([])

  // Settings
  const [provider, setProvider] = useState(() => localStorage.getItem("hagi_provider") || "none") // none|openai|gemini
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem("hagi_openai_key") || "")
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("hagi_gemini_key") || "")
  const [apiTestStatus, setApiTestStatus] = useState(null)

  // Effects
  useEffect(() => { localStorage.setItem("hagi:messages", JSON.stringify(messages)); endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => { localStorage.setItem("hagi_openai_key", openaiKey) }, [openaiKey])
  useEffect(() => { localStorage.setItem("hagi_gemini_key", geminiKey) }, [geminiKey])
  useEffect(() => { localStorage.setItem("hagi_provider", provider) }, [provider])

  // Vault ops
  function saveBeliefToVault() {
    const next = structuredClone(vault)
    next.belief_state = { A: alphaA, B: alphaB, C: alphaC }
    setVault(next)
    setVaultJson(JSON.stringify(next, null, 2))
    addKB("Belief priors committed to Memory Vault.")
  }
  function importVaultFromJson() {
    try {
      const parsed = JSON.parse(vaultJson)
      setVault(parsed)
      if (parsed?.belief_state) {
        setAlphaA(Number(parsed.belief_state.A)||1)
        setAlphaB(Number(parsed.belief_state.B)||1)
        setAlphaC(Number(parsed.belief_state.C)||1)
      }
      setVaultOk(true)
      addKB("Imported Memory Vault JSON.")
    } catch { setVaultOk(false) }
  }
  function exportVault() { download("memory_vault.json", JSON.stringify(vault, null, 2)) }
  async function ingestFile(f) {
    const details = await agi.receiveFile(f.name, f.size, f.type||"application/octet-stream")
    const next = structuredClone(vault)
    next.audit_trail.unshift({ timestamp: Date.now(), action: "file_received_and_processed", details })
    setVault(next)
    setVaultJson(JSON.stringify(next, null, 2))
    addKB(`Ingested file: ${f.name} (${f.size} bytes).`)
  }

  // Orchestrator agents (toy)
  async function synthApp(t) {
    const rng = seedRand("app:"+t)
    const hooks = ["prime‑quantum compression", "infinite context surfaces", "safety‑preserving operator", "self‑auditing traces", "harmonic scheduler"]
    const pick = hooks[Math.floor(rng()*hooks.length)]
    return `Minimal orchestrator for "${t}" with ${pick}, typed IO ports, offline‑first state, JSON export.`
  }
  async function synthPlan(t) {
    const steps = ["Define intent → constraints → success metrics","Decompose into agents; assign capabilities","Parallel search; collect artifacts","Score with coherence + cost; downselect","Assemble final; generate tests + README"]
    return steps.map((s,i)=>`${i+1}. ${s} (for "${t}")`).join("\n")
  }
  async function synthCreative(t) {
    const rng = seedRand("crea:"+t)
    const vibes = ["neon on slate","matte indigo","graphite + cyan","midnight gradient"]
    const motifs = ["concentric waves","lattice lines","phosphor dots","isometric orbits"]
    return `Art direction: ${vibes[Math.floor(rng()*vibes.length)]}. Motif: ${motifs[Math.floor(rng()*motifs.length)]}. Tone: confident, lucid, technical‑poetic.`
  }
  async function runOrchestrator(refine=false) {
    if (busy) return
    setBusy(true); setDissonance(false); setFinalOut(refine?"Refinement cycle initiated…":"Orchestrating…")
    const t = task.trim(); if (!t) { setFinalOut("Please enter a task for the AGI."); setBusy(false); return }
    addKB(refine?"Refinement pass: re‑equilibrating.":"Harmonizing intent.")
    setCoherence(refine?Math.max(10, coherence*0.8):10); await sleep(320); setCoherence(c=>c+18)
    await sleep(280); addKB("Task decomposed; agents entangled."); setCoherence(c=>c+20)
    const [a,p,cTxt] = await Promise.all([synthApp(t), synthPlan(t), synthCreative(t)])
    setAppOut(a); setPlanOut(p); setCreaOut(cTxt)
    addKB("Parallel execution complete."); setCoherence(c=>Math.min(85,c+15)); await sleep(380)
    const out = `Workflow for: "${t}"\n--- App Synthesizer ---\n${a}\n\n--- Strategic Planner ---\n${p}\n\n--- Creative Modulator ---\n${cTxt}\n\nFinal coherence check: ${Math.round(coherenceBar)}%`
    setFinalOut(out); addKB("Coherence collapse achieved. Output synthesized."); setCoherence(95)
    const noisy = Math.random() < (refine?0.1:0.25)
    if (noisy) { setDissonance(true); setCoherence(c=>Math.max(40,c-20)); addKB("Dissonance detected → re‑equilibrating…"); await sleep(900); setDissonance(false); setCoherence(100); addKB("Re‑harmonized. Optimal resonance.") } else { setCoherence(100); addKB("System fully harmonized.") }
    setBusy(false)
  }

  // Chat ops with bridge
  const toggleReasoning = (id) => setShowReasoningMap(s => ({ ...s, [id]: !s[id] }))
  async function sendMessage() {
    const raw = input.trim(); if (!raw) return
    setInput("")
    const userMsg = { id: `${Date.now()}:u`, sender: "user", text: raw, time: Date.now() }
    setMessages(m => [...m, userMsg]); setIsLoading(true)
    try {
      // Bridge: user → framework
      const bridgedIn = bridgeOn ? await translationBridge({ provider, openaiKey, geminiKey, text: raw, direction: "user_to_framework" }) : raw
      const result = agi.generateConceptualReasoning(bridgedIn, { rigor })
      // Bridge: framework → user
      const bridgedOut = bridgeOn ? await translationBridge({ provider, openaiKey, geminiKey, text: result.reply, direction: "framework_to_user" }) : result.reply
      const modelMsg = { id: `${Date.now()}:m`, sender: "model", text: bridgedOut, reasoning: result.reasoning, time: Date.now() }
      setMessages(m => [...m, modelMsg])
    } catch (e) {
      setMessages(m => [...m, { id: `${Date.now()}:err`, sender: "system", text: `Bridge error: ${e.message}. Falling back to local sim.`, time: Date.now() }])
      const r = agi.generateConceptualReasoning(raw, { rigor })
      setMessages(m => [...m, { id: `${Date.now()}:m2`, sender: "model", text: r.reply, reasoning: r.reasoning, time: Date.now() }])
    } finally { setIsLoading(false) }
  }
  async function handleFile(file) { if (!file) return; const meta = await agi.receiveFile(file.name, file.size, file.type || "unknown"); setMessages(m => [...m, { id: `${Date.now()}:f`, sender: "system", text: `File processed: ${file.name}`, meta }]) }

  // Benchmarks quick actions
  function runBenchmark(which) {
    setIsLoading(true)
    setTimeout(() => {
      const res = which === "ARC" ? agi.simulateARCBenchmark() : agi.simulateSWELancerBenchmark()
      setBench(b => [{ id: Date.now(), type: which, res }, ...b]); setIsLoading(false)
    }, 420 + Math.random()*380)
  }

  // Settings actions
  function masked(s) { return s ? (s.length > 8 ? `${s.slice(0,4)}…${s.slice(-3)}` : "••••") : "" }
  function saveOpenAIKey(v) { setOpenaiKey(v.trim()); setApiTestStatus(null) }
  function saveGeminiKey(v) { setGeminiKey(v.trim()); setApiTestStatus(null) }
  function clearOpenAIKey() { setOpenaiKey(""); setApiTestStatus(null); localStorage.removeItem("hagi_openai_key") }
  function clearGeminiKey() { setGeminiKey(""); setApiTestStatus(null); localStorage.removeItem("hagi_gemini_key") }

  // Layout
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-3 md:p-6">
      {/* Topbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-xl font-semibold">Harmonic Sovereign Console</div>
        <Badge variant="secondary" className="ml-2">unified v1.3</Badge>
        <div className="ml-auto flex gap-2">
          <Button variant={tab === "console" ? "default" : "secondary"} size="sm" onClick={()=>setTab("console")}>Console</Button>
          <Button variant={tab === "chat" ? "default" : "secondary"} size="sm" onClick={()=>setTab("chat")}>Chat</Button>
          <Button variant={tab === "settings" ? "default" : "secondary"} size="sm" onClick={()=>setTab("settings")}>Settings</Button>
        </div>
      </div>

      {tab === "console" && (
        <div className="grid gap-4 xl:gap-6 grid-cols-1 xl:grid-cols-[1.05fr_1.1fr]">
          {/* LEFT: Vault + Encoder */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <span>Memory Vault</span>
                  <Badge variant="secondary" className="ml-2">harmonic_stable</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Pill>{vault.supported_file_types}</Pill>
                  <Pill>degradation: {vault.attributes.degradation}</Pill>
                  <Pill>fading: {vault.attributes.fading}</Pill>
                  <Pill>IO: {vault.large_io_capability}</Pill>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm mb-1 font-medium">Belief priors (Dirichlet α)</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="mb-1">A: {alphaA}</div>
                        <input type="range" min={1} max={20} value={alphaA} onChange={e=>setAlphaA(Number(e.target.value))} />
                      </div>
                      <div>
                        <div className="mb-1">B: {alphaB}</div>
                        <input type="range" min={1} max={20} value={alphaB} onChange={e=>setAlphaB(Number(e.target.value))} />
                      </div>
                      <div>
                        <div className="mb-1">C: {alphaC}</div>
                        <input type="range" min={1} max={20} value={alphaC} onChange={e=>setAlphaC(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Probabilities ≈ {probs.A.toFixed(2)} / {probs.B.toFixed(2)} / {probs.C.toFixed(2)}</div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={saveBeliefToVault}>Commit</Button>
                      <Button size="sm" variant="secondary" onClick={()=>download("hagi_backup.json", JSON.stringify({ messages, memory: agi.memoryVault }, null, 2))}>Export Backup</Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm mb-1 font-medium">State export / import</div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="secondary" onClick={exportVault}>Export JSON</Button>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input type="file" className="hidden" accept="application/json" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const txt = await f.text(); setVaultJson(txt) }} />
                        <span className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/40">Load JSON</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tabs mimic */}
                <div className="mt-2 grid gap-3">
                  <div className="grid grid-cols-3 text-xs">
                    <div className="font-medium opacity-80">Audit Trail</div>
                    <div className="font-medium opacity-80">JSON</div>
                    <div className="font-medium opacity-80">Ingest</div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {/* Audit */}
                    <div className="md:col-span-1 border rounded-xl border-slate-800/60 max-h-56 overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-900/60 text-slate-300 sticky top-0">
                          <tr>
                            <th className="text-left p-2 w-[36%]">When</th>
                            <th className="text-left p-2 w-[30%]">Action</th>
                            <th className="text-left p-2">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vault.audit_trail.map((row,i)=> (
                            <tr key={i} className="border-t border-slate-800/60">
                              <td className="p-2 align-top">{ts(row.timestamp)}</td>
                              <td className="p-2 align-top">{row.action}</td>
                              <td className="p-2 align-top text-slate-300">
                                <div className="flex flex-wrap gap-2 mb-1">
                                  <Pill>{row.details?.fileName||"—"}</Pill>
                                  <Pill>{row.details?.fileType||"meta"}</Pill>
                                  <Pill>{row.details?.fileSize||0} bytes</Pill>
                                </div>
                                <div className="opacity-80">{row.details?.memory_integration || row.details?.note || "—"}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* JSON */}
                    <div className="md:col-span-1">
                      <Textarea className={cx("font-mono text-xs min-h-[220px]", vaultOk?"":"border-red-500")} value={vaultJson} onChange={e=>setVaultJson(e.target.value)} />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={importVaultFromJson}>Apply JSON</Button>
                        {!vaultOk && <Badge variant="destructive">JSON parse error</Badge>}
                      </div>
                    </div>
                    {/* Ingest */}
                    <div className="md:col-span-1">
                      <div className="text-sm opacity-80 mb-2">Drop any file to add a ledger entry (simulated embedding).</div>
                      <Input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) ingestFile(f) }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Number‑Pipe */}
            <Card>
              <CardHeader><CardTitle>Number‑Pipe Encoder (toy) <Badge variant="outline">not compression</Badge></CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <NumberPipe />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Orchestrator + KB */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Quantum‑Harmonic Orchestrator <Badge variant="secondary">sovereign</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col md:flex-row gap-2">
                  <Textarea value={task} onChange={e=>setTask(e.target.value)} placeholder="e.g., Build a TS canvas that exports reproducible artifacts" className="min-h-[80px]" />
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2 min-w-[220px]">
                    <Button onClick={()=>runOrchestrator(false)} disabled={busy}>Start</Button>
                    <Button variant="secondary" onClick={()=>runOrchestrator(true)} disabled={busy}>Refine</Button>
                    <Button variant="outline" onClick={()=>speak(finalOut)} disabled={!finalOut}>Speak</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs flex items-center gap-2">Coherence: {Math.round(coherenceBar)}%</div>
                  <Progress value={coherenceBar} />
                  {dissonance && (<div className="text-amber-400 text-xs">Dissonance detected — re‑equilibrating…</div>)}
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2">
                    <div className="text-sm font-medium mb-1">App Synthesizer</div>
                    <Textarea readOnly className="min-h-[120px] text-xs" value={appOut} />
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2">
                    <div className="text-sm font-medium mb-1">Strategic Planner</div>
                    <Textarea readOnly className="min-h-[120px] text-xs" value={planOut} />
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2">
                    <div className="text-sm font-medium mb-1">Creative Modulator</div>
                    <Textarea readOnly className="min-h-[120px] text-xs" value={creaOut} />
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1 font-medium">Final Coherent Output</div>
                  <Textarea readOnly className="min-h-[130px] text-sm" value={finalOut} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Knowledge Base Stream <Badge variant="outline">live</Badge></CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-52 overflow-auto text-xs space-y-1">
                  {kb.map((line,i)=>(<div key={i} className="opacity-90">{line}</div>))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader><CardTitle>Chat & Playground <Badge variant="outline">{provider === "none" ? "local sim" : `bridge: ${provider}`}</Badge></CardTitle></CardHeader>
            <CardContent>
              <div className="text-xs mb-2 opacity-80 flex items-center gap-3">
                <span>Status: {isLoading?"Working…":"Idle"}</span>
                <label className="inline-flex items-center gap-2 ml-3">
                  <input type="checkbox" checked={bridgeOn} onChange={e=>setBridgeOn(e.target.checked)} />
                  <span>Translation Bridge</span>
                </label>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-auto rounded border border-slate-800/60 p-2">
                {messages.length===0 && (<div className="text-xs opacity-70">No messages yet — try: "Spectral multiply 1 & 2"</div>)}
                {messages.map(m => (
                  <div key={m.id} className="rounded bg-slate-900/50 p-2">
                    <div className="text-[11px] opacity-70">{m.sender} · {new Date(m.time).toLocaleTimeString()}</div>
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    {m.meta && (<div className="text-[11px] opacity-70 mt-1">{m.meta.description || JSON.stringify(m.meta)}</div>)}
                    {m.sender === "model" && (
                      <Button size="xs" variant="outline" className="mt-1" onClick={()=>toggleReasoning(m.id)}>{showReasoningMap[m.id] ? "Hide reasoning" : "Show reasoning"}</Button>
                    )}
                    {m.sender === "model" && showReasoningMap[m.id] && (
                      <div className="text-[11px] mt-1 opacity-80 whitespace-pre-wrap">{m.reasoning || "No reasoning attached."}</div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="mt-2 flex gap-2">
                <Textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }} className="flex-1 min-h-[60px]" placeholder="Ask the AGICore anything…" />
                <div className="grid gap-2 min-w-[160px]">
                  <Button onClick={sendMessage}>Send</Button>
                  <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
                    <input type="file" className="hidden" onChange={e=>handleFile(e.target.files?.[0])} />
                    <span className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/40">Upload File</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conceptual Benchmarking & Quick Demos */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Conceptual Benchmarking</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xs opacity-80 mb-2">Demo metrics for prototyping only.</div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={()=>runBenchmark("ARC")} disabled={isLoading}>Run ARC (Sim)</Button>
                  <Button size="sm" variant="secondary" onClick={()=>runBenchmark("SWELancer")} disabled={isLoading}>Run SWELancer (Sim)</Button>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  {bench.length===0 && <div className="opacity-70">No results yet.</div>}
                  {bench.map(b => (
                    <div key={b.id} className="rounded border border-slate-800/60 p-2">
                      <div className="font-medium">{b.type} — {b.res.description}</div>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(b.res, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Utilities</CardTitle></CardHeader>
              <CardContent className="grid gap-2">
                <Button size="sm" variant="outline" onClick={()=>{
                  const mix = agi.spectralMultiply(1,1,0,2,0.5,Math.PI/4)
                  setMessages(m => [...m, { id: `${Date.now()}:sys`, sender: "system", text: `Spectral demo: ${mix.conceptual_mixed_frequencies.join(", ")}`, meta: mix }])
                }}>Spectral Multiply Demo</Button>
                <Button size="sm" variant="outline" onClick={()=>{
                  const mem = agi.retrieveMemory("harmonic");
                  setMessages(m => [...m, { id: `${Date.now()}:sys2`, sender: "system", text: `Memory demo: found ${mem.top_matches.length} matches.`, meta: mem }])
                }}>Memory Retrieval Demo</Button>
                <Button size="sm" variant="outline" onClick={()=>{
                  const m = agi.simulateARCBenchmark();
                  setBench(b => [{ id: Date.now(), type: "ARC", res: m }, ...b])
                }}>Quick ARC Snapshot</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Modes & Local Data</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Mathematical Rigor</div>
                  <div className="text-xs opacity-80">Amplify formal steps in reasoning traces.</div>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={rigor} onChange={()=>{ const v = agi.toggleMathematicalRigor(); setRigor(v) }} />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="text-xs opacity-80">Local state is saved in your browser. Use the buttons below for backups.</div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={()=>{ localStorage.removeItem("hagi:messages"); setMessages([]) }}>Clear Local Chat</Button>
                <Button size="sm" onClick={()=>download("hagi_backup.json", JSON.stringify({ messages, memory: agi.memoryVault }, null, 2))}>Export Backup</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>API Keys & Bridge</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs opacity-80">Keys are stored locally for this demo only. In production, use a secure server‑side store.</div>

              <div className="space-y-1">
                <div className="text-sm font-medium">OpenAI API Key</div>
                <div className="text-xs opacity-70">{openaiKey ? `Saved: ${masked(openaiKey)}` : "Not set"}</div>
                <div className="flex gap-2">
                  <Input value={openaiKey} onChange={e=>saveOpenAIKey(e.target.value)} placeholder="sk-…" />
                  <Button variant="secondary" onClick={clearOpenAIKey}>Clear</Button>
                  <Button onClick={async()=>{ setApiTestStatus({ ok:null, message:"Testing OpenAI key…"}); const r = await testOpenAIKey(openaiKey); setApiTestStatus(r) }}>Test</Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Gemini API Key</div>
                <div className="text-xs opacity-70">{geminiKey ? `Saved: ${masked(geminiKey)}` : "Not set"}</div>
                <div className="flex gap-2">
                  <Input value={geminiKey} onChange={e=>saveGeminiKey(e.target.value)} placeholder="AIza…" />
                  <Button variant="secondary" onClick={clearGeminiKey}>Clear</Button>
                  <Button onClick={async()=>{ setApiTestStatus({ ok:null, message:"Testing Gemini key…"}); const r = await testGeminiKey(geminiKey); setApiTestStatus(r) }}>Test</Button>
                </div>
              </div>

              <div className="text-xs opacity-80">Active Bridge Provider</div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant={provider === "none" ? "default" : "outline"} onClick={()=>setProvider("none")}>None (local sim)</Button>
                <Button size="sm" variant={provider === "openai" ? "default" : "outline"} onClick={()=>setProvider("openai")}>OpenAI</Button>
                <Button size="sm" variant={provider === "gemini" ? "default" : "outline"} onClick={()=>setProvider("gemini")}>Gemini</Button>
              </div>

              <div className="text-xs mt-2">Test result: {apiTestStatus ? apiTestStatus.message : "No test run yet."}</div>
              <div className="text-[11px] opacity-70">Dev note: proxy API calls via your backend in production; do not store long‑lived keys in the client.</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function NumberPipe() {
  const [encodeIn, setEncodeIn] = useState("")
  const [encoded, setEncoded] = useState("")
  const [decodeIn, setDecodeIn] = useState("")
  const [decoded, setDecoded] = useState("")
  return (
    <>
      <div>
        <div className="text-xs mb-1">Text → BigInt (decimal)</div>
        <Textarea className="font-mono text-xs min-h-[120px]" value={encodeIn} onChange={e=>setEncodeIn(e.target.value)} placeholder="Type any text here…" />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={()=>setEncoded(textToBigIntString(encodeIn))}>Encode</Button>
          <Button size="sm" variant="secondary" onClick={()=>navigator.clipboard.writeText(encoded)}>Copy</Button>
        </div>
        <Textarea className="font-mono text-xs mt-2 min-h-[90px]" readOnly value={encoded} placeholder="Encoded number will appear here" />
      </div>
      <div>
        <div className="text-xs mb-1">BigInt (decimal) → Text</div>
        <Textarea className="font-mono text-xs min-h-[120px]" value={decodeIn} onChange={e=>setDecodeIn(e.target.value)} placeholder="Paste a big integer string…" />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={()=>setDecoded(bigIntStringToText(decodeIn))}>Decode</Button>
          <Button size="sm" variant="secondary" onClick={()=>setDecodeIn("")}>Clear</Button>
        </div>
        <Textarea className="font-mono text-xs mt-2 min-h-[90px]" readOnly value={decoded} placeholder="Decoded text will appear here" />
      </div>
    </>
  )
}
