import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances, useGLTF, RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, DoubleSide, Vector3 } from 'three'
import { DESK_TOP, ROOM } from './layout'
import { PaletteContext, paletteFor, usePalette } from './palette'
import InteractiveProp from './InteractiveProp'
import { surface, surfaceWithMaps } from './surfaces'
import {
  cylinderProfile,
  lampBaseProfile,
  lampShadeProfile,
  mugProfile,
  planterProfile,
  speakerConeProfile,
} from './shapes'
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
  onOpenApp,
  onHoverProp,
}) {
  const palette = paletteFor(appearance)
  const canInteract = viewState === 'ROOM'

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
      <Bookshelf enabled={canInteract} onOpenApp={onOpenApp} onHoverProp={onHoverProp} />
      <WallArt enabled={canInteract} onOpenApp={onOpenApp} onHoverProp={onHoverProp} />
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
        <meshPhysicalMaterial map={floorWood} color={P.floor} {...surface('lacqueredWood', { roughness: 0.55, clearcoat: 0.35 })} />
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
      <meshPhysicalMaterial map={carpet} color={P.rug} {...surface('fabric')} />
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
      <RoundedBox args={[DESK_W, 0.06, DESK_D]} radius={0.009} smoothness={5} position={[0, DESK_TOP - 0.03, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial map={wood} color={P.deskTop} {...surfaceWithMaps('lacqueredWood')} />
      </RoundedBox>

      {/* Leather Desk Mat — Soft Rounded Rectangle */}
      <RoundedBox args={[1.4, 0.005, 0.55]} radius={0.008} smoothness={4} position={[0, DESK_TOP + 0.002, 0.05]} receiveShadow>
        <meshPhysicalMaterial color={P.deskMat} {...surfaceWithMaps('softTouch')} />
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
          <meshPhysicalMaterial color={P.deskLeg} {...surface('anodisedAluminium')} />
        </mesh>
      ))}

      {/* Modesty panel — smooth rounded */}
      <RoundedBox args={[DESK_W - 0.3, 0.5, 0.02]} radius={0.006} smoothness={4} position={[0, 0.4, -legZ - 0.03]}>
        <meshPhysicalMaterial map={wood} color={P.deskWood} {...surfaceWithMaps('paintedWood')} />
      </RoundedBox>

      {/* Drawer unit with smooth rounded edges */}
      <group position={[1.02, 0, 0]}>
        <RoundedBox args={[0.5, 0.62, DESK_D - 0.12]} radius={0.015} smoothness={4} position={[0, 0.31, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color="#6e523b" roughness={0.45} />
        </RoundedBox>
        {/* Smooth capsule drawer handles */}
        {[0.14, 0.34, 0.54].map((y) => (
          <mesh key={y} position={[0, y, DESK_D / 2 - 0.07]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.008, 0.18, 12, 24]} />
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

/* ==========================================================================
   Chair — a racing-style gaming chair, built from contoured parts.

   Rebuilt from a reference photo. The old one was a stack of boxes; what
   makes a real chair read as a chair is not more boxes but three things:

   · CONTOUR. A bucket seat is not flat. The base dishes slightly and the side
     bolsters rise and flare outward, so the silhouette has a waist. Same for
     the backrest: it narrows toward the lumbar and flares again at the
     shoulders.
   · PIPING. The coloured seams that trace every panel edge. These are what
     the eye actually reads as "upholstery", and they only work as real
     geometry following a curve — painted-on stripes read as decals.
   · SOFTNESS. Cushions get a large corner radius relative to their size,
     because foam under vinyl cannot hold a sharp edge. Hard parts (frame,
     base, gas lift) get a small one, because moulded nylon can.

   Every panel is a RoundedBox with a radius chosen from BEVEL and scaled to
   the part, and the upholstery uses the fabric surface so it has sheen rather
   than a plastic specular.
   ========================================================================== */

/** One piped seam, drawn as a tube along a curve. */
function Piping({ points, radius = 0.006, color = '#dc2626' }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))), [points])
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 24, radius, 8, false]} />
      <meshPhysicalMaterial color={color} {...surface('softTouch')} />
    </mesh>
  )
}

function Chair({ viewState }) {
  const P = usePalette()
  const isZoomed = viewState && viewState !== 'ROOM'
  const group = useRef()

  const shell = P.chairShell
  const accent = '#d92435'
  const frame = P.chairBase

  /* Staging, not decoration. Parked square in front of the desk the chair sits
     dead centre of the room shot and hides the one thing the visitor is meant
     to click. So it lives pushed out and turned away — the way a chair
     actually looks when nobody is sitting in it — and slides further aside on
     the way in to clear the sightline to the screen. */
  const pose = isZoomed ? { x: 1.6, z: 2.05, ry: -0.95 } : { x: 1.42, z: 1.72, ry: -0.85 }

  useFrame((_, delta) => {
    if (!group.current) return
    const k = 1 - Math.pow(0.004, delta)
    group.current.position.x += (pose.x - group.current.position.x) * k
    group.current.position.z += (pose.z - group.current.position.z) * k
    group.current.rotation.y += (pose.ry - group.current.rotation.y) * k
  })

  const vinyl = surfaceWithMaps('fabric')
  const moulded = surfaceWithMaps('plastic')
  const metal = surface('anodisedAluminium')

  return (
    <group ref={group} position={[pose.x, 0, pose.z]} rotation={[0, pose.ry, 0]}>
      {/* ------------------------------------------------------ Bucket seat */}
      <group position={[0, 0.45, 0]}>
        {/* Main cushion. Wide radius — foam cannot hold an edge. */}
        <RoundedBox args={[0.44, 0.085, 0.46]} radius={0.032} smoothness={5} castShadow receiveShadow>
          <meshPhysicalMaterial color={shell} {...vinyl} />
        </RoundedBox>

        {/* Front lip, slightly narrower and dropped, so the seat has a nose. */}
        <RoundedBox
          args={[0.38, 0.07, 0.1]}
          radius={0.03}
          smoothness={4}
          position={[0, -0.012, -0.25]}
          rotation={[0.16, 0, 0]}
          castShadow
        >
          <meshPhysicalMaterial color={shell} {...vinyl} />
        </RoundedBox>

        {/* Side bolsters — raised and flared outward, which is what gives a
            bucket seat its waist. */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.225, 0.035, -0.02]} rotation={[0, 0, sx * -0.34]}>
            <RoundedBox args={[0.085, 0.1, 0.42]} radius={0.038} smoothness={5} castShadow>
              <meshPhysicalMaterial color={shell} {...vinyl} />
            </RoundedBox>
            {/* Accent panel on the outer face of each bolster. */}
            <RoundedBox
              args={[0.016, 0.075, 0.36]}
              radius={0.007}
              smoothness={3}
              position={[sx * 0.04, 0.006, 0]}
            >
              <meshPhysicalMaterial color={accent} {...surface('softTouch')} />
            </RoundedBox>
          </group>
        ))}

        {/* Seam piping around the cushion edge. */}
        <Piping
          color={accent}
          points={[
            [-0.19, 0.045, -0.21],
            [0.0, 0.05, -0.235],
            [0.19, 0.045, -0.21],
          ]}
        />
      </group>

      {/* -------------------------------------------------------- Backrest */}
      <group position={[0, 0.93, 0.2]} rotation={[0.1, 0, 0]}>
        {/* Main panel, tapered by stacking two boxes rather than one slab —
            narrow at the lumbar, wider at the shoulders. */}
        <RoundedBox args={[0.4, 0.44, 0.085]} radius={0.045} smoothness={5} position={[0, -0.16, 0]} castShadow>
          <meshPhysicalMaterial color={shell} {...vinyl} />
        </RoundedBox>
        <RoundedBox args={[0.46, 0.34, 0.09]} radius={0.05} smoothness={5} position={[0, 0.16, 0]} castShadow>
          <meshPhysicalMaterial color={shell} {...vinyl} />
        </RoundedBox>
        {/* Crown */}
        <RoundedBox args={[0.34, 0.14, 0.08]} radius={0.045} smoothness={5} position={[0, 0.37, 0]} castShadow>
          <meshPhysicalMaterial color={shell} {...vinyl} />
        </RoundedBox>

        {/* Shoulder wings — angled forward so they wrap rather than stick out. */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.235, 0.16, -0.03]} rotation={[0, sx * 0.42, sx * -0.05]}>
            <RoundedBox args={[0.07, 0.34, 0.11]} radius={0.032} smoothness={5} castShadow>
              <meshPhysicalMaterial color={shell} {...vinyl} />
            </RoundedBox>
            <RoundedBox
              args={[0.02, 0.3, 0.02]}
              radius={0.008}
              smoothness={3}
              position={[sx * 0.03, 0, -0.05]}
            >
              <meshPhysicalMaterial color={accent} {...surface('softTouch')} />
            </RoundedBox>
          </group>
        ))}

        {/* Two accent stripes running the height of the backrest. */}
        {[-0.125, 0.125].map((x) => (
          <RoundedBox
            key={x}
            args={[0.055, 0.72, 0.012]}
            radius={0.006}
            smoothness={3}
            position={[x, 0.02, -0.046]}
          >
            <meshPhysicalMaterial color={accent} {...surface('softTouch')} />
          </RoundedBox>
        ))}

        {/* Headrest pillow, hung off the crown on two straps. */}
        <group position={[0, 0.3, -0.07]} rotation={[0.08, 0, 0]}>
          <RoundedBox args={[0.235, 0.115, 0.07]} radius={0.033} smoothness={5} castShadow>
            <meshPhysicalMaterial color={shell} {...vinyl} />
          </RoundedBox>
          {[-1, 1].map((sx) => (
            <RoundedBox
              key={sx}
              args={[0.045, 0.12, 0.075]}
              radius={0.022}
              smoothness={4}
              position={[sx * 0.115, 0, 0]}
            >
              <meshPhysicalMaterial color={accent} {...surface('softTouch')} />
            </RoundedBox>
          ))}
          {/* Straps up over the crown. */}
          {[-0.07, 0.07].map((x) => (
            <mesh key={x} position={[x, 0.09, 0.03]} rotation={[0.5, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.13, 10]} />
              <meshPhysicalMaterial color="#17181c" {...surface('softTouch')} />
            </mesh>
          ))}
        </group>

        {/* Lumbar pillow. */}
        <group position={[0, -0.28, -0.075]} rotation={[-0.06, 0, 0]}>
          <RoundedBox args={[0.3, 0.135, 0.075]} radius={0.036} smoothness={5} castShadow>
            <meshPhysicalMaterial color={shell} {...vinyl} />
          </RoundedBox>
          {[-1, 1].map((sx) => (
            <RoundedBox
              key={sx}
              args={[0.045, 0.14, 0.08]}
              radius={0.024}
              smoothness={4}
              position={[sx * 0.145, 0, 0]}
            >
              <meshPhysicalMaterial color={accent} {...surface('softTouch')} />
            </RoundedBox>
          ))}
        </group>
      </group>

      {/* ------------------------------------------------- Recline hardware */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.215, 0.5, 0.14]}>
          <RoundedBox args={[0.035, 0.13, 0.11]} radius={0.014} smoothness={4} castShadow>
            <meshPhysicalMaterial color={frame} {...metal} />
          </RoundedBox>
          {sx > 0 && (
            <mesh position={[0.03, -0.03, 0.02]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.008, 0.008, 0.09, 12]} />
              <meshPhysicalMaterial color={frame} {...metal} />
            </mesh>
          )}
        </group>
      ))}

      {/* ------------------------------------------------------- Armrests */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.3, 0.62, 0.01]}>
          {/* Soft top pad */}
          <RoundedBox args={[0.095, 0.03, 0.25]} radius={0.014} smoothness={5} castShadow>
            <meshPhysicalMaterial color="#1b1c21" {...moulded} />
          </RoundedBox>
          {/* Height-adjust column, tapering into the seat frame. */}
          <RoundedBox
            args={[0.05, 0.15, 0.06]}
            radius={0.018}
            smoothness={4}
            position={[0, -0.09, 0.03]}
            castShadow
          >
            <meshPhysicalMaterial color={frame} {...moulded} />
          </RoundedBox>
          {/* Adjust button */}
          <mesh position={[sx * 0.028, -0.055, 0.03]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.009, 0.009, 0.008, 12]} />
            <meshPhysicalMaterial color={accent} {...surface('plastic')} />
          </mesh>
        </group>
      ))}

      {/* ------------------------------------------------------- Gas lift */}
      {/* Tapered shroud over a polished piston — two cylinders, because a
          single one reads as a pole rather than a mechanism. */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.062, 0.2, 28]} />
        <meshPhysicalMaterial color={frame} {...moulded} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.026, 0.12, 24]} />
        <meshPhysicalMaterial color="#b9bcc4" {...metal} />
      </mesh>

      {/* ---------------------------------------------------- Five-star base */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            {/* Arm — tapered and angled down toward the caster. */}
            <RoundedBox
              args={[0.052, 0.036, 0.3]}
              radius={0.016}
              smoothness={4}
              position={[0, 0.075, 0.17]}
              rotation={[0.1, 0, 0]}
              castShadow
            >
              <meshPhysicalMaterial color={frame} {...moulded} />
            </RoundedBox>

            {/* Caster housing + wheel with a coloured hub. */}
            <group position={[0, 0.038, 0.325]}>
              <RoundedBox args={[0.036, 0.05, 0.036]} radius={0.012} smoothness={4} position={[0, 0.028, 0]}>
                <meshPhysicalMaterial color={frame} {...moulded} />
              </RoundedBox>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.036, 0.036, 0.026, 24]} />
                <meshPhysicalMaterial color="#101116" {...surface('rubber')} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.028, 18]} />
                <meshPhysicalMaterial color={accent} {...surface('plastic')} />
              </mesh>
            </group>
          </group>
        )
      })}

      {/* Centre hub cap over the star. */}
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[0.062, 0.07, 0.026, 28]} />
        <meshPhysicalMaterial color={frame} {...moulded} />
      </mesh>
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
          <RoundedBox key={i} position={[k.x, 0.028, k.z]} args={[0.28, 0.012, 0.021]} radius={0.0026} smoothness={4}>
        <meshStandardMaterial color="#27272a" roughness={0.35} metalness={0.2} />
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
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.006, 24]} />
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
  const P = usePalette()
  const woofer = useMemo(() => speakerConeProfile({ radius: 0.042, depth: 0.018 }), [])
  const tweeter = useMemo(() => speakerConeProfile({ radius: 0.018, depth: 0.008 }), [])
  const port = useMemo(() => cylinderProfile({ radius: 0.014, height: 0.012, fillet: 0.004 }), [])

  const cabinet = surfaceWithMaps('softTouch')
  const cone = surface('plastic', { roughness: 0.7 })
  const trim = surface('anodisedAluminium')

  return (
    <group>
      {[-0.84, 0.84].map((x) => (
        <group key={x} position={[x, DESK_TOP, -0.34]} rotation={[0, x < 0 ? 0.34 : -0.34, 0]}>
          {/* Cabinet. Real bookshelf speakers have a slightly proud baffle and
              a chamfered box — the chamfer is there to stop edge diffraction,
              and it is also what stops it reading as a shoebox. */}
          <RoundedBox
            args={[0.135, 0.27, 0.125]}
            radius={0.01}
            smoothness={5}
            position={[0, 0.135, 0]}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial color={P.speaker} {...cabinet} />
          </RoundedBox>

          {/* Baffle, a hair proud of the cabinet and slightly darker. */}
          <RoundedBox
            args={[0.128, 0.262, 0.008]}
            radius={0.006}
            smoothness={4}
            position={[0, 0.135, 0.064]}
          >
            <meshPhysicalMaterial color="#17181c" {...surface('softTouch')} />
          </RoundedBox>

          {/* Woofer — revolved cone with a surround roll and a dust cap. */}
          <group position={[0, 0.088, 0.068]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <latheGeometry args={[woofer, 32]} />
              <meshPhysicalMaterial color="#0d0e11" side={DoubleSide} {...cone} />
            </mesh>
            {/* Pressed metal basket ring. */}
            <mesh position={[0, -0.002, 0]}>
              <torusGeometry args={[0.046, 0.004, 10, 32]} />
              <meshPhysicalMaterial color="#3c3f46" {...trim} />
            </mesh>
          </group>

          {/* Tweeter */}
          <group position={[0, 0.208, 0.068]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <latheGeometry args={[tweeter, 24]} />
              <meshPhysicalMaterial color="#15161a" side={DoubleSide} {...cone} />
            </mesh>
            <mesh position={[0, -0.002, 0]}>
              <torusGeometry args={[0.021, 0.003, 8, 24]} />
              <meshPhysicalMaterial color="#3c3f46" {...trim} />
            </mesh>
          </group>

          {/* Bass reflex port, below the woofer. */}
          <mesh position={[0, 0.038, 0.066]} rotation={[-Math.PI / 2, 0, 0]}>
            <latheGeometry args={[port, 24]} />
            <meshPhysicalMaterial color="#0a0b0d" side={DoubleSide} roughness={0.9} />
          </mesh>

          {/* Rubber isolation feet, so the cabinet does not sit flush. */}
          {[
            [-0.045, -0.04],
            [0.045, -0.04],
            [-0.045, 0.04],
            [0.045, 0.04],
          ].map(([fx, fz], k) => (
            <mesh key={k} position={[fx, 0.004, fz]}>
              <cylinderGeometry args={[0.008, 0.009, 0.008, 12]} />
              <meshPhysicalMaterial color="#0f1013" {...surface('rubber')} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* Base brightness of the desk lamp. Referenced both by the light itself and
   by the flicker in useFrame — they have to agree, or the first frame resets
   the lamp to whatever the animation assumes. */
const LAMP_INTENSITY = 9

function DeskLamp({ lampOn = true, onToggleLamp }) {
  const bulbRef = useRef()
  const [hovered, setHovered] = useState(false)

  const shade = useMemo(() => lampShadeProfile(), [])
  const base = useMemo(() => lampBaseProfile(), [])

  /* The arm is one continuous swept tube rather than two boxes meeting at an
     angle. A real anglepoise has a bend, not a corner, and the highlight
     travelling along that bend is most of what sells it as metal. */
  const arm = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 0.02, 0),
        new Vector3(0.01, 0.16, 0.01),
        new Vector3(0.06, 0.34, 0.04),
        new Vector3(0.17, 0.46, 0.09),
        new Vector3(0.28, 0.5, 0.13),
      ]),
    [],
  )

  useEffect(() => {
    if (!hovered) return undefined
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  // Filament bulbs never sit perfectly still. Two out-of-phase sines beat
  // against each other so the flicker has no audible period.
  useFrame((state) => {
    if (!bulbRef.current || !lampOn) return
    const t = state.clock.elapsedTime
    bulbRef.current.intensity =
      LAMP_INTENSITY * (1 + Math.sin(t * 2.1) * 0.03 + Math.sin(t * 7.7) * 0.015)
  })

  const metal = surfaceWithMaps('anodisedAluminium')
  const paint = surface('plastic', { roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.2 })

  return (
    <group
      position={[-1.16, DESK_TOP, -0.52]}
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
      {/* Weighted base — a low dome, filleted at the edge. */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[base, 48]} />
        <meshPhysicalMaterial color="#2c2e34" {...metal} />
      </mesh>
      {/* Felt pad underneath, so it does not float on the desk. */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.106, 32]} />
        <meshPhysicalMaterial color="#17181b" {...surface('softTouch')} />
      </mesh>

      {/* Swept arm. */}
      <mesh castShadow>
        <tubeGeometry args={[arm, 40, 0.0115, 14, false]} />
        <meshPhysicalMaterial color="#3a3d44" {...metal} />
      </mesh>

      {/* Knuckle where the arm meets the base, and where it meets the shade. */}
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.02, 20, 16]} />
        <meshPhysicalMaterial color="#33363c" {...metal} />
      </mesh>
      <mesh position={[0.28, 0.5, 0.13]}>
        <sphereGeometry args={[0.018, 20, 16]} />
        <meshPhysicalMaterial color="#33363c" {...metal} />
      </mesh>

      {/* Shade — revolved, so it is a cone with a lip rather than a cone. */}
      <group position={[0.3, 0.485, 0.14]} rotation={[0.66, 0, -0.52]}>
        <mesh castShadow>
          <latheGeometry args={[shade, 40]} />
          <meshPhysicalMaterial color="#c9683a" side={DoubleSide} {...paint} />
        </mesh>
        {/* Warm painted interior — real shades are pale inside to bounce light. */}
        <mesh scale={[0.965, 0.98, 0.965]} position={[0, 0.002, 0]}>
          <latheGeometry args={[shade, 40]} />
          <meshPhysicalMaterial color="#ffe9cf" side={DoubleSide} roughness={0.85} />
        </mesh>

        {/* Bulb, only when lit. */}
        {lampOn && (
          <mesh position={[0, 0.045, 0]}>
            <sphereGeometry args={[0.028, 20, 16]} />
            <meshBasicMaterial color="#fff1d6" toneMapped={false} />
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
            position={[0.3, 0.47, 0.15]}
            target-position={[0.05, -0.6, 0.42]}
            color="#ffb257"
            intensity={LAMP_INTENSITY}
            distance={6}
            decay={2}
            angle={1.0}
            penumbra={0.9}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0015}
            shadow-normalBias={0.02}
            shadow-radius={6}
            shadow-blurSamples={12}
            shadow-camera-near={0.15}
            shadow-camera-far={6}
          />
          {/* Shadowless fill so the cone's edge does not cut hard. */}
          <pointLight
            position={[0.3, 0.5, 0.14]}
            color="#ffb257"
            intensity={0.7}
            distance={2.4}
            decay={2}
          />
        </>
      )}
    </group>
  )
}

function DeskClutter() {
  const mug = useMemo(() => mugProfile(), [])
  const ceramic = surfaceWithMaps('ceramic')

  return (
    <group>
      {/* Mug — revolved with a rolled rim and a recessed base, plus a real
          torus handle. Stacked cylinders read as stacked cylinders. */}
      <group position={[0.48, DESK_TOP, -0.28]}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[mug, 40]} />
          <meshPhysicalMaterial color="#eceae4" side={DoubleSide} {...ceramic} />
        </mesh>
        {/* Coffee, sitting a little below the rim. */}
        <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.039, 28]} />
          <meshPhysicalMaterial color="#2a1a10" roughness={0.16} clearcoat={0.9} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.052, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.026, 0.0075, 12, 28, Math.PI * 1.25]} />
          <meshPhysicalMaterial color="#eceae4" {...ceramic} />
        </mesh>
      </group>

      {/* A closed notebook with a visible page block and an elastic strap. */}
      <group position={[-1.16, DESK_TOP, 0.12]} rotation={[0, -0.3, 0]}>
        <RoundedBox args={[0.19, 0.018, 0.25]} radius={0.005} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#6f3336" {...surfaceWithMaps('softTouch')} />
        </RoundedBox>
        {/* Pages, inset so the cover overhangs them the way a real one does. */}
        <mesh position={[-0.004, 0.0005, 0]}>
          <boxGeometry args={[0.176, 0.014, 0.238]} />
          <meshPhysicalMaterial color="#efeade" roughness={0.95} />
        </mesh>
        {/* Elastic closure. */}
        <mesh position={[0.055, 0.0005, 0]}>
          <boxGeometry args={[0.006, 0.021, 0.252]} />
          <meshPhysicalMaterial color="#2a2c31" {...surface('rubber')} />
        </mesh>
        {/* Pen resting on top. */}
        <group position={[0.02, 0.019, 0.02]} rotation={[0, 0.5, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.005, 0.005, 0.135, 14]} />
            <meshPhysicalMaterial color="#1b2430" {...surface('plastic')} />
          </mesh>
          <mesh position={[0, 0.072, 0]}>
            <cylinderGeometry args={[0.0045, 0.002, 0.014, 12]} />
            <meshPhysicalMaterial color="#b9bcc4" {...surface('anodisedAluminium')} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function PCTower({ pcPower = true, onTogglePcPower }) {
  const P = usePalette()
  const powerRef = useRef()
  const hddRef = useRef()
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!hovered) return undefined
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (powerRef.current) {
      // Slow, calm breath.
      powerRef.current.material.emissiveIntensity = pcPower ? 2.2 + Math.sin(t * 1.6) * 0.5 : 0
    }
    if (hddRef.current) {
      /* Bursty. Layered sines give runs of activity and quiet gaps, which
         reads far more like a real disk than Math.random() ever does. */
      const burst = Math.sin(t * 13.7) * Math.sin(t * 3.1) * Math.sin(t * 0.7 + 1.2)
      hddRef.current.material.emissiveIntensity = pcPower && burst > 0.12 ? 3.4 : 0.05
    }
  })

  const shell = surfaceWithMaps('plastic')
  const glass = surface('glass')
  const metal = surface('anodisedAluminium')

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
      {/* Case. Chamfered rather than square — every real case has a broken
          edge because a sharp sheet-steel corner cuts your hand. */}
      <RoundedBox
        args={[0.24, 0.5, 0.54]}
        radius={0.012}
        smoothness={5}
        position={[0, 0.25, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial color={P.towerBody} {...shell} />
      </RoundedBox>

      {/* Tempered-glass side panel, inset behind a frame. */}
      <mesh position={[-0.122, 0.26, 0.02]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.44, 0.4]} />
        <meshPhysicalMaterial
          color="#10131a"
          transparent
          opacity={0.55}
          side={DoubleSide}
          {...glass}
        />
      </mesh>
      <RoundedBox
        args={[0.006, 0.44, 0.48]}
        radius={0.002}
        smoothness={3}
        position={[-0.12, 0.26, 0.02]}
      >
        <meshPhysicalMaterial color="#2b2e35" {...metal} />
      </RoundedBox>

      {/* Front mesh intake, drawn as a fine grille rather than a flat face. */}
      <RoundedBox args={[0.2, 0.36, 0.008]} radius={0.004} smoothness={3} position={[0, 0.3, 0.272]}>
        <meshPhysicalMaterial color="#191b20" roughness={0.95} />
      </RoundedBox>
      {Array.from({ length: 16 }, (_, k) => (
        <mesh key={k} position={[0, 0.14 + k * 0.021, 0.277]}>
          <boxGeometry args={[0.19, 0.008, 0.003]} />
          <meshPhysicalMaterial color="#2e3138" roughness={0.85} />
        </mesh>
      ))}

      {/* Top exhaust vent. */}
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={k} position={[0, 0.501, -0.16 + k * 0.04]}>
          <boxGeometry args={[0.18, 0.004, 0.016]} />
          <meshPhysicalMaterial color="#2e3138" roughness={0.9} />
        </mesh>
      ))}

      {/* IO strip: power button, two LEDs, a USB pair. */}
      <mesh position={[-0.055, 0.115, 0.276]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.006, 20]} />
        <meshPhysicalMaterial color="#3a3d44" {...metal} />
      </mesh>
      <mesh ref={powerRef} position={[-0.02, 0.115, 0.277]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial
          color="#7cff9b"
          emissive="#4bff7a"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={hddRef} position={[0.005, 0.115, 0.277]}>
        <sphereGeometry args={[0.005, 12, 12]} />
        <meshStandardMaterial
          color="#ff9b4b"
          emissive="#ff7a1a"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      {[0.045, 0.07].map((ux) => (
        <mesh key={ux} position={[ux, 0.115, 0.276]}>
          <boxGeometry args={[0.016, 0.007, 0.004]} />
          <meshPhysicalMaterial color="#14161a" roughness={0.8} />
        </mesh>
      ))}

      {/* Rubber feet, lifting the case off the floor. */}
      {[
        [-0.085, -0.2],
        [0.085, -0.2],
        [-0.085, 0.2],
        [0.085, 0.2],
      ].map(([fx, fz], k) => (
        <mesh key={k} position={[fx, 0.008, fz]}>
          <cylinderGeometry args={[0.014, 0.016, 0.016, 14]} />
          <meshPhysicalMaterial color="#0f1013" {...surface('rubber')} />
        </mesh>
      ))}

      {/* Faint spill from the LEDs onto the floor beside it. */}
      {pcPower && (
        <pointLight
          position={[0.05, 0.16, 0.36]}
          color="#ff9b4b"
          intensity={0.25}
          distance={0.9}
          decay={2}
        />
      )}
    </group>
  )
}

/* ==========================================================================
   WallArt — the prints above the desk, and the room's link into the work.

   Each frame is a real object: a mitred surround, a mount board, glass with a
   clearcoat, and the print recessed behind it. A poster drawn as a single
   zero-thickness plane reads as a sticker on the wall, because it has no edge
   for the light to catch.

   They are also the navigation. The ROC print IS RailCross's headline result,
   so clicking it opens RailCross — the wall stops being decoration and
   becomes the index.
   ========================================================================== */

function Frame({ w, h, print, tint = '#1a1a1e' }) {
  const moulding = surface('paintedWood', { roughness: 0.45, clearcoat: 0.4 })
  const t = 0.022 // frame face width
  const d = 0.026 // depth off the wall

  return (
    <group>
      {/* Mitred surround — four rails, not one slab, so the corners read. */}
      {[
        { a: [w, t, d], p: [0, h / 2 - t / 2, 0] },
        { a: [w, t, d], p: [0, -h / 2 + t / 2, 0] },
        { a: [t, h - t * 2, d], p: [-w / 2 + t / 2, 0, 0] },
        { a: [t, h - t * 2, d], p: [w / 2 - t / 2, 0, 0] },
      ].map((r, i) => (
        <RoundedBox key={i} args={r.a} radius={0.0035} smoothness={4} position={r.p} castShadow>
          <meshPhysicalMaterial color={tint} {...moulding} />
        </RoundedBox>
      ))}

      {/* Mount board, set back behind the frame face. */}
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[w - t * 1.4, h - t * 1.4]} />
        <meshPhysicalMaterial color="#f2efe8" roughness={0.95} />
      </mesh>

      {/* The print itself, recessed inside the mount. */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w - t * 3.2, h - t * 3.2]} />
        <meshStandardMaterial map={print} roughness={0.92} emissive="#ffb057" emissiveIntensity={0} />
      </mesh>

      {/* Glazing. Barely visible head-on, which is exactly right — you only
          notice it when the lamp rakes across it. */}
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[w - t * 1.6, h - t * 1.6]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.07}
          {...surface('glass')}
        />
      </mesh>
    </group>
  )
}

function WallArt({ enabled, onOpenApp, onHoverProp }) {
  const gradient = useMemo(() => posterGradientTexture(), [])
  const roc = useMemo(() => posterRocTexture(), [])
  const cork = useMemo(() => corkboardTexture(), [])
  useEffect(() => () => [gradient, roc, cork].forEach((t) => t.dispose()), [gradient, roc, cork])

  const z = ROOM.backZ + 0.014

  return (
    <group>
      <InteractiveProp
        label="Search Ranking Model"
        hint="Learning to rank · open project"
        enabled={enabled}
        onSelect={() => onOpenApp?.('projects', 'search-ranking')}
        onHover={onHoverProp}
        position={[-1.55, 1.92, z]}
        rotation={[0, 0, 0.014]}
      >
        <Frame w={0.72} h={0.96} print={gradient} />
      </InteractiveProp>

      <InteractiveProp
        label="RailCross"
        hint="0.888 ROC-AUC · open project"
        enabled={enabled}
        onSelect={() => onOpenApp?.('projects', 'railcross')}
        onHover={onHoverProp}
        position={[1.42, 2.0, z]}
        rotation={[0, 0, -0.008]}
      >
        <Frame w={0.94} h={0.72} print={roc} />
      </InteractiveProp>

      <InteractiveProp
        label="Get in touch"
        hint="Open Contact"
        enabled={enabled}
        onSelect={() => onOpenApp?.('contact')}
        onHover={onHoverProp}
        position={[0.0, 2.1, z]}
      >
        <Frame w={0.78} h={0.59} print={cork} tint="#6b4a29" />
      </InteractiveProp>
    </group>
  )
}

function Bookshelf({ enabled, onOpenApp, onHoverProp }) {
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
    <InteractiveProp
      label="About Adarsh"
      hint="Background, skills, what I'm learning"
      enabled={enabled}
      onSelect={() => onOpenApp?.('about')}
      onHover={onHoverProp}
      lift={0.02}
      position={[-2.35, 0, -0.75]}
      rotation={[0, 0.42, 0]}
    >
      {/* Smooth Rounded Back Panel */}
      <RoundedBox args={[0.86, 1.7, 0.03]} radius={0.008} smoothness={4} position={[0, 0.85, -0.13]} receiveShadow castShadow>
        <meshPhysicalMaterial map={wood} color={P.shelf} {...surfaceWithMaps('paintedWood')} />
      </RoundedBox>

      {/* Smooth Rounded Side Panels */}
      {[-0.42, 0.42].map((x) => (
        <RoundedBox key={x} args={[0.03, 1.7, 0.28]} radius={0.006} smoothness={4} position={[x, 0.85, 0]} castShadow>
          <meshPhysicalMaterial map={wood} color={P.shelf} {...surfaceWithMaps('paintedWood')} />
        </RoundedBox>
      ))}

      {/* Smooth Rounded Shelf Planks */}
      {[0.02, 0.44, 0.86, 1.28, 1.69].map((y) => (
        <RoundedBox key={y} args={[0.86, 0.03, 0.28]} radius={0.005} smoothness={4} position={[0, y, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial map={wood} color={P.shelf} {...surfaceWithMaps('paintedWood')} />
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
    </InteractiveProp>
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
  const pot = useMemo(() => planterProfile(), [])

  /* Deterministic layout. Math.random() here would reshuffle the plant on
     every hot reload, and a plant that rearranges itself is very distracting
     to work next to. */
  const leaves = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const angle = (i / 11) * Math.PI * 2 + 0.35
        const tier = i % 3
        return {
          angle,
          tilt: 0.34 + tier * 0.22,
          len: 0.34 + ((i * 7) % 5) * 0.055,
          width: 0.085 + (i % 4) * 0.014,
          droop: 0.1 + tier * 0.07,
          shade: i % 3,
        }
      }),
    [],
  )

  useFrame((state) => {
    if (!plantRef.current) return
    const t = state.clock.elapsedTime
    plantRef.current.rotation.y = Math.sin(t * 0.28) * 0.018
    plantRef.current.rotation.z = Math.sin(t * 0.47 + 1) * 0.007
  })

  const ceramic = surfaceWithMaps('ceramic')

  return (
    <group ref={plantRef} position={[2.46, 0, -0.28]} scale={0.86}>
      {/* Planter — revolved, with a rolled rim and a recessed foot, so it is a
          thrown pot rather than a tapered cylinder. */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[pot, 48]} />
        <meshPhysicalMaterial color="#e6e2da" side={DoubleSide} {...ceramic} />
      </mesh>

      {/* Soil, dished slightly below the rim. */}
      <mesh position={[0, 0.286, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.155, 32]} />
        <meshPhysicalMaterial color="#2b211a" roughness={1} />
      </mesh>

      {leaves.map((l, i) => {
        const xStem = Math.cos(l.angle) * 0.05
        const zStem = Math.sin(l.angle) * 0.05
        const xLeaf = Math.cos(l.angle) * (0.05 + l.len * 0.72)
        const zLeaf = Math.sin(l.angle) * (0.05 + l.len * 0.72)
        const yLeaf = 0.3 + l.len * 0.6 - l.droop

        const stem = new CatmullRomCurve3([
          new Vector3(xStem, 0.29, zStem),
          new Vector3(xStem * 1.5, 0.29 + l.len * 0.55, zStem * 1.5),
          new Vector3(xLeaf, yLeaf + 0.05, zLeaf),
        ])

        return (
          <group key={i}>
            {/* Stem tapers toward the tip — a constant-radius tube reads as
                wire, and that is what the old plant looked like. */}
            <mesh castShadow>
              <tubeGeometry args={[stem, 18, 0.0055, 10, false]} />
              <meshPhysicalMaterial color="#3f5f3c" roughness={0.72} />
            </mesh>

            {/* Blade. Flattened and lengthwise-curved, with a visible midrib. */}
            <group
              position={[xLeaf, yLeaf, zLeaf]}
              rotation={[
                Math.sin(l.angle) * (l.tilt + 0.28),
                l.angle,
                -Math.cos(l.angle) * (l.tilt + 0.28),
              ]}
            >
              <mesh scale={[l.width, l.len * 0.95, 0.012]} castShadow>
                <sphereGeometry args={[1, 20, 14]} />
                <meshPhysicalMaterial
                  color={l.shade === 0 ? '#436e46' : l.shade === 1 ? '#33583a' : '#2a4a31'}
                  side={DoubleSide}
                  roughness={0.62}
                  sheen={0.5}
                  sheenColor="#9ecb86"
                  clearcoat={0.22}
                  clearcoatRoughness={0.6}
                />
              </mesh>
              {/* Midrib — a real leaf has a spine and it catches the light. */}
              <mesh scale={[l.width * 0.1, l.len * 0.92, 0.016]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshPhysicalMaterial color="#5c8a55" roughness={0.6} />
              </mesh>
            </group>
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
