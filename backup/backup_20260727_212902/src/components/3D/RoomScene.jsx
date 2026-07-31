import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, Vector3 } from 'three'
import { DESK_TOP, ROOM } from './layout'
import {
  carpetTexture,
  corkboardTexture,
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
  lampOn = true,
  pcPower = true,
  onToggleLamp,
  onTogglePcPower,
}) {
  const [modelAvailable, setModelAvailable] = useState(false)

  useEffect(() => {
    fetch('/models/room.glb', { method: 'HEAD' })
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
  )
}

/* ========================================================================== */
/*  Shell — floor, walls, ceiling & dynamic RGB theme lighting               */
/* ========================================================================== */

function Shell({ roomTheme }) {
  const carpet = useMemo(() => carpetTexture('#1e1b24'), [])
  const wall = useMemo(() => wallTexture('#141318'), [])
  const floorWood = useMemo(() => woodTexture('#2b1e16', '#1a110c'), [])

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
        <meshStandardMaterial map={floorWood} color="#5c4738" roughness={0.45} metalness={0.1} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, ROOM.height / 2, ROOM.backZ]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.height]} />
        <meshStandardMaterial map={wall} color="#272533" roughness={0.88} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-ROOM.halfX, ROOM.height / 2, 0.6]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, ROOM.height]} />
        <meshStandardMaterial map={wall} color="#22202c" roughness={0.88} />
      </mesh>
      <mesh position={[ROOM.halfX, ROOM.height / 2, 0.6]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, ROOM.height]} />
        <meshStandardMaterial map={wall} color="#22202c" roughness={0.88} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, ROOM.height, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.width, 8]} />
        <meshStandardMaterial color="#0d0c10" roughness={1} />
      </mesh>

      {/* Skirting board — smooth rounded */}
      <mesh position={[0, 0.06, ROOM.backZ + 0.02]}>
        <boxGeometry args={[ROOM.width, 0.12, 0.03]} />
        <meshStandardMaterial color="#1a1822" roughness={0.5} />
      </mesh>

      {/* Ambient Dynamic RGB Desk Backlight Strip */}
      <pointLight position={[0, 1.1, ROOM.backZ + 0.15]} color={themeColors.c1} intensity={1.8} distance={4.5} />
      <pointLight position={[-1.2, 1.1, ROOM.backZ + 0.15]} color={themeColors.c2} intensity={1.2} distance={3.5} />
      <pointLight position={[1.2, 1.1, ROOM.backZ + 0.15]} color={themeColors.c3} intensity={1.2} distance={3.5} />
    </group>
  )
}

function Rug() {
  const carpet = useMemo(() => carpetTexture('#2a1b2e'), [])
  useEffect(() => () => carpet.dispose(), [carpet])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.75]} receiveShadow>
      <circleGeometry args={[1.65, 64]} />
      <meshStandardMaterial map={carpet} color="#4c3254" roughness={0.9} />
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
  const wood = useMemo(() => woodTexture('#3a261a', '#1e130c'), [])
  useEffect(() => () => wood.dispose(), [wood])

  const legX = DESK_W / 2 - 0.12
  const legZ = DESK_D / 2 - 0.1

  return (
    <group position={[0, 0, DESK_Z]}>
      {/* Top slab - Smooth Rounded Dark Walnut with soft chamfered edges */}
      <RoundedBox args={[DESK_W, 0.06, DESK_D]} radius={0.012} smoothness={4} position={[0, DESK_TOP - 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color="#8c6a51" roughness={0.78} metalness={0.02} />
      </RoundedBox>

      {/* Leather Desk Mat — Soft Rounded Rectangle */}
      <RoundedBox args={[1.4, 0.005, 0.55]} radius={0.008} smoothness={4} position={[0, DESK_TOP + 0.002, 0.05]} receiveShadow>
        <meshStandardMaterial color="#0a0a0c" roughness={0.75} metalness={0.05} />
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
          <meshStandardMaterial color="#121316" roughness={0.15} metalness={0.9} />
        </mesh>
      ))}

      {/* Modesty panel — smooth rounded */}
      <RoundedBox args={[DESK_W - 0.3, 0.5, 0.02]} radius={0.006} smoothness={4} position={[0, 0.4, -legZ - 0.03]}>
        <meshStandardMaterial map={wood} color="#5e4634" roughness={0.6} />
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
  const isZoomed = viewState && viewState !== 'ROOM'
  const xPos = isZoomed ? 0.45 : 0.06
  const zPos = isZoomed ? 2.2 : 1.05
  const rotY = isZoomed ? -0.45 : -0.18

  return (
    <group position={[xPos, 0, zPos]} rotation={[0, rotY, 0]}>
      {/* ---------------------------------------------------- Bucket Seat Cushion */}
      <group position={[0, 0.46, 0]}>
        {/* Central Black Seat Base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.07, 0.42]} />
          <meshStandardMaterial color="#0f0f13" roughness={0.4} metalness={0.08} />
        </mesh>

        {/* Front Seat Cushion Red Racing Stripe */}
        <mesh position={[0, 0.005, -0.18]} castShadow>
          <boxGeometry args={[0.384, 0.072, 0.08]} />
          <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Flared Side Seat Bolsters (Black with Red Piping Edges) */}
        {[-0.22, 0.22].map((x) => (
          <group key={x} position={[x, 0.03, 0]} rotation={[0, 0, x > 0 ? -0.32 : 0.32]}>
            <mesh castShadow>
              <boxGeometry args={[0.07, 0.08, 0.42]} />
              <meshStandardMaterial color="#0f0f13" roughness={0.4} />
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
          <meshStandardMaterial color="#0f0f13" roughness={0.4} metalness={0.08} />
        </mesh>

        {/* Flared Shoulder Wings (Wider Top Contour) */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.52, 0.24, 0.065]} />
          <meshStandardMaterial color="#0f0f13" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[0.36, 0.12, 0.06]} />
          <meshStandardMaterial color="#0f0f13" roughness={0.4} />
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
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.11, 0.045]} />
            <meshStandardMaterial color="#141418" roughness={0.5} />
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
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.12, 0.05]} />
            <meshStandardMaterial color="#141418" roughness={0.5} />
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
        <mesh castShadow>
          <boxGeometry args={[0.03, 0.12, 0.1]} />
          <meshStandardMaterial color="#1c1c22" roughness={0.2} metalness={0.9} />
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
          <mesh castShadow>
            <boxGeometry args={[0.09, 0.02, 0.26]} />
            <meshStandardMaterial color="#1c1c22" roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Heavy Black Armstem */}
          <mesh position={[0, -0.12, 0.05]}>
            <cylinderGeometry args={[0.018, 0.022, 0.22, 16]} />
            <meshStandardMaterial color="#141418" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ---------------------------------------------------- Heavy Gas Lift Cylinder */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.048, 0.44, 32]} />
        <meshStandardMaterial color="#141418" roughness={0.2} metalness={0.85} />
      </mesh>

      {/* ---------------------------------------------------- 5-Star Black Base with Red Wheel Hubs */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            {/* Curved Matte Black Leg Arm */}
            <mesh position={[0, 0.05, 0.18]} rotation={[0.15, 0, 0]} castShadow>
              <boxGeometry args={[0.04, 0.03, 0.32]} />
              <meshStandardMaterial color="#141418" roughness={0.3} metalness={0.4} />
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

  return (
    <group position={[-0.04, DESK_TOP + 0.005, 0.03]} rotation={[0, 0.02, 0]}>
      {/* Keyboard Body — Smooth Rounded Chassis */}
      <RoundedBox args={[0.92, 0.022, 0.19]} radius={0.008} smoothness={4} position={[0, 0.011, 0]} rotation={[-0.045, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.75} />
      </RoundedBox>

      <group rotation={[-0.045, 0, 0]}>
        {keys.map((k, i) => (
          <RoundedBox key={i} args={[k.wide ? 0.28 : 0.046, 0.012, 0.021]} radius={0.003} smoothness={2} position={[k.x, 0.028, k.z]}>
            <meshStandardMaterial
              color={k.accent ? '#f43f5e' : '#27272a'}
              roughness={0.35}
              metalness={0.2}
            />
          </RoundedBox>
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
        {/* Internal RGB Optical Sensor Light (Glows inside honeycomb shell) */}
        <pointLight position={[0, 0.02, 0]} color="#00f0ff" intensity={1.8} distance={0.12} decay={2} />
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

  useFrame((state) => {
    if (!bulbRef.current || !lampOn) return
    const t = state.clock.elapsedTime
    const f = 1 + Math.sin(t * 2.1) * 0.03 + Math.sin(t * 7.7) * 0.015
    bulbRef.current.intensity = 2.5 * f
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
        <pointLight
          ref={bulbRef}
          position={[-0.82, DESK_TOP + 0.42, -0.36]}
          color="#ffaa44"
          intensity={2.5}
          distance={5.5}
          decay={2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0012}
        />
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
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
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
          <RoundedBox key={i} args={[0.09, 0.007, 0.092]} radius={0.003} smoothness={2} position={[i * 0.004, 0.005 + i * 0.008, i * 0.003]} castShadow>
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
  const wood = useMemo(() => woodTexture('#2b1e16', '#1a110c'), [])
  useEffect(() => () => wood.dispose(), [wood])

  const books = useMemo(() => {
    const palette = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#ca8a04', '#0891b2']
    const rows = []
    for (let shelf = 0; shelf < 3; shelf++) {
      const row = []
      let x = -0.36
      while (x < 0.24) {
        const w = 0.026 + Math.random() * 0.03
        row.push({
          x: x + w / 2,
          w,
          h: 0.2 + Math.random() * 0.06,
          color: palette[Math.floor(Math.random() * palette.length)],
          lean: Math.random() > 0.88 ? 0.2 : 0,
        })
        x += w + 0.004
      }
      rows.push(row)
    }
    return rows
  }, [])

  return (
    <group position={[-2.35, 0, -0.75]} rotation={[0, 0.42, 0]}>
      {/* Smooth Rounded Back Panel */}
      <RoundedBox args={[0.86, 1.7, 0.03]} radius={0.008} smoothness={4} position={[0, 0.85, -0.13]} receiveShadow castShadow>
        <meshStandardMaterial map={wood} color="#5c4738" roughness={0.55} />
      </RoundedBox>

      {/* Smooth Rounded Side Panels */}
      {[-0.42, 0.42].map((x) => (
        <RoundedBox key={x} args={[0.03, 1.7, 0.28]} radius={0.006} smoothness={4} position={[x, 0.85, 0]} castShadow>
          <meshStandardMaterial map={wood} color="#5c4738" roughness={0.55} />
        </RoundedBox>
      ))}

      {/* Smooth Rounded Shelf Planks */}
      {[0.02, 0.44, 0.86, 1.28, 1.69].map((y) => (
        <RoundedBox key={y} args={[0.86, 0.03, 0.28]} radius={0.005} smoothness={4} position={[0, y, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color="#6e5443" roughness={0.55} />
        </RoundedBox>
      ))}

      {/* Smooth Rounded Books */}
      {books.map((row, s) =>
        row.map((b, i) => (
          <RoundedBox
            key={`${s}-${i}`}
            args={[b.w, b.h, 0.19]}
            radius={0.004}
            smoothness={2}
            position={[b.x, [0.46, 0.88, 1.3][s] + b.h / 2, 0.02]}
            rotation={[0, 0, b.lean]}
            castShadow
          >
            <meshStandardMaterial color={b.color} roughness={0.6} metalness={0.05} />
          </RoundedBox>
        )),
      )}
    </group>
  )
}

function Window() {
  const sky = useMemo(() => nightSkyTexture(), [])
  useEffect(() => () => sky.dispose(), [sky])

  return (
    <group position={[ROOM.halfX - 0.02, 1.72, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[1.3, 1.05]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {/* Smooth Rounded Window Frame */}
      <RoundedBox args={[1.38, 1.13, 0.04]} radius={0.012} smoothness={4} position={[0, 0, 0.012]}>
        <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.5} />
      </RoundedBox>
      <pointLight position={[0, 0, 0.9]} color="#38bdf8" intensity={1.2} distance={4.5} decay={2} />
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
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2 + 0.3
        const tilt = 0.3 + (i % 4) * 0.18
        const leafScale = 0.12 + (i % 3) * 0.045
        const stemLength = 0.3 + (i % 3) * 0.12
        const droop = 0.15 + (i % 5) * 0.06
        return { angle, tilt, leafScale, stemLength, droop }
      }),
    [],
  )

  return (
    <group ref={plantRef} position={[2.42, 0, 0.75]}>
      {/* Smooth Tapered Ceramic Planter with Rim */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
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
            <mesh castShadow>
              <tubeGeometry args={[stemCurve, 16, 0.005, 12, false]} />
              <meshStandardMaterial color="#15803d" roughness={0.35} metalness={0.05} />
            </mesh>

            {/* Organic Leaf Blade — Smooth Flattened Sphere */}
            <mesh
              position={[xLeaf, yLeaf, zLeaf]}
              rotation={[Math.sin(l.angle) * (l.tilt + 0.3), l.angle, -Math.cos(l.angle) * (l.tilt + 0.3)]}
              scale={[l.leafScale * 0.7, l.leafScale * 1.8, l.leafScale * 0.08]}
              castShadow
            >
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#16a34a' : '#15803d'}
                roughness={0.28}
                metalness={0.06}
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
