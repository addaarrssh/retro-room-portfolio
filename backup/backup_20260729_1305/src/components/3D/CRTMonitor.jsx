import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, MathUtils } from 'three'
import { PANEL, SCREEN, SCREEN_HTML_FACTOR, SCREEN_PX } from './layout'
import { fingerprintTexture, glowTexture, macWallpaperTexture } from './textures'
import DesktopOS from '../OS/DesktopOS'
import audio from '../../audio/AudioEngine'

const RippleShader = {
  uniforms: {
    uMap: { value: null },
    uProgress: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform float uProgress;
    uniform float uTime;
    varying vec2 vUv;
    varying float vRipple;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float dist = distance(uv, vec2(0.5));
      float wave = sin(dist * 35.0 - uTime * 6.0);
      float displacement = wave * uProgress * 0.03;
      pos.z += displacement;
      vRipple = displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uMap;
    uniform float uProgress;
    varying vec2 vUv;
    varying float vRipple;
    void main() {
      vec2 offset = vec2(vRipple * 0.4);
      float r = texture2D(uMap, vUv + offset).r;
      float g = texture2D(uMap, vUv).g;
      float b = texture2D(uMap, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
}

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
  /* MODERN = Apple Studio Display, RETRO = beige 90s CRT. SceneCanvas already
     passes this; it was being read on line ~175 without ever being declared,
     which threw on first render and took the whole canvas subtree down. */
  era = 'MODERN',
  pendingApp,
  onPendingHandled,
}) {
  const [hovered, setHovered] = useState(false)
  const bezelRef = useRef()
  const haloRef = useRef()
  const glowLightRef = useRef()
  const screenGlassRef = useRef()

  const wallpaper = useMemo(() => macWallpaperTexture(), [])
  const halo = useMemo(() => glowTexture(), [])
  const fingerprints = useMemo(() => fingerprintTexture(), [])

  useEffect(() => {
    return () => {
      wallpaper.dispose()
      halo.dispose()
      fingerprints.dispose()
    }
  }, [wallpaper, halo, fingerprints])

  const interactive = viewState === 'ROOM'
  const isZoomed = viewState === 'MONITOR_ZOOMED'
  const isZooming = viewState === 'ZOOMING_IN' || viewState === 'ZOOMING_OUT'

  useEffect(() => {
    document.body.style.cursor = hovered && interactive ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered, interactive])

  const rippleMaterialRef = useRef()
  const zoomStartRef = useRef(0)
  const soundPlayedRef = useRef(false)

  useEffect(() => {
    if (isZooming) {
      zoomStartRef.current = performance.now()
      soundPlayedRef.current = false
    }
  }, [isZooming])

  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.002, delta)
    const tClock = state.clock.elapsedTime

    if (rippleMaterialRef.current) {
      rippleMaterialRef.current.uniforms.uTime.value = tClock
      if (isZooming) {
        const elapsed = (performance.now() - zoomStartRef.current) / 1400
        const tProgress = Math.max(0, Math.min(1, elapsed))
        const rippleFactor = Math.sin(tProgress * Math.PI)
        rippleMaterialRef.current.uniforms.uProgress.value = rippleFactor

        if (tProgress >= 0.5 && !soundPlayedRef.current) {
          audio.powerOn()
          soundPlayedRef.current = true
        }
      } else {
        rippleMaterialRef.current.uniforms.uProgress.value = 0
      }
    }

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
      {era === 'RETRO' ? (
        /* 9.3 Beige CRT Monitor Model for RETRO 1995 era */
        <group>
          {/* Main Beige CRT Casing */}
          <RoundedBox
            ref={bezelRef}
            args={[PANEL.w + 0.08, PANEL.h + 0.08, 0.48]}
            radius={0.02}
            smoothness={4}
            position={[0, PANEL.y, PANEL.z - 0.22]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#d8d0bc" roughness={0.5} />
          </RoundedBox>
          {/* Front Bezel Inset */}
          <mesh position={[0, PANEL.y, PANEL_FACE_Z - 0.001]}>
            <planeGeometry args={[PANEL.w + 0.02, PANEL.h + 0.02]} />
            <meshStandardMaterial color="#33312b" roughness={0.7} />
          </mesh>
          {/* Top Vents */}
          {Array.from({ length: 8 }, (_, k) => (
            <mesh key={k} position={[-0.3 + k * 0.085, PANEL.y + PANEL.h / 2 + 0.038, PANEL.z - 0.22]}>
              <boxGeometry args={[0.04, 0.005, 0.35]} />
              <meshStandardMaterial color="#22201b" roughness={0.8} />
            </mesh>
          ))}
          {/* Front Dials & Green Power LED */}
          <group position={[0.28, BEZEL_Y, PANEL_FACE_Z + 0.002]}>
            <mesh position={[-0.04, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.008, 16]} />
              <meshStandardMaterial color="#666258" />
            </mesh>
            <mesh position={[-0.015, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.008, 16]} />
              <meshStandardMaterial color="#666258" />
            </mesh>
            <mesh position={[0.025, 0, 0]}>
              <sphereGeometry args={[0.005, 12, 12]} />
              <meshBasicMaterial color="#22c55e" toneMapped={false} />
            </mesh>
          </group>
        </group>
      ) : (
        /* Modern Apple Studio Display */
        <group>
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

          <mesh position={[0, PANEL.y, PANEL_FACE_Z - 0.0005]}>
            <planeGeometry args={[PANEL.w, PANEL.h]} />
            <meshStandardMaterial color="#0b0b0d" roughness={0.45} metalness={0.1} />
          </mesh>

          <mesh position={[0, PANEL.y, PANEL.z - 0.03]} castShadow receiveShadow>
            <boxGeometry args={[PANEL.w - 0.06, PANEL.h - 0.06, 0.045]} />
            <meshStandardMaterial color="#c3c5c8" roughness={0.35} metalness={0.9} />
          </mesh>

          <mesh position={[0, BEZEL_Y, PANEL_FACE_Z + 0.002]}>
            <planeGeometry args={[0.028, 0.033]} />
            <meshStandardMaterial color="#2a2a2d" roughness={0.25} metalness={0.85} />
          </mesh>
        </group>
      )}

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

      {/* 2.3 Dust on monitor top — visible when orbiting high */}
      <mesh position={[0, PANEL.y + PANEL.h / 2 + 0.0005, PANEL.z]}>
        <planeGeometry args={[PANEL.w * 0.95, PANEL.d * 0.9]} />
        <meshBasicMaterial color="#d8d4cc" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* ---------------------------------------------------------- Screen Glass (ROOM View — 3D Wallpaper) */}
      {/* Sits at SCREEN.z, which layout.js guarantees is in front of the panel
          face. Put it behind and the casing swallows it — the display goes dead
          grey and the wallpaper never renders. */}
      {!isZoomed && (
        <>
          <mesh ref={screenGlassRef} position={[0, SCREEN.y, SCREEN.z]}>
            <planeGeometry args={[SCREEN.w, SCREEN.h, 32, 32]} />
            {isZooming ? (
              <shaderMaterial
                ref={rippleMaterialRef}
                args={[RippleShader]}
                uniforms-uMap-value={wallpaper}
              />
            ) : (
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
            )}
          </mesh>

          {/* 2.4 Fingerprints on screen — second plane 1 mm in front of SCREEN.z */}
          <mesh position={[0, SCREEN.y, SCREEN.z + 0.001]}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
            <meshPhysicalMaterial
              map={fingerprints}
              transparent
              opacity={0.05}
              roughness={0.05}
              clearcoat={1}
            />
          </mesh>
        </>
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
            /* Visible from the moment it mounts, which is the start of the
               flight — so the viewer watches the screen wake up as they move
               toward it. Waiting for isZoomed meant the display sat dead until
               the camera landed and then cut to a finished desktop. The boot
               layer inside does the actual turning-on. */
            opacity: 1,
            transition: 'opacity 220ms ease-out',
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
