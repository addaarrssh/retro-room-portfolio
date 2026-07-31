import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances, useGLTF, RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, DoubleSide, Vector3 } from 'three'
import { DESK_TOP, ROOM } from './layout'
import { PaletteContext, paletteFor, usePalette } from './palette'
import {
  carpetTexture,
  corkboardTexture,
  daySkyTexture,
  nightSkyTexture,
  posterGradientTexture,
  posterRocTexture,
  wallTexture,
  woodTexture,
} from './textures'

/* ==========================================================================
   RoomScene — Photorealistic Smooth 3D Studio Room
   Every object uses high-segment smooth geometry with realistic materials:
   - RoundedBox for furniture with soft chamfered edges
   - CapsuleGeometry & SphereGeometry for organic ergonomic shapes
   - TubeGeometry with CatmullRomCurve3 for smooth curved arms & cables
   - CylinderGeometry with 48+ segments for silky-smooth cylindrical objects
   ========================================================================== */

const MODEL_URL = '/models/room.glb'

import ToyCarRoom from './ToyCarRoom'

export default function RoomScene({
  viewState,
  roomTheme = 'DEFAULT',
  appearance = 'LIGHT',
  lampOn = true,
  pcPower = true,
  onToggleLamp,
  onTogglePcPower,
}) {
  const palette = paletteFor(appearance)
  const [modelAvailable, setModelAvailable] = useState(false)

  useEffect(() => {
    fetch(MODEL_URL, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') || ''
        const size = parseInt(res.headers.get('content-length') || '0', 10)
        if (res.ok && !type.includes('html') && size > 5000) {
          setModelAvailable(true)
        }
      })
      .catch(() => {})
  }, [])

  if (modelAvailable) return <GLTFRoom />

  return (
    <PaletteContext.Provider value={palette}>
      <group>
      <Shell roomTheme={roomTheme} />
      <Rug />
      <Desk />
      <Chair viewState={viewState} />
      <Keyboard />
      <Mouse />
      <Speakers />
      <DeskLamp lampOn={lampOn} onToggleLamp={onToggleLamp} />
      <DeskClutter />
      <PCTower pcPower={pcPower} onTogglePcPower={onTogglePcPower} />
      <Bookshelf />
      <WallArt />
      <Window />
      <Plant />
      <Cables />
      <ToyCarRoom viewState={viewState} />
      </group>
    </PaletteContext.Provider>
  )
}

/* ========================================================================== */
/*  Shell — floor, walls, ceiling & dynamic RGB theme lighting               */
/* ========================================================================== */

function Shell({ roomTheme }) {
  const P = usePalette()
  const isLight = P.id === 'LIGHT'
  const carpet = useMemo(() => carpetTexture(P.rugTint), [P.rugTint])
  const wall = useMemo(() => wallTexture(P.wallTint), [P.wallTint])
  const floorWood = useMemo(() => woodTexture(P.floorTint, P.floorDark), [P.floorTint, P.floorDark])

  useEffect(
    () => () => [carpet, wall, floorWood].forEach((t) => t.dispose()),
    [carpet, wall, floorWood],
  )

  const themeColors = useMemo(() => {
    switch (roomTheme) {
      case 'CYBERPUNK':
        return { c1: '#ff007f', c2: '#00f0ff', c3: '#9d00ff' }
      case 'SUNSET':
        return { c1: '#f59e0b', c2: '#ef4444', c3: '#eab308' }
      case 'MATRIX':
        return { c1: '#10b981', c2: '#06b6d4', c3: '#22c55e' }
      default:
        return { c1: '#6366f1', c2: '#ec4899', c3: '#3b82f6' }
    }
  }, [roomTheme])

  return (
    <group>
      {/* Floor - Dark Walnut Parquet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]} receiveShadow>
        <planeGeometry args={[ROOM.width, 8]} />
        <meshStandardMaterial map={floorWood} color={P.floor} roughness={0.62} metalness={0.02} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, ROOM.height / 2, ROOM.backZ]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.height]} />
        <meshStandardMaterial map={wall} color={P.wall} roughness={0.94} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-ROOM.halfX, ROOM.height / 2, 0.6]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, ROOM.height]} />
        <meshStandardMaterial map={wall} color={P.wallSide} roughness={0.94} />
      </mesh>
      <mesh position={[ROOM.halfX, ROOM.height / 2, 0.6]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, ROOM.height]} />
        <meshStandardMaterial map={wall} color={P.wallSide} roughness={0.94} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, ROOM.height, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.width, 8]} />
        <meshStandardMaterial color={P.ceiling} roughness={1} />
      </mesh>

      {/* Skirting board — smooth rounded */}
      <mesh position={[0, 0.06, ROOM.backZ + 0.02]}>
        <boxGeometry args={[ROOM.width, 0.12, 0.03]} />
        <meshStandardMaterial color={P.skirting} roughness={0.7} />
      </mesh>

      {/* Ambient RGB wash behind the desk.
          This was three point lights. Every light in the scene is evaluated
          per fragment for every lit surface, so three decorative ones cost
          real frames for a gradient nobody can pick apart — one wider light
          plus two emissive strips reads the same and is a third of the work. */}
      {/* Accent underglow is a night-room device. In daylight it reads as a
          stray neon tube taped to a white wall, so it simply is not there. */}
      {!isLight && (
        <pointLight
          position={[0, 0.95, ROOM.backZ + 0.2]}
          color={themeColors.c1}
          intensity={2.6}
          distance={5.5}
        />
      )}
      {/* The emitter itself: a strip tucked behind the desk's back edge and
          aimed at the wall, so what you see is the wash rather than the tube.
          Floating it out in the open read as two neon lines pasted on the
          wall, which is exactly what an unseen light source should not do. */}
      {!isLight && (
        <mesh position={[0, 0.72, ROOM.backZ + 0.04]} rotation={[-0.35, 0, 0]}>
          <planeGeometry args={[2.6, 0.012]} />
          <meshBasicMaterial color={themeColors.c1} toneMapped={false} />
        </mesh>
      )}
      {!isLight &&
        [-1.05, 1.05].map((x, i) => (
        <mesh key={x} position={[x, 0.72, ROOM.backZ + 0.045]} rotation={[-0.35, 0, 0]}>
          <planeGeometry args={[0.7, 0.014]} />
          <meshBasicMaterial color={i === 0 ? themeColors.c2 : themeColors.c3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Rug() {
  const P = usePalette()
  const carpet = useMemo(() => carpetTexture(P.rugTint), [P.rugTint])
  useEffect(() => () => carpet.dispose(), [carpet])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.75]} receiveShadow>
      <circleGeometry args={[1.65, 64]} />
      <meshStandardMaterial map={carpet} color={P.rug} roughness={0.95} />
    </mesh>
  )
}

/* ========================================================================== */
/*  Desk — Smooth Rounded Edges & Realistic Walnut Top                        */
/* ========================================================================== */

const DESK_W = 3.0
const DESK_D = 1.05
const DESK_Z = -0.35

function Desk() {
  const P = usePalette()
  const wood = useMemo(() => woodTexture(P.deskWood, P.deskWoodDark), [P.deskWood, P.deskWoodDark])
  useEffect(() => () => wood.dispose(), [wood])

  const legX = DESK_W / 2 - 0.12
  const legZ = DESK_D / 2 - 0.1

  return (
    <group position={[0, 0, DESK_Z]}>
      {/* Top slab - Smooth Rounded Dark Walnut with soft chamfered edges */}
      <RoundedBox args={[DESK_W, 0.06, DESK_D]} radius={0.012} smoothness={4} position={[0, DESK_TOP - 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color={P.deskTop} roughness={0.62} metalness={0.02} />
      </RoundedBox>

      {/* Leather Desk Mat — Soft Rounded Rectangle */}
      <RoundedBox args={[1.4, 0.005, 0.55]} radius={0.008} smoothness={4} position={[0, DESK_TOP + 0.002, 0.05]} receiveShadow>
        <meshStandardMaterial color={P.deskMat} roughness={0.78} metalness={0.04} />
      </RoundedBox>

      {/* Sleek Tapered Cylindrical Metallic Legs */}
      {[
        [-legX, -legZ],
        [legX, -legZ],
        [-legX, legZ],
        [legX, legZ],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, (DESK_TOP - 0.06) / 2, z]} castShadow>
          <cylinderGeometry args={[0.032, 0.042, DESK_TOP - 0.06, 32]} />
          <meshStandardMaterial color={P.deskLeg} roughness={0.28} metalness={0.85} />
        </mesh>
      ))}

      {/* Modesty panel — smooth rounded */}
      <RoundedBox args={[DESK_W - 0.3, 0.5, 0.02]} radius={0.006} smoothness={4} position={[0, 0.4, -legZ - 0.03]}>
        <meshStandardMaterial map={wood} color={P.deskWood} roughness={0.7} />
      </RoundedBox>

      {/* Drawer unit with smooth rounded edges */}
      <group position={[1.02, 0, 0]}>
        <RoundedBox args={[0.5, 0.62, DESK_D - 0.12]} radius={0.015} smoothness={4} position={[0, 0.31, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color="#6e523b" roughness={0.45} />
        </RoundedBox>
        {/* Smooth capsule drawer handles */}
        {[0.14, 0.34, 0.54].map((y) => (
          <mesh key={y} position={[0, y, DESK_D / 2 - 0.07]}>
            <capsuleGeometry args={[0.008, 0.18, 12, 24]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#27272a" roughness={0.2} metalness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ========================================================================== */
/*  Chair — 1:1 Replica of Green Soul Monster Ultimate Esports Gaming Chair   */
/* ========================================================================== */

function Chair({ viewState }) {
  const P = usePalette()
  const isZoomed = viewState && viewState !== 'ROOM'
  const group = useRef()

  /* Staging, not decoration. Parked square in front of the desk the chair sits
     dead centre of the room shot and hides the one thing the visitor is meant
     to click. So it lives pushed out and turned away — the way a chair
     actually looks when nobody is sitting in it — and slides further aside on
     the way in to clear the sightline to the screen. */
  const pose = isZoomed
    ? { x: 1.6, z: 2.05, ry: -0.95 }
    : { x: 1.42, z: 1.72, ry: -0.85 }

  useFrame((_, delta) => {
    if (!group.current) return
    const k = 1 - Math.pow(0.004, delta)
    group.current.position.x += (pose.x - group.current.position.x) * k
    group.current.position.z += (pose.z - group.current.position.z) * k
    group.current.rotation.y += (pose.ry - group.current.rotation.y) * k
  })

  return (
    <group ref={group} position={[pose.x, 0, pose.z]} rotation={[0, pose.ry, 0]}>
      {/* ---------------------------------------------------- Bucket Seat Cushion */}
      <group position={[0, 0.46, 0]}>
        {/* Central Black Seat Base */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.38, 0.07, 0.42]} />
          <meshStandardMaterial color={P.chairShell} roughness={0.4} metalness={0.08} />
        </mesh>

        {/* Front Seat Cushion Red Racing Stripe */}
        <mesh position={[0, 0.005, -0.18]}>
          <boxGeometry args={[0.384, 0.072, 0.08]} />
          <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Flared Side Seat Bolsters (Black with Red Piping Edges) */}
        {[-0.22, 0.22].map((x) => (
          <group key={x} position={[x, 0.03, 0]} rotation={[0, 0, x > 0 ? -0.32 : 0.32]}>
            <mesh>
              <boxGeometry args={[0.07, 0.08, 0.42]} />
              <meshStandardMaterial color={P.chairShell} roughness={0.4} />
            </mesh>
            {/* Red Bolster Outer Piping */}
            <mesh position={[x > 0 ? 0.032 : -0.032, 0.005, 0]}>
              <boxGeometry args={[0.012, 0.085, 0.425]} />
              <meshStandardMaterial color="#ef4444" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---------------------------------------------------- Tall Contoured Backrest */}
      <group position={[0, 0.92, 0.21]} rotation={[0.08, 0, 0]}>
        {/* Main Matte Black Backrest Frame */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.62, 0.07]} />
          <meshStandardMaterial color={P.chairShell} roughness={0.4} metalness={0.08} />
        </mesh>

        {/* Flared Shoulder Wings (Wider Top Contour) */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.52, 0.24, 0.065]} />
          <meshStandardMaterial color={P.chairShell} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.36, 0.12, 0.06]} />
          <meshStandardMaterial color={P.chairShell} roughness={0.4} />
        </mesh>

        {/* Red Outer Contour Piping Border along Shoulder Wings & Edges */}
        {[-0.26, 0.26].map((x) => (
          <mesh key={x} position={[x, 0.22, 0]}>
            <boxGeometry args={[0.014, 0.245, 0.072]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
        ))}

        {/* Two Vertical Bright Red Racing Stripes Down Left & Right */}
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.02, -0.036]}>
            <boxGeometry args={[0.05, 0.58, 0.006]} />
            <meshStandardMaterial color="#dc2626" roughness={0.32} />
          </mesh>
        ))}

        {/* -------------------------------------------------- Headrest & Lumbar Pillows */}
        {/* Headrest Butterfly Pillow (Black Center with Red Wing Tips & White Logo) */}
        <group position={[0, 0.26, -0.055]}>
          {/* Main Black Pillow Body */}
          <mesh>
            <boxGeometry args={[0.18, 0.11, 0.045]} />
            <meshStandardMaterial color={P.chairBase} roughness={0.5} />
          </mesh>
          {/* Red Side Wings */}
          {[-0.105, 0.105].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.048]} />
              <meshStandardMaterial color="#dc2626" roughness={0.35} />
            </mesh>
          ))}
          {/* White Green Soul Logo Emblem Print */}
          <mesh position={[0, 0.005, -0.024]}>
            <planeGeometry args={[0.07, 0.035]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>

        {/* Ergonomic Lumbar Support Cushion (Black with Red End Straps) */}
        <group position={[0, -0.18, -0.05]}>
          <mesh>
            <boxGeometry args={[0.3, 0.12, 0.05]} />
            <meshStandardMaterial color={P.chairBase} roughness={0.5} />
          </mesh>
          {[-0.13, 0.13].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.04, 0.122, 0.052]} />
              <meshStandardMaterial color="#dc2626" roughness={0.35} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ---------------------------------------------------- Recline Hinge Mechanism (Right side) */}
      <group position={[0.22, 0.48, 0.18]}>
        <mesh>
          <boxGeometry args={[0.03, 0.12, 0.1]} />
          <meshStandardMaterial color={P.chairBase} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.02, -0.02, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.012, 0.09, 0.025]} />
          <meshStandardMaterial color="#27272a" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* ---------------------------------------------------- T-Shaped 3D Black Armrests */}
      {[-0.29, 0.29].map((x) => (
        <group key={x} position={[x, 0.58, 0.02]}>
          {/* Flat Wide Armrest Pad */}
          <mesh>
            <boxGeometry args={[0.09, 0.02, 0.26]} />
            <meshStandardMaterial color={P.chairBase} roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Heavy Black Armstem */}
          <mesh position={[0, -0.12, 0.05]}>
            <cylinderGeometry args={[0.018, 0.022, 0.22, 16]} />
            <meshStandardMaterial color={P.chairBase} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ---------------------------------------------------- Heavy Gas Lift Cylinder */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.048, 0.44, 32]} />
        <meshStandardMaterial color={P.chairBase} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* ---------------------------------------------------- 5-Star Black Base with Red Wheel Hubs */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            {/* Curved Matte Black Leg Arm */}
            <mesh position={[0, 0.05, 0.18]} rotation={[0.15, 0, 0]} castShadow>
              <boxGeometry args={[0.04, 0.03, 0.32]} />
              <meshStandardMaterial color={P.chairBase} roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Rubber Caster Wheel with Red 5-Spoke Hubcap */}
            <group position={[0, 0.028, 0.33]}>
              {/* Outer Rubber Tire */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.032, 0.032, 0.025, 24]} />
                <meshStandardMaterial color="#0a0a0d" roughness={0.7} />
              </mesh>
              {/* Bright Red Inner Hubcap */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.022, 0.022, 0.027, 16]} />
                <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.3} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/* ========================================================================== */
/*  Peripherals — Smooth Rounded Keyboard & Ergonomic Mouse                   */
/* ========================================================================== */

function Keyboard() {
  const keys = useMemo(() => {
    const out = []
    const cols = 15
    const rows = 5
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          x: -0.4 + c * 0.0565,
          z: -0.055 + r * 0.0275,
          wide: r === 4 && c > 4 && c < 10,
          accent: (r === 0 && c === 0) || (r === 4 && c === 7),
        })
      }
    }
    return out.filter((k) => !(k.wide && k.x > -0.16))
  }, [])

  const standardKeys = useMemo(() => keys.filter((k) => !k.wide), [keys])
  const wideKeys = useMemo(() => keys.filter((k) => k.wide), [keys])

  return (
    <group position={[-0.04, DESK_TOP + 0.005, 0.03]} rotation={[0, 0.02, 0]}>
      {/* Keyboard Body — Smooth Rounded Chassis */}
      <RoundedBox args={[0.92, 0.022, 0.19]} radius={0.008} smoothness={4} position={[0, 0.011, 0]} rotation={[-0.045, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.75} />
      </RoundedBox>

      <group rotation={[-0.045, 0, 0]}>
        {/* ~70 keycaps as one instanced draw call instead of seventy.
            Individually they were the single largest mesh group in the room
            and every one of them was also a shadow caster, which the lamp
            then had to re-render. Instances share one geometry and one
            material, so the whole keyboard costs about what one key did. */}
        <Instances
          limit={90}
          range={standardKeys.length}
          castShadow={false}
          receiveShadow
        >
          <boxGeometry args={[0.046, 0.012, 0.021]} />
          <meshStandardMaterial color="#27272a" roughness={0.35} metalness={0.2} />
          {standardKeys.map((k, i) => (
            <Instance key={i} position={[k.x, 0.028, k.z]} color={k.accent ? '#f43f5e' : '#27272a'} />
          ))}
        </Instances>

        {/* Space bar and the other wide caps keep their own geometry — there
            are only a handful and they are a different size. */}
        {wideKeys.map((k, i) => (
          <mesh key={i} position={[k.x, 0.028, k.z]}>
            <boxGeometry args={[0.28, 0.012, 0.021]} />
            <meshStandardMaterial color="#27272a" roughness={0.35} metalness={0.2} />
          </mesh>
        ))}

        {[-0.02, 0.02].map((x, i) => (
          <mesh key={x} position={[0.36 + x, 0.026, -0.078]}>
            <sphereGeometry args={[0.006, 16, 16]} />
            <meshStandardMaterial
              color={i === 0 ? '#38bdf8' : '#27272a'}
              emissive={i === 0 ? '#0284c7' : '#000000'}
              emissiveIntensity={i === 0 ? 2.2 : 0}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ========================================================================== */
/*  Mouse — 1:1 Razer Viper Mini Signature Edition Honeycomb Gaming Mouse     */
/* ========================================================================== */

function Mouse() {
  return (
    <group position={[0.66, DESK_TOP + 0.005, 0.02]}>
      {/* Razer Gaming Mousepad — Smooth Rounded Rectangle with Neon RGB Border */}
      <group rotation={[0, 0.06, 0]}>
        <RoundedBox args={[0.3, 0.004, 0.24]} radius={0.008} smoothness={4} position={[0, 0.002, 0]} receiveShadow>
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </RoundedBox>
        {/* RGB Perimeter Trim */}
        <mesh position={[0, 0.004, 0]}>
          <planeGeometry args={[0.298, 0.238]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>

      {/* ---------------------------------------------------- Razer Honeycomb Mouse Chassis */}
      <group position={[0, 0.006, 0]}>
        {/* Sensor glow. This was a real point light with distance 0.12 — it
            lit nothing but its own shell, while still costing every lit
            surface in the room an extra light in the shader. An emissive
            sphere and the bloom pass give the identical result for free. */}
        <mesh position={[0, 0.015, 0]}>
          <sphereGeometry args={[0.012, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" toneMapped={false} />
        </mesh>

        {/* Outer Magnesium Exoskeleton Arch Shell (Dark Gunmetal Finish) */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <capsuleGeometry args={[0.026, 0.042, 16, 32]} />
          <meshStandardMaterial color="#16161a" roughness={0.22} metalness={0.88} />
        </mesh>

        {/* Triangular / Honeycomb Cutout Lattice Array */}
        {[-0.01, 0.01].map((x) =>
          [-0.012, 0, 0.012].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.034, z]} rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[0.007, 0.0025, 8, 16]} />
              <meshStandardMaterial color="#0d0d10" roughness={0.3} metalness={0.9} />
            </mesh>
          ))
        )}

        {/* Ergonomic Left & Right Click Trigger Blades */}
        {[-0.011, 0.011].map((x) => (
          <mesh key={x} position={[x, 0.024, -0.024]} rotation={[0.12, 0, x > 0 ? -0.05 : 0.05]} castShadow>
            <boxGeometry args={[0.018, 0.008, 0.034]} />
            <meshStandardMaterial color="#18181c" roughness={0.2} metalness={0.85} />
          </mesh>
        ))}

        {/* White "RAZER" Logo Text Emblem on Right Trigger */}
        <mesh position={[0.012, 0.029, -0.018]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.014, 0.004]} />
          <meshBasicMaterial color="#f8fafc" toneMapped={false} />
        </mesh>

        {/* Knurled Metallic Chrome Scroll Wheel with RGB Center */}
        <group position={[0, 0.028, -0.028]} rotation={[0.3, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.006, 24]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.95} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.0065, 0.001, 12, 24]} />
            <meshBasicMaterial color="#00f0ff" toneMapped={false} />
          </mesh>
        </group>

        {/* Dual Side Thumb Buttons (Left side) */}
        {[-0.008, 0.006].map((z) => (
          <mesh key={z} position={[-0.026, 0.022, z]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.003, 0.005, 0.01]} />
            <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ========================================================================== */
/*  Speakers — Studio Monitor Enclosures with Smooth Rounded Bodies           */
/* ========================================================================== */

function Speakers() {
  return (
    <group>
      {[-0.84, 0.84].map((x) => (
        <group key={x} position={[x, DESK_TOP, -0.34]} rotation={[0, x < 0 ? 0.34 : -0.34, 0]}>
          {/* Smooth Rounded Speaker Enclosure */}
          <RoundedBox args={[0.13, 0.26, 0.12]} radius={0.018} smoothness={4} position={[0, 0.13, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#121215" roughness={0.35} metalness={0.55} />
          </RoundedBox>

          {/* Smooth Metallic Copper Woofer Cone */}
          <mesh position={[0, 0.09, 0.062]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.008, 48]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Woofer Dust Cap — Smooth Hemisphere */}
          <mesh position={[0, 0.09, 0.068]}>
            <sphereGeometry args={[0.02, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} rotation={[-Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#09090b" roughness={0.25} metalness={0.3} />
          </mesh>
          {/* Silk Dome Tweeter */}
          <mesh position={[0, 0.2, 0.062]}>
            <sphereGeometry args={[0.018, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} rotation={[-Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.92} />
          </mesh>
          {/* Tweeter Ring */}
          <mesh position={[0, 0.2, 0.061]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.022, 0.003, 16, 48]} />
            <meshStandardMaterial color="#a1a1aa" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ========================================================================== */
/*  Desk Lamp — Smooth Brass Gooseneck Arm & Flared Bell Shade (Interactive)  */
/* ========================================================================== */

const LAMP_INTENSITY = 9

function DeskLamp({ lampOn = true, onToggleLamp }) {
  const bulbRef = useRef()
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer'
      return () => {
        document.body.style.cursor = 'auto'
      }
    }
  }, [hovered])

  // Base intensity has to track the spotLight's own value, or this quietly
  // resets the lamp to a tenth of its brightness on the first frame.
  useFrame((state) => {
    if (!bulbRef.current || !lampOn) return
    const t = state.clock.elapsedTime
    const f = 1 + Math.sin(t * 2.1) * 0.03 + Math.sin(t * 7.7) * 0.015
    bulbRef.current.intensity = LAMP_INTENSITY * f
  })

  // Smooth curved gooseneck arm
  const armCurve = useMemo(() => {
    return new CatmullRomCurve3([
      new Vector3(-1.16, DESK_TOP + 0.02, -0.52),
      new Vector3(-1.14, DESK_TOP + 0.28, -0.49),
      new Vector3(-1.06, DESK_TOP + 0.48, -0.44),
      new Vector3(-0.95, DESK_TOP + 0.58, -0.42),
      new Vector3(-0.84, DESK_TOP + 0.52, -0.38),
    ])
  }, [])

  // Power cord running from lamp base behind the desk
  const lampCordCurve = useMemo(() => {
    return new CatmullRomCurve3([
      new Vector3(-1.16, DESK_TOP + 0.01, -0.52),
      new Vector3(-1.25, DESK_TOP - 0.02, -0.65),
      new Vector3(-1.28, 0.2, -0.68),
    ])
  }, [])

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onToggleLamp?.()
      }}
    >
      {/* Power Cord Tube */}
      <mesh castShadow>
        <tubeGeometry args={[lampCordCurve, 24, 0.005, 12, false]} />
        <meshStandardMaterial color="#09090b" roughness={0.7} />
      </mesh>

      {/* Weighted Smooth Rounded Base */}
      <mesh position={[-1.16, DESK_TOP + 0.015, -0.52]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.03, 48]} />
        <meshStandardMaterial color="#18181b" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Base Rim Ring */}
      <mesh position={[-1.16, DESK_TOP + 0.005, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.115, 0.005, 16, 48]} />
        <meshStandardMaterial color="#d97706" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Smooth Curved Brass Gooseneck Arm */}
      <mesh castShadow>
        <tubeGeometry args={[armCurve, 48, 0.012, 24, false]} />
        <meshStandardMaterial color="#d97706" roughness={0.2} metalness={0.88} />
      </mesh>

      {/* Flared Bell Shade — Smooth Interior & Exterior */}
      <group position={[-0.84, DESK_TOP + 0.52, -0.38]} rotation={[0.5, 0, -0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.15, 0.22, 48, 1, true]} />
          <meshStandardMaterial color="#09090b" roughness={0.25} metalness={0.72} side={2} />
        </mesh>
        {/* Warm Inner Glow Disc (Only visible when lamp is ON) */}
        {lampOn && (
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.14, 48]} />
            <meshBasicMaterial color="#ffedd5" toneMapped={false} />
          </mesh>
        )}
      </group>

      {lampOn && (
        <>
          {/* The scene's only shadow caster, and deliberately a spot rather
              than a point light. A shadow-casting point light renders the
              whole scene six times, once per cube face; a spot renders it
              once. That single swap is worth more frames than every other
              optimisation in this file combined, and the lamp has a shade so
              a cone is the physically honest shape anyway. */}
          <spotLight
            ref={bulbRef}
            position={[-0.82, DESK_TOP + 0.42, -0.36]}
            target-position={[-0.1, DESK_TOP, 0.0]}
            color="#ffaa44"
            intensity={LAMP_INTENSITY}
            distance={6}
            decay={2}
            angle={1.05}
            penumbra={0.85}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0015}
            shadow-normalBias={0.02}
            shadow-camera-near={0.15}
            shadow-camera-far={6}
          />
          {/* A dim, shadowless point light fills in the cone's edge so the
              lamp still washes the wall behind it. */}
          <pointLight
            position={[-0.82, DESK_TOP + 0.42, -0.36]}
            color="#ffaa44"
            intensity={0.9}
            distance={3.2}
            decay={2}
          />
        </>
      )}
    </group>
  )
}

/* ========================================================================== */
/*  Desk Clutter — Smooth Ceramic Mug with Torus Handle & Floppy Disks        */
/* ========================================================================== */

function DeskClutter() {
  const floppyColors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981']

  return (
    <group>
      {/* Smooth Ceramic Coffee Mug */}
      <group position={[0.48, DESK_TOP, -0.28]}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.1, 48]} />
          <meshStandardMaterial color="#f4f4f5" roughness={0.18} metalness={0.05} />
        </mesh>
        {/* Coffee Liquid Surface */}
        <mesh position={[0, 0.096, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.039, 32]} />
          <meshStandardMaterial color="#1c1917" roughness={0.1} />
        </mesh>
        {/* Smooth Torus Handle */}
        <mesh position={[0.056, 0.055, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.024, 0.007, 24, 48, Math.PI * 1.3]} />
          <meshStandardMaterial color="#f4f4f5" roughness={0.18} />
        </mesh>
      </group>

      {/* Rounded Floppy Disks */}
      <group position={[-0.78, DESK_TOP, -0.16]} rotation={[0, 0.22, 0]}>
        {floppyColors.map((c, i) => (
          <RoundedBox key={i} args={[0.09, 0.007, 0.092]} radius={0.003} smoothness={2} position={[i * 0.004, 0.005 + i * 0.008, i * 0.003]}>
            <meshStandardMaterial color={c} roughness={0.45} metalness={0.1} />
          </RoundedBox>
        ))}
      </group>
    </group>
  )
}

/* ========================================================================== */
/*  PC Tower — Smooth Rounded Case with Tempered Glass Side Panel             */
/* =========================================/* ========================================================================== */
function PCTower({ pcPower = true, onTogglePcPower }) {
  const powerRef = useRef()
  const hddRef = useRef()
  const fanRef = useRef()
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer'
      return () => {
        document.body.style.cursor = 'auto'
      }
    }
  }, [hovered])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (powerRef.current) {
      powerRef.current.material.emissiveIntensity = pcPower ? 2.2 + Math.sin(t * 1.6) * 0.5 : 0.05
    }
    if (hddRef.current) {
      const burst = Math.sin(t * 13.7) * Math.sin(t * 3.1) * Math.sin(t * 0.7 + 1.2)
      const on = pcPower && burst > 0.12
      hddRef.current.material.emissiveIntensity = on ? 3.4 : 0.05
    }
    if (fanRef.current && pcPower) {
      fanRef.current.rotation.z += 0.25
    }
  })

  return (
    <group
      position={[1.6, 0, -0.62]}
      rotation={[0, -0.16, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onTogglePcPower?.()
      }}
    >
      {/* Smooth Rounded PC Case Frame */}
      <RoundedBox args={[0.24, 0.5, 0.54]} radius={0.02} smoothness={4} position={[0, 0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#121215" roughness={0.25} metalness={0.72} />
      </RoundedBox>

      {/* --- INTERNAL COMPONENTS (Visible through glass) --- */}
      {/* Motherboard PCB */}
      <mesh position={[0.08, 0.26, 0]}>
        <boxGeometry args={[0.01, 0.42, 0.46]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>

      {/* Glowing RGB CPU AIO Liquid Cooler Pump Block */}
      <mesh position={[0.06, 0.32, -0.05]}>
        <cylinderGeometry args={[0.035, 0.035, 0.025, 24]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={pcPower ? 2.5 : 0} toneMapped={false} />
      </mesh>

      {/* Dual RGB RAM Sticks */}
      {[-0.01, 0.01].map((z) => (
        <mesh key={z} position={[0.06, 0.35, 0.04 + z]}>
          <boxGeometry args={[0.008, 0.06, 0.015]} />
          <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={pcPower ? 2.2 : 0} toneMapped={false} />
        </mesh>
      ))}

      {/* GPU Graphics Card with Backplate */}
      <group position={[0.03, 0.18, 0.02]}>
        <boxGeometry args={[0.12, 0.04, 0.32]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.8} />
        {/* GPU Side Logo Light */}
        <mesh position={[0.061, 0, 0]}>
          <planeGeometry args={[0.2, 0.02]} rotation={[0, Math.PI / 2, 0]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={pcPower ? 2.5 : 0} toneMapped={false} />
        </mesh>
      </group>

      {/* Rear RGB Exhaust Fan with Spinning Blades */}
      <group position={[0.02, 0.34, -0.21]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.006, 16, 32]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={pcPower ? 2.2 : 0} toneMapped={false} />
        </mesh>
        <group ref={fanRef} position={[0, 0, -0.005]}>
          {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle) => (
            <mesh key={angle} rotation={[0, 0, angle]}>
              <boxGeometry args={[0.075, 0.012, 0.003]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.3} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Tempered Glass Side Panel */}
      <mesh position={[0.121, 0.25, 0]}>
        <planeGeometry args={[0.5, 0.44]} />
        <meshStandardMaterial color="#09090b" roughness={0.08} metalness={0.92} transparent opacity={0.45} />
      </mesh>

      {/* Power LED */}
      <mesh ref={powerRef} position={[0.03, 0.45, 0.274]}>
        <sphereGeometry args={[0.009, 24, 24]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={pcPower ? 2.2 : 0.1} toneMapped={false} />
      </mesh>
      {/* HDD Activity LED */}
      <mesh ref={hddRef} position={[0.06, 0.45, 0.274]}>
        <sphereGeometry args={[0.008, 24, 24]} />
        <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={pcPower ? 3 : 0.1} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ========================================================================== */
/*  Wall Art & Storage                                                        */
/* ========================================================================== */

function WallArt() {
  const gradient = useMemo(() => posterGradientTexture(), [])
  const roc = useMemo(() => posterRocTexture(), [])
  const cork = useMemo(() => corkboardTexture(), [])
  useEffect(() => () => [gradient, roc, cork].forEach((t) => t.dispose()), [gradient, roc, cork])

  const z = ROOM.backZ + 0.012

  return (
    <group>
      {/* Gradient Descent Poster — Framed with Smooth Rounded Frame */}
      <group position={[-1.55, 1.92, z]} rotation={[0, 0, 0.014]}>
        <RoundedBox args={[0.72, 0.96, 0.02]} radius={0.008} smoothness={4}>
          <meshStandardMaterial color="#1a1a1e" roughness={0.3} metalness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.66, 0.9]} />
          <meshStandardMaterial map={gradient} roughness={0.92} />
        </mesh>
      </group>

      {/* Neural Network Poster — Framed with Smooth Rounded Frame */}
      <group position={[1.42, 2.0, z]} rotation={[0, 0, -0.008]}>
        <RoundedBox args={[0.94, 0.72, 0.02]} radius={0.008} smoothness={4}>
          <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.82, 0.6]} />
          <meshStandardMaterial map={roc} roughness={0.92} />
        </mesh>
      </group>

      {/* Corkboard — Framed */}
      <group position={[0.0, 2.1, z]}>
        <RoundedBox args={[0.78, 0.59, 0.02]} radius={0.008} smoothness={4}>
          <meshStandardMaterial color="#5c4226" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.72, 0.53]} />
          <meshStandardMaterial map={cork} roughness={1} />
        </mesh>
      </group>
    </group>
  )
}

/* ========================================================================== */
/*  Bookshelf — Smooth Rounded Shelving with Realistic Leaning Books          */
/* ========================================================================== */

function Bookshelf() {
  const P = usePalette()
  const wood = useMemo(() => woodTexture(P.shelfWood, P.shelfWoodDark), [P.shelfWood, P.shelfWoodDark])
  useEffect(() => () => wood.dispose(), [wood])

  /* Real book spines are cloth and dust jackets, not saturated plastic. The
     palette is desaturated and darkened so the shelf reads as a bookshelf
     across the room instead of a row of highlighter pens, and each spine gets
     a paper block plus a band so it catches the lamp at a different angle. */
  const books = useMemo(() => {
    const palette = [
      '#7d3038',
      '#2f4661',
      '#3b5c43',
      '#8a5a2b',
      '#4c3a63',
      '#8a7332',
      '#2f5560',
      '#6b2f45',
      '#3f3f46',
    ]
    const rows = []
    for (let shelf = 0; shelf < 3; shelf++) {
      const row = []
      let x = -0.36
      while (x < 0.24) {
        const w = 0.022 + Math.random() * 0.032
        row.push({
          x: x + w / 2,
          w,
          h: 0.19 + Math.random() * 0.07,
          color: palette[Math.floor(Math.random() * palette.length)],
          // Most books stand straight; a couple lean, which is what stops a
          // shelf looking like a texture swatch.
          lean: Math.random() > 0.86 ? 0.12 + Math.random() * 0.12 : 0,
          band: Math.random() > 0.55,
          roughness: 0.62 + Math.random() * 0.28,
        })
        x += w + 0.005
      }
      rows.push(row)
    }
    return rows
  }, [])

  /* Flattened with absolute Y, so the instanced groups below can be driven
     from one flat list rather than a nested map. */
  const flatBooks = useMemo(() => {
    const shelfY = [0.46, 0.88, 1.3]
    return books.flatMap((row, s) => row.map((b) => ({ ...b, y: shelfY[s] + b.h / 2 })))
  }, [books])

  const bandedBooks = useMemo(() => flatBooks.filter((b) => b.band), [flatBooks])

  return (
    <group position={[-2.35, 0, -0.75]} rotation={[0, 0.42, 0]}>
      {/* Smooth Rounded Back Panel */}
      <RoundedBox args={[0.86, 1.7, 0.03]} radius={0.008} smoothness={4} position={[0, 0.85, -0.13]} receiveShadow castShadow>
        <meshStandardMaterial map={wood} color={P.shelf} roughness={0.7} />
      </RoundedBox>

      {/* Smooth Rounded Side Panels */}
      {[-0.42, 0.42].map((x) => (
        <RoundedBox key={x} args={[0.03, 1.7, 0.28]} radius={0.006} smoothness={4} position={[x, 0.85, 0]} castShadow>
          <meshStandardMaterial map={wood} color={P.shelf} roughness={0.7} />
        </RoundedBox>
      ))}

      {/* Smooth Rounded Shelf Planks */}
      {[0.02, 0.44, 0.86, 1.28, 1.69].map((y) => (
        <RoundedBox key={y} args={[0.86, 0.03, 0.28]} radius={0.005} smoothness={4} position={[0, y, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color={P.shelf} roughness={0.7} />
        </RoundedBox>
      ))}

      {/* Books, drawn as three instanced groups — spines, page blocks and
          title bands — rather than three meshes per book. At ~42 books that
          is 126 draw calls collapsed into 3. Per-book size differences come
          from each Instance's own scale, so the shelf still looks hand-packed.
          None of them cast shadows: they sit inside a shelf where no shadow
          they cast would ever be visible, and every caster is work the lamp
          has to redo. */}
      <Instances limit={60} range={flatBooks.length} castShadow={false} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.72} metalness={0} />
        {flatBooks.map((b, i) => (
          <Instance
            key={i}
            position={[b.x, b.y, 0.02]}
            rotation={[0, 0, b.lean]}
            scale={[b.w, b.h, 0.19]}
            color={b.color}
          />
        ))}
      </Instances>

      <Instances limit={60} range={flatBooks.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cdc3ad" roughness={0.95} />
        {flatBooks.map((b, i) => (
          <Instance
            key={i}
            position={[b.x, b.y, 0.008]}
            rotation={[0, 0, b.lean]}
            scale={[b.w * 0.82, b.h * 0.94, 0.17]}
          />
        ))}
      </Instances>

      <Instances limit={60} range={bandedBooks.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d9c9a3" roughness={0.7} />
        {bandedBooks.map((b, i) => (
          <Instance
            key={i}
            position={[b.x, b.y + b.h * 0.24, 0.116]}
            rotation={[0, 0, b.lean]}
            scale={[b.w * 0.7, 0.016, 0.004]}
          />
        ))}
      </Instances>
    </group>
  )
}

function Window() {
  const P = usePalette()
  const isLight = P.id === 'LIGHT'
  const sky = useMemo(
    () => (isLight ? daySkyTexture() : nightSkyTexture()),
    [isLight],
  )
  useEffect(() => () => sky.dispose(), [sky])

  return (
    <group position={[ROOM.halfX - 0.02, 1.72, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[1.3, 1.05]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {/* Smooth Rounded Window Frame */}
      <RoundedBox args={[1.38, 1.13, 0.04]} radius={0.012} smoothness={4} position={[0, 0, 0.012]}>
        <meshStandardMaterial color={P.windowFrame} roughness={0.45} metalness={0.3} />
      </RoundedBox>
      {/* Daylight spilling in from the window plane. */}
      <pointLight
        position={[0, 0, 0.9]}
        color={isLight ? '#eaf2ff' : '#38bdf8'}
        intensity={isLight ? 2.2 : 1.2}
        distance={5.5}
        decay={2}
      />
    </group>
  )
}

/* ========================================================================== */
/*  Plant — Photorealistic Organic Drooping Leaves with Veined Texture        */
/* ========================================================================== */

function Plant() {
  const plantRef = useRef()

  // Gentle breeze sway animation
  useFrame((state) => {
    if (!plantRef.current) return
    const t = state.clock.elapsedTime
    plantRef.current.rotation.y = Math.sin(t * 0.3) * 0.02
    plantRef.current.rotation.z = Math.sin(t * 0.5 + 1.0) * 0.008
  })

  const leaves = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + 0.3
        const tilt = 0.3 + (i % 4) * 0.18
        const leafScale = 0.12 + (i % 3) * 0.045
        const stemLength = 0.3 + (i % 3) * 0.12
        const droop = 0.15 + (i % 5) * 0.06
        return { angle, tilt, leafScale, stemLength, droop }
      }),
    [],
  )

  /* Pushed back into the corner and scaled down. Sat forward at full size it
     was the largest object in the frame and pulled the eye straight off the
     desk — a plant should dress the corner, not compete with the monitor. */
  return (
    <group ref={plantRef} position={[2.46, 0, -0.28]} scale={0.86}>
      {/* Smooth Tapered Ceramic Planter with Rim */}
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[0.18, 0.12, 0.36, 48]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.2} metalness={0.15} />
      </mesh>
      {/* Planter Rim Ring */}
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.175, 0.012, 16, 48]} />
        <meshStandardMaterial color="#222226" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Dark Organic Soil */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.02, 48]} />
        <meshStandardMaterial color="#1c1917" roughness={0.95} />
      </mesh>

      {/* Realistic Organic Curved Leaf Blades & Stems */}
      {leaves.map((l, i) => {
        const xStem = Math.cos(l.angle) * 0.06
        const zStem = Math.sin(l.angle) * 0.06
        const xLeaf = Math.cos(l.angle) * (0.06 + l.stemLength * 0.75)
        const zLeaf = Math.sin(l.angle) * (0.06 + l.stemLength * 0.75)
        const yLeaf = 0.36 + l.stemLength * 0.55 - l.droop

        // Curved stem path
        const stemCurve = new CatmullRomCurve3([
          new Vector3(xStem, 0.36, zStem),
          new Vector3(xStem * 1.4, 0.36 + l.stemLength * 0.5, zStem * 1.4),
          new Vector3(xLeaf, yLeaf + 0.06, zLeaf),
        ])

        return (
          <group key={i}>
            {/* Smooth Curved Stem Tube */}
            <mesh>
              <tubeGeometry args={[stemCurve, 16, 0.005, 12, false]} />
              <meshStandardMaterial color="#3a5a37" roughness={0.72} metalness={0} />
            </mesh>

            {/* Leaf blade. Real foliage is matte and desaturated — the primary
                greens it had before glowed like plastic under any light and
                were the loudest colour in the room. A hint of translucency
                and a sheen replaces the gloss. */}
            <mesh
              position={[xLeaf, yLeaf, zLeaf]}
              rotation={[
                Math.sin(l.angle) * (l.tilt + 0.3),
                l.angle,
                -Math.cos(l.angle) * (l.tilt + 0.3),
              ]}
              scale={[l.leafScale * 0.66, l.leafScale * 1.7, l.leafScale * 0.07]}
             
            >
              <sphereGeometry args={[1, 24, 24]} />
              <meshPhysicalMaterial
                color={i % 3 === 0 ? '#3d6b41' : i % 3 === 1 ? '#2f5535' : '#28472c'}
                roughness={0.68}
                metalness={0}
                sheen={0.4}
                sheenColor="#8fbf7a"
                clearcoat={0.18}
                clearcoatRoughness={0.7}
                side={DoubleSide}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Cables() {
  const curve = useMemo(() => {
    return new CatmullRomCurve3([
      new Vector3(-0.04, DESK_TOP, -0.06),
      new Vector3(0.15, DESK_TOP - 0.02, -0.3),
      new Vector3(0.3, DESK_TOP - 0.01, -0.4),
      new Vector3(1.0, 0.3, -0.5),
      new Vector3(1.48, 0.15, -0.55),
    ])
  }, [])

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 48, 0.006, 16, false]} />
      <meshStandardMaterial color="#09090b" roughness={0.65} metalness={0.15} />
    </mesh>
  )
}

/* ========================================================================== */
/*  Optional modelled room                                                    */
/* ========================================================================== */

/**
 * Rendered only once RoomScene's HEAD probe has confirmed the file exists, so
 * useGLTF never suspends the canvas forever on a 404. Shadows are switched on
 * across the tree because exporters rarely set them.
 *
 * This has to stay defined even while there is no room.glb — RoomScene
 * references it, so deleting it turns "drop in a model" into a hard
 * ReferenceError and a blank page.
 */
function GLTFRoom() {
  const { scene } = useGLTF(MODEL_URL)

  const prepared = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return <primitive object={prepared} />
}
