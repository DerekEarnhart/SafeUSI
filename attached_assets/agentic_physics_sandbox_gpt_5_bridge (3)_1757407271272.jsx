'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'
import { Play, Pause, Sparkles, Zap, Settings, ShieldCheck, RotateCcw, Download, Upload, KeyRound, Bot } from 'lucide-react'

/**
 * Agentic Physics Sandbox — React + Three + cannon‑es (v3, LLM‑enabled)
 * --------------------------------------------------------------------
 * Built‑in optional GPT‑5 bridge (browser fetch to OpenAI Chat Completions)
 * Settings panel in the dock to enter/store API key + select model
 * Translate NL prompt → AgentPlan(JSON) using the bridge when enabled
 * Stores API key/model/provider in localStorage (client‑only)
 *
 * ⚠️ Security note: API keys stored in localStorage are visible to anyone
 * who can run JS in this origin. This is OK for local tinkering, but for
 * production use you should proxy requests through a secure backend.
 */

// --------------------------
// Types & Tooling Contracts
// --------------------------

export type Vec3 = [number, number, number]

export type SpawnPrimitive = {
  op: 'spawn'
  kind: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'torus'
  size?: Vec3 | number // depending on kind
  position?: Vec3
  rotationEuler?: Vec3 // radians
  mass?: number
  color?: string
  restitution?: number
  friction?: number
}

export type SpawnLight = {
  op: 'light'
  kind: 'ambient' | 'directional' | 'point' | 'spot'
  id?: string
  color?: string
  intensity?: number
  position?: Vec3
}

export type SetGravity = { op: 'gravity'; g: Vec3 }

export type Impulse = { op: 'impulse'; id: string; impulse: Vec3; worldPoint?: Vec3 }

export type Tint = { op: 'tint'; id: string; color: string }

export type Destroy = { op: 'destroy'; id: string }

export type ConstrainDist = { op: 'constraint:distance'; a: string; b: string; max: number }

export type Reset = { op: 'reset' }

export type Action = SpawnPrimitive | SpawnLight | SetGravity | Impulse | Tint | Destroy | ConstrainDist | Reset

export type AgentPlan = { actions: Action[]; meta?: Record<string, any> }

/** Optional external LLM bridge: implement prompt→AgentPlan(JSON) */
export type LLMBridge = (prompt: string, context: any) => Promise<AgentPlan>

// Agent tick API
export type SnapshotBody = {
  id: string
  kind: string
  mass: number
  position: Vec3
  velocity: Vec3
  quaternion: [number, number, number, number]
}
export type WorldSnapshot = {
  time: number
  gravity: Vec3
  objects: SnapshotBody[]
}
export type EnvAPI = {
  run: (plan: AgentPlan) => void
  spawn: (a: SpawnPrimitive) => string | null
  impulse: (a: Impulse) => void
  setGravity: (a: SetGravity) => void
  reset: () => void
  tint: (a: Tint) => void
}

// -----------------
// Small utilities
// -----------------
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const s = window.localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])
  return [value, setValue] as const
}

// ---------------
// Component Props
// ---------------
export default function AgenticPhysicsSandbox({
  bridge,
  agentTick,
  seed,
}: {
  /** Optional LLM bridge for NL → JSON */
  bridge?: LLMBridge
  /** Optional per‑step agent hook (called at fixed physics cadence) */
  agentTick?: (env: EnvAPI, snapshot: WorldSnapshot) => void | Promise<void>
  /** Optional RNG seed for deterministic spawns */
  seed?: number
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // three
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  // physics
  const worldRef = useRef<CANNON.World | null>(null)
  const fixedDT = 1 / 60
  const accumulatorRef = useRef(0)

  // mapping and ids
  type BodyEntry = { id: string; body: CANNON.Body; mesh: THREE.Object3D; kind: string; material: CANNON.Material }
  const bodiesRef = useRef<Map<string, BodyEntry>>(new Map())
  const idCounterRef = useRef(0)
  const genId = () => `obj_${idCounterRef.current++}`

  // contact material management
  const matProps = useRef(new Map<number, { f: number; r: number }>())
  const contactPairs = useRef(new Set<string>())
  const pairKey = (a: CANNON.Material, b: CANNON.Material) => (a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`)

  // constraints & lights registry for cleanup
  const constraintsRef = useRef<CANNON.Constraint[]>([])
  const lightsRef = useRef<Map<string, THREE.Light>>(new Map())

  // RNG (LCG)
  const rngState = useRef<number>(seed ?? Math.floor(Math.random() * 1e9))
  function rand() {
    rngState.current = (1664525 * rngState.current + 1013904223) >>> 0
    return rngState.current / 0xffffffff
  }

  // loop
  const rafRef = useRef<number | null>(null)
  const clockRef = useRef(new THREE.Clock())

  // UI state
  const [running, setRunning] = useState(true)
  const [godmode, setGodmode] = useState(false)
  const [objectCap, setObjectCap] = useState(96)
  const [energyCap, setEnergyCap] = useState(5e4)
  const [stats, setStats] = useState({ time: 0, objects: 0, energy: 0, fps: 0 })
  const [log, setLog] = useState<string[]>(['Sandbox ready.'])
  const [prompt, setPrompt] = useState('stack 20 boxes into a leaning tower and add a spotlight')
  const [jsonText, setJsonText] = useState(
    () =>
      JSON.stringify(
        {
          actions: [
            { op: 'spawn', kind: 'box', size: [1, 1, 1], position: [0, 5, 0], mass: 5, color: '#8be9fd', friction: 0.4, restitution: 0.05 },
            { op: 'spawn', kind: 'sphere', size: 0.6, position: [1, 8, 0], mass: 2, color: '#ff79c6', friction: 0.2, restitution: 0.6 },
            { op: 'impulse', id: 'last', impulse: [50, 0, 0] },
            { op: 'light', kind: 'spot', position: [10, 15, 10], intensity: 1.2 },
          ],
        },
        null,
        2,
      ),
  )

  // LLM settings (persisted)
  type Provider = 'off' | 'openai'
  const [provider, setProvider] = useLocalStorage<Provider>('sandbox.llm.provider', 'off')
  const [gptModel, setGptModel] = useLocalStorage<string>('sandbox.llm.model', 'gpt-5')
  const [gptKey, setGptKey] = useLocalStorage<string>('sandbox.llm.key', '')
  const [llmBusy, setLlmBusy] = useState(false)

  // safety bounds (world box)
  const worldBounds = useMemo(() => ({ halfExtents: new CANNON.Vec3(40, 40, 40) }), [])

  // ----------------------
  // Initialization/Teardown
  // ----------------------
  useEffect(() => {
    const mount = mountRef.current!
    const canvas = canvasRef.current!

    // Scene + Camera
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b0b12')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000)
    camera.position.set(12, 12, 18)
    camera.lookAt(0, 4, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 4, 0)
    controlsRef.current = controls

    // Lights (ambient hemi + dir)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.7)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(6, 10, 4)
    dir.castShadow = true
    scene.add(dir)
    lightsRef.current.set('hemi', hemi)
    lightsRef.current.set('dir', dir)

    // Physics world
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) })
    world.broadphase = new CANNON.SAPBroadphase(world)
    world.allowSleep = true
    world.solver.iterations = 10
    world.defaultContactMaterial.friction = 0.3
    world.defaultContactMaterial.restitution = 0.05
    worldRef.current = world

    // Ground plane
    {
      const groundBody = new CANNON.Body({ mass: 0 })
      const groundShape = new CANNON.Plane()
      groundBody.addShape(groundShape)
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
      world.addBody(groundBody)
      const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: '#23232f', metalness: 0, roughness: 1 }),
      )
      groundMesh.receiveShadow = true
      groundMesh.rotation.x = -Math.PI / 2
      scene.add(groundMesh)
    }

    // World bounds (six static planes forming a box)
    addBounds(worldBounds.halfExtents)

    // Resize
    const ro = new ResizeObserver(() => fitRenderer())
    ro.observe(mount)
    fitRenderer()

    // Events / shortcuts
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') setRunning((v) => !v)
      if (e.key.toLowerCase() === 'r') resetWorld()
      if (e.key.toLowerCase() === 'g') setGodmode((v) => !v)
    }
    window.addEventListener('keydown', onKey)

    // Start
    startLoop()

    logMsg('Initialized.')

    // Expose minimal API for external driving
    ;(window as any).sandbox = {
      run: (plan: AgentPlan) => runPlan(plan),
      reset: () => resetWorld(),
      list: () => Array.from(bodiesRef.current.values()).map((e) => e.id),
      snapshot: () => buildSnapshot(),
    }

    // Run lightweight self-tests once after init
    setTimeout(() => runSelfTests(), 0)

    return () => {
      stopLoop()
      window.removeEventListener('keydown', onKey)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      for (const [, entry] of bodiesRef.current) {
        removeEntry(entry)
      }
      constraintsRef.current.forEach((c) => world.removeConstraint(c))
      constraintsRef.current.length = 0
      for (const [, L] of lightsRef.current) scene.remove(L)
      lightsRef.current.clear()
      world.bodies.forEach((b) => world.remove(b))
      scene.clear()
      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      worldRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function fitRenderer() {
    const mount = mountRef.current!
    const renderer = rendererRef.current!
    const camera = cameraRef.current!
    const { clientWidth: w, clientHeight: h } = mount
    renderer.setSize(w, h, false)
    camera.aspect = Math.max(1e-6, w / Math.max(1, h))
    camera.updateProjectionMatrix()
  }

  function startLoop() {
    if (rafRef.current != null) return
    let accumFPS = 0
    let frames = 0
    clockRef.current.getDelta()
    const loop = () => {
      const dt = clockRef.current.getDelta()
      if (running) stepPhysics(dt)
      const renderer = rendererRef.current!
      const scene = sceneRef.current!
      const camera = cameraRef.current!
      controlsRef.current!.update()
      renderer.render(scene, camera)

      accumFPS += 1 / Math.max(1e-6, dt)
      frames++
      if (frames % 10 === 0) {
        const fps = (accumFPS / 10) | 0
        accumFPS = 0
        setStats((s) => ({ ...s, fps }))
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }
  function stopLoop() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // -----------------
  // Physics + Energy
  // -----------------
  function stepPhysics(dt: number) {
    const world = worldRef.current!
    accumulatorRef.current += dt
    while (accumulatorRef.current >= fixedDT) {
      world.step(fixedDT)
      accumulatorRef.current -= fixedDT

      if (agentTick) {
        const snapshot = buildSnapshot()
        const env: EnvAPI = {
          run: runPlan,
          spawn: (a) => spawnPrimitive(a),
          impulse: (a) => applyImpulse(a),
          setGravity: (g) => setGravity(g),
          reset: resetWorld,
          tint: (t) => tint(t),
        }
        try {
          Promise.resolve(agentTick(env, snapshot)).catch((e) => logMsg('agentTick error: ' + (e as Error).message))
        } catch (e) {
          logMsg('agentTick threw: ' + (e as Error).message)
        }
      }
    }

    for (const [, entry] of bodiesRef.current) {
      const { body, mesh } = entry
      ;(mesh.position as any).set(body.position.x, body.position.y, body.position.z)
      ;(mesh.quaternion as any).set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
    }

    const energy = computeEnergy()
    const objects = bodiesRef.current.size
    if (!godmode) {
      if (objects > objectCap) {
        cullExcess(objects - objectCap)
        logMsg(`Safety: culled ${objects - objectCap} objects (cap ${objectCap}).`)
      }
      if (energy > energyCap) {
        dampVelocities(0.85)
        logMsg(`Safety: energy ${energy.toFixed(0)} > cap ${energyCap}. Applied damping.`)
      }
    }
    setStats((s) => ({ time: s.time + dt, objects, energy, fps: s.fps }))
  }

  function buildSnapshot(): WorldSnapshot {
    const world = worldRef.current!
    const objects: SnapshotBody[] = []
    bodiesRef.current.forEach(({ id, body, kind }) => {
      objects.push({
        id,
        kind,
        mass: body.mass,
        position: [body.position.x, body.position.y, body.position.z],
        velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
        quaternion: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
      })
    })
    return { time: stats.time, gravity: [world.gravity.x, world.gravity.y, world.gravity.z], objects }
  }

  function computeEnergy() {
    const g = worldRef.current!.gravity.y
    let E = 0
    bodiesRef.current.forEach(({ body }) => {
      if (body.mass === 0) return
      const v2 = body.velocity.lengthSquared()
      const KE = 0.5 * body.mass * v2
      const PE = -body.mass * g * body.position.y
      E += KE + PE
    })
    return E
  }

  function dampVelocities(factor: number) {
    bodiesRef.current.forEach(({ body }) => {
      body.velocity.scale(factor, body.velocity)
      body.angularVelocity.scale(factor, body.angularVelocity)
    })
  }

  function cullExcess(n: number) {
    const keys = Array.from(bodiesRef.current.keys())
    for (let i = 0; i < n; i++) {
      const id = keys[i]
      const entry = bodiesRef.current.get(id)
      if (entry) removeEntry(entry)
    }
  }

  function addBounds(half: CANNON.Vec3) {
    const world = worldRef.current!
    const scene = sceneRef.current!
    const createPlane = (normal: CANNON.Vec3, distance: number) => {
      const shape = new CANNON.Plane()
      const body = new CANNON.Body({ mass: 0 })
      body.addShape(shape)
      const q = new CANNON.Quaternion()
      q.setFromVectors(new CANNON.Vec3(0, 1, 0), normal)
      body.quaternion.copy(q)
      body.position.set(normal.x * distance, normal.y * distance, normal.z * distance)
      world.addBody(body)
      const helper = new THREE.GridHelper(half.x * 2, 40, '#262637', '#1b1b26')
      ;(helper.position as any).set(body.position.x, body.position.y, body.position.z)
      if (normal.x !== 0) helper.rotation.z = Math.PI / 2
      if (normal.z !== 0) helper.rotation.x = Math.PI / 2
      if (normal.y !== 1) helper.rotation.y = 0
      scene.add(helper)
    }
    createPlane(new CANNON.Vec3(0, 1, 0), -half.y)
    createPlane(new CANNON.Vec3(0, -1, 0), -half.y)
    createPlane(new CANNON.Vec3(1, 0, 0), -half.x)
    createPlane(new CANNON.Vec3(-1, 0, 0), -half.x)
    createPlane(new CANNON.Vec3(0, 0, 1), -half.z)
    createPlane(new CANNON.Vec3(0, 0, -1), -half.z)
  }

  // -----------------
  // Tool Implementations
  // -----------------

  function hexToThree(c?: string) {
    return new THREE.Color(c || '#9ad1ff')
  }

  function addEntry(entry: BodyEntry) {
    bodiesRef.current.set(entry.id, entry)
    const world = worldRef.current!
    const thisMat = entry.material
    const thisProps = matProps.current.get(thisMat.id) || { f: 0.3, r: 0.05 }
    for (const [, e] of bodiesRef.current) {
      if (e.id === entry.id) continue
      const otherMat = e.material
      const key = pairKey(thisMat, otherMat)
      if (!contactPairs.current.has(key)) {
        const op = matProps.current.get(otherMat.id) || { f: 0.3, r: 0.05 }
        const cm = new CANNON.ContactMaterial(thisMat, otherMat, {
          friction: 0.5 * (thisProps.f + op.f),
          restitution: 0.5 * (thisProps.r + op.r),
        })
        world.addContactMaterial(cm)
        contactPairs.current.add(key)
      }
    }
  }

  function removeEntry(entry: BodyEntry) {
    const world = worldRef.current!
    const scene = sceneRef.current!
    world.removeBody(entry.body)
    scene.remove(entry.mesh)
    disposeEntry(entry)
    bodiesRef.current.delete(entry.id)
  }

  function disposeEntry(entry: BodyEntry) {
    entry.mesh.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) {
        const m = obj.material
        Array.isArray(m) ? m.forEach((x: any) => x.dispose?.()) : m.dispose?.()
      }
    })
  }

  function spawnPrimitive(a: SpawnPrimitive): string | null {
    const world = worldRef.current!
    const scene = sceneRef.current!
    if (!godmode && bodiesRef.current.size >= objectCap) {
      logMsg('Cap reached; spawn rejected.')
      return null
    }

    const id = genId()
    let body: CANNON.Body
    let mesh: THREE.Mesh
    const mass = a.mass ?? 1
    const color = hexToThree(a.color)

    switch (a.kind) {
      case 'box': {
        const size = (a.size as Vec3) ?? [1, 1, 1]
        const he = new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)
        const shape = new CANNON.Box(he)
        body = new CANNON.Body({ mass })
        body.addShape(shape)
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(...size),
          new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.7 }),
        )
        break
      }
      case 'sphere': {
        const r = typeof a.size === 'number' ? a.size : Array.isArray(a.size) ? (a.size[0] as number) : 0.5
        const shape = new CANNON.Sphere(r)
        body = new CANNON.Body({ mass })
        body.addShape(shape)
        mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.5 }))
        break
      }
      case 'cylinder': {
        const s = (a.size as Vec3) ?? [0.5, 1, 0.5]
        const shape = new CANNON.Cylinder(s[0], s[2], s[1], 12)
        body = new CANNON.Body({ mass })
        body.addShape(shape)
        const geo = new THREE.CylinderGeometry(s[0], s[2], s[1], 24)
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }))
        break
      }
      case 'capsule': {
        const s = (a.size as Vec3) ?? [0.4, 1.2, 0.4]
        const shape = new CANNON.Cylinder(s[0], s[2], s[1], 12)
        body = new CANNON.Body({ mass })
        body.addShape(shape)
        const geo = new THREE.CapsuleGeometry(s[0], s[1])
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }))
        break
      }
      case 'torus': {
        const r = typeof a.size === 'number' ? a.size : 1
        const geo = new THREE.TorusGeometry(r, r * 0.3, 12, 32)
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }))
        const shape = new CANNON.Sphere(r)
        body = new CANNON.Body({ mass })
        body.addShape(shape)
        break
      }
      default:
        return null
    }

    const mat = new CANNON.Material()
    const fr = a.friction ?? 0.3
    const re = a.restitution ?? 0.05
    body.material = mat
    matProps.current.set(mat.id, { f: fr, r: re })

    const p = a.position ?? [0, 8, 0]
    body.position.set(p[0], p[1], p[2])
    if (a.rotationEuler) {
      const q = new CANNON.Quaternion()
      q.setFromEuler(a.rotationEuler[0], a.rotationEuler[1], a.rotationEuler[2], 'XYZ')
      body.quaternion.copy(q)
    }
    ;(mesh.position as any).set(p[0], p[1], p[2])
    ;(mesh as any).castShadow = true

    world.addBody(body)
    scene.add(mesh)
    const entry: BodyEntry = { id, body, mesh, kind: a.kind, material: mat }
    addEntry(entry)
    return id
  }

  function addLight(a: SpawnLight) {
    const scene = sceneRef.current!
    const color = new THREE.Color(a.color || '#ffffff')
    let light: THREE.Light
    switch (a.kind) {
      case 'ambient':
        light = new THREE.AmbientLight(color, a.intensity ?? 0.4)
        break
      case 'directional':
        light = new THREE.DirectionalLight(color, a.intensity ?? 1.0)
        ;(light as any).castShadow = true
        break
      case 'point':
        light = new THREE.PointLight(color, a.intensity ?? 1.0, 100)
        break
      case 'spot':
      default:
        light = new THREE.SpotLight(color, a.intensity ?? 1.0, 200, Math.PI / 6, 0.2)
        ;(light as any).castShadow = true
    }
    scene.add(light)
    const pos = a.position ?? [8, 12, 8]
    light.position.set(pos[0], pos[1], pos[2])
    lightsRef.current.set(a.id || `light_${lightsRef.current.size + 1}`, light)
  }

  function applyImpulse(a: Impulse) {
    const id = a.id === 'last' ? Array.from(bodiesRef.current.keys()).slice(-1)[0] : a.id
    if (!id) return
    const entry = bodiesRef.current.get(id)
    if (!entry) return
    const body = entry.body
    const imp = new CANNON.Vec3(...a.impulse)
    const pt = a.worldPoint ? new CANNON.Vec3(...a.worldPoint) : body.position.clone()
    body.applyImpulse(imp, pt)
  }

  function tint(a: Tint) {
    const entry = bodiesRef.current.get(a.id)
    if (!entry) return
    const color = new THREE.Color(a.color)
    ;(entry.mesh as any).traverse?.((m: any) => {
      if (m.material) {
        const mm = m.material
        Array.isArray(mm) ? mm.forEach((x: any) => x.color?.set(color)) : mm.color?.set(color)
      }
    })
  }

  function destroy(a: Destroy) {
    const entry = bodiesRef.current.get(a.id)
    if (entry) removeEntry(entry)
  }

  function constrainDistance(a: ConstrainDist) {
    const A = bodiesRef.current.get(a.a)?.body
    const B = bodiesRef.current.get(a.b)?.body
    if (!A || !B) return
    const c = new CANNON.DistanceConstraint(A, B, a.max)
    worldRef.current!.addConstraint(c)
    constraintsRef.current.push(c)
  }

  function setGravity(a: SetGravity) {
    worldRef.current!.gravity.set(a.g[0], a.g[1], a.g[2])
  }

  function resetWorld() {
    for (const [, e] of bodiesRef.current) removeEntry(e)
    bodiesRef.current.clear()
    idCounterRef.current = 0
    setStats((s) => ({ ...s, objects: 0, energy: 0 }))
    logMsg('World reset.')
  }

  // ---------------
  // Action Routing
  // ---------------
  function runPlan(plan: AgentPlan) {
    for (const a of plan.actions ?? []) {
      switch (a.op) {
        case 'spawn':
          spawnPrimitive(a)
          break
        case 'light':
          addLight(a)
          break
        case 'gravity':
          setGravity(a)
          break
        case 'impulse':
          applyImpulse(a)
          break
        case 'tint':
          tint(a)
          break
        case 'destroy':
          destroy(a)
          break
        case 'constraint:distance':
          constrainDistance(a)
          break
        case 'reset':
          resetWorld()
          break
      }
    }
  }

  function logMsg(m: string) {
    setLog((L) => [...L.slice(-199), `${new Date().toLocaleTimeString()} — ${m}`])
  }

  // --------------------------------------
  // NL → JSON (bridge / OpenAI / fallback)
  // --------------------------------------
  async function translatePrompt(p: string): Promise<AgentPlan> {
    // 1) External bridge prop (preferred if provided)
    if (bridge) {
      try {
        const plan = await bridge(p, { objects: bodiesRef.current.size, caps: { objectCap, energyCap }, godmode })
        return plan
      } catch (e) {
        logMsg('Bridge failed, trying next: ' + (e as Error).message)
      }
    }

    // 2) Global planner from your surrounding app (if present)
    if (typeof window !== 'undefined' && (window as any).UHAI?.plan) {
      try {
        const plan = await (window as any).UHAI.plan(p, { objects: bodiesRef.current.size, caps: { objectCap, energyCap }, godmode })
        return plan
      } catch (e) {
        logMsg('UHAI.plan failed, trying next: ' + (e as Error).message)
      }
    }

    // 3) Built‑in OpenAI GPT‑5 bridge
    if (provider === 'openai' && gptKey) {
      try {
        const plan = await openAIPlan(p, { objects: bodiesRef.current.size, caps: { objectCap, energyCap }, godmode })
        return plan
      } catch (e) {
        logMsg('OpenAI bridge failed, using naive parser: ' + (e as Error).message)
      }
    }

    // 4) Fallback tiny parser
    return naiveParse(p)
  }

  async function openAIPlan(nlPrompt: string, context: any): Promise<AgentPlan> {
    const endpoint = 'https://api.openai.com/v1/chat/completions'
    setLlmBusy(true)
    try {
      const system = `You are a planning tool for a 3D physics sandbox.\nTranslate the user's request into a strict JSON object with schema:\n{\n  "actions": [\n    // list of actions, each one of:\n    {"op":"spawn","kind":"box|sphere|cylinder|capsule|torus","size":number|[x,y,z],"position":[x,y,z],"mass":number,"color":"#RRGGBB","friction":number,"restitution":number},\n    {"op":"light","kind":"ambient|directional|point|spot","position":[x,y,z],"intensity":number,"color":"#RRGGBB"},\n    {"op":"gravity","g":[x,y,z]},\n    {"op":"impulse","id":"<object id or 'last'>","impulse":[x,y,z],"worldPoint":[x,y,z]},\n    {"op":"tint","id":"<object id>","color":"#RRGGBB"},\n    {"op":"destroy","id":"<object id>"},\n    {"op":"constraint:distance","a":"<id>","b":"<id>","max":number},\n    {"op":"reset"}\n  ],\n  "meta": {"notes": "optional"}\n}\nConstraints: keep total spawns reasonable (<= ${objectCap}); prefer stable stacks; never include comments or trailing commas; only valid fields.`

      const messages = [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ prompt: nlPrompt, context }) },
      ] as any

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${gptKey}`,
        },
        body: JSON.stringify({
          model: gptModel,
          response_format: { type: 'json_object' },
          messages,
        }),
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(`HTTP ${res.status} — ${t}`)
      }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(text)
      if (!parsed || !Array.isArray(parsed.actions)) throw new Error('Model did not return { actions: [...] }')
      return parsed as AgentPlan
    } finally {
      setLlmBusy(false)
    }
  }

  function naiveParse(prompt: string): AgentPlan {
    const acts: Action[] = []
    const p = prompt.toLowerCase()
    const num = (s: string) => parseFloat(s)

    if (p.startsWith('gravity')) {
      const parts = p.replace(/gravity\s+/, '').split(/[\,\s]+/).map(num)
      if (parts.length >= 3) acts.push({ op: 'gravity', g: [parts[0], parts[1], parts[2]] as Vec3 })
    }

    const boxMatch = (p.match(/(spawn|add)\s+(\d+)?\s*boxes?/) || p.match(/box/)) ? 1 : 0
    if (boxMatch) {
      const count = parseInt((p.match(/(\d+)\s*boxes?/) || [])[1] || '1')
      for (let i = 0; i < Math.min(count || 1, 50); i++) {
        acts.push({ op: 'spawn', kind: 'box', size: [1, 1, 1], position: [rand() * 2 - 1, 6 + i * 1.2, rand() * 2 - 1], mass: 2 })
      }
    }
    if (p.includes('sphere')) {
      acts.push({ op: 'spawn', kind: 'sphere', size: 0.5, position: [0, 10, 0], mass: 1 })
    }
    if (p.includes('spotlight') || p.includes('spot light')) {
      acts.push({ op: 'light', kind: 'spot', position: [10, 15, 10], intensity: 1.2 })
    }
    if (acts.length === 0) {
      for (let i = 0; i < 12; i++)
        acts.push({ op: 'spawn', kind: 'box', size: [1, 0.6, 1], position: [Math.sin(i * 0.3), 0.6 + i * 0.65, Math.cos(i * 0.3)], mass: 2 })
    }
    return { actions: acts }
  }

  // ----------------
  // Import/Export IO
  // ----------------
  function exportSnapshot() {
    const arr: any[] = []
    bodiesRef.current.forEach(({ id, body, kind, mesh }) => {
      const mat: any = (mesh as any).material
      const colorHex = Array.isArray(mat) ? mat[0]?.color?.getHexString?.() : mat?.color?.getHexString?.()
      let size: any = undefined
      if ((mesh as any).geometry) {
        const g: any = (mesh as any).geometry
        if (kind === 'box') size = [g.parameters.width, g.parameters.height, g.parameters.depth]
        if (kind === 'sphere') size = g.parameters.radius
        if (kind === 'cylinder') size = [g.parameters.radiusTop, g.parameters.height, g.parameters.radiusBottom]
        if (kind === 'capsule') size = [g.parameters.radius, g.parameters.length + 2 * g.parameters.radius, g.parameters.radius]
        if (kind === 'torus') size = g.parameters.radius
      }
      arr.push({
        id,
        kind,
        size,
        mass: body.mass,
        position: [body.position.x, body.position.y, body.position.z],
        quaternion: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
        velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
        color: colorHex,
      })
    })
    const data = {
      gravity: [worldRef.current!.gravity.x, worldRef.current!.gravity.y, worldRef.current!.gravity.z],
      objects: arr,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sandbox_snapshot.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function importSnapshot(file: File) {
    const fr = new FileReader()
    fr.onload = () => {
      try {
        const data = JSON.parse(String(fr.result))
        resetWorld()
        setGravity({ op: 'gravity', g: data.gravity })
        for (const o of data.objects || []) {
          const id = spawnPrimitive({ op: 'spawn', kind: o.kind, mass: o.mass, position: o.position, color: `#${o.color || '9ad1ff'}`, size: o.size })
          if (id) {
            const entry = bodiesRef.current.get(id)!
            entry.body.quaternion.set(o.quaternion[0], o.quaternion[1], o.quaternion[2], o.quaternion[3])
            entry.body.velocity.set(o.velocity[0], o.velocity[1], o.velocity[2])
          }
        }
        logMsg('Snapshot imported.')
      } catch (e) {
        logMsg('Import failed: ' + (e as Error).message)
      }
    }
    fr.readAsText(file)
  }

  // -----------------
  // UI Handlers
  // -----------------
  async function runJSON() {
    try {
      const plan = JSON.parse(jsonText) as AgentPlan
      runPlan(plan)
      logMsg('Ran JSON plan.')
    } catch (e) {
      logMsg('Invalid JSON: ' + (e as Error).message)
    }
  }

  async function runPrompt() {
    const plan = await translatePrompt(prompt)
    runPlan(plan)
    logMsg(provider === 'openai' && gptKey ? 'Ran NL plan (GPT‑5 bridge).' : bridge ? 'Ran NL plan (bridge).' : 'Ran NL plan (naive parser).')
  }

  async function planOnly() {
    try {
      const plan = await translatePrompt(prompt)
      setJsonText(JSON.stringify(plan, null, 2))
      logMsg('Planned (did not execute).')
    } catch (e) {
      logMsg('Planning failed: ' + (e as Error).message)
    }
  }

  // -----------------
  // Runtime Self‑Tests
  // -----------------
  function runSelfTests() {
    try {
      // T1: naive box count
      const p = naiveParse('spawn 3 boxes')
      const nBoxes = p.actions.filter((a: any) => a.op === 'spawn' && a.kind === 'box').length
      console.assert(nBoxes >= 3, 'T1 failed: expected at least 3 boxes from naiveParse')

      // T2: spawn/reset changes object count
      const before = bodiesRef.current.size
      runPlan({ actions: [{ op: 'spawn', kind: 'box', size: [1, 1, 1], position: [0, 2, 0], mass: 1 }] })
      const during = bodiesRef.current.size
      console.assert(during === before + 1, 'T2 failed: spawn should add one object')
      resetWorld()
      const after = bodiesRef.current.size
      console.assert(after === 0, 'T2 failed: reset should clear objects')

      // T3: damping should not increase energy
      const sid = spawnPrimitive({ op: 'spawn', kind: 'sphere', size: 0.5, position: [0, 5, 0], mass: 5 })
      if (sid) {
        const entry = bodiesRef.current.get(sid)!
        entry.body.velocity.set(10, 0, 0)
        const E1 = computeEnergy()
        dampVelocities(0.5)
        const E2 = computeEnergy()
        console.assert(E2 <= E1 + 1e-6, 'T3 failed: damping must not increase energy')
        resetWorld()
      }

      // T4: gravity setter
      const gBefore = worldRef.current!.gravity.y
      setGravity({ op: 'gravity', g: [0, -1.23, 0] })
      console.assert(Math.abs(worldRef.current!.gravity.y + 1.23) < 1e-9, 'T4 failed: gravity not applied')
      setGravity({ op: 'gravity', g: [0, gBefore, 0] })

      // T5: tint applies color (best-effort check)
      const bid = spawnPrimitive({ op: 'spawn', kind: 'box', size: [1, 1, 1], position: [0, 2, 0], mass: 1 })
      if (bid) {
        tint({ op: 'tint', id: bid, color: '#ff0000' })
        const entry = bodiesRef.current.get(bid)!
        const mat: any = (entry.mesh as any).material
        const hex = (Array.isArray(mat) ? mat[0]?.color?.getHexString?.() : mat?.color?.getHexString?.()) || '000000'
        console.assert(hex.length === 6, 'T5 failed: tint did not set color hex')
        resetWorld()
      }

      logMsg('Self-tests passed.')
    } catch (err) {
      console.error(err)
      logMsg('Self-tests error: ' + (err as Error).message)
    }
  }

  function fitCameraToScene(padding = 1.2) {
    const camera = cameraRef.current!
    const box = new THREE.Box3()
    box.expandByPoint(new THREE.Vector3(0, 0, 0))
    sceneRef.current!.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) box.expandByObject(obj)
    })
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxSize = Math.max(size.x, size.y, size.z)
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))
    const distance = padding * fitHeightDistance
    const dir = new THREE.Vector3(1, 1, 1).normalize()
    camera.position.copy(center.clone().add(dir.multiplyScalar(distance)))
    camera.lookAt(center)
    controlsRef.current?.target.copy(center)
  }

  return (
    <div ref={mountRef} className="relative w-full h-[100svh] sm:h-screen overflow-hidden bg-[#0b0b12] text-white">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* HUD */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-2xl p-3 shadow-lg min-w-[260px]">
        <div className="text-xs text-white/70">Agentic Physics Sandbox</div>
        <div className="mt-1 grid grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-white/50">Time</div>
            <div className="tabular-nums">{stats.time.toFixed(1)}s</div>
          </div>
          <div>
            <div className="text-white/50">Objects</div>
            <div className="tabular-nums">{stats.objects}</div>
          </div>
          <div>
            <div className="text-white/50">Energy</div>
            <div className="tabular-nums">{Math.round(stats.energy)}</div>
          </div>
          <div>
            <div className="text-white/50">FPS</div>
            <div className="tabular-nums">{stats.fps}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setRunning((v) => !v)}
            className="px-2 py-1 rounded-lg border border-white/20 hover:border-white/40 inline-flex items-center gap-1 text-xs"
          >
            {running ? (
              <>
                <Pause className="w-3 h-3" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Play
              </>
            )}
          </button>
          <button
            onClick={() => {
              resetWorld()
            }}
            className="px-2 py-1 rounded-lg border border-white/20 hover:border-white/40 inline-flex items-center gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button onClick={exportSnapshot} className="px-2 py-1 rounded-lg border border-white/20 hover:border-white/40 inline-flex items-center gap-1 text-xs">
            <Download className="w-3 h-3" /> Export
          </button>
          <label className="px-2 py-1 rounded-lg border border-white/20 hover:border-white/40 inline-flex items-center gap-1 text-xs cursor-pointer">
            <Upload className="w-3 h-3" /> Import
            <input type="file" className="hidden" accept="application/json" onChange={(e) => e.target.files && importSnapshot(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* Control Dock */}
      <div className="absolute top-3 right-3 w-[560px] max-w-[94vw] bg-black/60 backdrop-blur rounded-2xl p-3 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-300" /> Creative Tools
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={godmode} onChange={(e) => setGodmode(e.target.checked)} className="accent-purple-400" /> Godmode
            </label>
            <span className="text-white/50">/</span>
            <label className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Safety
            </label>
          </div>
        </div>

        {/* LLM Planner Settings */}
        <div className="space-y-2">
          <div className="text-sm font-medium inline-flex items-center gap-2">
            <Bot className="w-4 h-4" /> LLM Planner
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs items-center">
            <label className="flex items-center gap-2 col-span-2 sm:col-span-1">
              Provider
              <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="bg-white/5 px-2 py-1 rounded">
                <option value="off">Off (use fallback)</option>
                <option value="openai">OpenAI (GPT‑5)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 col-span-2 sm:col-span-1">
              Model
              <select value={gptModel} onChange={(e) => setGptModel(e.target.value)} className="bg-white/5 px-2 py-1 rounded" disabled={provider !== 'openai'}>
                <option value="gpt-5">gpt-5</option>
                <option value="gpt-5-mini">gpt-5-mini</option>
                <option value="gpt-5-nano">gpt-5-nano</option>
              </select>
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <KeyRound className="w-3 h-3" /> API Key
              <input
                type="password"
                value={gptKey}
                onChange={(e) => setGptKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-white/5 px-2 py-1 rounded"
                disabled={provider !== 'openai'}
                autoComplete="off"
              />
            </label>
            <div className="col-span-2 text-[11px] text-white/60">
              Stored locally in this browser. For production, proxy through a backend — never ship keys to clients.
            </div>
            <div className="col-span-2 flex gap-2">
              <button onClick={planOnly} disabled={llmBusy} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm disabled:opacity-50">
                {llmBusy ? 'Planning…' : 'Plan Only'}
              </button>
              <button onClick={runPrompt} disabled={llmBusy} className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-sm disabled:opacity-50">
                {llmBusy ? 'Running…' : 'Run Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* Object/Energy Caps */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-white/70">Object Cap: {objectCap}</span>
            <input type="range" min={16} max={256} step={1} value={objectCap} onChange={(e) => setObjectCap(parseInt(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-white/70">Energy Cap: {Math.round(energyCap)}</span>
            <input type="range" min={1e3} max={1e6} step={1000} value={energyCap} onChange={(e) => setEnergyCap(parseFloat(e.target.value))} />
          </label>
        </div>

        {/* Prompt / JSON panes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <div className="text-xs text-white/70 mb-1">NL Prompt</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-white/5 rounded p-2 text-sm"
              placeholder="e.g., build a pyramid of 20 boxes and shine a spotlight"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={fitCameraToScene} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs inline-flex items-center gap-1">
                <Settings className="w-3 h-3" /> Fit Camera
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-xs text-white/70 mb-1">Plan JSON</div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="min-h-[120px] bg-white/5 rounded p-2 font-mono text-[12px]"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={runJSON} className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs">Run JSON</button>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="bg-white/5 rounded p-2 h-[120px] overflow-auto text-[11px] font-mono">
          {log.slice(-6).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
