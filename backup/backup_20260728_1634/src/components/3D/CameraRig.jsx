import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import { SCREEN, monitorViewDistance } from './layout'

/* ==========================================================================
   CameraRig — the only thing allowed to move the camera.

   - ROOM view:    OrbitControls, so you can swing around and watch the car
   - MONITOR view: the camera flies flush to the display

   Three things here are load-bearing and easy to break again:

   1. The flight is driven from useFrame, not from an animation library on its
      own ticker. R3F's loop is the same loop that renders, so if anything is
      on screen at all the camera is moving. A separate rAF ticker can be put
      to sleep — by a background tab, by the browser throttling an inactive
      window — and when that happens the transition silently stalls halfway
      and the user is left staring at a desk from across the room.

   2. OrbitControls.update() does NOT check `controls.enabled`. It always
      rewrites camera.position from its own spherical state, clamped to
      [minDistance, maxDistance], and always calls lookAt(controls.target). So
      it must never run while the rig owns the camera. drei's internal
      useFrame is already gated on `enabled`, so leaving the controls disabled
      for the duration of a flight is enough — but nothing else may call
      update() either.

   3. minDistance has to stay below the monitor view distance, or that same
      clamp makes the flush framing unreachable however the flight is written.
   ========================================================================== */

const ROOM_TARGET = [0, 1.0, 0]

export const VIEWS = {
  ROOM: {
    position: [0, 2.2, 4.5],
    target: ROOM_TARGET,
  },
}

const DURATION_IN = 1.5
const DURATION_OUT = 1.4

/** Must stay under monitorViewDistance() or the zoom cannot reach the screen. */
const MIN_ORBIT_DISTANCE = 0.6
const MAX_ORBIT_DISTANCE = 7.5

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export default function CameraRig({ viewState }) {
  const { camera, size } = useThree()
  const controlsRef = useRef()

  /* The flush framing depends on viewport aspect: on a narrow window the
     display is width-limited rather than height-limited, so the camera has to
     sit further back to keep the whole desktop on screen. */
  const monitorView = useMemo(() => {
    const aspect = size.width / size.height || 16 / 9
    const distance = monitorViewDistance(camera.fov, aspect)
    return {
      position: [0, SCREEN.y, SCREEN.z + distance],
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

  useEffect(() => {
    const goingIn = viewState === 'ZOOMING_IN' || viewState === 'MONITOR_ZOOMED'
    const view = goingIn ? monitorView : VIEWS.ROOM
    const f = flight.current

    // Start from wherever the camera actually is, so interrupting a flight
    // mid-way continues smoothly rather than snapping back to the start.
    f.from.copy(camera.position)
    f.fromTarget.copy(f.target)
    f.to.set(...view.position)
    f.toTarget.set(...view.target)
    f.duration = goingIn ? DURATION_IN : DURATION_OUT
    f.goingIn = goingIn
    f.startedAt = performance.now()
    f.active = true

    // Hand the camera to the rig for the duration of the flight.
    if (controlsRef.current) controlsRef.current.enabled = false
  }, [viewState, camera, monitorView])

  useFrame((state, delta) => {
    const f = flight.current
    const isRoomView = viewState === 'ROOM'

    if (f.active) {
      // Wall-clock, not accumulated delta. A throttled or backgrounded tab
      // delivers almost no frames; accumulating delta would leave the camera
      // stranded part-way through the flight until focus came back, whereas
      // elapsed time always lands it where it belongs on the very next frame.
      const t = Math.min(1, (performance.now() - f.startedAt) / (f.duration * 1000))
      const eased = f.goingIn ? easeInOutCubic(t) : easeOutCubic(t)

      camera.position.lerpVectors(f.from, f.to, eased)
      f.target.lerpVectors(f.fromTarget, f.toTarget, easeOutCubic(Math.min(1, t * 1.2)))
      camera.lookAt(f.target)

      if (t >= 1) {
        f.active = false
        if (isRoomView && controlsRef.current) {
          // Re-seat the controls on where the camera actually landed,
          // otherwise the first orbit drag snaps.
          controlsRef.current.target.copy(f.target)
          controlsRef.current.enabled = true
          controlsRef.current.update()
        }
      }
      return
    }

    if (isRoomView && controlsRef.current?.enabled) {
      // Gentle sway, applied as an offset from the room target rather than
      // accumulated onto it — accumulating lets the target drift away over
      // time and slowly tilts the whole shot.
      const k = 1 - Math.pow(0.001, delta)
      const tgt = controlsRef.current.target
      tgt.x += (ROOM_TARGET[0] + state.pointer.x * 0.35 - tgt.x) * k * 0.12
      tgt.y += (ROOM_TARGET[1] + state.pointer.y * 0.22 - tgt.y) * k * 0.12
      tgt.z += (ROOM_TARGET[2] - tgt.z) * k * 0.12
      f.target.copy(tgt)
    } else if (!isRoomView) {
      camera.lookAt(f.target)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={viewState === 'ROOM'}
      target={ROOM_TARGET}
      enableDamping
      dampingFactor={0.05}
      // Panning would drag the target out from under the sway above.
      enablePan={false}
      rotateSpeed={0.7}
      zoomSpeed={0.7}
      minDistance={MIN_ORBIT_DISTANCE}
      maxDistance={MAX_ORBIT_DISTANCE}
      // Keep the camera inside the room: the walls are single-sided planes and
      // orbiting past them shows the scene from outside through the backs.
      minPolarAngle={0.55}
      maxPolarAngle={Math.PI / 2 + 0.06}
      minAzimuthAngle={-Math.PI / 2.4}
      maxAzimuthAngle={Math.PI / 2.4}
      makeDefault
    />
  )
}
