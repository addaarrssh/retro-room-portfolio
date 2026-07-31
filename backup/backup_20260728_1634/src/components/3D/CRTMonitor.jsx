import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, MathUtils } from 'three'
import { PANEL, SCREEN, SCREEN_HTML_FACTOR, SCREEN_PX } from './layout'
import { glowTexture, macWallpaperTexture } from './textures'
import DesktopOS from '../OS/DesktopOS'

/** Front face of the panel, and the middle of the bezel strip below the display. */
const PANEL_FACE_Z = PANEL.z + PANEL.d / 2
const BEZEL_Y = (PANEL.y - PANEL.h / 2 + (SCREEN.y - SCREEN.h / 2)) / 2

/** Anodised aluminium, the colour Apple enclosures actually are. */
const ALUMINIUM = '#d5d7da'

/* ==========================================================================
   CRTMonitor — the Apple display on the desk, and the frame the OS lives in.

   ROOM view   the screen is a lit plane showing the desktop picture
   ZOOMED view that plane is swapped for a real DOM tree via <Html transform>

   The swap is why the display must sit in front of the panel face (see
   layout.js): the DOM is not depth-tested, so it draws over the casing either
   way, but the wallpaper plane does not — bury it and the screen goes dead
   grey while the zoomed view still looks fine, which makes the bug easy to
   miss and hard to place.
   ========================================================================== */

export default function CRTMonitor({
  viewState,
  onClick,
  windowManager,
  muted,
  onToggleMute,
  appearance,
  onToggleAppearance,
  pendingApp,
  onPendingHandled,
}) {
  const [hovered, setHovered] = useState(false)
  const bezelRef = useRef()
  const haloRef = useRef()
  const glowLightRef = useRef()
  const screenGlassRef = useRef()

  const halo = useMemo(() => glowTexture(), [])
  const wallpaper = useMemo(() => macWallpaperTexture(), [])
  useEffect(() => () => [halo, wallpaper].forEach((t) => t.dispose()), [halo, wallpaper])

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
      {/* ------------------------------------------------- Apple Studio Display */}
      {/* Enclosure. Anodised aluminium — low roughness and high metalness so
          the environment probe actually shows up in it, which is the whole
          reason the material reads as machined metal rather than grey paint. */}
      <RoundedBox
        ref={bezelRef}
        args={[PANEL.w + 0.024, PANEL.h + 0.024, PANEL.d]}
        radius={0.014}
        smoothness={4}
        position={[0, PANEL.y, PANEL.z - 0.002]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={ALUMINIUM}
          roughness={0.32}
          metalness={0.92}
          emissive="#7dd3fc"
          emissiveIntensity={0}
        />
      </RoundedBox>

      {/* Black bezel inset into the aluminium, the way the real one is. */}
      <mesh position={[0, PANEL.y, PANEL_FACE_Z - 0.0005]}>
        <planeGeometry args={[PANEL.w, PANEL.h]} />
        <meshStandardMaterial color="#0b0b0d" roughness={0.45} metalness={0.1} />
      </mesh>

      {/* Slim rear enclosure. */}
      <mesh position={[0, PANEL.y, PANEL.z - 0.03]} castShadow receiveShadow>
        <boxGeometry args={[PANEL.w - 0.06, PANEL.h - 0.06, 0.045]} />
        <meshStandardMaterial color="#c3c5c8" roughness={0.35} metalness={0.9} />
      </mesh>

      {/* Etched Apple logo on the chin. Dark-on-dark, only catching the lamp —
          a bright badge would read as a sticker. */}
      <mesh position={[0, BEZEL_Y, PANEL_FACE_Z + 0.002]}>
        <planeGeometry args={[0.028, 0.033]} />
        <meshStandardMaterial color="#2a2a2d" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* ------------------------------------------------- Stand */}
      {/* Tilting arm: a flat aluminium blade, not a box — it is the silhouette
          people recognise the display by. */}
      <mesh position={[0, 0.9, -0.135]} rotation={[-0.32, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.4, 0.022]} />
        <meshStandardMaterial color={ALUMINIUM} roughness={0.3} metalness={0.92} />
      </mesh>

      {/* Hinge collar where the arm meets the panel. */}
      <mesh position={[0, 1.05, -0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.026, 0.026, 0.2, 24]} />
        <meshStandardMaterial color="#b9bbbe" roughness={0.28} metalness={0.93} />
      </mesh>

      {/* Flat oval foot. */}
      <group position={[0, 0.716, -0.16]}>
        <mesh scale={[1, 1, 0.72]} castShadow receiveShadow>
          <cylinderGeometry args={[0.185, 0.19, 0.016, 48]} />
          <meshStandardMaterial color={ALUMINIUM} roughness={0.3} metalness={0.92} />
        </mesh>
        {/* Rubber contact pad underneath. */}
        <mesh position={[0, -0.009, 0]} scale={[1, 1, 0.72]}>
          <cylinderGeometry args={[0.17, 0.17, 0.003, 40]} />
          <meshStandardMaterial color="#2b2b2e" roughness={0.9} />
        </mesh>
      </group>

      {/* ---------------------------------------------------------- Screen Glass (ROOM View — 3D Wallpaper) */}
      {/* Sits at SCREEN.z, which layout.js guarantees is in front of the panel
          face. Put it behind and the casing swallows it — the display goes dead
          grey and the wallpaper never renders. */}
      {!isZoomed && (
        <mesh ref={screenGlassRef} position={[0, SCREEN.y, SCREEN.z]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshStandardMaterial
            map={wallpaper}
            color="#ffffff"
            emissive="#ffffff"
            emissiveMap={wallpaper}
            emissiveIntensity={0.85}
            roughness={0.12}
            metalness={0.08}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* ---------------------------------------------------------- HTML Desktop OS (Infinity Edge Virtual Display) */}
      {(isZoomed || isZooming) && (
        <Html
          transform
          position={[0, SCREEN.y, SCREEN.z]}
          distanceFactor={SCREEN_HTML_FACTOR}
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
            powered
            windowManager={windowManager}
            muted={muted}
            onToggleMute={onToggleMute}
            appearance={appearance}
            onToggleAppearance={onToggleAppearance}
            pendingApp={pendingApp}
            onPendingHandled={onPendingHandled}
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
