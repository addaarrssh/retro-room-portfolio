import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import gsap from 'gsap'

/* ==========================================================================
   CameraRig — Smooth Orbit Controls & Cinematic View Transitions
   - ROOM View: 360° Free Orbit Rotation around room to watch car from any angle
   - MONITOR View: Smooth camera zoom flush into CRT monitor tube
   ========================================================================== */

export const VIEWS = {
  ROOM: {
    position: [0, 2.2, 4.5],
    target: [0, 1.0, 0],
    parallax: 0.15,
  },
  MONITOR: {
    position: [0, 1.26, 1.40],
    target: [0, 1.26, 0],
    parallax: 0,
  },
}

const DURATION_IN = 1.5
const DURATION_OUT = 1.4

export default function CameraRig({ viewState }) {
  const { camera } = useThree()
  const controlsRef = useRef()

  const rig = useRef({
    position: new Vector3(...VIEWS.ROOM.position),
    target: new Vector3(...VIEWS.ROOM.target),
    parallax: VIEWS.ROOM.parallax,
  })

  const isRoomView = viewState === 'ROOM'

  useEffect(() => {
    const goingIn = viewState === 'ZOOMING_IN' || viewState === 'MONITOR_ZOOMED'
    const view = goingIn ? VIEWS.MONITOR : VIEWS.ROOM
    const duration = goingIn ? DURATION_IN : DURATION_OUT

    if (controlsRef.current) {
      controlsRef.current.enabled = false
    }

    const tweens = [
      gsap.to(camera.position, {
        x: view.position[0],
        y: view.position[1],
        z: view.position[2],
        duration,
        ease: goingIn ? 'power3.inOut' : 'power2.inOut',
        overwrite: true,
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.update()
          }
        },
        onComplete: () => {
          if (viewState === 'ROOM' && controlsRef.current) {
            controlsRef.current.enabled = true
          }
        },
      }),
      gsap.to(rig.current.target, {
        x: view.target[0],
        y: view.target[1],
        z: view.target[2],
        duration: duration * 0.85,
        ease: 'power2.out',
        overwrite: true,
      }),
    ]

    return () => tweens.forEach((t) => t.kill())
  }, [viewState, camera])

  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.001, delta)

    if (isRoomView && controlsRef.current) {
      // Normalized pointer mouse coordinates (-1 to 1)
      const px = state.pointer.x
      const py = state.pointer.y

      // Target parallax offset for mouse movement sway
      const targetParallaxX = px * 0.35
      const targetParallaxY = py * 0.22

      // Smoothly tilt and shift OrbitControls target according to mouse position
      controlsRef.current.target.x += (targetParallaxX - (controlsRef.current.target.x - rig.current.target.x)) * k * 0.1
      controlsRef.current.target.y += (1.0 + targetParallaxY - controlsRef.current.target.y) * k * 0.1
      controlsRef.current.update()
    } else if (!isRoomView) {
      camera.lookAt(rig.current.target)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={isRoomView}
      target={[0, 1.0, 0]}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      minDistance={1.8}
      maxDistance={7.5}
      maxPolarAngle={Math.PI / 2 + 0.12} // Allow 360° rotation around desk
      makeDefault
    />
  )
}
