import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { SCREEN, monitorViewDistance } from './layout'

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
  /* Pulled back room view framing — desk and monitor look small in the middle of room. */
  ROOM: {
    position: [0, 2.2, 7.2],
    target: ROOM_TARGET,
  },
}

const DURATION_IN = 0.85
const DURATION_OUT = 0.85

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
const PARALLAX_Z = 0.85

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

/* How far back the relaxed desk view sits, as a multiple of the flush
   distance. 1.55 is enough to bring the monitor's casing, the keyboard and the
   front edge of the desk into frame without losing the sense that you are
   still sitting at it — past about 1.8 it stops being a lean-back and starts
   being a different shot. */
const RELAX = 1.55

/* How fast the lean between relaxed and flush resolves, per second. This is
   the number that decides whether the interaction feels expensive or twitchy.
   Too high and the camera snaps the instant the pointer crosses the bezel,
   which is jarring because the pointer crosses it constantly; too low and the
   screen is still arriving when you have already started reading. */
const FOCUS_EASE = 1.6

/* Quintic easing — much silkier than cubic. The higher exponent means the
   acceleration at the start is gentler and the deceleration at the end lingers
   longer, which is what makes a flight feel expensive rather than mechanical. */
const easeInOutQuintic = (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2)
const easeOutQuintic = (t) => 1 - Math.pow(1 - t, 5)

export default function CameraRig({ viewState, screenFocused = false }) {
  const { camera, size } = useThree()

  /* TWO distances at the desk, not one.

     Sitting down is not a single position. While the pointer is ON the screen
     you want to be flush against the glass, because you are reading; the moment
     it leaves, you want to be leaning back far enough to see the machine you
     are sitting at and the desk it stands on. The reference site does exactly
     this and it is most of what makes the scene feel inhabited rather than
     modal — you are never simply "in the monitor", you are at a desk, and the
     desk is still there in your peripheral vision.

     Both are derived from viewport aspect, because on a narrow window the 4:3
     display is width-limited rather than height-limited and the camera has to
     sit further back to keep all of it on screen. */
  const monitorView = useMemo(() => {
    const aspect = size.width / size.height || 16 / 9
    const flush = monitorViewDistance(camera.fov, aspect)
    return {
      flush,
      relaxed: flush * RELAX,
      target: [0, SCREEN.y, SCREEN.z],
    }
  }, [camera.fov, size.width, size.height])

  const flight = useRef({
    active: false,
    startedAt: 0,
    duration: DURATION_IN,
    goingIn: false,
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

  /* 0 = leaning back at the desk, 1 = flush against the glass. Eased rather
     than switched, and held in a ref so it survives re-renders without
     restarting the animation. */
  const focus = useRef(0)

  /* A FLIGHT STARTS ON A VIEW CHANGE, AND ON NOTHING ELSE.

     This effect used to list `monitorView` as a dependency, and that was the
     bug behind "it zooms out a little on its own". `monitorView` is derived
     from the viewport, so it changes on every resize — and a resize is not
     only someone dragging the window corner. A scrollbar appearing, the OS
     <Html> layer mounting, a phone's URL bar sliding away, or the browser
     settling its layout a frame after load all resize the canvas. Each one
     re-ran this effect, which restarted a one-and-a-half second flight from
     wherever the camera happened to be — so the shot drifted, apparently in
     response to whatever the pointer had just done, because that is what the
     viewer had just done.

     Now the only thing that can begin a flight is an actual change of
     viewState. Resizes are handled below, by SNAPPING, which is correct: the
     framing has to change because the aspect changed, but the camera should
     not travel to get there. */
  useEffect(() => {
    const goingIn = viewState === 'ZOOMING_IN' || viewState === 'MONITOR_ZOOMED'
    const f = flight.current

    // Start from wherever the camera actually is, so interrupting a flight
    // mid-way continues smoothly rather than snapping back to the start.
    f.from.copy(camera.position)
    f.fromTarget.copy(f.target)

    /* The flight always lands on the RELAXED desk position, never flush. The
       last stretch — relaxed to flush — belongs to the focus easing below, so
       arriving reads as sitting down and then leaning in, two beats rather than
       one long push. It also means the flight has one fixed endpoint and cannot
       fight the pointer for control of the final distance. */
    if (goingIn) {
      f.to.set(0, SCREEN.y, SCREEN.z + monitorView.relaxed)
      f.toTarget.set(...monitorView.target)
    } else {
      f.to.set(...VIEWS.ROOM.position)
      f.toTarget.set(...VIEWS.ROOM.target)
    }
    f.duration = goingIn ? DURATION_IN : DURATION_OUT
    f.goingIn = goingIn
    f.startedAt = performance.now()
    f.active = true
    // monitorView is deliberately NOT a dependency — see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState, camera])

  /* Re-framing after a resize, without moving. Only while parked AT the
     monitor: in the room the framing is a fixed position that does not depend
     on aspect, and mid-flight the running interpolation already owns the
     camera and must not be overwritten under it. */
  useEffect(() => {
    if (viewState !== 'MONITOR_ZOOMED') return
    const f = flight.current
    if (f.active) return
    const dist = monitorView.relaxed + (monitorView.flush - monitorView.relaxed) * focus.current
    camera.position.set(0, SCREEN.y, SCREEN.z + dist)
    f.target.set(...monitorView.target)
    camera.lookAt(f.target)
  }, [monitorView, viewState, camera])

  useFrame((state, delta) => {
    const f = flight.current

    if (f.active) {
      const t = Math.min(1, (performance.now() - f.startedAt) / (f.duration * 1000))
      const eased = f.goingIn ? easeInOutQuintic(t) : easeOutQuintic(t)

      camera.position.lerpVectors(f.from, f.to, eased)

      /* Blend the float in over the RETURN flight, so the camera is already
         drifting by the time it parks. Without this the flight lands exactly
         on the resting position and the float — which never stopped running —
         snaps its current offset in on the very next frame. Scaling by the same
         easing the flight uses means the two are the same motion, and there is
         no frame where anything jumps. */
      if (!f.goingIn) {
        const now = performance.now() / 1000
        camera.position.x += floatAxis(FLOAT.x, now) * eased
        camera.position.y += floatAxis(FLOAT.y, now) * eased
        camera.position.z += floatAxis(FLOAT.z, now) * eased
      }

      f.target.lerpVectors(f.fromTarget, f.toTarget, easeOutQuintic(Math.min(1, t * 1.15)))
      camera.lookAt(f.target)

      if (t >= 1) {
        f.active = false
        // Re-seat the drift where the flight ended so the parallax picks up
        // from the resting shot instead of jumping on its first frame.
        drift.current.set(0, 0, 0)
      }
      return
    }

    /* -------------------------------------------------- seated at the desk */
    if (viewState === 'MONITOR_ZOOMED') {
      const k = 1 - Math.exp(-FOCUS_EASE * delta)
      focus.current += ((screenFocused ? 1 : 0) - focus.current) * k

      const dist = monitorView.relaxed + (monitorView.flush - monitorView.relaxed) * focus.current

      // Seated 3D desk pointer parallax (matches Henry Heffernan's reference site)
      const pk = 1 - Math.exp(-PARALLAX_EASE * delta)
      const targetParallaxX = screenFocused ? 0 : state.pointer.x * 0.28
      const targetParallaxY = screenFocused ? 0 : state.pointer.y * 0.16
      drift.current.x += (targetParallaxX - drift.current.x) * pk
      drift.current.y += (targetParallaxY - drift.current.y) * pk

      const now = performance.now() / 1000
      const breathe = (1 - focus.current) * 0.32

      camera.position.set(
        drift.current.x + floatAxis(FLOAT.x, now) * breathe,
        SCREEN.y + drift.current.y + floatAxis(FLOAT.y, now) * breathe,
        SCREEN.z + dist,
      )
      f.target.set(drift.current.x * 0.4, SCREEN.y + drift.current.y * 0.3, SCREEN.z)
      camera.lookAt(f.target)
      return
    }

    if (viewState === 'ROOM') {
      /* Frame-rate independent smoothing. `1 - exp(-k * dt)` is the correct
         form: a plain `lerp(a, b, 0.1)` per frame moves twice as fast at
         120fps as at 60, so the feel of the drift would change with the
         display rather than staying the same everywhere. */
      const k = 1 - Math.exp(-PARALLAX_EASE * delta)
      drift.current.x += (state.pointer.x * PARALLAX_X - drift.current.x) * k
      drift.current.y += (state.pointer.y * PARALLAX_Y - drift.current.y) * k
      // Pointer UP eases the camera IN, which is why this is negated.
      drift.current.z += (-state.pointer.y * PARALLAX_Z - drift.current.z) * k

      /* Wall-clock, like everything else here. `state.clock` is an accumulated
         elapsed time that stalls with the render loop, so a tab that is
         restored after being backgrounded would resume the float from where it
         paused and visibly jump. Real elapsed time just carries on. */
      const t = performance.now() / 1000

      camera.position.set(
        VIEWS.ROOM.position[0] + drift.current.x + floatAxis(FLOAT.x, t),
        VIEWS.ROOM.position[1] + drift.current.y + floatAxis(FLOAT.y, t),
        VIEWS.ROOM.position[2] + drift.current.z + floatAxis(FLOAT.z, t),
      )

      /* The target follows at a FRACTION of the camera's travel rather than
         staying pinned. Pinned, every camera move is a pure orbit and the desk
         appears to swing; moving the target with it keeps the subject roughly
         where it is in frame while the viewpoint shifts around it, which is
         what a real handheld camera does and what makes the motion read as
         drift rather than as a turntable. */
      f.target.set(
        ROOM_TARGET[0] + drift.current.x * 0.35 + floatAxis(FLOAT.x, t) * 0.4,
        ROOM_TARGET[1] + drift.current.y * 0.3 + floatAxis(FLOAT.y, t) * 0.4,
        ROOM_TARGET[2],
      )
    }

    camera.lookAt(f.target)
  })

  return null
}
