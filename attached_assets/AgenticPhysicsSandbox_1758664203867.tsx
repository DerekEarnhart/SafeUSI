
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'
import { Play, Pause, Sparkles, Zap, Settings, ShieldCheck, RotateCcw, Download, Upload, KeyRound, Bot } from 'lucide-react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js'

/**
 * Agentic Physics Sandbox — React + Three + cannon‑es (v3, LLM‑enabled)
 * --------------------------------------------------------------------
 * Additions in this version:
 * - Built‑in optional GPT‑5 bridge (browser fetch to OpenAI Chat Completions)
 * - Settings panel in the dock to enter/store API key + select model
 * - Translate NL prompt → AgentPlan(JSON) using the bridge when enabled
 * - Stores API key/model/provider in localStorage (client‑only)
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
  kind: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'torus' | 'mesh'
  size?: Vec3 | number // depending on kind
  position?: Vec3
  rotationEuler?: Vec3 // radians
  mass?: number
  color?: string
  restitution?: number
  friction?: number
  linearDamping?: number   // NEW
  angularDamping?: number  // NEW
  // for mesh
  url?: string             // NEW (mesh)
  scale?: number | Vec3    // NEW (mesh)
  convex?: boolean         // NEW (mesh)
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
  tint: (t: Tint) => void
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

function ensureGeom(g: THREE.BufferGeometry) {
  const geom = g.index ? g.toNonIndexed() : g.clone()
  geom.computeBoundingBox(); geom.computeBoundingSphere()
  return geom
}

function geometryToTrimesh(geom: THREE.BufferGeometry) {
  const g = ensureGeom(geom)
  const pos = g.getAttribute('position')
  const vertices: number[] = Array.from(pos.array as Iterable<number>)
  // triangles are 0..n in order for non‑indexed geometry
  const indices: number[] = [...Array(vertices.length / 3).keys()]
  return new CANNON.Trimesh(new Float32Array(vertices), new Uint16Array(indices))
}

function geometryToConvexPolyhedron(geom: THREE.BufferGeometry) {
  const g = ensureGeom(geom)
  const pts: THREE.Vector3[] = []
  const a = g.getAttribute('position')
  for (let i = 0; i < a.count; i++) pts.push(new THREE.Vector3(a.getX(i), a.getY(i), a.getZ(i)))

  const hull = new ConvexHull().setFromPoints(pts)
  const verts: CANNON.Vec3[] = []
  const vertMap = new Map<string, number>()
  const faces: number[][] = []

  const addVert = (v: THREE.Vector3) => {
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
    if (!vertMap.has(key)) {
      vertMap.set(key, verts.length)
      verts.push(new CANNON.Vec3(v.x, v.y, v.z))
    }
    return vertMap.get(key)!
  }

  // iterate hull faces via edges
  // @ts-ignore (Hull types are not exported fully)
  hull.faces.forEach((f) => {
    const indices: number[] = []
    let e = f.edge
    do {
      indices.push(addVert(e.head().point))
      e = e.next
    } while (e !== f.edge)
    if (indices.length >= 3) faces.push(indices)
  })

  return new CANNON.ConvexPolyhedron({ vertices: verts, faces })
}

async function loadGLTF(url: string): Promise<THREE.Mesh> {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(url)
  let best: THREE.Mesh | null = null
  gltf.scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh
      if (!best || (m.geometry?.attributes?.position?.count ?? 0) > (best.geometry?.attributes?.position?.count ?? 0)) best = m
    }
  })
  if (!best) throw new Error('No mesh found in GLTF')
  // clone to avoid mutating cached buffers
  return new THREE.Mesh(best.geometry.clone(), (best.material as THREE.Material)?.clone?.() || new THREE.MeshStandardMaterial({ color: '#9ad1ff' }))
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
    world.defaultContactMaterial.friction = 0.4
    world.defaultContactMaterial.restitution = 0.05
    worldRef.current = world

    // Ground plane
    const groundMaterial = new CANNON.Material('ground')
    const GROUND_FRIC = 0.9
    const GROUND_REST = 0.0

    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial })
    const groundShape = new CANNON.Plane()
    groundBody.addShape(groundShape)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)

    // remember its material props so contact pairs get a high friction value
    matProps.current.set(groundMaterial.id, { f: GROUND_FRIC, r: GROUND_REST })

    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: '#23232f', metalness: 0, roughness: 1 }),
    )
    groundMesh.receiveShadow = true
    groundMesh.rotation.x = -Math.PI / 2
    scene.add(groundMesh)

    // World bounds (six static planes forming a box)
    addBounds(worldBounds.halfExtents)

    // Resize
    const ro = new ResizeObserver(() => fitRenderer())
    ro.observe(mount)
    fitRenderer()
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
// ro.disconnect()
      controls.dispose()
      renderer.dispose()
      for (const [, entry] of bodiesRef.current) {
        removeEntry(entry)
      }
      constraintsRef.current.forEach((c) => worldRef.current?.removeConstraint(c))
      constraintsRef.current.length = 0
      for (const [, L] of lightsRef.current) scene.remove(L)
      lightsRef.current.clear()
      if (worldRef.current) {
        worldRef.current.bodies.forEach((b) => worldRef.current.removeBody(b))
      }
      scene.clear()
      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      worldRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



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
    // Add contact material for this body with all existing bodies
    for (const [, otherEntry] of bodiesRef.current) {
      if (entry.id === otherEntry.id) continue
      const key = pairKey(entry.material, otherEntry.material)
      if (!contactPairs.current.has(key)) {
        const matA = matProps.current.get(entry.material.id) ?? { f: 0.3, r: 0.05 }
        const matB = matProps.current.get(otherEntry.material.id) ?? { f: 0.3, r: 0.05 }
        world.addContactMaterial(
          new CANNON.ContactMaterial(entry.material, otherEntry.material, {
            friction: (matA.f + matB.f) / 2,
            restitution: (matA.r + matB.r) / 2,
          }),
        )
        contactPairs.current.add(key)
      }
    }
  }

  function removeEntry(entry: BodyEntry) {
    const { id, body, mesh } = entry
    worldRef.current!.removeBody(body)
    sceneRef.current!.remove(mesh)
    bodiesRef.current.delete(id)
    // TODO: remove contact materials?
  }

  function spawnPrimitive(a: SpawnPrimitive) {
    const id = genId()
    const color = hexToThree(a.color)
    let mesh: THREE.Mesh
    let shape: CANNON.Shape

    const mass = a.mass ?? 1
    const friction = a.friction ?? (a.kind === 'box' ? 0.8 : 0.4)
    const restitution = a.restitution ?? 0.05

    switch (a.kind) {
      case 'box':
        const boxSize = a.size ? (Array.isArray(a.size) ? a.size : [a.size, a.size, a.size]) : [1, 1, 1]
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(boxSize[0], boxSize[1], boxSize[2]),
          new THREE.MeshStandardMaterial({ color }),
        )
        shape = new CANNON.Box(new CANNON.Vec3(boxSize[0] / 2, boxSize[1] / 2, boxSize[2] / 2))
        break
      case 'sphere':
        const sphereRadius = (a.size as number) ?? 0.5
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(sphereRadius, 32, 32),
          new THREE.MeshStandardMaterial({ color }),
        )
        shape = new CANNON.Sphere(sphereRadius)
        break
      case 'cylinder':
        const cylinderSize = a.size ? (Array.isArray(a.size) ? a.size : [a.size, a.size, a.size]) : [1, 2, 32]
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(cylinderSize[0], cylinderSize[0], cylinderSize[1], cylinderSize[2]),
          new THREE.MeshStandardMaterial({ color }),
        )
        shape = new CANNON.Cylinder(cylinderSize[0], cylinderSize[0], cylinderSize[1], cylinderSize[2])
        break
      case 'capsule':
        const capsuleSize = a.size ? (Array.isArray(a.size) ? a.size : [a.size, a.size]) : [0.5, 1]
        mesh = new THREE.Mesh(
          new THREE.CapsuleGeometry(capsuleSize[0], capsuleSize[1]),
          new THREE.MeshStandardMaterial({ color }),
        )
        shape = new CANNON.Sphere(capsuleSize[0]) // Simplified for now
        break
      case 'torus':
        const torusSize = a.size ? (Array.isArray(a.size) ? a.size : [a.size, a.size]) : [1, 0.2]
        mesh = new THREE.Mesh(
          new THREE.TorusGeometry(torusSize[0], torusSize[1]),
          new THREE.MeshStandardMaterial({ color }),
        )
        shape = new CANNON.Sphere(torusSize[0]) // Simplified for now
        break
      case 'mesh': {
        const url = (a as any).url as string
        if (!url) { logMsg('mesh spawn missing url'); return null }
  
        ;(async () => {
          try {
            const mesh = await loadGLTF(url)
            const scale = (a as any).scale ?? 1
            if (Array.isArray(scale)) mesh.scale.set(scale[0], scale[1], scale[2])
            else mesh.scale.setScalar(scale)
  
            mesh.castShadow = true
            const color = hexToThree(a.color)
            const mat: any = (mesh.material as any)
            if (mat?.color) mat.color.set(color)
  
            // build physics shape (convex for dynamic; trimesh if mass==0 or convex:false)
            const geom = ensureGeom(mesh.geometry as THREE.BufferGeometry)
            const useConvex = (a as any).convex !== false && (a.mass ?? 1) > 0
            const shape = useConvex ? geometryToConvexPolyhedron(geom) : geometryToTrimesh(geom)
  
            const body = new CANNON.Body({ mass: a.mass ?? (useConvex ? 2 : 0) })
            body.addShape(shape)
  
            // damping + sleep
            body.allowSleep = true
        body.allowSleep = true
    body.sleepSpeedLimit = 0.08     // settle when slow
    body.sleepTimeLimit  = 0.6

    body.linearDamping  = a.linearDamping  ?? 0.25   // stops sliding
    body.angularDamping = a.angularDamping ?? 0.35   // stops rolling
  
            // contact material
            const m = new CANNON.Material()
            const fr = a.friction ?? 0.6
            const re = a.restitution ?? 0.05
            body.material = m
            matProps.current.set(m.id, { f: fr, r: re })
  
            const p = a.position ?? [0, 6, 0]
            body.position.set(p[0], p[1], p[2])
            if (a.rotationEuler) {
              const q = new CANNON.Quaternion(); q.setFromEuler(a.rotationEuler[0], a.rotationEuler[1], a.rotationEuler[2], 'XYZ')
              body.quaternion.copy(q)
            }
  
            worldRef.current!.addBody(body)
            sceneRef.current!.add(mesh)
            const entry = { id, body, mesh, kind: 'mesh', material: m }
            addEntry(entry)
            logMsg(`spawned mesh: ${url}`)
          } catch (e) {
            logMsg('mesh load failed: ' + (e as Error).message)
          }
        })()
        return id
      }
      default:
        throw new Error(`Unknown primitive kind: ${a.kind}`)
    }

    mesh.castShadow = true
    const body = new CANNON.Body({ mass, material: new CANNON.Material() })
    body.addShape(shape)

    // damping + sleep
    body.allowSleep = true
    body.sleepSpeedLimit = 0.08     // settle when slow
    body.sleepTimeLimit  = 0.6

    body.linearDamping  = a.linearDamping  ?? 0.25   // stops sliding
    body.angularDamping = a.angularDamping ?? 0.35   // stops rolling

    const p = a.position ?? [0, 6, 0]
    body.position.set(p[0], p[1], p[2])
    if (a.rotationEuler) {
      const q = new CANNON.Quaternion(); q.setFromEuler(a.rotationEuler[0], a.rotationEuler[1], a.rotationEuler[2], 'XYZ')
      body.quaternion.copy(q)
    }

    worldRef.current!.addBody(body)
    sceneRef.current!.add(mesh)

    const mat = body.material as CANNON.Material
    matProps.current.set(mat.id, { f: friction, r: restitution })

    const entry = { id, body, mesh, kind: a.kind, material: mat }
    addEntry(entry)
    logMsg(`spawned ${a.kind}: ${id}`)
    return id
  }

  function applyImpulse(a: Impulse) {
    const entry = bodiesRef.current.get(a.id === 'last' ? `obj_${idCounterRef.current - 1}` : a.id)
    if (!entry) { logMsg(`impulse: body ${a.id} not found`); return }
    const impulse = new CANNON.Vec3(...a.impulse)
    const worldPoint = a.worldPoint ? new CANNON.Vec3(...a.worldPoint) : entry.body.position
    entry.body.applyImpulse(impulse, worldPoint)
    logMsg(`impulse on ${entry.id}: ${a.impulse}`)
  }

  function setGravity(a: SetGravity) {
    worldRef.current!.gravity.set(a.g[0], a.g[1], a.g[2])
    logMsg(`gravity set to ${a.g}`)
  }

  function tint(a: Tint) {
    const entry = bodiesRef.current.get(a.id === 'last' ? `obj_${idCounterRef.current - 1}` : a.id)
    if (!entry) { logMsg(`tint: body ${a.id} not found`); return }
    const mat: any = (entry.mesh as THREE.Mesh).material
    if (mat?.color) mat.color.set(hexToThree(a.color))
    logMsg(`tinted ${entry.id} to ${a.color}`)
  }

  function runPlan(plan: AgentPlan) {
    for (const action of plan.actions) {
      switch (action.op) {
        case 'spawn':
          spawnPrimitive(action)
          break
        case 'light':
          spawnLight(action)
          break
        case 'gravity':
          setGravity(action)
          break
        case 'impulse':
          applyImpulse(action)
          break
        case 'tint':
          tint(action)
          break
        case 'destroy':
          const entry = bodiesRef.current.get(action.id)
          if (entry) removeEntry(entry)
          break
        case 'constraint:distance':
          // TODO: implement distance constraint
          logMsg('distance constraint not yet implemented')
          break
        case 'reset':
          resetWorld()
          break
        default:
          logMsg(`unknown action: ${(action as any).op}`)
      }
    }
  }

  function spawnLight(a: SpawnLight) {
    const color = hexToThree(a.color)
    let light: THREE.Light
    switch (a.kind) {
      case 'ambient':
        light = new THREE.AmbientLight(color, a.intensity)
        break
      case 'directional':
        light = new THREE.DirectionalLight(color, a.intensity)
        break
      case 'point':
        light = new THREE.PointLight(color, a.intensity)
        break
      case 'spot':
        light = new THREE.SpotLight(color, a.intensity)
        break
      default:
        throw new Error(`Unknown light kind: ${a.kind}`)
    }
    if (a.position) light.position.set(a.position[0], a.position[1], a.position[2])
    sceneRef.current!.add(light)
    lightsRef.current.set(a.id ?? genId(), light)
    logMsg(`spawned light: ${a.kind}`)
  }

  function resetWorld() {
    stopLoop()
    for (const [, entry] of bodiesRef.current) {
      removeEntry(entry)
    }
    constraintsRef.current.forEach((c) => worldRef.current!.removeConstraint(c))
    constraintsRef.current.length = 0
    for (const [, L] of lightsRef.current) sceneRef.current!.remove(L)
    lightsRef.current.clear()
    worldRef.current!.bodies.forEach((b) => worldRef.current!.remove(b))
    idCounterRef.current = 0
    rngState.current = seed ?? Math.floor(Math.random() * 1e9)
    log.current = ['Sandbox reset.']
    setStats({ time: 0, objects: 0, energy: 0, fps: 0 })
    startLoop()
  }

  function logMsg(msg: string) {
    setLog((prev) => [msg, ...prev].slice(0, 100))
  }

  function runSelfTests() {
    logMsg('Running self-tests...')
    const testPlan: AgentPlan = {
      actions: [
        { op: 'spawn', kind: 'box', size: 1, position: [0, 5, 0], mass: 1, color: '#8be9fd' },
        { op: 'spawn', kind: 'sphere', size: 0.5, position: [1, 6, 0], mass: 0.5, color: '#ff79c6' },
        { op: 'impulse', id: 'last', impulse: [0, 0, 20] },
        { op: 'light', kind: 'point', position: [2, 3, 4], intensity: 1.0, id: 'testLight' },
        { op: 'tint', id: 'testLight', color: '#f1fa8c' },
        { op: 'gravity', g: [0, -5, 0] },
        { op: 'destroy', id: 'obj_0' },
      ],
    }
    runPlan(testPlan)
    logMsg('Self-tests complete.')
  }

  return (
    <div ref={mountRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>

      {/* HUD */}
      <div className="absolute top-4 left-4 text-white text-xs font-mono bg-black bg-opacity-50 p-2 rounded">
        <div>Time: {stats.time.toFixed(1)}s</div>
        <div>Objects: {stats.objects}</div>
        <div>Energy: {stats.energy.toFixed(0)}</div>
        <div>FPS: {stats.fps}</div>
      </div>

      {/* Log */}
      <div className="absolute bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 p-2 rounded text-white text-xs font-mono overflow-y-auto">
        {log.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      {/* Dock */}
      <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg shadow-lg flex flex-col space-y-3 w-80">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button onClick={() => setRunning(!running)} className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
            {running ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={resetWorld} className="p-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors">
            <RotateCcw size={20} />
          </button>
          <span className="text-white text-sm">{running ? 'Running' : 'Paused'}</span>
        </div>

        {/* Prompt Input */}
        <textarea
          className="w-full p-2 rounded-md bg-gray-700 text-white text-sm resize-none"
          rows={3}
          placeholder="Enter natural language prompt for agent..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
        <button
          onClick={() => {
            if (bridge) {
              setLlmBusy(true)
              bridge(prompt, { snapshot: buildSnapshot() })
                .then((plan) => {
                  setJsonText(JSON.stringify(plan, null, 2))
                  runPlan(plan)
                })
                .catch((e) => logMsg('LLM bridge error: ' + (e as Error).message))
                .finally(() => setLlmBusy(false))
            } else {
              logMsg('LLM bridge not enabled. Set provider to OpenAI in settings.')
            }
          }}
          className={`w-full p-2 rounded-md transition-colors ${llmBusy ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
          disabled={llmBusy}
        >
          {llmBusy ? 'Thinking...' : <><Sparkles size={20} className="inline mr-2" />Send to Agent</>}
        </button>

        {/* JSON Input */}
        <textarea
          className="w-full p-2 rounded-md bg-gray-700 text-white text-sm resize-none font-mono"
          rows={6}
          placeholder="Or paste AgentPlan JSON here..."
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        ></textarea>
        <button
          onClick={() => {
            try {
              const plan = JSON.parse(jsonText) as AgentPlan
              runPlan(plan)
            } catch (e) {
              logMsg('JSON parse error: ' + (e as Error).message)
            }
          }}
          className="w-full p-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          <Zap size={20} className="inline mr-2" />Run JSON Plan
        </button>

        {/* Settings */}
        <div className="flex items-center space-x-2">
          <button onClick={() => { /* Toggle settings modal */ }} className="p-2 bg-gray-600 rounded-md hover:bg-gray-700 transition-colors">
            <Settings size={20} />
          </button>
          <span className="text-white text-sm">Settings</span>
        </div>

        {/* LLM Settings Panel (simplified for brevity) */}
        <div className="bg-gray-700 p-3 rounded-md space-y-2">
          <div className="text-white text-sm font-bold">LLM Bridge Settings</div>
          <div className="flex items-center space-x-2">
            <label htmlFor="provider-select" className="text-white text-sm">Provider:</label>
            <select
              id="provider-select"
              className="flex-grow p-1 rounded-md bg-gray-600 text-white text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <option value="off">Off</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          {provider === 'openai' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="model-input" className="text-white text-sm">Model:</label>
                <input
                  id="model-input"
                  type="text"
                  className="flex-grow p-1 rounded-md bg-gray-600 text-white text-sm"
                  value={gptModel}
                  onChange={(e) => setGptModel(e.target.value)}
                  placeholder="e.g., gpt-4o"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="key-input" className="text-white text-sm">API Key:</label>
                <input
                  id="key-input"
                  type="password"
                  className="flex-grow p-1 rounded-md bg-gray-600 text-white text-sm"
                  value={gptKey}
                  onChange={(e) => setGptKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Safety Settings */}
        <div className="bg-gray-700 p-3 rounded-md space-y-2">
          <div className="text-white text-sm font-bold">Safety Settings</div>
          <div className="flex items-center space-x-2">
            <label htmlFor="object-cap-input" className="text-white text-sm">Object Cap:</label>
            <input
              id="object-cap-input"
              type="number"
              className="flex-grow p-1 rounded-md bg-gray-600 text-white text-sm"
              value={objectCap}
              onChange={(e) => setObjectCap(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="energy-cap-input" className="text-white text-sm">Energy Cap:</label>
            <input
              id="energy-cap-input"
              type="number"
              className="flex-grow p-1 rounded-md bg-gray-600 text-white text-sm"
              value={energyCap}
              onChange={(e) => setEnergyCap(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="godmode-checkbox"
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600"
              checked={godmode}
              onChange={(e) => setGodmode(e.target.checked)}
            />
            <label htmlFor="godmode-checkbox" className="text-white text-sm">God Mode (Disable Safety)</label>
          </div>
        </div>
      </div>
    </div>
  )
}


