import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Plane, Raycaster } from 'three'
import { SCREEN } from './layout'

export default function WorldCursor({ viewState }) {
  const { camera, gl } = useThree()
  const cursorGroupRef = useRef()
  const lightRef = useRef()
  const [nearScreen, setNearScreen] = useState(false)

  const planeRef = useRef(new Plane(new Vector3(0, 0, 1), -0.4))
  const raycasterRef = useRef(new Raycaster())
  const hitPointRef = useRef(new Vector3(0, 1.2, 0.4))
  const pointerPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e) => {
      const rect = gl.domElement.getBoundingClientRect()
      pointerPosRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      }
    }

    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [gl])

  useFrame(() => {
    if (!cursorGroupRef.current) return

    raycasterRef.current.setFromCamera(pointerPosRef.current, camera)
    if (raycasterRef.current.ray.intersectPlane(planeRef.current, hitPointRef.current)) {
      cursorGroupRef.current.position.copy(hitPointRef.current)

      // Distance to screen center at [0, SCREEN.y, SCREEN.z]
      const distToScreen = hitPointRef.current.distanceTo(new Vector3(0, SCREEN.y, SCREEN.z))
      const isNear = distToScreen < 0.45 && viewState === 'ROOM'

      if (isNear !== nearScreen) {
        setNearScreen(isNear)
        document.body.style.cursor = isNear ? 'none' : 'auto'
      }
    }
  })

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  return (
    <group ref={cursorGroupRef} position={[0, 1.2, 0.4]}>
      {/* Faint soft point light */}
      <pointLight
        ref={lightRef}
        color={nearScreen ? '#6ff2ff' : '#38bdf8'}
        intensity={0.25}
        distance={0.8}
        decay={2}
        castShadow={false}
      />

      {nearScreen ? (
        /* Morph into 3D arrow pointer glyph when near monitor */
        <group scale={0.035} rotation={[0, 0, -0.4]}>
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.3, 0.8, 3]} />
            <meshBasicMaterial color="#6ff2ff" toneMapped={false} />
          </mesh>
        </group>
      ) : (
        /* Soft additive glowing orb outside screen radius */
        <mesh scale={0.028}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}
