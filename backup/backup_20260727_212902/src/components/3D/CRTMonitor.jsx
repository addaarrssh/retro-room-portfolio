import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, MathUtils } from 'three'
import { MONITOR, SCREEN, SCREEN_PX } from './layout'
import { asusGamingWallpaperTexture, glowTexture } from './textures'
import DesktopOS from '../OS/DesktopOS'

/* ==========================================================================
   CRTMonitor — 1:1 Replica of Modern Ultra-Slim ASUS Gaming Monitor
   - Ultra-thin borderless gaming panel with bottom metallic ASUS logo badge
   - Slanted ergonomic neck & hollow curved ring stand base
   - ROOM view: 3D ASUS Gaming car wallpaper preview
   - ZOOMED view: HTML Desktop OS inside screen bezels
   ========================================================================== */

export default function CRTMonitor({
  viewState,
  onClick,
  windowManager,
  hasBooted,
  powerCycle,
  muted,
  onToggleMute,
}) {
  const [hovered, setHovered] = useState(false)
  const bezelRef = useRef()
  const haloRef = useRef()
  const glowLightRef = useRef()
  const screenGlassRef = useRef()

  const halo = useMemo(() => glowTexture(), [])
  const asusTex = useMemo(() => asusGamingWallpaperTexture(), [])
  useEffect(() => () => [halo, asusTex].forEach((t) => t.dispose()), [halo, asusTex])

  const interactive = viewState === 'ROOM'
  const isZoomed = viewState === 'MONITOR_ZOOMED'
  const isZooming = viewState === 'ZOOMING_IN' || viewState === 'ZOOMING_OUT'

  useEffect(() => {
    document.body.style.cursor = hovered && interactive ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered, interactive])

  useEffect(() => {
    if (!interactive) setHovered(false)
  }, [interactive])

  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.002, delta)

    if (bezelRef.current) {
      const target = hovered && interactive ? 0.35 : 0.0
      bezelRef.current.material.emissiveIntensity = MathUtils.lerp(
        bezelRef.current.material.emissiveIntensity,
        target,
        k,
      )
    }

    if (haloRef.current) {
      const target = isZoomed ? 1.0 : 0.5
      haloRef.current.material.opacity = MathUtils.lerp(haloRef.current.material.opacity, target, k)
    }
    if (glowLightRef.current) {
      const target = isZoomed ? 1.2 : 0.6
      glowLightRef.current.intensity = MathUtils.lerp(glowLightRef.current.intensity, target, k)
    }
  })

  const handleOver = (e) => {
    e.stopPropagation()
    if (interactive) setHovered(true)
  }
  const handleOut = (e) => {
    e.stopPropagation()
    setHovered(false)
  }
  const handleClick = (e) => {
    e.stopPropagation()
    if (interactive) onClick?.()
  }

  // No-op raycast — makes a mesh invisible to pointer events
  const noRaycast = useMemo(() => ({ raycast: () => {} }), [])

  return (
    <group onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
      {/* ---------------------------------------------------------- Modern Ultra-Thin ASUS Display Panel */}
      {/* Outer Panel Frame Casing — Razor-thin infinity edge frame */}
      <RoundedBox
        ref={bezelRef}
        args={[1.144, 0.854, 0.024]}
        radius={0.012}
        smoothness={4}
        position={[0, SCREEN.y + 0.015, SCREEN.z - 0.012]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#141418"
          roughness={0.72}
          metalness={0.12}
          emissive="#38bdf8"
          emissiveIntensity={0}
        />
      </RoundedBox>

      {/* Rear Housing Bump */}
      <mesh position={[0, SCREEN.y - 0.08, SCREEN.z - 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.38, 0.055]} />
        <meshStandardMaterial color="#0b0b0e" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Bottom Bezel Metallic ASUS Logo Plaque */}
      <mesh position={[0, SCREEN.y - 0.402, SCREEN.z + 0.001]}>
        <boxGeometry args={[1.144, 0.03, 0.004]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Metallic Silver ASUS Logo */}
      <mesh position={[0, SCREEN.y - 0.402, SCREEN.z + 0.004]}>
        <planeGeometry args={[0.11, 0.018]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.95} toneMapped={false} />
      </mesh>

      {/* Power Indicator LED (Bottom Right Corner) */}
      <mesh position={[0.53, SCREEN.y - 0.402, SCREEN.z + 0.003]}>
        <sphereGeometry args={[0.006, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      {/* ---------------------------------------------------------- ASUS Curved Ring Stand Base */}
      {/* Slanted Metallic Neck */}
      <mesh position={[0, 0.94, -0.14]} rotation={[-0.38, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.11, 0.45, 0.045]} />
        <meshStandardMaterial color="#141418" roughness={0.2} metalness={0.88} />
      </mesh>

      {/* Hollow Curved Ring Stand Base */}
      <group position={[0, 0.718, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.22, 0.024, 16, 48]} />
          <meshStandardMaterial color="#111115" roughness={0.2} metalness={0.85} />
        </mesh>
        {/* Angular Base Footing Pads */}
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.08, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.028]} />
            <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* ---------------------------------------------------------- Screen Glass (ROOM View — 3D Wallpaper) */}
      {!isZoomed && (
        <mesh
          ref={screenGlassRef}
          position={[0, SCREEN.y + 0.015, SCREEN.z - 0.002]}
        >
          <planeGeometry args={[1.140, 0.850]} />
          <meshStandardMaterial
            map={asusTex}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.7}
            roughness={0.12}
            metalness={0.08}
          />
        </mesh>
      )}

      {/* ---------------------------------------------------------- HTML Desktop OS (Infinity Edge Virtual Display) */}
      {(isZoomed || isZooming) && (
        <Html
          transform
          position={[0, SCREEN.y + 0.015, SCREEN.z - 0.006]}
          distanceFactor={0.388}
          zIndexRange={[100, 0]}
          occlude={false}
          pointerEvents={isZoomed ? 'auto' : 'none'}
          style={{
            width: `${SCREEN_PX.w}px`,
            height: `${SCREEN_PX.h}px`,
            overflow: 'hidden',
            borderRadius: '4px',
            opacity: isZoomed ? 1 : 0,
            transition: 'opacity 400ms ease-in-out',
            pointerEvents: isZoomed ? 'auto' : 'none',
          }}
        >
          <DesktopOS
            active={isZoomed}
            powered={true}
            hasBooted={hasBooted}
            powerCycle={powerCycle}
            windowManager={windowManager}
            muted={muted}
            onToggleMute={onToggleMute}
          />
        </Html>
      )}

      {/* Bloom Ambient Screen Glow */}
      <mesh
        ref={haloRef}
        position={[0, SCREEN.y, SCREEN.z + 0.026]}
        {...(isZoomed ? noRaycast : {})}
      >
        <planeGeometry args={[SCREEN.w * 1.55, SCREEN.h * 1.65]} />
        <meshBasicMaterial
          map={halo}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Phosphor Spill Light */}
      <pointLight
        ref={glowLightRef}
        position={[0, SCREEN.y - 0.1, SCREEN.z + 0.34]}
        color="#38bdf8"
        intensity={0.6}
        distance={2.1}
        decay={2}
      />
    </group>
  )
}
