import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import audio from '../../audio/AudioEngine'

/* ==========================================================================
   ToyCarRoom — Ultra-Realistic Die-Cast Mini Sports Car Physics & Block Engine
   - Separate Steering (Y-axis) & Wheel Spin (X-axis) for zero rotation jitter
   - Block-to-block collision response & boundary physics
   - High-fidelity die-cast car body with alloy rims, headlights & spoiler
   ========================================================================== */

const BOUNDS = {
  minX: -2.3,
  maxX: 2.3,
  minZ: -0.6,
  maxZ: 1.8,
  minY: 0.1,
  maxY: 2.5,
}

const INITIAL_BLOCKS = [
  { id: 1, x: 0.4, z: 0.3, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f43f5e' },
  { id: 2, x: 0.5, z: 0.3, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#3b82f6' },
  { id: 3, x: 0.6, z: 0.3, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#10b981' },
  { id: 4, x: 0.45, z: 0.3, y: 0.12, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#f59e0b' },
  { id: 5, x: 0.55, z: 0.3, y: 0.12, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#8b5cf6' },
  { id: 6, x: 0.5, z: 0.3, y: 0.2, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#ec4899' },
  { id: 7, x: 1.1, z: 0.1, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#06b6d4' },
  { id: 8, x: 1.2, z: 0.1, y: 0.04, vx: 0, vz: 0, rotX: 0, rotY: 0, color: '#eab308' },
]

export default function ToyCarRoom({ viewState }) {
  const [vehicleMode] = useState('CAR')
  const lastThockTimeRef = useRef(0)

  // Car Mesh Refs
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

  // Physics Blocks Refs
  const blocksDataRef = useRef(JSON.parse(JSON.stringify(INITIAL_BLOCKS)))
  const blockMeshRefs = useRef([])

  // Keyboard Inputs
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })

  const [headlightsOn, setHeadlightsOn] = useState(true)
  const [skidMarks, setSkidMarks] = useState([])
  const lastSkidTimeRef = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.current.forward = true
      if (k === 's' || k === 'arrowdown') keys.current.backward = true
      if (k === 'a' || k === 'arrowleft') keys.current.left = true
      if (k === 'd' || k === 'arrowright') keys.current.right = true

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
        setSkidMarks([])
        audio.thock()
      }
    }

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.current.forward = false
      if (k === 's' || k === 'arrowdown') keys.current.backward = false
      if (k === 'a' || k === 'arrowleft') keys.current.left = false
      if (k === 'd' || k === 'arrowright') keys.current.right = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Animation & Physics Frame Loop
  useFrame((_, delta) => {
    if (viewState && viewState !== 'ROOM') return
    const k = keys.current
    const dt = Math.min(delta, 0.05)

    // ---------------------------------------------------- CAR PHYSICS
    if (vehicleMode === 'CAR') {
      const cs = carState.current
      const maxSpeed = 0.032
      const revSpeed = -0.02
      const accel = 0.045 * dt
      const drag = 0.92

      // W = Drive FORWARD, S = Drive REVERSE
      if (k.forward) cs.speed = Math.min(maxSpeed, cs.speed + accel)
      else if (k.backward) cs.speed = Math.max(revSpeed, cs.speed - accel)
      else cs.speed *= drag

      // Steering: A = Steer Left (+0.34 rad), D = Steer Right (-0.34 rad)
      const steerTarget = k.left ? 0.34 : k.right ? -0.34 : 0
      cs.steering += (steerTarget - cs.steering) * 0.12

      // Smooth heading rotation during movement
      if (Math.abs(cs.speed) > 0.001) {
        cs.heading += cs.steering * (cs.speed * 5.5)
      }

      // Forward vector along car front (-Z direction)
      cs.x -= Math.sin(cs.heading) * cs.speed
      cs.z -= Math.cos(cs.heading) * cs.speed

      if (Number.isFinite(cs.x)) cs.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, cs.x))
      if (Number.isFinite(cs.z)) cs.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, cs.z))

      // Tire Skid Marks when drifting/steering at speed
      const now = Date.now()
      if (Math.abs(cs.steering) > 0.15 && Math.abs(cs.speed) > 0.012 && now - lastSkidTimeRef.current > 80) {
        lastSkidTimeRef.current = now
        setSkidMarks((prev) => [
          ...prev.slice(-30),
          { id: Math.random(), x: cs.x, z: cs.z, heading: cs.heading },
        ])
      }

      // Update Car Mesh with Realistic Damped Suspension Pitch & Roll
      if (carGroupRef.current) {
        const pitch = -cs.speed * 2.8
        const roll = -cs.steering * Math.abs(cs.speed) * 8.0
        carGroupRef.current.position.set(cs.x, 0.04, cs.z)
        carGroupRef.current.rotation.set(pitch, cs.heading, roll)
      }

      // Front Wheels Steering Angle (Rotate Y-axis group cleanly)
      if (frontLeftSteeringRef.current && frontRightSteeringRef.current) {
        frontLeftSteeringRef.current.rotation.y = cs.steering
        frontRightSteeringRef.current.rotation.y = cs.steering
      }

      // Wheel Spin Roll (Spin X-axis mesh inside group — zero Euler glitch)
      const spin = cs.speed * 25
      ;[frontLeftWheelMeshRef, frontRightWheelMeshRef, rearLeftWheelMeshRef, rearRightWheelMeshRef].forEach((ref) => {
        if (ref.current) ref.current.rotation.x -= spin
      })

      // Collision Detection with Physics Blocks
      const currentBlocks = blocksDataRef.current
      for (let i = 0; i < currentBlocks.length; i++) {
        const b = currentBlocks[i]
        const dx = b.x - cs.x
        const dz = b.z - cs.z
        const distSq = dx * dx + dz * dz

        // Car-to-block impact
        if (distSq < 0.038 && Math.abs(cs.speed) > 0.003) {
          const dist = Math.sqrt(distSq) || 0.001
          const nx = dx / dist
          const nz = dz / dist
          const force = Math.abs(cs.speed) * 2.5
          b.vx = nx * force
          b.vz = nz * force
          b.rotX += (Math.random() - 0.5) * 0.5
          b.rotY += (Math.random() - 0.5) * 0.5

          const now = Date.now()
          if (now - lastThockTimeRef.current > 200) {
            audio.thock()
            lastThockTimeRef.current = now
          }
        }

        // Block-to-block elastic collision response (prevents overlapping)
        for (let j = i + 1; j < currentBlocks.length; j++) {
          const b2 = currentBlocks[j]
          const bdx = b2.x - b.x
          const bdz = b2.z - b.z
          const bdistSq = bdx * bdx + bdz * bdz
          if (bdistSq < 0.007) { // 0.085^2 radius check
            const bdist = Math.sqrt(bdistSq) || 0.001
            const bnx = bdx / bdist
            const bnz = bdz / bdist
            const overlap = 0.085 - bdist
            b.x -= bnx * overlap * 0.5
            b.z -= bnz * overlap * 0.5
            b2.x += bnx * overlap * 0.5
            b2.z += bnz * overlap * 0.5
            // Transfer momentum
            const tvx = b.vx
            const tvz = b.vz
            b.vx = b2.vx * 0.8
            b.vz = b2.vz * 0.8
            b2.vx = tvx * 0.8
            b2.vz = tvz * 0.8
          }
        }

        // Friction & integration
        b.vx *= 0.91
        b.vz *= 0.91

        if (Math.abs(b.vx) > 0.0001) b.x += b.vx
        if (Math.abs(b.vz) > 0.0001) b.z += b.vz

        if (Number.isFinite(b.x)) b.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, b.x))
        if (Number.isFinite(b.z)) b.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, b.z))

        const mesh = blockMeshRefs.current[i]
        if (mesh && Number.isFinite(b.x) && Number.isFinite(b.z)) {
          mesh.position.set(b.x, b.y, b.z)
          mesh.rotation.set(b.rotX, b.rotY, 0)
        }
      }
    }
  })

  // Wheel Helper Component with Alloy Rims & Tread Detail
  const Wheel = ({ isFront, isLeft, steeringRef, meshRef }) => {
    const xPos = isLeft ? -0.095 : 0.095
    const zPos = isFront ? -0.085 : 0.085
    const radius = isFront ? 0.036 : 0.038
    const width = 0.026

    const wheelContent = (
      <group ref={meshRef}>
        {/* Rubber Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radius, radius, width, 24]} />
          <meshStandardMaterial color="#111115" roughness={0.85} />
        </mesh>
        {/* Chrome Metallic Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[isLeft ? -0.001 : 0.001, 0, 0]}>
          <cylinderGeometry args={[radius * 0.65, radius * 0.65, width + 0.002, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.92} />
        </mesh>
        {/* Center Cap Nut */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[isLeft ? -0.014 : 0.014, 0, 0]}>
          <cylinderGeometry args={[radius * 0.25, radius * 0.25, 0.005, 12]} />
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

  return (
    <group>
      {/* ---------------------------------------------------- 🏎️ ULTRA-DETAILED DIE-CAST SPORTS CAR */}
      <group ref={carGroupRef} position={[0.8, 0.04, 0.8]}>
        {/* Main Body Chassis — Smooth Curved Crimson Metallic Red */}
        <RoundedBox args={[0.165, 0.048, 0.27]} radius={0.012} smoothness={4} position={[0, 0.04, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e11d48" roughness={0.18} metalness={0.82} />
        </RoundedBox>

        {/* Racing Stripes */}
        <mesh position={[0, 0.065, 0]}>
          <boxGeometry args={[0.036, 0.002, 0.268]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.2} />
        </mesh>

        {/* Aerodynamic Cabin Glass — Tinted Curved Canopy */}
        <RoundedBox args={[0.125, 0.044, 0.125]} radius={0.01} smoothness={4} position={[0, 0.08, -0.018]} castShadow>
          <meshStandardMaterial color="#09090b" roughness={0.08} metalness={0.92} transparent opacity={0.78} />
        </RoundedBox>

        {/* Rear Spoiler Wing */}
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

        {/* Front Headlight Lenses with Bright LED Beams */}
        {[-0.054, 0.054].map((x) => (
          <group key={x} position={[x, 0.045, -0.136]}>
            <mesh>
              <sphereGeometry args={[0.014, 16, 16]} />
              <meshBasicMaterial color={headlightsOn ? '#7dd3fc' : '#334155'} toneMapped={false} />
            </mesh>
          </group>
        ))}
        {headlightsOn && (
          <group>
            <pointLight position={[0, 0.05, -0.22]} color="#38bdf8" intensity={2.2} distance={1.8} decay={2} />
            <spotLight
              position={[0, 0.06, -0.14]}
              target-position={[0, 0, -2.5]}
              color="#e0f2fe"
              intensity={3.5}
              angle={0.45}
              penumbra={0.6}
              distance={3.5}
            />
          </group>
        )}

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

      {/* ---------------------------------------------------- Tactile Chamfered Wooden/Plastic Blocks */}
      {INITIAL_BLOCKS.map((b, i) => (
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
      ))}
      {/* ---------------------------------------------------- Dynamic Tire Skid Marks */}
      {skidMarks.map((s) => (
        <mesh
          key={s.id}
          position={[s.x, 0.008, s.z]}
          rotation={[-Math.PI / 2, 0, s.heading]}
        >
          <planeGeometry args={[0.18, 0.04]} />
          <meshBasicMaterial color="#09090b" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  )
}
