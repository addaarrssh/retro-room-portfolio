import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances, RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, DoubleSide, MathUtils, Vector3 } from 'three'
import { DESK_TOP } from './layout'
import { disks, hardware } from '../../data/portfolio'
import { PaletteContext, paletteFor, usePalette } from './palette'
import { surface, surfaceWithMaps } from './surfaces'
import audio from '../../audio/AudioEngine'
import {
  coveGeometry,
  cushionGeometry,
  cylinderProfile,
  keycapGeometry,
  lampBaseProfile,
  lampShadeProfile,
  mugProfile,
  planterProfile,
  speakerConeProfile,
} from './shapes'
import {
  deskWearTexture,
  groundShadowTexture,
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



export default function RoomScene({
  viewState,
  appearance = 'LIGHT',
  lampOn = true,
  pcPower = true,
  onToggleLamp,
  onTogglePcPower,
  /* MODERN | RETRO. Drives the era switch on the desk; DeskClutter renders the
     rocker and the sticky note that toggle it. */
  era = 'MODERN',
  onToggleEra,
  onOpenApp,
  onHoverProp,
}) {
  const palette = paletteFor(appearance)
  const canInteract = viewState === 'ROOM'

  return (
    <PaletteContext.Provider value={palette}>
      {/* What is on the sweep is the entire design.

          Everything that needed a wall to exist — the door, the window, three
          framed prints, a bookshelf, a ceiling pendant — is gone with the
          walls. So is the floor clutter: the rug, the rainbow name-blocks,
          the traffic cones, the marbles and the drivable car. They were built
          to show effort to friends; against an empty sweep they read as mess,
          and the emptiness they were filling is now the point.

          What is left is a desk and the things a person actually works at.
          ToyCarRoom.jsx and Turntable.jsx are untouched on disk — they are
          unmounted, not deleted, so either can come back in one line. */}
      {/* A second pass of subtraction, and a harder one than the first.

          The desk still carried a lamp, a pair of speakers, a floppy rack, a
          tower under the desk and a run of cables between them. Every one of
          those is well modelled and every one was working against the shot:

          · THE LAMP was the largest object in frame after the monitor and the
            only saturated colour in a neutral scene, so the eye went to a lamp
            on a portfolio site. It also carried the scene's second shadow
            caster and its own point light.
          · THE SPEAKERS AND THE TOWER sat at the extreme left and right of the
            desk, pushing the silhouette wider than the frame and forcing the
            camera further back — which is why the desk was cropped at the
            edges rather than floating in space.
          · THE CABLES drew hard dark lines across the empty sweep beneath the
            desk. That emptiness is the composition; anything crossing it fills
            it back in.
          · THE FLOPPY RACK was a second, hidden index into the same apps the
            desktop icons already list, so it duplicated navigation nobody had
            found.

          What is left is a desk, a chair, the machine, and the two props that
          say a person works here. Nothing is deleted from disk — each of these
          is one line away from coming back. */}
      <group>
        <Shell />
        <GroundShadow />
        <Desk />
        <Chair viewState={viewState} />
        <Keyboard />
        <Mouse />
        <DeskClutter onHoverProp={onHoverProp} />
        <Plant />
      </group>
    </PaletteContext.Provider>
  )
}

/* ========================================================================== */
/*  Shell — one seamless studio sweep                                        */
/* ========================================================================== */

/* This was a floor plane, a back wall, two side walls, a ceiling and a
   skirting board — six surfaces, five visible corners, and an RGB underglow
   strip taped behind the desk. All of it is gone.

   What replaces it is a single cyclorama: the floor curves up into the
   backdrop through a large radius so there is no corner to find, and nothing
   else exists. No ceiling, no side walls, no horizon. The desk sits on an
   infinite surface, which is the entire reason product photography is shot
   this way — with nothing else in frame to judge scale against, the object
   has to carry the image on its own.

   Everything the room used to say through set dressing (a window, a door, a
   poster wall) it now has to say through the objects on the desk. That is the
   point, not a side effect. */
function Shell() {
  const P = usePalette()

  const cove = useMemo(
    () =>
      coveGeometry({
        // Generous on every axis: the orbit clamp lets the camera swing to
        // +-75 degrees, and an edge coming into frame at the extreme would
        // undo the whole illusion. Fog dissolves the far reaches anyway.
        width: 34,
        floorDepth: 20,
        wallHeight: 9,
        backZ: -1.8,
        // A big radius reads as a real cyc wall. Small radii look like a
        // rounded-over box corner, which is the thing being avoided.
        radius: 2.6,
        arcSegments: 32,
        colorFloor: P.sweepFloor,
        colorTop: P.sweepTop,
      }),
    [P.sweepFloor, P.sweepTop],
  )

  useEffect(() => () => cove.dispose(), [cove])

  return (
    <mesh geometry={cove} receiveShadow>
      {/* Matte paper, not a lacquered floor. Any gloss here would produce a
          reflection of the desk that instantly re-establishes a ground plane
          and kills the floating quality. vertexColors carries the gentle
          floor-to-top falloff baked into the geometry. */}
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
    </mesh>
  )
}

/* The soft pool the furniture sits in. Two quads rather than one: the desk
   and the chair are far enough apart that a single blob stretched across both
   reads as a grey smear, while two overlapping pools read as two objects. */
function GroundShadow() {
  const tex = useMemo(() => groundShadowTexture({ strength: 0.72, falloff: 1.7 }), [])
  useEffect(() => () => tex.dispose(), [tex])

  return (
    <group>
      {/* Desk. Wider than deep, offset back to sit under the worktop. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -0.3]} renderOrder={1}>
        <planeGeometry args={[4.6, 2.4]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.95} />
      </mesh>
      {/* Chair, smaller and tighter — it stands on castors, so its contact
          patch is genuinely smaller than the desk's. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.005, 1.75]} renderOrder={1}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.75} />
      </mesh>
    </group>
  )
}

/* ========================================================================== */
/*  Desk — Smooth Rounded Edges & Realistic Walnut Top                        */
/* ========================================================================== */

/* 3.0m was a conference table. A real one-person desk is about 1.4-1.6m, and
   the extra metre and a half was doing active harm: it pushed the silhouette
   wider than the frame, so the camera had to sit far enough back that the desk
   was cropped at both edges instead of floating in the middle of an empty
   sweep. Narrowing it is what lets the composition breathe. */
const DESK_W = 2.3
const DESK_D = 1.05
const DESK_Z = -0.35

function Desk() {
  const P = usePalette()
  const wood = useMemo(() => woodTexture(P.deskWood, P.deskWoodDark), [P.deskWood, P.deskWoodDark])
  const deskWear = useMemo(() => deskWearTexture(), [])
  useEffect(() => {
    return () => {
      wood.dispose()
      deskWear.dispose()
    }
  }, [wood, deskWear])

  const legX = DESK_W / 2 - 0.12
  const legZ = DESK_D / 2 - 0.1

  return (
    <group position={[0, 0, DESK_Z]}>
      {/* Top slab.

          `color` is WHITE here, and that is the fix for a desk that stayed
          black however much the palette was lightened. `map` and `color`
          MULTIPLY: the wood texture is already drawn in the palette's own
          colours, so tinting it a second time with deskTop squared the value —
          a mid grey map times a mid grey tint lands at roughly a fifth of
          either. The map carries the albedo; the tint gets out of its way. */}
      <RoundedBox args={[DESK_W, 0.06, DESK_D]} radius={0.009} smoothness={5} position={[0, DESK_TOP - 0.03, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial map={wood} roughnessMap={deskWear} color="#ffffff" {...surfaceWithMaps('lacqueredWood')} />
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
        <meshPhysicalMaterial map={wood} color="#ffffff" {...surfaceWithMaps('paintedWood')} />
      </RoundedBox>

      {/* Drawer unit. The carcass was hardcoded #6e523b — a saturated walnut
          brown that ignored the palette entirely, so it stayed a dark wooden
          box under a grey desk in every appearance. It follows the desk now. */}
      <group position={[DESK_W / 2 - 0.33, 0, 0]}>
        <RoundedBox args={[0.5, 0.62, DESK_D - 0.12]} radius={0.015} smoothness={4} position={[0, 0.31, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color="#ffffff" roughness={0.45} />
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

/* ========================================================================== */
/* Executive Leather Office Chair — Replica of Brown Executive Swivel Chair   */
/* ========================================================================== */

function ArmrestLoop({ side = 1 }) {
  const curve = useMemo(() => {
    return new CatmullRomCurve3([
      new Vector3(side * 0.22, 0.45, 0.05),
      new Vector3(side * 0.26, 0.44, -0.16),
      new Vector3(side * 0.27, 0.58, -0.19),
      new Vector3(side * 0.27, 0.65, -0.05),
      new Vector3(side * 0.27, 0.64, 0.12),
      new Vector3(side * 0.22, 0.58, 0.18),
    ])
  }, [side])

  return (
    <group>
      {/* Silver / Chrome Loop Arm Frame */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 32, 0.016, 12, false]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Top Padded Brown Leather Arm Rest */}
      <group position={[side * 0.27, 0.66, -0.02]} rotation={[0.08, 0, 0]}>
        <RoundedBox args={[0.08, 0.038, 0.28]} radius={0.015} smoothness={5} castShadow receiveShadow>
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </RoundedBox>
      </group>
    </group>
  )
}

function Chair() {
  return (
    <group position={[1.15, 0, 1.25]} rotation={[0, -0.65, 0]}>
      {/* ------------------------------------------------------ Seat Cushion */}
      <group position={[0, 0.48, 0]}>
        {/* Main Plush Seat Base */}
        <RoundedBox args={[0.5, 0.09, 0.48]} radius={0.022} smoothness={5} position={[0, 0, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </RoundedBox>
        {/* Top Plush Cushion Layer */}
        <RoundedBox args={[0.46, 0.05, 0.44]} radius={0.018} smoothness={5} position={[0, 0.045, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </RoundedBox>
        {/* Front Knee Roll / Waterfall Curve */}
        <mesh position={[0, 0.01, -0.24]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.46, 24]} />
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </mesh>
        {/* Side Stitched Seams */}
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.065, 0]}>
            <boxGeometry args={[0.005, 0.005, 0.4]} />
            <meshPhysicalMaterial color="#321914" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* ------------------------------------------------------ Executive Backrest */}
      <group position={[0, 0.96, 0.2]} rotation={[0.08, 0, 0]}>
        {/* Main Outer Shell */}
        <RoundedBox args={[0.46, 0.76, 0.07]} radius={0.026} smoothness={5} position={[0, 0, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </RoundedBox>

        {/* Integrated Top Headrest Cushion */}
        <RoundedBox args={[0.38, 0.2, 0.04]} radius={0.018} smoothness={5} position={[0, 0.26, -0.028]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </RoundedBox>

        {/* Upper Backrest Panel with Inset Diagonal Stitching */}
        <group position={[0, 0.04, -0.03]}>
          <RoundedBox args={[0.35, 0.26, 0.03]} radius={0.014} smoothness={4} castShadow receiveShadow>
            <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
          </RoundedBox>
          {/* Diagonal Stitch Line Details */}
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * 0.11, 0, -0.018]} rotation={[0, 0, sx * -0.28]}>
              <boxGeometry args={[0.004, 0.24, 0.005]} />
              <meshPhysicalMaterial color="#321914" roughness={0.45} />
            </mesh>
          ))}
        </group>

        {/* Lower Lumbar Cushion Support */}
        <RoundedBox args={[0.38, 0.2, 0.04]} radius={0.018} smoothness={5} position={[0, -0.2, -0.028]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#42241d" roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.25} />
        </RoundedBox>

        {/* Horizontal Stitching Seams */}
        {[-0.1, 0.16].map((y) => (
          <mesh key={y} position={[0, y, -0.038]}>
            <boxGeometry args={[0.36, 0.004, 0.005]} />
            <meshPhysicalMaterial color="#321914" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* ------------------------------------------------------ Loop Armrests */}
      <ArmrestLoop side={-1} />
      <ArmrestLoop side={1} />

      {/* ------------------------------------------------------ Under-Seat Mechanism */}
      <group position={[0, 0.4, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.22, 0.05, 0.22]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.7} />
        </mesh>
        {/* Tilt tension control knob */}
        <mesh position={[0, -0.05, 0.06]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.06, 20]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.7} />
        </mesh>
        {/* Height adjustment lever */}
        <group position={[-0.14, -0.02, 0.02]} rotation={[0, 0, -0.25]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.18, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[-0.09, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.012, 0.04]} />
            <meshStandardMaterial color="#1a1a1c" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* ------------------------------------------------------ Hydraulics & Base */}
      {/* Central Black Hydraulic Cover */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.042, 0.2, 24]} />
        <meshStandardMaterial color="#1a1a1c" roughness={0.7} />
      </mesh>
      {/* Shiny Chrome Shaft */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.12, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* ------------------------------------------------------ 5-Star Polished Chrome Base */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            {/* Arched Chrome Leg extending horizontally along ground */}
            <mesh position={[0, 0.065, 0.14]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.015, 0.02, 0.28, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
            </mesh>

            {/* Black Caster Wheel Assembly resting on floor */}
            <group position={[0, 0.025, 0.27]}>
              <mesh position={[0, 0.015, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.02, 12]} />
                <meshStandardMaterial color="#1a1a1c" roughness={0.7} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.026, 0.026, 0.022, 20]} />
                <meshStandardMaterial color="#1a1a1c" roughness={0.7} />
              </mesh>
            </group>
          </group>
        )
      })}

      {/* Center Chrome Hub Cap */}
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.03, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
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

  const wasdKeys = useMemo(
    () => [
      { key: 'W', x: -0.4 + 2 * 0.0565, z: -0.055 + 2 * 0.0275 },
      { key: 'A', x: -0.4 + 1 * 0.0565, z: -0.055 + 3 * 0.0275 },
      { key: 'S', x: -0.4 + 2 * 0.0565, z: -0.055 + 3 * 0.0275 },
      { key: 'D', x: -0.4 + 3 * 0.0565, z: -0.055 + 3 * 0.0275 },
    ],
    [],
  )

  const isWasdKey = (x, z) =>
    wasdKeys.some((w) => Math.abs(w.x - x) < 0.005 && Math.abs(w.z - z) < 0.005)

  const standardKeys = useMemo(
    () => keys.filter((k) => !k.wide && !isWasdKey(k.x, k.z)),
    [keys],
  )
  const wideKeys = useMemo(() => keys.filter((k) => k.wide), [keys])

  /* Two keycap shapes for the whole board. The standard cap is shared by the
     instanced field AND the four WASD meshes, so ~70 caps cost one geometry. */
  const cap = useMemo(() => keycapGeometry(), [])
  const wideCap = useMemo(() => keycapGeometry({ width: 0.28, taper: 0.94, radius: 0.004 }), [])
  useEffect(
    () => () => {
      cap.dispose()
      wideCap.dispose()
    },
    [cap, wideCap],
  )

  return (
    <group position={[-0.04, DESK_TOP + 0.005, 0.03]} rotation={[0, 0.02, 0]}>
      {/* Keyboard Body — Smooth Rounded Chassis */}
      <RoundedBox args={[0.92, 0.022, 0.19]} radius={0.008} smoothness={4} position={[0, 0.011, 0]} rotation={[-0.045, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.75} />
      </RoundedBox>

      <group rotation={[-0.045, 0, 0]}>
        {/* ~70 keycaps as one instanced draw call */}
        <Instances
          limit={90}
          range={standardKeys.length}
          geometry={cap}
          castShadow={false}
          receiveShadow
        >
          {/* ABS keycaps are not shiny. The old 0.2 metalness made them look
              like painted metal; real caps are a soft dielectric that picks
              up a faint clearcoat from finger oil. */}
          <meshPhysicalMaterial
            color="#27272a"
            roughness={0.44}
            clearcoat={0.3}
            clearcoatRoughness={0.55}
          />
          {standardKeys.map((k, i) => (
            <Instance key={i} position={[k.x, 0.022, k.z]} color={k.accent ? '#7c7a76' : '#27272a'} />
          ))}
        </Instances>

        {/* Worn WASD keys — separate meshes so they can sit a hair lower and
            take a polished, darker finish. Shine from use is the detail that
            says a person actually sat here. */}
        {wasdKeys.map((w) => (
          <mesh key={w.key} position={[w.x, 0.0214, w.z]} geometry={cap}>
            <meshPhysicalMaterial
              color="#1d1d20"
              roughness={0.2}
              clearcoat={0.72}
              clearcoatRoughness={0.16}
            />
          </mesh>
        ))}

        {/* Space bar and the other wide caps get their own geometry — there
            are only a handful and they are a different size. */}
        {wideKeys.map((k, i) => (
          <mesh key={i} position={[k.x, 0.022, k.z]} geometry={wideCap}>
            <meshPhysicalMaterial
              color="#27272a"
              roughness={0.44}
              clearcoat={0.3}
              clearcoatRoughness={0.55}
            />
          </mesh>
        ))}

        {[-0.02, 0.02].map((x, i) => (
          <mesh key={x} position={[0.36 + x, 0.026, -0.078]}>
            <sphereGeometry args={[0.006, 16, 16]} />
            <meshStandardMaterial
              color={i === 0 ? '#f0a860' : '#27272a'}
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
          <meshBasicMaterial color="#c8c4bc" transparent opacity={0.3} toneMapped={false} />
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
          <meshBasicMaterial color="#c8c4bc" toneMapped={false} />
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

        {/* Ergonomic left & right click blades. A mouse button is a moulded
            shell that follows the curve of the chassis under your fingertip —
            as a flat box it read as a chiclet glued to the top. Flattened
            spheres pick up the same specular sweep as the shell they sit on. */}
        {[-0.011, 0.011].map((x) => (
          <mesh
            key={x}
            position={[x, 0.024, -0.024]}
            rotation={[0.12, 0, x > 0 ? -0.05 : 0.05]}
            scale={[0.0095, 0.005, 0.019]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 16]} />
            <meshPhysicalMaterial
              color="#18181c"
              roughness={0.28}
              metalness={0.6}
              clearcoat={0.55}
              clearcoatRoughness={0.25}
            />
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
            <meshBasicMaterial color="#c8c4bc" toneMapped={false} />
          </mesh>
        </group>

        {/* Dual side thumb buttons — capsules, because a side button is a
            small pill that stands proud of the shell, not a chip of box. */}
        {[-0.008, 0.006].map((z) => (
          <mesh key={z} position={[-0.026, 0.022, z]} rotation={[Math.PI / 2, 0, -0.2]}>
            <capsuleGeometry args={[0.0022, 0.006, 6, 12]} />
            <meshPhysicalMaterial
              color="#09090b"
              roughness={0.32}
              metalness={0.6}
              clearcoat={0.4}
            />
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

  /* The cones move with the music. Two monitors on a desk that stay perfectly
     still while a record is spinning three feet away is the detail that makes
     a room read as a diorama; a woofer that breathes with the bass is what
     connects the deck to the rest of the scene.

     Driven straight off the engine's analyser in useFrame — the levels are
     already being computed for the desktop visualiser, so this is a read of
     numbers that exist either way, and it writes to a ref rather than state so
     it never triggers a React render. */
  const coneRefs = useRef([])
  const level = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    // Bottom two bands are the bass; that is what a woofer actually follows.
    const bands = audio.playing ? audio.getLevels(8) : null
    const bass = bands ? (bands[0] + bands[1]) / 2 : 0
    // Asymmetric smoothing: a cone snaps out on the transient and settles back.
    const k = bass > level.current ? 0.55 : 0.12
    level.current += (bass - level.current) * (1 - Math.pow(1 - k, dt * 60))

    /* Excursion runs along the cone's own axis, which is the lathe's revolve
       axis (local Y) — not world Z. The parent group is rotated -90° about X,
       which maps local +Y to world -Z, i.e. into the cabinet, so pushing the
       cone OUT toward the listener is local -Y. Setting .z here moved it
       sideways across the baffle instead. */
    for (const cone of coneRefs.current) {
      if (cone) cone.position.y = -level.current * 0.006
    }
  })

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
            <mesh ref={(el) => (coneRefs.current[x < 0 ? 0 : 1] = el)}>
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

  /* Aim-the-lamp. headRot is the shade's yaw/pitch; dragStartRef holds the
     pointer origin and the rotation at grab time so the drag is relative
     rather than absolute — otherwise the head snaps to the cursor on grab.
     Both were referenced by the pointer handlers below without ever being
     declared, which threw on first render and took the canvas down. */
  const [headRot, setHeadRot] = useState({ yaw: 0, pitch: 0 })
  const dragStartRef = useRef(null)

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

  const handlePointerDown = (e) => {
    e.stopPropagation()
    dragStartRef.current = { x: e.clientX, y: e.clientY, yaw: headRot.yaw, pitch: headRot.pitch }
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragStartRef.current) return
    e.stopPropagation()
    const dx = (e.clientX - dragStartRef.current.x) * 0.008
    const dy = (e.clientY - dragStartRef.current.y) * 0.008

    setHeadRot({
      yaw: Math.max(-1.1, Math.min(1.1, dragStartRef.current.yaw + dx)),
      pitch: Math.max(-0.9, Math.min(0.9, dragStartRef.current.pitch + dy)),
    })
  }

  const handlePointerUp = (e) => {
    if (!dragStartRef.current) return
    e.stopPropagation()
    dragStartRef.current = null
    if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId)
    audio.switchToggle()
  }

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

      {/* Aimable Shade — draggable head group */}
      <group
        position={[0.3, 0.485, 0.14]}
        rotation={[0.66 + headRot.pitch, headRot.yaw, -0.52]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
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

        {lampOn && (
          <spotLight
            ref={bulbRef}
            position={[0, 0, 0]}
            target-position={[0, -1.2, 0]}
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
        )}
      </group>
    </group>
  )
}

function DeskClutter({ onHoverProp }) {
  const mug = useMemo(() => mugProfile(), [])
  const ceramic = surfaceWithMaps('ceramic')
  /* Paper, written out rather than pulled from SURFACES — there is no 'paper'
     preset, and surface() silently falls back to PLASTIC for an unknown key,
     which would have given every sheet on this desk a soft sheen. Paper is the
     most diffuse thing in the room: no clearcoat, no metalness, and roughness
     just short of 1 so it still takes a little shape from the key light. */
  const paper = { roughness: 0.94, metalness: 0, clearcoat: 0 }

  return (
    <group>
      {/* ==================================================================
          A desk somebody works at.

          This held three things: a mug, a notebook, and a rocker switch for
          an era toggle that no longer exists. Two problems with that.

          The obvious one is that the notebook sat at x = -1.16 on a desk whose
          half-width is now 1.15 — it was hanging in mid air off the left edge,
          a real bug introduced when the desk was narrowed and the props were
          not moved with it.

          The subtler one is the reason the room never felt finished: an empty
          desk with one mug on it does not read as minimal, it reads as
          UNFURNISHED. The reference site's desk carries a paper tray, a stack
          of output, a loose sheet with writing on it, two ring binders and a
          mug — and that density is doing the emotional work. Objects with no
          function say a person was here and left for a minute. The negative
          space around the DESK is the composition; negative space on top of
          the desk is just an absence.

          Everything below is placed in desk-local coordinates against the
          2.3m top, with the keyboard zone (roughly x -0.45..0.45, z 0.1..0.35)
          left clear.
          ================================================================== */}

      {/* ---- Letter tray, stacked two high, with output sitting in it ---- */}
      <group position={[-0.85, DESK_TOP, -0.12]} rotation={[0, 0.08, 0]}>
        {[0, 0.055].map((y, i) => (
          <group key={i} position={[0, y, 0]}>
            {/* The tray is a floor and two side rails — an open box would read
                as a container, and the whole point of a letter tray is that
                you can see the paper in it from the side. */}
            <RoundedBox args={[0.3, 0.008, 0.23]} radius={0.002} smoothness={3} castShadow receiveShadow>
              <meshPhysicalMaterial color="#b9ae9a" roughness={0.78} />
            </RoundedBox>
            {[-0.146, 0.146].map((x) => (
              <RoundedBox
                key={x}
                position={[x, 0.018, 0]}
                args={[0.012, 0.036, 0.23]}
                radius={0.002}
                smoothness={3}
                castShadow
              >
                <meshPhysicalMaterial color="#a99d88" roughness={0.8} />
              </RoundedBox>
            ))}
            {/* Paper in the tray. Slightly rotated, because paper never lands
                square, and that tiny angle is most of what stops a stack of
                boxes from looking like a stack of boxes. */}
            <RoundedBox
              position={[0.004, 0.019, -0.004]}
              rotation={[0, 0.035, 0]}
              args={[0.255, 0.022, 0.196]}
              radius={0.001}
              smoothness={2}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial color="#f4f2ec" {...paper} />
            </RoundedBox>
          </group>
        ))}
      </group>

      {/* ---- A loose stack of printout, straight on the desk ---- */}
      <group position={[-0.48, DESK_TOP, -0.16]} rotation={[0, -0.06, 0]}>
        <RoundedBox args={[0.23, 0.036, 0.18]} radius={0.001} smoothness={2} castShadow receiveShadow>
          <meshPhysicalMaterial color="#f6f4ee" {...paper} />
        </RoundedBox>
        {/* The top sheet, offset — a stack with a perfectly flush top edge is
            a solid, not a stack. */}
        <RoundedBox
          position={[0.012, 0.019, 0.008]}
          rotation={[0, 0.05, 0]}
          args={[0.225, 0.002, 0.176]}
          radius={0.0008}
          smoothness={2}
        >
          <meshPhysicalMaterial color="#fbfaf6" {...paper} />
        </RoundedBox>
      </group>

      {/* ---- One sheet lying flat, with writing on it ---- */}
      <group position={[-0.5, DESK_TOP + 0.0015, 0.19]} rotation={[-Math.PI / 2, 0, 0.22]}>
        <mesh receiveShadow>
          <planeGeometry args={[0.2, 0.15]} />
          <meshPhysicalMaterial color="#faf8f3" {...paper} />
        </mesh>
        {/* Ruled lines of "handwriting". Short, uneven, and stopping well
            before the right edge, which is what writing looks like from two
            metres away — evenly full lines read as a printed form. */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[-0.012 - (i % 2) * 0.008, 0.05 - i * 0.017, 0.001]}>
            <planeGeometry args={[0.13 - (i % 3) * 0.028, 0.0035]} />
            <meshBasicMaterial color="#8d8a83" />
          </mesh>
        ))}
      </group>

      {/* ---- Two ring binders, standing, leaning into each other ---- */}
      <group position={[0.95, DESK_TOP, -0.2]}>
        {[
          { x: 0, tilt: 0.03, c: '#5c4034' },
          { x: 0.075, tilt: -0.05, c: '#4a332a' },
        ].map((b) => (
          <group key={b.x} position={[b.x, 0.14, 0]} rotation={[0, 0, b.tilt]}>
            <RoundedBox args={[0.058, 0.28, 0.23]} radius={0.006} smoothness={3} castShadow receiveShadow>
              <meshPhysicalMaterial color={b.c} roughness={0.62} />
            </RoundedBox>
            {/* The spine label — a pale rectangle is all that resolves, and
                it is the detail that makes it a binder and not a brick. */}
            <mesh position={[0, 0.055, 0.116]}>
              <planeGeometry args={[0.04, 0.09]} />
              <meshBasicMaterial color="#ddd6c8" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- Mug, within reach of the keyboard ---- */}
      <group position={[0.7, DESK_TOP, 0.04]}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[mug, 40]} />
          <meshPhysicalMaterial color="#eceae4" side={DoubleSide} {...ceramic} />
        </mesh>
        {/* Coffee, sitting a little below the rim. */}
        <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.039, 28]} />
          <meshPhysicalMaterial color="#2a1a10" roughness={0.16} clearcoat={0.9} />
        </mesh>
        <mesh position={[0.052, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.026, 0.0075, 12, 28, Math.PI * 1.25]} />
          <meshPhysicalMaterial color="#eceae4" {...ceramic} />
        </mesh>
      </group>

      {/* ---- Notebook and pen, now actually ON the desk ---- */}
      <group
        position={[-0.93, DESK_TOP, 0.26]}
        rotation={[0, -0.28, 0]}
        onPointerOver={() => onHoverProp?.({ label: 'Notebook', hint: 'Where the working out happens' })}
        onPointerOut={() => onHoverProp?.(null)}
      >
        <RoundedBox args={[0.19, 0.018, 0.25]} radius={0.005} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#6f3336" {...surfaceWithMaps('softTouch')} />
        </RoundedBox>
        <RoundedBox position={[-0.004, 0.0005, 0]} args={[0.176, 0.014, 0.238]} radius={0.0028} smoothness={4}>
          <meshPhysicalMaterial color="#efeade" roughness={0.95} />
        </RoundedBox>
        <RoundedBox position={[0.055, 0.0005, 0]} args={[0.006, 0.021, 0.252]} radius={0.0012} smoothness={4}>
          <meshPhysicalMaterial color="#2a2c31" {...surface('rubber')} />
        </RoundedBox>
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

function DiskRack({ enabled, onOpenApp, onHoverProp }) {
  const [activeDisk, setActiveDisk] = useState(null)

  const handleDiskClick = (disk) => {
    if (!enabled) return
    setActiveDisk(disk.id)
    audio.thock()
    audio.blip()
    setTimeout(() => {
      onOpenApp?.(disk.appId)
      setActiveDisk(null)
    }, 850)
  }

  return (
    <group position={[-1.28, DESK_TOP, 0.28]} rotation={[0, 0.25, 0]}>
      {/* Rack Spindle */}
      <RoundedBox args={[0.16, 0.015, 0.12]} radius={0.003} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2b2d35" roughness={0.6} />
      </RoundedBox>
      <RoundedBox position={[-0.06, 0.04, 0]} args={[0.012, 0.08, 0.1]} radius={0.0024} smoothness={4}>
        <meshStandardMaterial color="#3f424e" />
      </RoundedBox>
      <RoundedBox position={[0.06, 0.04, 0]} args={[0.012, 0.08, 0.1]} radius={0.0024} smoothness={4}>
        <meshStandardMaterial color="#3f424e" />
      </RoundedBox>

      {/* Racked 3.5" Floppy Disks */}
      {disks.map((d, i) => {
        const isInserting = activeDisk === d.id
        const yOffset = isInserting ? 0.25 : i * 0.009 + 0.012
        const xOffset = isInserting ? 1.5 : (i - 3) * 0.015

        return (
          <group
            key={d.id}
            position={[xOffset, yOffset, 0]}
            rotation={isInserting ? [0, -0.4, 0] : [0, 0, 0]}
            onClick={(e) => {
              e.stopPropagation()
              handleDiskClick(d)
            }}
            onPointerOver={() => onHoverProp?.({ label: d.label, hint: 'Click to insert floppy disk and open app' })}
            onPointerOut={() => onHoverProp?.(null)}
          >
            <RoundedBox args={[0.09, 0.006, 0.092]} radius={0.002} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color={d.color} roughness={0.4} />
            </RoundedBox>
            <mesh position={[0, 0.0035, -0.022]}>
              <planeGeometry args={[0.032, 0.026]} />
              <meshStandardMaterial color="#c0c2c8" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.0035, 0.018]}>
              <planeGeometry args={[0.07, 0.035]} />
              <meshBasicMaterial color="#f8f6f0" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function PCTower({ pcPower = true, onTogglePcPower, onHoverProp }) {
  const P = usePalette()
  const powerRef = useRef()
  const hddRef = useRef()
  const glassPanelRef = useRef()
  const [panelOpen, setPanelOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!hovered) return undefined
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (powerRef.current) {
      powerRef.current.material.emissiveIntensity = pcPower ? 2.2 + Math.sin(t * 1.6) * 0.5 : 0
    }
    if (hddRef.current) {
      const burst = Math.sin(t * 13.7) * Math.sin(t * 3.1) * Math.sin(t * 0.7 + 1.2)
      hddRef.current.material.emissiveIntensity = pcPower && burst > 0.12 ? 3.4 : 0.05
    }
    if (glassPanelRef.current) {
      const targetRot = panelOpen ? -1.3 : 0
      glassPanelRef.current.rotation.y = MathUtils.lerp(glassPanelRef.current.rotation.y, targetRot, delta * 5)
    }
  })

  const shell = surfaceWithMaps('plastic')
  const glass = surface('glass')
  const metal = surface('anodisedAluminium')

  const getHw = (part) => hardware.find((h) => h.part === part) ?? { label: part, detail: '' }

  return (
    <group
      position={[1.6, 0, -0.62]}
      rotation={[0, -0.16, 0]}
    >
      {/* Case Chassis */}
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

      {/* Internal Hardware Components (Skills Viewer) */}
      <group position={[0.01, 0.26, 0.02]}>
        {/* Motherboard Green PCB */}
        <RoundedBox position={[0.08, 0, 0]} args={[0.01, 0.42, 0.46]} radius={0.002} smoothness={4}>
        <meshStandardMaterial color="#2f3134" roughness={0.4} />
      </RoundedBox>

        {/* 1. GPU (PyTorch · CUDA) */}
        <group
          position={[0.02, -0.04, 0.04]}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHoverProp?.({ label: `GPU: ${getHw('GPU').label}`, hint: getHw('GPU').detail })
          }}
          onPointerOut={() => onHoverProp?.(null)}
        >
          <RoundedBox args={[0.11, 0.045, 0.28]} radius={0.004} smoothness={4}>
            <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.8} />
          </RoundedBox>
          <mesh position={[-0.056, 0, 0]}>
            <planeGeometry args={[0.03, 0.22]} />
            <meshBasicMaterial color="#f0a860" toneMapped={false} />
          </mesh>
        </group>

        {/* 2. RAM Sticks (pandas · NumPy) */}
        <group
          position={[0.06, 0.12, -0.08]}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHoverProp?.({ label: `RAM: ${getHw('RAM').label}`, hint: getHw('RAM').detail })
          }}
          onPointerOut={() => onHoverProp?.(null)}
        >
          {[-0.015, 0.015].map((z) => (
            <RoundedBox key={z} position={[0, 0, z]} args={[0.008, 0.09, 0.014]} radius={0.0016} smoothness={4}>
        <meshStandardMaterial color="#7c7a76" roughness={0.2} metalness={0.9} />
      </RoundedBox>
          ))}
        </group>

        {/* 3. CPU Cooler (scikit-learn · XGBoost) */}
        <group
          position={[0.04, 0.08, 0.02]}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHoverProp?.({ label: `CPU: ${getHw('CPU').label}`, hint: getHw('CPU').detail })
          }}
          onPointerOut={() => onHoverProp?.(null)}
        >
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.05, 24]} />
            <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>

        {/* 4. SSD M.2 (23 Public Repos) */}
        <group
          position={[0.06, -0.12, 0.08]}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHoverProp?.({ label: `SSD: ${getHw('SSD').label}`, hint: getHw('SSD').detail })
          }}
          onPointerOut={() => onHoverProp?.(null)}
        >
          <RoundedBox args={[0.006, 0.02, 0.07]} radius={0.0012} smoothness={4}>
        <meshStandardMaterial color="#3a3c40" roughness={0.4} />
      </RoundedBox>
        </group>

        {/* 5. PSU Box (Python · SQL) */}
        <group
          position={[0, -0.18, -0.12]}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHoverProp?.({ label: `PSU: ${getHw('PSU').label}`, hint: getHw('PSU').detail })
          }}
          onPointerOut={() => onHoverProp?.(null)}
        >
          <RoundedBox args={[0.18, 0.09, 0.16]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#111215" roughness={0.6} />
          </RoundedBox>
        </group>
      </group>

      {/* 8.2 Hinged Tempered Glass Side Panel */}
      <group
        ref={glassPanelRef}
        position={[-0.122, 0.26, 0.24]}
        onClick={(e) => {
          e.stopPropagation()
          setPanelOpen((o) => !o)
          audio.click()
        }}
        onPointerOver={() => onHoverProp?.({ label: 'PC Glass Side Panel', hint: panelOpen ? 'Click to close panel' : 'Click to swing open & view internal hardware skills' })}
        onPointerOut={() => onHoverProp?.(null)}
      >
        <mesh position={[0, 0, -0.22]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.44, 0.4]} />
          <meshPhysicalMaterial
            color="#10131a"
            transparent
            opacity={0.45}
            side={DoubleSide}
            {...glass}
          />
        </mesh>
        <RoundedBox
          args={[0.006, 0.44, 0.48]}
          radius={0.002}
          smoothness={4}
          position={[0, 0, -0.22]}
        >
          <meshPhysicalMaterial color="#2b2e35" {...metal} />
        </RoundedBox>
      </group>

      {/* Front mesh intake, drawn as a fine grille rather than a flat face. */}
      <RoundedBox args={[0.2, 0.36, 0.008]} radius={0.004} smoothness={4} position={[0, 0.3, 0.272]}>
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
    <group ref={plantRef} position={[1.85, 0, -0.1]} scale={0.94}>
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
              <meshPhysicalMaterial color="#7d9a72" roughness={0.72} />
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
                  color={l.shade === 0 ? '#9ab88c' : l.shade === 1 ? '#87a97b' : '#76986a'}
                  side={DoubleSide}
                  /* Leaves are TRANSLUCENT, and without saying so the ones
                     facing away from the key crush to near-black — which is
                     why half this plant looked dead next to the other half.
                     A real leaf is a thin membrane: light coming from behind
                     passes through it, so its shadow side never goes darker
                     than a dim version of its own colour. Proper transmission
                     is far too expensive for a scene with this many leaves;
                     a low emissive in the leaf's own hue is the standard cheap
                     stand-in and is indistinguishable at this distance. */
                  emissive={l.shade === 0 ? '#5c7a50' : l.shade === 1 ? '#4f6d45' : '#45613c'}
                  emissiveIntensity={0.45}
                  roughness={0.62}
                  sheen={0.5}
                  sheenColor="#9aa294"
                  clearcoat={0.22}
                  clearcoatRoughness={0.6}
                />
              </mesh>
              {/* Midrib — a real leaf has a spine and it catches the light. */}
              <mesh scale={[l.width * 0.1, l.len * 0.92, 0.016]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshPhysicalMaterial color="#a8c39b" roughness={0.6} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}




function PowerStripAndCables() {
  const cables = useMemo(() => {
    const stripPos = new Vector3(0.6, 0.03, -0.4)
    return [
      new CatmullRomCurve3([
        new Vector3(0, DESK_TOP, -0.05),
        new Vector3(0.15, DESK_TOP - 0.25, -0.25),
        stripPos,
      ]),
      new CatmullRomCurve3([
        new Vector3(1.0, DESK_TOP, -0.3),
        new Vector3(0.85, DESK_TOP - 0.3, -0.4),
        stripPos,
      ]),
      new CatmullRomCurve3([
        new Vector3(-0.8, DESK_TOP, -0.4),
        new Vector3(-0.1, 0.15, -0.5),
        stripPos,
      ]),
    ]
  }, [])

  return (
    <group>
      <group position={[0.6, 0.025, -0.4]}>
        <RoundedBox args={[0.32, 0.04, 0.09]} radius={0.008} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#22242a" roughness={0.4} />
        </RoundedBox>
        {[-0.1, -0.03, 0.04, 0.11].map((x) => (
          <mesh key={x} position={[x, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.012, 16]} />
            <meshBasicMaterial color="#111215" />
          </mesh>
        ))}
        <mesh position={[-0.13, 0.022, 0]}>
          <boxGeometry args={[0.015, 0.005, 0.018]} />
          <meshBasicMaterial color="#ff3300" toneMapped={false} />
        </mesh>
      </group>

      {cables.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 24, 0.004, 8, false]} />
          <meshStandardMaterial color="#18191d" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/* ========================================================================== */
/*  Optional modelled room                                                    */
/* ========================================================================== */

