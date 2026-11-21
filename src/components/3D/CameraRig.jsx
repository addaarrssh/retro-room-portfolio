import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { SCREEN, SEAT_Y, monitorViewDistance } from './layout'
import { INTRO_MS, SIT_MS, STAND_MS } from './timing'
import { COMPACT } from '../../hooks/useDevice'

/* ==========================================================================
   CameraRig — the only thing allowed to move the camera.

   - ROOM view:    a fixed shot that drifts a few centimetres with the pointer
   - MONITOR view: the camera flies flush to the display

   THE ORBIT CONTROLS ARE GONE, and that is a design decision, not a cleanup.

   A free orbit invites the visitor to fly the camera, and almost every one of
   them lands somewhere worse than the shot that was composed for them: under
   the desk, edge-on to the sweep, or spun round to the blank back of the
   monitor. Worse, it makes the room feel like a viewer rather than a place —
   you are operating it instead of being in it.

   What replaces it is a fixed camera with PARALLAX: the shot barely moves, but
   it moves with you, which is enough for the scene to feel three-dimensional
   and alive without ever leaving the composition. The whole travel is a few
   centimetres. If a visitor notices it as a feature, it is too strong.

   Removing the controls also removes three specific bugs this project has
   already hit, all of which came from `OrbitControls.update()` rewriting
   `camera.position` from its own spherical state regardless of `enabled` —
   the min/max distance clamp fighting the flight, the target drifting under
   the idle sway, and the first drag after a flight snapping. None of them can
   happen now, because nothing else touches the camera.

   The flight itself is still driven from useFrame on WALL-CLOCK time. Not an
   animation library on its own ticker, which a background tab puts to sleep,
   and not accumulated delta, which strands the camera mid-flight in a
   throttled tab. Elapsed time always lands it where it belongs on the very
   next frame it gets.
   ========================================================================== */

const ROOM_TARGET = [0, 0.85, 0]

export const VIEWS = {
  ROOM: {
    position: [0, 2.05, 5.9],
    target: ROOM_TARGET,
  },
}

/* The set — plant, desk, chair — is about 4.3m wide, and it should fill
   roughly three quarters of the frame on any window shape. A fixed camera
   distance cannot do that: tuned for a 16:10 laptop it leaves the desk a
   small island on an ultrawide and crops the chair on a squarer window. So
   the distance is solved from the aspect ratio, and clamped so a very wide
   window does not push the camera through the front of the desk. */
const SET_WIDTH = 5.7

/* PORTRAIT. A phone held upright is about 0.46 wide for every 1 tall, and at
   the 34 degree lens the room was composed for, fitting a 4.3m set into that
   sliver puts the camera twenty metres away, deep in the fog. So a portrait
   frame gets a wider lens (up to 55 degrees), a tighter margin around the set,
   and a slightly longer leash on the distance. `portraitness` is 0 at a square
   window and 1 from an aspect of 0.5 down, so a window being dragged narrower
   eases between the two framings instead of snapping. */
const FOV_WIDE = 34
const FOV_PORTRAIT = 50
const SET_WIDTH_PORTRAIT = 3.65

/* THE PORTRAIT HERO SHOT. Head-on, a set that is 4.3m wide and 1.5m tall can
   only ever be a thin band across the middle of an upright phone, with empty
   backdrop above and below it. So the phone does not get the head-on shot.
   The camera swings round to the chair side and lifts, which turns the set
   corner-on: its width is foreshortened, its depth runs up the frame, and the
   desk, monitor and chair stack into the tall shape the screen actually has.
   It also happens to be the angle from which the scene is most obviously
   three-dimensional, which is the right first impression for the one device
   where nobody can move a mouse to find that out. */
const PORTRAIT_YAW = 0.62
const PORTRAIT_PITCH = 0.25
const portraitness = (aspect) => Math.min(1, Math.max(0, (1 - aspect) / 0.5))
export function fovForAspect(aspect) {
  return FOV_WIDE + (FOV_PORTRAIT - FOV_WIDE) * portraitness(aspect)
}

function roomDistance(fovDeg, aspect) {
  const p = portraitness(aspect)
  const halfFov = Math.tan((fovDeg * Math.PI) / 180 / 2)
  const width = SET_WIDTH + (SET_WIDTH_PORTRAIT - SET_WIDTH) * p
  const d = width / (2 * halfFov * aspect)
  return Math.min(9.5 + 1.5 * p, Math.max(5.2, d))
}

/* TOUCH LOOK-AROUND. A finger dragged across the room swings the camera
   around the desk. This is not the free orbit that was removed above: the
   swing is clamped to an arc in front of the set, so there is no way to end up
   behind the monitor or under the floor, and it is done here, by the rig, so
   nothing else is writing to the camera. Radians per pixel of drag. */
const ORBIT_SPEED = 0.006
const ORBIT_YAW_MAX = 0.7
const ORBIT_PITCH_MIN = -0.3
const ORBIT_PITCH_MAX = 0.22
const _orbit = new Vector3()
const _right = new Vector3()
const _up = new Vector3(0, 1, 0)


/* How far the shot travels, in metres, at full pointer deflection.

   The first pass at this was 0.34 / 0.16 with no dolly, which was so small
   that most visitors never noticed the scene responded to them at all. On the
   reference site the parallax is a real camera move: pushing the pointer from
   one corner of the window to the other changes the apparent size of the desk
   by about a quarter, which only happens if the camera is DOLLYING, not just
   sliding sideways.

   So Z is the important one here. Moving the pointer up eases the camera in
   toward the desk and moving it down pulls back, which is what gives the shot
   its sense of depth — a pure X/Y slide at this distance reads as the image
   being dragged around behind glass. */
const PARALLAX_X = 0.85
const PARALLAX_Y = 0.4
const PARALLAX_Z = 0.7

/* Fraction of the remaining distance closed per second. Low enough that the
   camera trails the pointer noticeably, which is what makes it feel like
   weight rather than like the mouse dragging the scene. */
const PARALLAX_EASE = 1.2

/* THE FLOAT. The shot is never completely still, even with the pointer
   untouched and the visitor doing nothing.

   This is the single cheapest thing that separates a 3D scene from a
   rendered photograph, and it was missing entirely: without it, anyone who
   arrives and does not immediately move the mouse sees a static image and has
   no reason to believe the page is interactive at all.

   Each axis is the sum of TWO sine waves at deliberately incommensurate
   periods. One wave is a metronome — you feel the loop within a few seconds
   and it starts to read as a mechanism. Two waves whose periods do not divide
   into each other produce a drift that takes minutes to repeat and never
   settles into an obvious rhythm, which is what makes it read as a camera
   breathing rather than as an animation playing.

   Amplitudes are in metres and are smaller than the pointer parallax on
   purpose: the float is the floor of the motion, not the feature. */
const FLOAT = {
  x: [
    { amp: 0.11, period: 19.0 },
    { amp: 0.06, period: 7.3 },
  ],
  y: [
    { amp: 0.07, period: 23.0 },
    { amp: 0.04, period: 9.7 },
  ],
  z: [
    { amp: 0.14, period: 27.0 },
    { amp: 0.07, period: 11.3 },
  ],
}

/** Sum of the waves for one axis at time `t` seconds. */
function floatAxis(waves, t) {
  let v = 0
  for (const w of waves) v += Math.sin((t / w.period) * Math.PI * 2) * w.amp
  return v
}

/* ---------------------------------------------------------------- flights

   Every flight — the reveal after START, sitting down, standing up — is the
   same move: a camera travelling from one framed shot to another. Two things
   make it read as a camera operator rather than as a lerp.

   · DISTANCE IS INTERPOLATED IN LOG SPACE. A straight lerp from six metres to
     forty centimetres covers most of its distance in the first half, so the
     approach looks like a lunge followed by a crawl. Moving the log of the
     distance at a steady rate gives a constant APPARENT speed — the screen
     grows in frame at the same rate all the way in — which is how a dolly on
     a long lens feels.
   · THE AIM LEADS THE BODY. The look-at point settles a little ahead of the
     position, so the camera turns to face what it is going to before it has
     finished getting there, the way a head turns before a body follows. */
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const _o0 = new Vector3()
const _o1 = new Vector3()
const _dir = new Vector3()

/** Writes the camera position and aim for flight `f` at eased progress `e`. */
function flightPose(f, e, outPos, outTarget) {
  outTarget.lerpVectors(f.fromTarget, f.toTarget, Math.min(1, e * 1.12))
  _o0.subVectors(f.from, f.fromTarget)
  _o1.subVectors(f.to, f.toTarget)
  const l0 = Math.max(1e-4, _o0.length())
  const l1 = Math.max(1e-4, _o1.length())
  _dir.copy(_o0).divideScalar(l0).lerp(_o1.divideScalar(l1), e).normalize()
  const len = Math.exp(Math.log(l0) + (Math.log(l1) - Math.log(l0)) * e)
  outPos.copy(outTarget).addScaledVector(_dir, len)
}

/* Where the camera waits behind the BIOS screen, relative to the room shot:
   further back, higher and off to one side. The reveal is a slow descending
   glide from here into the composed shot, so the first thing anyone sees of
   the room is the room arriving — not a cut to a still. */
const INTRO_OFFSET = [-1.9, 1.5, 4.6]
const INTRO_TARGET = [0, 0.55, 0]

export default function CameraRig({ viewState, entered = true }) {
  const { camera, size } = useThree()
  const aspect = size.width / size.height || 16 / 9
  const fov = fovForAspect(aspect)

  /* The lens follows the window shape. Set here rather than on <Canvas>,
     whose camera props are only read once at mount. */
  useEffect(() => {
    if (Math.abs(camera.fov - fov) < 0.01) return
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [camera, fov])

  /* The seated shot: flush to the glass, derived from viewport aspect because
     a narrow window is width-limited and has to sit further back to keep the
     whole 4:3 display in frame.

     There is ONE seated distance. There used to be two — flush while the
     pointer was on the glass, leaning back whenever it left — and with a
     hover-to-sit on top, every pass of the mouse across the bezel set the
     camera surging in or out. Sitting down is now a decision: click, arrive,
     stay put until you choose to stand. */
  const monitorView = useMemo(() => {
    /* On a phone the glass has to fill the frame or nothing on it can be
       read, so the air around the monitor is given up: almost flush across
       the width in portrait, a little looser in landscape where the limit is
       height and the chin under the display would otherwise be cut. */
    const margin = COMPACT ? (aspect < 1 ? 1.05 : 1.14) : undefined
    return {
      flush: monitorViewDistance(fov, aspect, margin),
      target: [0, SEAT_Y, SCREEN.z],
    }
  }, [fov, aspect])

  /* Resting room position for this window shape. Held in a ref and read every
     frame, so a resize re-frames the room without restarting anything. */
  const roomPos = useRef([...VIEWS.ROOM.position])
  {
    const p = portraitness(aspect)
    _orbit.set(0, VIEWS.ROOM.position[1] - ROOM_TARGET[1], roomDistance(fov, aspect) - ROOM_TARGET[2])
    if (p > 0) {
      _orbit.applyAxisAngle(_up, PORTRAIT_YAW * p)
      _right.crossVectors(_up, _orbit).normalize()
      _orbit.applyAxisAngle(_right, -PORTRAIT_PITCH * p)
    }
    roomPos.current[0] = ROOM_TARGET[0] + _orbit.x
    roomPos.current[1] = ROOM_TARGET[1] + _orbit.y
    roomPos.current[2] = ROOM_TARGET[2] + _orbit.z
  }

  const flight = useRef({
    active: false,
    kind: 'out',
    startedAt: 0,
    duration: STAND_MS,
    from: new Vector3(),
    fromTarget: new Vector3(...ROOM_TARGET),
    to: new Vector3(),
    toTarget: new Vector3(),
    target: new Vector3(...ROOM_TARGET),
  })

  /* Where the parallax has drifted to. Kept as its own vector and ADDED to the
     resting position each frame, rather than accumulated onto the camera —
     accumulating lets the shot wander away from the composed framing over the
     course of a visit. */
  const drift = useRef(new Vector3())

  /* Touch look-around state. `touch` flips on at the first finger and stays
     on: from then the pointer parallax is off, because on a touch screen
     "where the pointer is" is just wherever the last tap happened to land. */
  const orbit = useRef({ yaw: 0, pitch: 0, goalYaw: 0, goalPitch: 0, touch: false, id: null, x: 0, y: 0 })
  const viewRef = useRef(viewState)
  viewRef.current = viewState

  useEffect(() => {
    const o = orbit.current
    const down = (e) => {
      if (e.pointerType !== 'touch') return
      o.touch = true
      if (viewRef.current !== 'ROOM' || o.id !== null) return
      if (e.target?.closest?.('button, a, input, textarea, [data-os-screen]')) return
      o.id = e.pointerId
      o.x = e.clientX
      o.y = e.clientY
    }
    const move = (e) => {
      if (e.pointerId !== o.id) return
      if (viewRef.current !== 'ROOM') return
      o.goalYaw = Math.min(ORBIT_YAW_MAX, Math.max(-ORBIT_YAW_MAX, o.goalYaw - (e.clientX - o.x) * ORBIT_SPEED))
      o.goalPitch = Math.min(
        ORBIT_PITCH_MAX,
        Math.max(ORBIT_PITCH_MIN, o.goalPitch + (e.clientY - o.y) * ORBIT_SPEED),
      )
      o.x = e.clientX
      o.y = e.clientY
    }
    const up = (e) => {
      if (e.pointerId === o.id) o.id = null
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  /* The reveal. Until START is pressed the camera is parked at the intro pose
     (behind an opaque loading screen, so nobody sees it); the moment it is
     pressed it glides into the room shot while the screen fades. */
  const introStarted = useRef(false)
  useEffect(() => {
    if (!entered || introStarted.current) return
    introStarted.current = true
    const f = flight.current
    f.from.set(
      roomPos.current[0] + INTRO_OFFSET[0],
      roomPos.current[1] + INTRO_OFFSET[1],
      roomPos.current[2] + INTRO_OFFSET[2],
    )
    f.fromTarget.set(...INTRO_TARGET)
    f.to.set(...roomPos.current)
    f.toTarget.set(...ROOM_TARGET)
    f.kind = 'intro'
    f.duration = INTRO_MS
    f.startedAt = performance.now()
    f.active = true
  }, [entered])

  /* A FLIGHT STARTS ON A VIEW CHANGE, AND ON NOTHING ELSE.

     `monitorView` is deliberately not a dependency: it is derived from the
     viewport, so it changes on every resize — a scrollbar appearing, the
     <Html> layer mounting, a phone URL bar — and each one used to restart the
     flight from wherever the camera was. Resizes SNAP instead (below). */
  const lastView = useRef(viewState)
  useEffect(() => {
    if (lastView.current === viewState) return
    lastView.current = viewState
    if (viewState !== 'ZOOMING_IN' && viewState !== 'ZOOMING_OUT') return
    const goingIn = viewState === 'ZOOMING_IN'
    const f = flight.current

    // Start from wherever the camera actually is, so interrupting a flight
    // mid-way continues smoothly rather than snapping back to the start.
    f.from.copy(camera.position)
    f.fromTarget.copy(f.target)

    if (goingIn) {
      // Standing back up returns to the composed shot, not to wherever the
      // last drag left the camera.
      const o = orbit.current
      o.yaw = o.pitch = o.goalYaw = o.goalPitch = 0
      o.id = null
      f.to.set(0, SEAT_Y, SCREEN.z + monitorView.flush)
      f.toTarget.set(...monitorView.target)
    } else {
      f.to.set(...roomPos.current)
      f.toTarget.set(...VIEWS.ROOM.target)
    }
    f.kind = goingIn ? 'in' : 'out'
    f.duration = goingIn ? SIT_MS : STAND_MS
    f.startedAt = performance.now()
    f.active = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState, camera])

  /* Re-framing after a resize while seated, without moving. Mid-flight the
     running interpolation owns the camera and must not be overwritten. */
  useEffect(() => {
    if (viewState !== 'MONITOR_ZOOMED') return
    const f = flight.current
    if (f.active) return
    camera.position.set(0, SEAT_Y, SCREEN.z + monitorView.flush)
    f.target.set(...monitorView.target)
    camera.lookAt(f.target)
  }, [monitorView, viewState, camera])

  const step = (state, delta) => {
    const f = flight.current

    /* Behind the BIOS screen: hold the intro pose. */
    if (!entered && !f.active) {
      camera.position.set(
        roomPos.current[0] + INTRO_OFFSET[0],
        roomPos.current[1] + INTRO_OFFSET[1],
        roomPos.current[2] + INTRO_OFFSET[2],
      )
      f.target.set(...INTRO_TARGET)
      camera.lookAt(f.target)
      return
    }

    if (f.active) {
      const t = Math.min(1, (performance.now() - f.startedAt) / f.duration)
      const eased = f.kind === 'intro' ? smootherstep(easeOutCubic(t) * 0.35 + t * 0.65) : smootherstep(t)

      flightPose(f, eased, camera.position, f.target)

      /* Landing in the room: blend the float in with the same easing, so the
         camera is already drifting when it parks and nothing jumps on the
         first free frame. */
      if (f.kind !== 'in') {
        const now = performance.now() / 1000
        camera.position.x += floatAxis(FLOAT.x, now) * eased
        camera.position.y += floatAxis(FLOAT.y, now) * eased
        camera.position.z += floatAxis(FLOAT.z, now) * eased
      }
      camera.lookAt(f.target)

      if (t >= 1) {
        f.active = false
        drift.current.set(0, 0, 0)
      }
      return
    }

    /* -------------------------------------------------- seated at the desk
       Perfectly still. You are reading; a camera that sways while you read
       is a camera that makes the text swim. */
    if (viewState === 'MONITOR_ZOOMED' || viewState === 'ZOOMING_IN') {
      camera.position.set(0, SEAT_Y, SCREEN.z + monitorView.flush)
      f.target.set(...monitorView.target)
      camera.lookAt(f.target)
      return
    }

    /* ------------------------------------------------------------- room
       Frame-rate independent smoothing: `1 - exp(-k * dt)` feels the same at
       60Hz and 120Hz, where a plain per-frame lerp would not. */
    const k = 1 - Math.exp(-PARALLAX_EASE * delta)
    const o = orbit.current
    const px = o.touch ? 0 : state.pointer.x
    const py = o.touch ? 0 : state.pointer.y
    drift.current.x += (px * PARALLAX_X - drift.current.x) * k
    drift.current.y += (py * PARALLAX_Y - drift.current.y) * k
    // Pointer UP eases the camera IN, which is why this is negated.
    drift.current.z += (-py * PARALLAX_Z - drift.current.z) * k

    // The swing trails the finger a little, the same weight as the parallax.
    const ko = 1 - Math.exp(-9 * delta)
    o.yaw += (o.goalYaw - o.yaw) * ko
    o.pitch += (o.goalPitch - o.pitch) * ko

    // Wall-clock, so a tab restored from the background does not jump.
    const t = performance.now() / 1000

    camera.position.set(
      roomPos.current[0] + drift.current.x + floatAxis(FLOAT.x, t),
      roomPos.current[1] + drift.current.y + floatAxis(FLOAT.y, t),
      roomPos.current[2] + drift.current.z + floatAxis(FLOAT.z, t),
    )

    if (o.yaw !== 0 || o.pitch !== 0) {
      _orbit.set(camera.position.x - ROOM_TARGET[0], camera.position.y - ROOM_TARGET[1], camera.position.z - ROOM_TARGET[2])
      _orbit.applyAxisAngle(_up, o.yaw)
      _right.crossVectors(_up, _orbit).normalize()
      _orbit.applyAxisAngle(_right, -o.pitch)
      camera.position.set(ROOM_TARGET[0] + _orbit.x, ROOM_TARGET[1] + _orbit.y, ROOM_TARGET[2] + _orbit.z)
    }

    /* The target follows at a fraction of the camera's travel, so moves read
       as a handheld drift rather than a turntable orbit. */
    f.target.set(
      ROOM_TARGET[0] + drift.current.x * 0.35 + floatAxis(FLOAT.x, t) * 0.4,
      ROOM_TARGET[1] + drift.current.y * 0.3 + floatAxis(FLOAT.y, t) * 0.4,
      ROOM_TARGET[2],
    )
    camera.lookAt(f.target)
  }

  /* Priority -1, and the matrices are flushed by hand.

     The desktop on the monitor is DOM, positioned by drei's <Html transform>
     from the camera's world matrix. That component does its sums in its own
     useFrame — and if it runs BEFORE this one, or reads a matrix three.js has
     not refreshed yet, it places the desktop where the camera was on the
     PREVIOUS frame. The result is the desktop visibly swimming against the
     casing whenever the camera moves, and on a slow machine (where a frame is
     50ms, not 16) it slides clean off the glass. Running first and updating
     the matrices immediately means everything downstream sees this frame's
     camera. A negative priority orders the callback without taking over the
     render loop, which only a positive one does. */
  useFrame((state, delta) => {
    step(state, delta)
    camera.updateMatrixWorld()
  }, -1)

  return null
}
