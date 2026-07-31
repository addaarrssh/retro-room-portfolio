import { useRef, useState, useCallback } from 'react'
import { Vector3, Plane, Raycaster } from 'three'
import { PhysicsBody } from './physics'

export function useGrabbable({ initialPosition = [0, 0, 0], bounds }) {
  const [position, setPosition] = useState(initialPosition)
  const [rotation] = useState([0, 0, 0])
  const [isDragging, setIsDragging] = useState(false)

  const historyRef = useRef([])
  const physicsRef = useRef(null)
  const dragPlaneRef = useRef(new Plane())
  const raycasterRef = useRef(new Raycaster())
  const intersectionRef = useRef(new Vector3())

  const handlePointerDown = useCallback(
    (e, camera) => {
      e.stopPropagation()
      setIsDragging(true)
      historyRef.current = []

      if (e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId)
      }

      // Drag plane parallel to camera
      const dir = camera.getWorldDirection(new Vector3()).negate()
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(dir, new Vector3(...position))
    },
    [position],
  )

  const handlePointerMove = useCallback(
    (e, camera, gl) => {
      if (!isDragging) return
      e.stopPropagation()

      const rect = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera({ x, y }, camera)
      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionRef.current)) {
        const now = performance.now()
        const newPos = [intersectionRef.current.x, intersectionRef.current.y, intersectionRef.current.z]

        historyRef.current.push({ pos: newPos, time: now })
        if (historyRef.current.length > 5) historyRef.current.shift()

        setPosition(newPos)
      }
    },
    [isDragging],
  )

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDragging) return
      e.stopPropagation()
      setIsDragging(false)

      if (e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId)
      }

      const h = historyRef.current
      if (h.length >= 2) {
        const first = h[0]
        const last = h[h.length - 1]
        const dt = (last.time - first.time) / 1000

        if (dt > 0.001) {
          const vx = (last.pos[0] - first.pos[0]) / dt
          const vy = (last.pos[1] - first.pos[1]) / dt
          const vz = (last.pos[2] - first.pos[2]) / dt

          physicsRef.current = new PhysicsBody({
            position: last.pos,
            velocity: [vx, vy, vz],
            rotation: rotation,
            angularVelocity: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6],
            bounds,
          })
        }
      }
    },
    [isDragging, rotation, bounds],
  )

  return {
    position,
    rotation,
    isDragging,
    physicsRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
