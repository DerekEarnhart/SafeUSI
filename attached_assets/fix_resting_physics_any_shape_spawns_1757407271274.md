# Why cubes keep sliding/bouncing & how to make “any” shape

Below are **drop‑in patches** for your current `AgenticPhysicsSandbox` to (1) make bodies settle realistically and (2) load arbitrary mesh shapes (GLTF) with either a **convex hull** collider (dynamic) or **trimesh** collider (best for static scenery).

> TL;DR: low friction + no rolling resistance + low damping = long slides. We’ll add per‑body damping + sleep thresholds + higher ground friction, and expose a new `mesh` spawn action that loads a GLTF and builds a physics shape.

---

## 1) Improve resting behavior (stop the endless sliding/rolling)

### A. Give the ground its own high‑friction material
Add this **inside initialization** where you create the ground:

```ts
// Physics world (existing)
world.defaultContactMaterial.friction = 0.4
world.defaultContactMaterial.restitution = 0.05
world.allowSleep = true

// Ground with sticky contact
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
```

> Your `addEntry()` already creates `ContactMaterial`s for new pairs using `matProps`, so this auto‑propagates to object/ground contacts.

### B. Set per‑body damping + sleep thresholds when spawning
Add optional damping fields to the action type:

```ts
export type SpawnPrimitive = {
  op: 'spawn'
  kind: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'torus' | 'mesh'
  size?: Vec3 | number
  position?: Vec3
  rotationEuler?: Vec3
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
```

Then, inside `spawnPrimitive(...)` **after** creating the Cannon `Body`, apply sensible defaults:

```ts
body.allowSleep = true
body.sleepSpeedLimit = 0.08     // settle when slow
body.sleepTimeLimit  = 0.6

body.linearDamping  = a.linearDamping  ?? 0.25   // stops sliding
body.angularDamping = a.angularDamping ?? 0.35   // stops rolling
```

You can also bump friction on big boxes:

```ts
const fr = a.friction ?? (a.kind === 'box' ? 0.8 : 0.4)
const re = a.restitution ?? 0.05
matProps.current.set(mat.id, { f: fr, r: re })
```

> Result: boxes stop "ice‑skating" and go to sleep once velocities are tiny.

---

## 2) Spawn “any” shape: GLTF loader + convex hull / trimesh collider

**Imports (top of file):**
```ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js'
```

**Helpers (place near other helpers):**
```ts
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
```

**Add a new spawn branch** inside `spawnPrimitive`:
```ts
case 'mesh': {
  const url = (a as any).url as string
  if (!url) { logMsg('mesh spawn missing url'); return null }

  const id = genId()
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
      body.sleepSpeedLimit = 0.08
      body.sleepTimeLimit  = 0.6
      body.linearDamping   = a.linearDamping  ?? 0.25
      body.angularDamping  = a.angularDamping ?? 0.35

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
```

> **Notes**
> * Use **convex** for moving/dynamic meshes. Trimesh is heavy/unstable for dynamics—use it mostly for static scenery (mass 0).
> * If convex hull fails or is too detailed, you can simplify geometry offline or approximate with a compound of boxes.

---

## 3) JSON examples

**Stop the slidey feel (per‑body damping + friction):**
```json
{
  "actions": [
    { "op": "spawn", "kind": "box", "size": [2,2,2], "position": [0,6,0], "mass": 8,
      "friction": 0.85, "restitution": 0.02, "linearDamping": 0.3, "angularDamping": 0.45 }
  ]
}
```

**Spawn an arbitrary mesh (dynamic convex hull):**
```json
{
  "actions": [
    { "op": "spawn", "kind": "mesh", "url": "/models/bunny.glb",
      "scale": 1.5, "position": [0,8,0], "mass": 3, "convex": true,
      "linearDamping": 0.3, "angularDamping": 0.4 }
  ]
}
```

**Spawn static scene geometry (trimesh):**
```json
{
  "actions": [
    { "op": "spawn", "kind": "mesh", "url": "/models/room.glb",
      "scale": [1,1,1], "position": [0,0,0], "mass": 0, "convex": false }
  ]
}
```

---

## 4) Optional: UI knobs for damping
If you want quick tuning from the dock, add sliders/inputs for global defaults and feed them into the `spawnPrimitive` calls (e.g., `defaultLinearDamping`, `defaultAngularDamping`).

---

### Why bodies drift after impact (short answer)
- **Low friction** → tangential slip on contact.
- **No rolling resistance** in most real‑time engines → cubes keep rolling.
- **Low/zero damping** → velocities don’t decay.
- **Sleep thresholds too strict** → engine never marks them as sleeping.

The patches above target all four.

