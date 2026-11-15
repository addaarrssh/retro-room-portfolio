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
  leafGeometry,
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, DESK_Z]} renderOrder={1}>
        <planeGeometry args={[4.4, 2.6]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.95} />
      </mesh>
      {/* Chair, smaller and tighter — it stands on castors, so its contact
          patch is genuinely smaller than the desk's. */}
      {/* Positioned FROM the chair. It was hard-coded half a metre away from
          it, so the chair floated and a grey smudge sat alone on the floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CHAIR_POS[0], 0.005, CHAIR_POS[2]]} renderOrder={1}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.8} />
      </mesh>
      {/* Plant pot. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLANT_POS[0], 0.005, PLANT_POS[2]]} renderOrder={1}>
        <planeGeometry args={[1.25, 1.25]} />
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

/* Depth and position are set by what has to stand on the desk, front to back:
   the monitor's 0.44m body, the base unit that sticks out 12cm in front of it,
   a clear strip, the keyboard, and a margin before the edge. That adds up to
   about 1.2m with the front edge at z = +0.62.

   It was 1.05m deep and centred at z = -0.35, which put the front edge at
   +0.175 — only 5cm in front of the base unit. There was physically no room
   for a keyboard, so it sat INSIDE the base unit with its ends poking out of
   both sides, and the notebook and the loose sheet hung in mid-air past the
   edge. */
const DESK_D = 1.2
const DESK_Z = 0.02

/* The chair is pushed back and to the right of the desk, turned in toward it,
   as if someone just stood up. It used to stand directly in front of the right
   half of the desk with its back to the camera: a tall dark slab covering the
   drawer unit, the binders and most of the plant, and it cut into the right
   edge of the frame once you sat down. Out here it reads as a chair in three-
   quarter view and hides nothing. The plant moves to the left so the desk has
   something either side of it. */
const CHAIR_POS = [1.78, 0, 1.0]
const PLANT_POS = [-1.78, 0, -0.2]

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

  /* The desk is three parts, the way a good one is actually built: a thick
     slab, a drawer pedestal that carries its right end, and a steel sled leg
     that carries its left. It used to be a slab on four tube legs with a box
     pushed underneath — and the two right-hand legs ran straight THROUGH that
     box, which is the dark notch that showed at its bottom corner. */
  const PED_W = 0.52
  const PED_H = 0.6
  const PED_D = DESK_D - 0.14
  const pedX = DESK_W / 2 - PED_W / 2 - 0.05
  const sledX = -DESK_W / 2 + 0.14
  const sledZ = DESK_D / 2 - 0.12
  const underTop = DESK_TOP - 0.055
  const steel = { color: P.deskLeg, roughness: 0.42, metalness: 0.55 }

  return (
    <group position={[0, 0, DESK_Z]}>
      {/* Top slab. `color` stays WHITE: map and color multiply, and the wood
          texture is already drawn in the palette's own colours. */}
      <RoundedBox args={[DESK_W, 0.055, DESK_D]} radius={0.012} smoothness={5} position={[0, DESK_TOP - 0.0275, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial map={wood} roughnessMap={deskWear} color="#ffffff" {...surfaceWithMaps('lacqueredWood')} />
      </RoundedBox>

      {/* Steel apron, inset under the slab. The shadow gap it leaves is what
          makes the top read as a separate, floating board. */}
      <mesh position={[-0.2, underTop - 0.02, 0]}>
        <boxGeometry args={[DESK_W - 0.75, 0.04, DESK_D - 0.22]} />
        <meshStandardMaterial {...steel} />
      </mesh>

      {/* Sled leg, left: two uprights joined by a foot on the floor. */}
      <group position={[sledX, 0, 0]}>
        {[-sledZ, sledZ].map((z) => (
          <RoundedBox key={z} args={[0.05, underTop - 0.03, 0.05]} radius={0.008} smoothness={3} position={[0, (underTop - 0.03) / 2 + 0.03, z]} castShadow>
            <meshStandardMaterial {...steel} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.06, 0.03, sledZ * 2 + 0.12]} radius={0.008} smoothness={3} position={[0, 0.015, 0]} castShadow>
          <meshStandardMaterial {...steel} />
        </RoundedBox>
      </group>

      {/* Modesty panel at the back, in the same wood. */}
      <RoundedBox args={[DESK_W - PED_W - 0.5, 0.36, 0.018]} radius={0.004} smoothness={3} position={[-0.2, underTop - 0.22, -DESK_D / 2 + 0.14]}>
        <meshStandardMaterial map={wood} color="#e9e9e9" roughness={0.6} />
      </RoundedBox>

      {/* Drawer pedestal, right. */}
      <group position={[pedX, 0, 0]}>
        {/* Recessed plinth, so the carcass hovers a few centimetres. */}
        <mesh position={[0, 0.025, -0.01]}>
          <boxGeometry args={[PED_W - 0.05, 0.05, PED_D - 0.06]} />
          <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
        </mesh>
        <RoundedBox args={[PED_W, PED_H, PED_D]} radius={0.01} smoothness={4} position={[0, 0.05 + PED_H / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={wood} color="#f2f2f2" roughness={0.5} />
        </RoundedBox>
        {/* Three drawer fronts, standing 6mm proud with a dark reveal between
            them — the reveal is the detail that says "drawers", a handle on a
            flat face only says "box with handles". */}
        <mesh position={[0, 0.05 + PED_H / 2, PED_D / 2 + 0.0005]}>
          <planeGeometry args={[PED_W - 0.03, PED_H - 0.03]} />
          <meshStandardMaterial color="#1a1512" roughness={0.9} />
        </mesh>
        {[0.52, 0.335, 0.15].map((y, k) => (
          <group key={y} position={[0, y + 0.05, PED_D / 2 + 0.004]}>
            <RoundedBox args={[PED_W - 0.04, k === 2 ? 0.2 : 0.165, 0.008]} radius={0.003} smoothness={3} position={[0, k === 2 ? -0.018 : 0, 0]} receiveShadow>
              <meshStandardMaterial map={wood} color="#ffffff" roughness={0.42} />
            </RoundedBox>
            {/* Slim bar pull on two standoffs. */}
            <mesh position={[0, 0.045, 0.02]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.006, 0.16, 6, 16]} />
              <meshStandardMaterial color="#c9c4b8" roughness={0.25} metalness={0.9} />
            </mesh>
            {[-0.07, 0.07].map((hx) => (
              <mesh key={hx} position={[hx, 0.045, 0.011]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.004, 0.004, 0.018, 10]} />
                <meshStandardMaterial color="#c9c4b8" roughness={0.25} metalness={0.9} />
              </mesh>
            ))}
          </group>
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

function ArmrestLoop({ side = 1, leather }) {
  const curve = useMemo(() => {
    return new CatmullRomCurve3([
      new Vector3(side * 0.2, 0.44, 0.06),
      new Vector3(side * 0.275, 0.45, -0.1),
      new Vector3(side * 0.29, 0.57, -0.17),
      new Vector3(side * 0.29, 0.655, -0.06),
      new Vector3(side * 0.29, 0.65, 0.1),
      new Vector3(side * 0.25, 0.58, 0.2),
    ])
  }, [side])

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[curve, 40, 0.013, 12, false]} />
        <meshStandardMaterial color="#d9dce0" metalness={0.95} roughness={0.18} />
      </mesh>
      <group position={[side * 0.29, 0.668, -0.01]} rotation={[0.04, 0, 0]}>
        <RoundedBox args={[0.06, 0.028, 0.26]} radius={0.013} smoothness={5} castShadow>
          <meshPhysicalMaterial {...leather} />
        </RoundedBox>
      </group>
    </group>
  )
}

/* ==========================================================================
   Chair — a soft-pad executive chair.

   Rebuilt around three decisions:

   · THE CUSHIONS ARE CUSHIONS. The seat and back were stacks of rounded
     boxes, which read as planks. They are now inflated-box geometry (see
     cushionGeometry), so every face crowns and the corners melt the way foam
     under leather does.
   · THE BACK HAS A SHELL. A dark moulded shell behind a lighter pad, with a
     visible edge all round, is the silhouette of every good office chair. A
     single slab of one colour is the silhouette of a headstone.
   · IT IS TAN. The palette has specified tan leather all along; the meshes
     were hard-coded to a near-black brown, so the chair rendered as a dark
     mass and the one warm object in the room was missing.
   ========================================================================== */
function Chair() {
  const P = usePalette()
  const cushion = useMemo(() => cushionGeometry({ crown: 0.34, segments: 12 }), [])
  /* Channel pillows crown much harder than the base cushion: each one is a
     narrow band of foam held down along both seams. */
  const pillow = useMemo(() => cushionGeometry({ crown: 0.62, segments: 12 }), [])
  useEffect(
    () => () => {
      cushion.dispose()
      pillow.dispose()
    },
    [cushion, pillow],
  )

  const leather = {
    color: P.chairShell,
    roughness: 0.46,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    sheen: 0.4,
    sheenColor: '#ffe2c2',
  }
  const shell = { color: '#232326', roughness: 0.5, metalness: 0.2 }
  /* The back of the backrest is upholstered too, a shade darker. */
  const backLeather = { color: P.chairAccent, roughness: 0.55 }
  const chrome = { color: '#d9dce0', metalness: 0.95, roughness: 0.18 }

  return (
    /* Turned three-quarters TOWARD the camera, so what you see is the tan seat
       and pad. Facing the desk, the camera got the back of the shell: a tall
       dark rectangle, which is the least interesting side of any chair. */
    <group position={CHAIR_POS} rotation={[0, 2.25, 0]}>
      {/* ---------------------------------------------------------- Seat */}
      <RoundedBox args={[0.52, 0.035, 0.5]} radius={0.016} smoothness={4} position={[0, 0.455, 0]} castShadow>
        <meshStandardMaterial {...shell} />
      </RoundedBox>
      {/* Seat: a base cushion with three channel-stitched pillows on top.
          The channels are real geometry — separate inflated pads pressed
          against each other — because a stitched seam on leather is a valley
          between two crowns, and a painted line can never cast that shadow. */}
      <mesh geometry={cushion} position={[0, 0.5, -0.005]} scale={[0.25, 0.032, 0.245]} castShadow receiveShadow>
        <meshPhysicalMaterial {...leather} />
      </mesh>
      {[-0.155, 0, 0.155].map((z, i) => (
        <mesh
          key={z}
          geometry={pillow}
          position={[0, 0.54 + (i === 2 ? -0.004 : 0), z - 0.005]}
          scale={[0.228, 0.03, 0.079]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial {...leather} />
        </mesh>
      ))}

      {/* ---------------------------------------------------------- Back */}
      <group position={[0, 0.99, 0.25]} rotation={[0.13, 0, 0]}>
        {/* Moulded outer shell, slightly larger than the pad so a dark rim
            frames it all round. */}
        <mesh geometry={cushion} position={[0, 0, 0.028]} scale={[0.255, 0.43, 0.03]} castShadow>
          <meshPhysicalMaterial {...backLeather} clearcoat={0.15} clearcoatRoughness={0.6} />
        </mesh>
        {/* Five channel pillows, the top one a fatter head roll. Each band
            sits a hair further forward toward the middle, so the stack has
            the lumbar curve of a real backrest instead of being flat. */}
        {[-0.3, -0.15, 0, 0.15, 0.31].map((y, i) => (
          <mesh
            key={y}
            geometry={pillow}
            position={[0, y, -0.012 - (i === 1 || i === 2 ? 0.01 : 0)]}
            scale={[0.226, i === 4 ? 0.088 : 0.077, i === 4 ? 0.05 : 0.04]}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial {...leather} />
          </mesh>
        ))}
        {/* Spine bracket joining the back to the mechanism. */}
        <RoundedBox args={[0.07, 0.34, 0.025]} radius={0.008} smoothness={3} position={[0, -0.52, 0.03]} rotation={[-0.28, 0, 0]} castShadow>
          <meshStandardMaterial {...shell} />
        </RoundedBox>
      </group>

      <ArmrestLoop side={-1} leather={leather} />
      <ArmrestLoop side={1} leather={leather} />

      {/* ------------------------------------------- Mechanism and gas lift */}
      <RoundedBox args={[0.2, 0.05, 0.24]} radius={0.012} smoothness={3} position={[0, 0.41, 0.02]} castShadow>
        <meshStandardMaterial {...shell} />
      </RoundedBox>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.2, 24]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow>
        <cylinderGeometry args={[0.036, 0.042, 0.14, 24]} />
        <meshStandardMaterial {...shell} />
      </mesh>

      {/* ------------------------------------------------ Five-star base */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3
        return (
          <group key={i} rotation={[0, a, 0]}>
            {/* Each spoke falls from the hub to the castor. */}
            <mesh position={[0, 0.095, 0.16]} rotation={[Math.PI / 2 + 0.16, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.014, 0.31, 14]} />
              <meshStandardMaterial {...chrome} />
            </mesh>
            <group position={[0, 0.03, 0.31]}>
              <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.009, 0.009, 0.03, 10]} />
                <meshStandardMaterial {...shell} />
              </mesh>
              {[-0.014, 0.014].map((wx) => (
                <mesh key={wx} position={[wx, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
                  <meshStandardMaterial color="#19191b" roughness={0.75} />
                </mesh>
              ))}
            </group>
          </group>
        )
      })}
      <mesh position={[0, 0.125, 0]} castShadow>
        <cylinderGeometry args={[0.046, 0.058, 0.05, 24]} />
        <meshStandardMaterial {...chrome} />
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
    <group position={[-0.04, DESK_TOP + 0.005, 0.38]} rotation={[0, 0.02, 0]}>
      {/* Keyboard Body — Smooth Rounded Chassis */}
      <RoundedBox args={[0.92, 0.022, 0.19]} radius={0.008} smoothness={4} position={[0, 0.011, 0]} rotation={[-0.045, 0, 0]} castShadow receiveShadow>
        {/* Beige, like the machine it is plugged into. It was gunmetal with
            charcoal caps — a 2020s gaming board in front of a 1995 computer,
            and the only black object on the desk, so it read as a hole. */}
        <meshStandardMaterial color="#d3cec1" roughness={0.6} />
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
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
          {standardKeys.map((k, i) => (
            <Instance
              key={i}
              position={[k.x, 0.022, k.z]}
              /* Alphas are ivory; the modifier columns at either end are the
                 darker grey every board of the period used. */
              color={k.accent || k.x < -0.37 || k.x > 0.36 ? '#a9a497' : '#ece8dd'}
            />
          ))}
        </Instances>

        {/* Worn WASD keys — separate meshes so they can sit a hair lower and
            take a polished, darker finish. Shine from use is the detail that
            says a person actually sat here. */}
        {wasdKeys.map((w) => (
          <mesh key={w.key} position={[w.x, 0.0214, w.z]} geometry={cap}>
            <meshStandardMaterial color="#e2ddd0" roughness={0.28} />
          </mesh>
        ))}

        {/* Space bar and the other wide caps get their own geometry — there
            are only a handful and they are a different size. */}
        {wideKeys.map((k, i) => (
          <mesh key={i} position={[k.x, 0.022, k.z]} geometry={wideCap}>
            <meshStandardMaterial color="#ece8dd" roughness={0.55} />
          </mesh>
        ))}

        {[-0.02, 0.02].map((x, i) => (
          <mesh key={x} position={[0.36 + x, 0.026, -0.078]}>
            <sphereGeometry args={[0.004, 12, 12]} />
            <meshStandardMaterial
              color={i === 0 ? '#3ddc6a' : '#8f8a7d'}
              emissive={i === 0 ? '#22c55e' : '#000000'}
              emissiveIntensity={i === 0 ? 1.6 : 0}
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
  /* The cord. A period mouse is a corded mouse, and the cable wandering back
     toward the machine is what ties it to the computer — without it the mouse
     is a loose pebble on a mat. */
  const cord = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 0.014, -0.08),
        new Vector3(0.01, 0.006, -0.16),
        new Vector3(-0.07, 0.005, -0.27),
        new Vector3(-0.22, 0.005, -0.34),
        new Vector3(-0.36, 0.005, -0.44),
        new Vector3(-0.42, 0.005, -0.62),
      ]),
    [],
  )

  return (
    <group position={[0.78, DESK_TOP, 0.38]}>
      {/* Mousepad: cloth top on a thin rubber base, with a stitched edge. */}
      <group rotation={[0, 0.05, 0]}>
        <RoundedBox args={[0.42, 0.005, 0.34]} radius={0.002} smoothness={3} position={[0, 0.0025, 0]} receiveShadow>
          <meshStandardMaterial color="#2a2d33" roughness={0.95} />
        </RoundedBox>
        <mesh position={[0, 0.0052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.395, 0.315]} />
          <meshStandardMaterial color="#33373f" roughness={1} />
        </mesh>
      </group>

      {/* ------------------------------------------------------- The mouse
          A two-button beige mouse: a low dome, flatter at the front where the
          buttons are, with a seam between the buttons and one across the
          body. The old model was a gunmetal capsule with six torus "honeycomb"
          rings, a glowing sensor and a logo plate — forty draw calls of detail
          that from the camera read as a single black blob. Shape first. */}
      <group position={[-0.02, 0.005, 0.02]} rotation={[0, 0.18, 0]}>
        <mesh position={[0, 0.004, 0]} scale={[0.05, 0.034, 0.082]} castShadow>
          <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#d8d3c6" roughness={0.5} clearcoat={0.2} clearcoatRoughness={0.5} />
        </mesh>
        {/* Base skirt, so the dome does not end in a knife edge. */}
        <mesh position={[0, 0.003, 0]} scale={[1, 1, 1.64]}>
          <cylinderGeometry args={[0.05, 0.049, 0.006, 32]} />
          <meshStandardMaterial color="#c4bfb2" roughness={0.6} />
        </mesh>
        {/* Seam between the two buttons. */}
        <mesh position={[0, 0.03, -0.042]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.0018, 0.004, 0.058]} />
          <meshStandardMaterial color="#8d887b" roughness={0.8} />
        </mesh>
        {/* Seam across the body, behind the buttons. */}
        <mesh position={[0, 0.0375, -0.006]} rotation={[0.06, 0, 0]}>
          <boxGeometry args={[0.082, 0.004, 0.0018]} />
          <meshStandardMaterial color="#8d887b" roughness={0.8} />
        </mesh>
        {/* Strain relief where the cord leaves. */}
        <mesh position={[0, 0.012, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.008, 0.02, 12]} />
          <meshStandardMaterial color="#bdb8ab" roughness={0.7} />
        </mesh>
      </group>

      <mesh>
        <tubeGeometry args={[cord, 48, 0.0042, 8, false]} />
        <meshStandardMaterial color="#cfcabd" roughness={0.7} />
      </mesh>
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

/* ==========================================================================
   DeskClutter — the things that say a person works here.

   Three rules, each of which the previous version broke:

   1. EVERYTHING IS IN WORLD COORDINATES AND MUST LAND ON THE TOP. The desk
      spans x -1.15..1.15 and z -0.58..0.62. The notebook and the loose sheet
      used to sit past the front edge, in mid-air.

   2. NOTHING OVERLAPS. The mug stood at the same spot as the mouse — one was
      inside the other. Zones, left to right:
        left   x < -0.45      tray (back), printout, loose sheet, notebook
        centre                machine, keyboard
        right  x > 0.5        binders (back), mug, mousepad (front)

   3. PROPS ARE SCALED TO THE MACHINE. The monitor and keyboard are drawn
      about twice life size, which is what gives the room its toy-diorama
      charm. The mug, tray and binders were modelled at true size, so next to
      a metre-wide keyboard the mug was an eggcup. PROP is the one number that
      brings them into the same world.
   ========================================================================== */
const PROP = 1.5

function DeskClutter({ onHoverProp }) {
  const mug = useMemo(
    () => mugProfile({ rBottom: 0.04, rTop: 0.044, height: 0.094, wall: 0.0045 }),
    [],
  )
  const ceramic = surfaceWithMaps('ceramic')
  /* Paper, written out rather than pulled from SURFACES — there is no 'paper'
     preset, and surface() silently falls back to PLASTIC for an unknown key,
     which would have given every sheet on this desk a soft sheen. */
  const paper = { roughness: 0.94, metalness: 0, clearcoat: 0 }

  return (
    <group>
      {/* ---- Letter tray, stacked two high, with output sitting in it ---- */}
      <group position={[-0.88, DESK_TOP, -0.3]} rotation={[0, 0.1, 0]} scale={PROP * 0.9}>
        {[0, 0.055].map((y, i) => (
          <group key={i} position={[0, y, 0]}>
            <RoundedBox args={[0.3, 0.008, 0.23]} radius={0.002} smoothness={3} position={[0, 0.004, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#2c2c2f" roughness={0.55} metalness={0.3} />
            </RoundedBox>
            {[-0.146, 0.146].map((x) => (
              <RoundedBox key={x} position={[x, 0.022, 0]} args={[0.008, 0.036, 0.23]} radius={0.002} smoothness={3}>
                <meshStandardMaterial color="#2c2c2f" roughness={0.55} metalness={0.3} />
              </RoundedBox>
            ))}
            <RoundedBox position={[0, 0.022, -0.113]} args={[0.3, 0.036, 0.006]} radius={0.002} smoothness={3}>
              <meshStandardMaterial color="#2c2c2f" roughness={0.55} metalness={0.3} />
            </RoundedBox>
            {/* Paper never lands square; the small angle is what stops a stack
                of boxes looking like a stack of boxes. */}
            <RoundedBox
              position={[0.004, 0.019, 0.006]}
              rotation={[0, i ? -0.03 : 0.04, 0]}
              args={[0.262, 0.02 - i * 0.008, 0.2]}
              radius={0.001}
              smoothness={2}
              receiveShadow
            >
              <meshStandardMaterial color="#f4f2ec" {...paper} />
            </RoundedBox>
          </group>
        ))}
      </group>

      {/* ---- A loose stack of printout ---- */}
      <group position={[-0.72, DESK_TOP + 0.02, 0.08]} rotation={[0, -0.09, 0]} scale={PROP * 0.85}>
        <RoundedBox args={[0.23, 0.026, 0.17]} radius={0.001} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color="#f1efe8" {...paper} />
        </RoundedBox>
        <RoundedBox position={[0.01, 0.0145, 0.006]} rotation={[0, 0.06, 0]} args={[0.226, 0.003, 0.168]} radius={0.0008} smoothness={2}>
          <meshStandardMaterial color="#fbfaf6" {...paper} />
        </RoundedBox>
      </group>

      {/* ---- One sheet lying flat, with writing on it ---- */}
      <group position={[-0.64, DESK_TOP + 0.0015, 0.42]} rotation={[-Math.PI / 2, 0, 0.2]} scale={PROP * 0.9}>
        <mesh receiveShadow>
          <planeGeometry args={[0.2, 0.15]} />
          <meshStandardMaterial color="#faf8f3" {...paper} />
        </mesh>
        {/* Short, uneven lines that stop well before the right edge, which is
            what handwriting looks like from two metres away. */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[-0.012 - (i % 2) * 0.008, 0.05 - i * 0.017, 0.0006]}>
            <planeGeometry args={[0.13 - (i % 3) * 0.028, 0.003]} />
            <meshBasicMaterial color="#8d8a83" />
          </mesh>
        ))}
      </group>

      {/* ---- Notebook and pen ---- */}
      <group
        position={[-0.96, DESK_TOP + 0.013, 0.33]}
        rotation={[0, -0.24, 0]}
        scale={PROP * 0.85}
        onPointerOver={() => onHoverProp?.({ label: 'Notebook', hint: 'Where the working out happens' })}
        onPointerOut={() => onHoverProp?.(null)}
      >
        <RoundedBox args={[0.19, 0.018, 0.25]} radius={0.005} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#7a2f33" {...surfaceWithMaps('softTouch')} />
        </RoundedBox>
        <RoundedBox position={[-0.004, 0.0005, 0]} args={[0.176, 0.014, 0.238]} radius={0.0028} smoothness={4}>
          <meshStandardMaterial color="#efeade" roughness={0.95} />
        </RoundedBox>
        {/* Elastic closure band. */}
        <RoundedBox position={[0.055, 0.0005, 0]} args={[0.006, 0.021, 0.252]} radius={0.0012} smoothness={4}>
          <meshStandardMaterial color="#2a2c31" roughness={0.9} />
        </RoundedBox>
        <group position={[0.01, 0.0145, 0.02]} rotation={[Math.PI / 2, 0, 0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.005, 0.005, 0.135, 14]} />
            <meshStandardMaterial color="#1b2430" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.074, 0]}>
            <cylinderGeometry args={[0.0045, 0.0015, 0.014, 12]} />
            <meshStandardMaterial color="#b9bcc4" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* ---- Two ring binders, standing, leaning into each other ---- */}
      <group position={[0.98, DESK_TOP, -0.33]} rotation={[0, -0.12, 0]} scale={PROP * 0.92}>
        {[
          { x: 0, tilt: 0.0, c: '#34373d' },
          { x: 0.068, tilt: -0.045, c: '#8a3b33' },
        ].map((b) => (
          <group key={b.x} position={[b.x, 0.142, 0]} rotation={[0, 0, b.tilt]}>
            <RoundedBox args={[0.058, 0.28, 0.23]} radius={0.004} smoothness={3} castShadow receiveShadow>
              <meshStandardMaterial color={b.c} roughness={0.6} />
            </RoundedBox>
            {/* Spine label and finger ring — the two details that make it a
                binder and not a brick. */}
            <mesh position={[0, 0.05, 0.1155]}>
              <planeGeometry args={[0.04, 0.1]} />
              <meshBasicMaterial color="#e9e4d8" />
            </mesh>
            <mesh position={[0, -0.075, 0.1155]}>
              <ringGeometry args={[0.008, 0.012, 20]} />
              <meshStandardMaterial color="#c9ccd2" roughness={0.3} metalness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- Mug, on a coaster, right of the machine ----
          Rebuilt. Three things were wrong with the old one beyond its size:
          the handle was a torus rotated to lie FLAT, so it was a horizontal
          ring sticking out of the side like a saucer; the coffee was a disc
          wider than the inside of the cup; and it sat on the mouse. The handle
          is now a vertical half-ring whose two ends meet the wall, which is
          the shape a hand actually goes through. */}
      <group position={[0.74, DESK_TOP, -0.02]} rotation={[0, -0.7, 0]} scale={PROP * 1.1}>
        {/* Cork coaster. */}
        <mesh position={[0, 0.003, 0]} receiveShadow>
          <cylinderGeometry args={[0.058, 0.058, 0.006, 40]} />
          <meshStandardMaterial color="#a8855c" roughness={0.95} />
        </mesh>
        <group position={[0, 0.006, 0]}>
          <mesh castShadow receiveShadow>
            <latheGeometry args={[mug, 48]} />
            <meshPhysicalMaterial color="#f3f1ec" side={DoubleSide} {...ceramic} />
          </mesh>
          {/* A dipped-glaze band round the foot: one flat colour on white
              ceramic is the difference between a mug and a prop cylinder. */}
          <mesh position={[0, 0.021, 0]}>
            <cylinderGeometry args={[0.0418, 0.0406, 0.03, 48, 1, true]} />
            <meshPhysicalMaterial color="#c2553c" roughness={0.25} clearcoat={0.7} clearcoatRoughness={0.15} />
          </mesh>
          {/* Coffee, a little below the rim and inside the wall. */}
          <mesh position={[0, 0.078, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.0375, 36]} />
            <meshStandardMaterial color="#2b1a10" roughness={0.12} />
          </mesh>
          {/* Handle: a half torus standing upright in the XY plane. A torus
              sweeps from +X anticlockwise, so rotating it -90deg about Z makes
              the half-ring bulge toward +X with both ends on the mug wall. */}
          <mesh position={[0.04, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <torusGeometry args={[0.026, 0.0068, 14, 28, Math.PI]} />
            <meshPhysicalMaterial color="#f3f1ec" {...ceramic} />
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
  const pot = useMemo(() => planterProfile({ rTop: 0.2, rBottom: 0.14, height: 0.36 }), [])
  const leaf = useMemo(() => leafGeometry(), [])
  useEffect(() => () => leaf.dispose(), [leaf])

  /* A rubber plant (Ficus elastica): a few upright stems carrying big, dark,
     glossy leaves that alternate up the stem and angle outward. It is the
     plant in every well-photographed office for a reason — the leaves are
     large enough to read as shapes from across a room, and glossy enough to
     pick up a highlight.

     Everything is deterministic. Math.random() here would reshuffle the plant
     on every hot reload. */
  const stems = useMemo(() => {
    const defs = [
      { x: 0.0, z: 0.0, h: 1.32, lean: [0.05, -0.03], n: 8 },
      { x: -0.07, z: 0.05, h: 1.02, lean: [-0.2, 0.1], n: 6 },
      { x: 0.07, z: -0.04, h: 0.84, lean: [0.22, 0.12], n: 5 },
    ]
    return defs.map((d, si) => {
      const base = new Vector3(d.x, 0.33, d.z)
      const top = new Vector3(d.x + d.lean[0], 0.33 + d.h, d.z + d.lean[1])
      const mid = new Vector3(d.x + d.lean[0] * 0.25, 0.33 + d.h * 0.55, d.z + d.lean[1] * 0.25)
      const curve = new CatmullRomCurve3([base, mid, top])
      const leaves = Array.from({ length: d.n }, (_, k) => {
        const t = 0.26 + (k / (d.n - 1)) * 0.74
        const at = curve.getPoint(t)
        // Golden-angle spiral, so no two leaves stack above one another.
        const azimuth = si * 1.9 + k * 2.4
        const young = k === d.n - 1
        return {
          at: [at.x, at.y, at.z],
          azimuth,
          // Lower leaves hang closer to horizontal; the newest stands upright.
          pitch: young ? 0.3 : 1.18 - t * 0.5 + ((k * 7) % 3) * 0.06,
          len: young ? 0.26 : 0.4 - t * 0.1 + ((k * 5) % 4) * 0.018,
          tone: (si + k) % 3,
          young,
        }
      })
      return { curve, leaves }
    })
  }, [])

  useFrame((state) => {
    if (!plantRef.current) return
    const t = state.clock.elapsedTime
    plantRef.current.rotation.y = Math.sin(t * 0.28) * 0.02
    plantRef.current.rotation.z = Math.sin(t * 0.47 + 1) * 0.006
  })

  const ceramic = surfaceWithMaps('ceramic')
  const GREENS = ['#2f6b3c', '#27592f', '#3a7a45']
  /* Leaves are thin and let light through, so the side facing away from the
     key never goes black. A low emissive in the leaf's own hue stands in for
     real transmission, which is far too expensive per leaf. */
  const GLOWS = ['#1f4a28', '#1a3f22', '#28572f']

  return (
    <group ref={plantRef} position={PLANT_POS}>
      {/* Planter: matte off-white ceramic with a rolled rim. */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[pot, 56]} />
        <meshPhysicalMaterial color="#f1eee8" side={DoubleSide} {...ceramic} roughness={0.42} clearcoat={0.25} />
      </mesh>
      <mesh position={[0, 0.325, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.185, 36]} />
        <meshStandardMaterial color="#2b211a" roughness={1} />
      </mesh>

      {stems.map((st, si) => (
        <group key={si}>
          <mesh castShadow>
            <tubeGeometry args={[st.curve, 20, 0.011, 8, false]} />
            <meshStandardMaterial color="#5b4a36" roughness={0.8} />
          </mesh>

          {st.leaves.map((l, k) => (
            <group key={k} position={l.at} rotation={[0, l.azimuth, 0]}>
              {/* A short stalk, then the blade. Tilting about X swings the
                  blade from straight up toward the outside of the plant. */}
              <group rotation={[l.pitch, 0, 0]}>
                <mesh position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.004, 0.005, 0.06, 6]} />
                  <meshStandardMaterial color="#6f8f5a" roughness={0.7} />
                </mesh>
                <mesh geometry={leaf} position={[0, 0.055, 0]} scale={[l.len * 0.56, l.len, l.len]} castShadow>
                  <meshPhysicalMaterial
                    color={l.young ? '#6ea85a' : GREENS[l.tone]}
                    emissive={l.young ? '#3f6b33' : GLOWS[l.tone]}
                    emissiveIntensity={0.55}
                    side={DoubleSide}
                    roughness={0.32}
                    clearcoat={0.5}
                    clearcoatRoughness={0.3}
                  />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      ))}
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

