import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import audio from '../../audio/AudioEngine'

/* ==========================================================================
   ToyCarRoom — Bruno Simon Style 3D Name Typography & Collision Explosion Physics
   - 3D Extruded Block Letters: "A D A R S H   S A H U" with chamfered bevels & drop shadows
   - Voxel Fragment Explosion Shards on high-speed impact (speed > 0.01)
   - Real-time impulse vector calculations: velocity (vx, vz) & rotation (rotX, rotY)
   - Audio feedback: audio.explode() / audio.thock()
   - Controls: WASD/Arrows (Drive), Shift (Nitro), L (Headlights), H (Horn), R (Reset)
   ========================================================================== */

const SKID_COUNT = 24
const EXPLOSION_COUNT = 32

const BOUNDS = {
  minX: -2.3,
  maxX: 2.3,
  minZ: -0.6,
  maxZ: 1.8,
  minY: 0.1,
  maxY: 2.5,
}

const NAME_COLORS = [
  '#f43f5e', // A - Red
  '#fb923c', // D - Orange
  '#facc15', // A - Yellow
  '#10b981', // R - Emerald
  '#06b6d4', // S - Cyan
  '#6366f1', // H - Indigo
  '#a855f7', // S - Purple
  '#ec4899', // A - Pink
  '#ef4444', // H - Bright Red
  '#38bdf8', // U - Light Blue
]

const INITIAL_BLOCKS = [
  // --- Bruno Simon 3D Name Typography: "A D A R S H   S A H U" (10 Letters)
  { id: 1, type: 'letter', letter: 'A', x: -0.68, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[0] },
  { id: 2, type: 'letter', letter: 'D', x: -0.52, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[1] },
  { id: 3, type: 'letter', letter: 'A', x: -0.36, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[2] },
  { id: 4, type: 'letter', letter: 'R', x: -0.20, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[3] },
  { id: 5, type: 'letter', letter: 'S', x: -0.04, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[4] },
  { id: 6, type: 'letter', letter: 'H', x:  0.12, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[5] },
  // Gap between FIRST and LAST name
  { id: 7, type: 'letter', letter: 'S', x:  0.40, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[6] },
  { id: 8, type: 'letter', letter: 'A', x:  0.56, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[7] },
  { id: 9, type: 'letter', letter: 'H', x:  0.72, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[8] },
  { id: 10, type: 'letter', letter: 'U', x: 0.88, z: 0.45, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: NAME_COLORS[9] },

  // --- Pyramid Block Stack (10 blocks)
  { id: 11, type: 'block', x: -1.05, z: 0.1, y: 0.036, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f43f5e' },
  { id: 12, type: 'block', x: -0.97, z: 0.1, y: 0.036, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#3b82f6' },
  { id: 13, type: 'block', x: -0.89, z: 0.1, y: 0.036, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#10b981' },
  { id: 14, type: 'block', x: -0.81, z: 0.1, y: 0.036, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f59e0b' },
  { id: 15, type: 'block', x: -1.01, z: 0.1, y: 0.108, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#8b5cf6' },
  { id: 16, type: 'block', x: -0.93, z: 0.1, y: 0.108, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#ec4899' },
  { id: 17, type: 'block', x: -0.85, z: 0.1, y: 0.108, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#06b6d4' },
  { id: 18, type: 'block', x: -0.97, z: 0.1, y: 0.18, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#eab308' },
  { id: 19, type: 'block', x: -0.89, z: 0.1, y: 0.18, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#a855f7' },
  { id: 20, type: 'block', x: -0.93, z: 0.1, y: 0.252, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#ef4444' },

  // --- Slalom Traffic Cones (5 cones)
  { id: 21, type: 'cone', x: 1.05, z: -0.1, y: 0.045, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f97316' },
  { id: 22, type: 'cone', x: 1.25, z: 0.3, y: 0.045, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f97316' },
  { id: 23, type: 'cone', x: 1.05, z: 0.7, y: 0.045, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f97316' },
  { id: 24, type: 'cone', x: 1.25, z: 1.1, y: 0.045, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f97316' },
  { id: 25, type: 'cone', x: 1.05, z: 1.5, y: 0.045, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f97316' },

  // --- Rolling Marbles / Metallic Spheres (4 spheres)
  { id: 26, type: 'sphere', x: -0.5, z: 1.0, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#38bdf8' },
  { id: 27, type: 'sphere', x: -0.3, z: 1.3, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f43f5e' },
  { id: 28, type: 'sphere', x: 0.2, z: 1.1, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#a855f7' },
  { id: 29, type: 'sphere', x: 0.5, z: 1.25, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#10b981' },
]

function Wheel({ isFront, isLeft, steeringRef, meshRef }) {
  const xPos = isLeft ? -0.095 : 0.095
  const zPos = isFront ? -0.085 : 0.085
  const radius = isFront ? 0.036 : 0.038
  const width = 0.026

  const wheelContent = (
    <group ref={meshRef}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius, radius, width, 20]} />
        <meshStandardMaterial color="#111115" roughness={0.85} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[isLeft ? -0.001 : 0.001, 0, 0]}>
        <cylinderGeometry args={[radius * 0.65, radius * 0.65, width + 0.002, 14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.92} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[isLeft ? -0.014 : 0.014, 0, 0]}>
        <cylinderGeometry args={[radius * 0.25, radius * 0.25, 0.005, 10]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )

  if (isFront) {
    return (
      <group ref={steeringRef} position={[xPos, 0.03, zPos]}>
        {wheelContent}
      </group>
    )
  }

  return <group position={[xPos, 0.03, zPos]}>{wheelContent}</group>
}

/* ==========================================================================
   Bruno Simon style 3D name.

   The letters are real extruded letterforms, not a cube with the character
   printed on the front. That distinction is the whole effect: a decal reads
   as a texture the moment the car knocks a letter onto its side, whereas an
   extruded form still reads as an "A" from any angle — which is exactly when
   you are looking at it, mid-tumble.

   Each glyph is a handful of bars on a normalised grid (-0.5..0.5 on both
   axes), extruded upward from the floor. Grid Y maps to -Z so the letters
   read the right way up to a camera sitting at +Z looking back at the desk.
   ========================================================================== */

const LETTER_W = 0.115
const LETTER_H = 0.155
const LETTER_D = 0.055

/** [centreX, centreY, width, height] per bar, on the normalised grid. */
const LETTER_SHAPES = {
  A: [
    [-0.34, 0.0, 0.32, 1.0],
    [0.34, 0.0, 0.32, 1.0],
    [0.0, 0.34, 1.0, 0.32],
    [0.0, -0.05, 1.0, 0.28],
  ],
  D: [
    [-0.34, 0.0, 0.32, 1.0],
    [0.1, 0.34, 0.88, 0.32],
    [0.1, -0.34, 0.88, 0.32],
    [0.34, 0.0, 0.32, 0.7],
  ],
  R: [
    [-0.34, 0.0, 0.32, 1.0],
    [0.1, 0.34, 0.88, 0.32],
    [0.34, 0.15, 0.32, 0.42],
    [0.05, -0.02, 0.78, 0.28],
    [0.3, -0.33, 0.3, 0.34],
  ],
  S: [
    [0.0, 0.34, 1.0, 0.32],
    [-0.34, 0.15, 0.32, 0.42],
    [0.0, -0.02, 1.0, 0.28],
    [0.34, -0.18, 0.32, 0.42],
    [0.0, -0.34, 1.0, 0.32],
  ],
  H: [
    [-0.34, 0.0, 0.32, 1.0],
    [0.34, 0.0, 0.32, 1.0],
    [0.0, -0.02, 0.72, 0.28],
  ],
  U: [
    [-0.34, 0.09, 0.32, 0.82],
    [0.34, 0.09, 0.32, 0.82],
    [0.0, -0.34, 1.0, 0.32],
  ],
}

function BrunoSimon3DLetter({ letter, color }) {
  const bars = LETTER_SHAPES[letter] ?? LETTER_SHAPES.A

  return (
    <group>
      {/* Contact shadow plate. Sits a hair above the rug so it reads as the
          letter's own footprint rather than z-fighting with the floor. */}
      <mesh position={[0, -LETTER_D / 2 - 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LETTER_W * 1.25, LETTER_H * 1.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {bars.map(([gx, gy, gw, gh], i) => (
        <RoundedBox
          key={i}
          args={[gw * LETTER_W, LETTER_D, gh * LETTER_H]}
          radius={0.008}
          smoothness={2}
          position={[gx * LETTER_W, 0, -gy * LETTER_H]}
          castShadow
        >
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.12} />
        </RoundedBox>
      ))}
    </group>
  )
}

export default function ToyCarRoom({ viewState }) {
  const [vehicleMode] = useState('CAR')
  const lastThockTimeRef = useRef(0)

  const carGroupRef = useRef()
  const frontLeftSteeringRef = useRef()
  const frontRightSteeringRef = useRef()
  const frontLeftWheelMeshRef = useRef()
  const frontRightWheelMeshRef = useRef()
  const rearLeftWheelMeshRef = useRef()
  const rearRightWheelMeshRef = useRef()

  const carState = useRef({
    x: 0.8,
    z: 0.8,
    heading: 0,
    speed: 0,
    steering: 0,
  })

  const blocksDataRef = useRef(JSON.parse(JSON.stringify(INITIAL_BLOCKS)))
  const blockMeshRefs = useRef([])

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    nitro: false,
  })

  const [headlightsOn, setHeadlightsOn] = useState(true)
  const spotLightRef = useRef()
  const spotLightTargetRef = useRef()
  const lastSkidTimeRef = useRef(0)
  const skidRefs = useRef([])
  const skidCursor = useRef(0)

  // Pre-allocated Voxel Explosion Shards Pool
  const explosionPool = useRef(
    Array.from({ length: EXPLOSION_COUNT }, () => ({
      x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, scale: 0, alpha: 0, color: '#f43f5e', rx: 0, ry: 0
    }))
  )
  const explosionMeshRefs = useRef([])

  // Trigger high-octane voxel fragment blast on impact
  const triggerExplosion = (x, y, z) => {
    audio.explode?.()
    const pool = explosionPool.current
    const shardColors = ['#f43f5e', '#fb923c', '#facc15', '#10b981', '#06b6d4', '#ffffff', '#38bdf8']

    for (let i = 0; i < EXPLOSION_COUNT; i++) {
      const p = pool[i]
      p.x = x + (Math.random() - 0.5) * 0.08
      p.y = y + 0.02
      p.z = z + (Math.random() - 0.5) * 0.08

      const speed = 0.04 + Math.random() * 0.065
      const angle = Math.random() * Math.PI * 2
      p.vx = Math.cos(angle) * speed
      p.vy = 0.05 + Math.random() * 0.04
      p.vz = Math.sin(angle) * speed
      p.rx = (Math.random() - 0.5) * 0.4
      p.ry = (Math.random() - 0.5) * 0.4
      p.alpha = 1.0
      p.scale = 0.016 + Math.random() * 0.022
      p.color = shardColors[i % shardColors.length]
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.current.forward = true
      if (k === 's' || k === 'arrowdown') keys.current.backward = true
      if (k === 'a' || k === 'arrowleft') keys.current.left = true
      if (k === 'd' || k === 'arrowright') keys.current.right = true
      if (e.shiftKey || k === 'shift') keys.current.nitro = true

      if (k === 'l') {
        audio.switchToggle()
        setHeadlightsOn((v) => !v)
      }

      if (k === 'h') {
        audio.horn()
      }

      if (k === 'r') {
        carState.current = { x: 0.8, z: 0.8, heading: 0, speed: 0, steering: 0 }
        blocksDataRef.current = JSON.parse(JSON.stringify(INITIAL_BLOCKS))
        skidRefs.current.forEach((m) => m && (m.visible = false))
        skidCursor.current = 0

        // Hide all explosion shards
        explosionPool.current.forEach((p, i) => {
          p.alpha = 0
          const m = explosionMeshRefs.current[i]
          if (m) m.visible = false
        })

        audio.thock?.()
      }
    }

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.current.forward = false
      if (k === 's' || k === 'arrowdown') keys.current.backward = false
      if (k === 'a' || k === 'arrowleft') keys.current.left = false
      if (k === 'd' || k === 'arrowright') keys.current.right = false
      if (!e.shiftKey && k === 'shift') keys.current.nitro = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (viewState && viewState !== 'ROOM') return
    const k = keys.current
    const dt = Math.min(delta, 0.05)

    if (vehicleMode === 'CAR') {
      const cs = carState.current
      const maxSpeed = k.nitro ? 0.058 : 0.034
      const revSpeed = -0.02
      const accel = (k.nitro ? 0.085 : 0.045) * dt
      const drag = 0.92

      if (k.forward) cs.speed = Math.min(maxSpeed, cs.speed + accel)
      else if (k.backward) cs.speed = Math.max(revSpeed, cs.speed - accel)
      else cs.speed *= drag

      const steerTarget = k.left ? 0.34 : k.right ? -0.34 : 0
      cs.steering += (steerTarget - cs.steering) * 0.12

      if (Math.abs(cs.speed) > 0.001) {
        cs.heading += cs.steering * (cs.speed * 5.5)
      }

      cs.x -= Math.sin(cs.heading) * cs.speed
      cs.z -= Math.cos(cs.heading) * cs.speed

      if (Number.isFinite(cs.x)) cs.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, cs.x))
      if (Number.isFinite(cs.z)) cs.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, cs.z))

      // Skid marks
      const now = performance.now()
      if (
        (Math.abs(cs.steering) > 0.15 || k.nitro) &&
        Math.abs(cs.speed) > 0.012 &&
        now - lastSkidTimeRef.current > (k.nitro ? 45 : 70)
      ) {
        lastSkidTimeRef.current = now
        const slot = skidRefs.current[skidCursor.current % SKID_COUNT]
        if (slot) {
          slot.position.set(cs.x, 0.008, cs.z)
          slot.rotation.set(-Math.PI / 2, 0, cs.heading)
          slot.visible = true
        }
        skidCursor.current++
      }

      for (let i = 0; i < SKID_COUNT; i++) {
        const slot = skidRefs.current[i]
        if (!slot?.visible) continue
        const age = (skidCursor.current - i + SKID_COUNT) % SKID_COUNT
        if (age > SKID_COUNT - 4) slot.visible = false
      }

      // Update Car Mesh Position & Orientation
      if (carGroupRef.current) {
        const pitch = -cs.speed * 2.8
        const roll = -cs.steering * Math.abs(cs.speed) * 8.0
        carGroupRef.current.position.set(cs.x, 0.04, cs.z)
        carGroupRef.current.rotation.set(pitch, cs.heading, roll)
      }

      if (spotLightRef.current && spotLightTargetRef.current) {
        spotLightRef.current.target = spotLightTargetRef.current
      }

      if (frontLeftSteeringRef.current && frontRightSteeringRef.current) {
        frontLeftSteeringRef.current.rotation.y = cs.steering
        frontRightSteeringRef.current.rotation.y = cs.steering
      }

      const spin = cs.speed * 25
      ;[frontLeftWheelMeshRef, frontRightWheelMeshRef, rearLeftWheelMeshRef, rearRightWheelMeshRef].forEach((ref) => {
        if (ref.current) ref.current.rotation.x -= spin
      })

      // Bruno Simon 3D Letter & Object Physics Collision Loop
      const currentBlocks = blocksDataRef.current
      for (let i = 0; i < currentBlocks.length; i++) {
        const b = currentBlocks[i]
        const dx = b.x - cs.x
        const dz = b.z - cs.z
        const distSq = dx * dx + dz * dz

        /* Centre-to-centre trigger distance, squared at the comparison.
           The old code compared a SQUARED distance against a plain radius,
           which made every letter a 22cm trigger and let the car detonate
           its neighbours two positions away.
           The value has to sit between the letter's own half-diagonal
           (~9.7cm, or the car visibly overlaps before anything happens) and
           the 16cm letter spacing (or neighbours fire together). */
        const hitRadius = b.type === 'letter' ? 0.125 : b.type === 'sphere' ? 0.07 : 0.075

        if (distSq < hitRadius * hitRadius && Math.abs(cs.speed) > 0.003) {
          const dist = Math.sqrt(distSq) || 0.001
          const nx = dx / dist
          const nz = dz / dist
          const impactForce = Math.abs(cs.speed) * (b.type === 'letter' ? 4.5 : 2.5)

          b.vx = nx * impactForce
          b.vz = nz * impactForce
          b.rotX += (Math.random() - 0.5) * 1.2
          b.rotY += (Math.random() - 0.5) * 1.2
          b.rotZ = (b.rotZ ?? 0) + (Math.random() - 0.5) * 1.0

          // High-speed collision triggers 3D Voxel Explosion & Boom SFX
          if (Math.abs(cs.speed) > 0.018 && b.type === 'letter') {
            triggerExplosion(b.x, 0.04, b.z)
          } else {
            const nowTime = performance.now()
            if (nowTime - lastThockTimeRef.current > 160) {
              audio.thock?.()
              lastThockTimeRef.current = nowTime
            }
          }
        }

        // Object-to-object elastic collision
        for (let j = i + 1; j < currentBlocks.length; j++) {
          const b2 = currentBlocks[j]
          const bdx = b2.x - b.x
          const bdz = b2.z - b.z
          const bdistSq = bdx * bdx + bdz * bdz
          if (bdistSq < 0.008) {
            const bdist = Math.sqrt(bdistSq) || 0.001
            const bnx = bdx / bdist
            const bnz = bdz / bdist
            const overlap = 0.088 - bdist
            b.x -= bnx * overlap * 0.5
            b.z -= bnz * overlap * 0.5
            b2.x += bnx * overlap * 0.5
            b2.z += bnz * overlap * 0.5
            const tvx = b.vx
            const tvz = b.vz
            b.vx = b2.vx * 0.8
            b.vz = b2.vz * 0.8
            b2.vx = tvx * 0.8
            b2.vz = tvz * 0.8
          }
        }

        const friction = b.type === 'sphere' ? 0.95 : 0.91
        b.vx *= friction
        b.vz *= friction

        if (Math.abs(b.vx) > 0.0001) b.x += b.vx
        if (Math.abs(b.vz) > 0.0001) b.z += b.vz

        if (Number.isFinite(b.x)) b.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, b.x))
        if (Number.isFinite(b.z)) b.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, b.z))

        const mesh = blockMeshRefs.current[i]
        if (mesh && Number.isFinite(b.x) && Number.isFinite(b.z)) {
          mesh.position.set(b.x, b.y, b.z)
          mesh.rotation.set(b.rotX, b.rotY, b.rotZ ?? 0)
        }
      }

      // Update 3D Voxel Explosion Debris Shards
      const pool = explosionPool.current
      for (let i = 0; i < EXPLOSION_COUNT; i++) {
        const p = pool[i]
        if (p.alpha > 0.01) {
          p.x += p.vx
          p.y += p.vy
          p.z += p.vz
          p.vy -= 0.004 // gravity
          p.alpha *= 0.93 // ~600ms to invisible at 60fps
          const mesh = explosionMeshRefs.current[i]
          if (mesh) {
            mesh.position.set(p.x, p.y, p.z)
            mesh.rotation.x += p.rx
            mesh.rotation.y += p.ry
            mesh.scale.setScalar(p.alpha * p.scale)
            mesh.visible = true
          }
        } else {
          const mesh = explosionMeshRefs.current[i]
          if (mesh) mesh.visible = false
        }
      }
    }
  })

  return (
    <group>
      {/* ---------------------------------------------------- 🏎️ DIE-CAST MINI SPORTS CAR */}
      <group ref={carGroupRef} position={[0.8, 0.04, 0.8]}>
        {/* Main Body Chassis */}
        <RoundedBox args={[0.165, 0.048, 0.27]} radius={0.012} smoothness={4} position={[0, 0.04, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e11d48" roughness={0.18} metalness={0.82} />
        </RoundedBox>

        {/* Racing Stripes */}
        <mesh position={[0, 0.065, 0]}>
          <boxGeometry args={[0.036, 0.002, 0.268]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.2} />
        </mesh>

        {/* Cabin Glass */}
        <RoundedBox args={[0.125, 0.044, 0.125]} radius={0.01} smoothness={4} position={[0, 0.08, -0.018]} castShadow>
          <meshStandardMaterial color="#09090b" roughness={0.08} metalness={0.92} transparent opacity={0.78} />
        </RoundedBox>

        {/* Rear Spoiler */}
        <group position={[0, 0.088, 0.125]}>
          <RoundedBox args={[0.16, 0.008, 0.035]} radius={0.002} smoothness={2} castShadow>
            <meshStandardMaterial color="#18181b" roughness={0.2} metalness={0.8} />
          </RoundedBox>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, -0.015, 0]}>
              <boxGeometry args={[0.008, 0.024, 0.02]} />
              <meshStandardMaterial color="#18181b" roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* Headlights — Permanently mounted to prevent WebGL shader crashes on toggle */}
        <object3D ref={spotLightTargetRef} position={[0, 0, -3.5]} />
        {[-0.054, 0.054].map((x) => (
          <group key={x} position={[x, 0.045, -0.136]}>
            <mesh>
              <sphereGeometry args={[0.014, 16, 16]} />
              <meshBasicMaterial color={headlightsOn ? '#7dd3fc' : '#334155'} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <spotLight
          ref={spotLightRef}
          position={[0, 0.06, -0.14]}
          color="#cfe9ff"
          intensity={headlightsOn ? 6 : 0}
          angle={0.45}
          penumbra={0.6}
          distance={4.0}
          decay={1.8}
        />

        {/* Rear Brake Light Bar */}
        <mesh position={[0, 0.046, 0.136]}>
          <boxGeometry args={[0.13, 0.01, 0.004]} />
          <meshBasicMaterial color="#f43f5e" toneMapped={false} />
        </mesh>

        {/* Wheels */}
        <Wheel isFront={true} isLeft={true} steeringRef={frontLeftSteeringRef} meshRef={frontLeftWheelMeshRef} />
        <Wheel isFront={true} isLeft={false} steeringRef={frontRightSteeringRef} meshRef={frontRightWheelMeshRef} />
        <Wheel isFront={false} isLeft={true} meshRef={rearLeftWheelMeshRef} />
        <Wheel isFront={false} isLeft={false} meshRef={rearRightWheelMeshRef} />
      </group>

      {/* ---------------------------------------------------- Dynamic Interactive Bruno Simon 3D Name & Objects */}
      {INITIAL_BLOCKS.map((b, i) => {
        if (b.type === 'letter') {
          return (
            <group
              key={b.id}
              ref={(el) => (blockMeshRefs.current[i] = el)}
              position={[b.x, b.y, b.z]}
              rotation={[b.rotX, b.rotY, 0]}
            >
              <BrunoSimon3DLetter letter={b.letter} color={b.color} />
            </group>
          )
        }

        if (b.type === 'cone') {
          return (
            <group
              key={b.id}
              ref={(el) => (blockMeshRefs.current[i] = el)}
              position={[b.x, b.y, b.z]}
              rotation={[b.rotX, b.rotY, 0]}
            >
              <mesh position={[0, -0.035, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.075, 0.008, 0.075]} />
                <meshStandardMaterial color="#f97316" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.008, 0.035, 0.08, 14]} />
                <meshStandardMaterial color="#f97316" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.008, 0]}>
                <cylinderGeometry args={[0.016, 0.022, 0.022, 14]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.2} />
              </mesh>
            </group>
          )
        }

        if (b.type === 'sphere') {
          return (
            <mesh
              key={b.id}
              ref={(el) => (blockMeshRefs.current[i] = el)}
              position={[b.x, b.y, b.z]}
              rotation={[b.rotX, b.rotY, 0]}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[0.038, 20, 20]} />
              <meshStandardMaterial color={b.color} roughness={0.15} metalness={0.8} />
            </mesh>
          )
        }

        return (
          <RoundedBox
            key={b.id}
            ref={(el) => (blockMeshRefs.current[i] = el)}
            args={[0.072, 0.072, 0.072]}
            radius={0.008}
            smoothness={3}
            position={[b.x, b.y, b.z]}
            rotation={[b.rotX, b.rotY, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={b.color} roughness={0.35} metalness={0.15} />
          </RoundedBox>
        )
      })}

      {/* ---------------------------------------------------- 3D Voxel Explosion Debris Shards */}
      {Array.from({ length: EXPLOSION_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            explosionMeshRefs.current[i] = el
          }}
          visible={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={explosionPool.current[i]?.color || '#f43f5e'} toneMapped={false} />
        </mesh>
      ))}

      {/* Skid marks */}
      {Array.from({ length: SKID_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            skidRefs.current[i] = el
          }}
          visible={false}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.18, 0.04]} />
          <meshBasicMaterial color="#09090b" transparent opacity={0.32} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
