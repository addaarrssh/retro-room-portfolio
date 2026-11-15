import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, MathUtils } from 'three'
import { PANEL, SCREEN, SCREEN_HTML_FACTOR, SCREEN_PX } from './layout'
import {
  crtBadgeTexture,
  fingerprintTexture,
  glowTexture,
  macWallpaperTexture,
  moldedPlasticTexture,
} from './textures'
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

/** Depth of the beige CRT's body. Named because its front face has to be
    positioned FROM it — see the casing mesh for why guessing here buries the
    display behind the plastic. */
const CASING_DEPTH = 0.44

/* A tube monitor is not a box. It is a shallow front shell holding the glass,
   and behind that a smaller housing that steps in and tapers back around the
   neck of the tube. Modelled as one 0.44m box it looked like a flat panel
   that had been extruded — from the room's three-quarter view the side was a
   blank slab. Splitting it gives the stepped profile everybody recognises. */
const SHELL_DEPTH = 0.17

/* ==========================================================================
   The proportions of a 1990s CRT, which are not the proportions of a screen.

   The old casing was PANEL + 8cm on both axes and centred on the panel, which
   gave an even 4cm frame all the way round. That is a FLAT PANEL's geometry,
   and it is why the beige box still read as a modern monitor painted beige.

   A tube monitor is dominated by the plastic, not the glass:

   · The side walls are thick, because a deflection yoke and its coils sit
     behind them.
   · The bottom is much deeper than the top — the "chin" — because that is
     where the controls, the badge and the degauss button lived. An even frame
     is the single clearest tell that a CRT was modelled from a photo of a
     flat panel.

   So the casing is offset DOWN from the panel: the extra height lands under
   the glass, not around it.
   ========================================================================== */
const CASING_W = PANEL.w + 0.2
const CASING_H = PANEL.h + 0.18
const CASING_Y = PANEL.y - 0.05

/** Middle of the chin: between the bottom of the glass and the bottom of the
    case. Derived, so it stays put if the proportions above are retuned. */
const CHIN_Y = (SCREEN.y - SCREEN.h / 2 + (CASING_Y - CASING_H / 2)) / 2
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
  onScreenFocus,
  entered = true,
}) {
  const [hovered, setHovered] = useState(false)
  const bezelRef = useRef()
  const haloRef = useRef()
  const glowLightRef = useRef()
  const screenGlassRef = useRef()

  const wallpaper = useMemo(() => macWallpaperTexture(), [])
  const halo = useMemo(() => glowTexture(), [])
  const fingerprints = useMemo(() => fingerprintTexture(), [])
  const casePlastic = useMemo(() => moldedPlasticTexture(), [])
  const badge = useMemo(() => crtBadgeTexture('Sahu', 'adarsh inc'), [])

  /* Whether a hover is allowed to fly the camera in. Cleared on each trip,
     restored when the pointer genuinely leaves the monitor. See handleOver. */
  const armed = useRef(true)

  /* When the visitor got past the BIOS screen. The START button sits in the
     middle of the window — directly over the monitor — so the pointer is
     ALREADY on the monitor the moment the room appears, and the first pixel of
     mouse movement used to count as a hover and fly them straight in. They
     never saw the room. For the first moments after entry a hover only
     disarms; the pointer has to leave the monitor and come back deliberately. */
  const enteredAt = useRef(0)
  useEffect(() => {
    if (entered) enteredAt.current = performance.now()
  }, [entered])

  useEffect(() => {
    return () => {
      wallpaper.dispose()
      halo.dispose()
      casePlastic.dispose()
      badge.dispose()
      fingerprints.dispose()
    }
  }, [wallpaper, halo, fingerprints, casePlastic, badge])

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
    const k = 1 - Math.pow(0.0001, delta)
    const tClock = state.clock.elapsedTime

    if (rippleMaterialRef.current) {
      rippleMaterialRef.current.uniforms.uTime.value = tClock
      if (isZooming) {
        const elapsed = (performance.now() - zoomStartRef.current) / 850
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

    /* The halo is an ADDITIVE plane 1.55x the size of the display, and it used
       to ramp UP to full opacity on zoom — which is backwards. Bloom is what a
       lit screen looks like FROM ACROSS A ROOM; it is not what it looks like
       when your face is a foot from the glass. At reading distance that plane
       was washing a flat #008080 desktop out to a pale gradient and lifting
       the black text off the page, so it now fades almost out as you arrive
       and is at its strongest in the room view, where it belongs. */
    if (haloRef.current) {
      /* 0.5 in the room view was drowning the display: an additive plane that
         large, that bright, turns whatever is on the screen into a single
         white-blue blob, and the whole point of painting a Windows desktop
         onto the panel is that you can READ it from the desk. A lit CRT does
         bloom, but it blooms around the edges of bright pixels — it does not
         erase the image. */
      const target = isZoomed ? 0.1 : 0.18
      haloRef.current.material.opacity = MathUtils.lerp(haloRef.current.material.opacity, target, k)
    }
    if (glowLightRef.current) {
      // Still spills onto the desk, but no longer floods the shot.
      const target = isZoomed ? 0.35 : 0.6
      glowLightRef.current.intensity = MathUtils.lerp(glowLightRef.current.intensity, target, k)
    }
  })

  /* Hovering the monitor sits you down at it. No click.

     This is the single interaction that makes the room feel like a place
     rather than a picture with a button on it: you move the pointer toward the
     screen, the screen comes to you, and you never had to be told that the
     monitor was the way in. The bottom prompt still says "click anywhere",
     because clicking anywhere else also works — but nobody who moves their
     pointer over the display needs to read it.

     The guard matters. Pointer-over fires again on every re-entry, and R3F
     re-fires it as the geometry moves under a stationary cursor during the
     flight, so without `interactive` (which is false the moment the state
     leaves ROOM) this would restart the transition on itself several times a
     second and the camera would never arrive. */
  const handleOver = (e) => {
    e.stopPropagation()
    if (!interactive) return
    setHovered(true)

    if (!entered || performance.now() - enteredAt.current < 2200) {
      armed.current = false
      return
    }

    if (!armed.current) return
    armed.current = false
    onClick?.()
  }

  const handleOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    armed.current = true
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
          {/* Main Beige CRT Casing.

              The Z here is derived, not chosen. layout.js guarantees that the
              lit display sits in front of the thin PANEL slab — but this casing
              is a 0.48m deep box, and at its old position its front face landed
              at -0.023, which is 5mm IN FRONT of the screen at -0.028. The
              casing was swallowing the display: from the room you saw a beige
              box with a glow on it and no desktop at all, while the zoomed view
              still looked perfect, because the <Html> desktop is DOM and DOM is
              not depth-tested. That asymmetry is what makes this bug so easy to
              miss and so hard to place.

              So the front face is now placed relative to the panel face rather
              than by eye, and the depth is subtracted explicitly. */}
          <RoundedBox
            ref={bezelRef}
            args={[CASING_W, CASING_H, SHELL_DEPTH]}
            radius={0.034}
            smoothness={5}
            position={[0, CASING_Y, PANEL_FACE_Z - 0.004 - SHELL_DEPTH / 2]}
            castShadow
            receiveShadow
          >
            {/* Beige ABS, and every value here is doing a specific job.

                · The colour moved off #d8d0bc, which is the yellow everyone
                  reaches for and reads as "old plastic" rather than as plastic.
                  Cases of this era left the factory a warm light GREY and
                  yellowed unevenly with age — starting from the grey and
                  letting the mottle in the roughness map carry the aging is
                  both truer and quieter against a neutral sweep.
                · roughness 0.62 with a MAP rather than a flat number: the map
                  is the whole point, because a constant roughness gives one
                  clean highlight and that single unbroken specular is the tell
                  that a surface is CG.
                · A trace of clearcoat. Moulded plastic has a thin, harder skin
                  where it met the mould wall, so there is a faint second,
                  sharper reflection sitting on top of the diffuse one. Without
                  it the case reads as unglazed pottery. */}
            <meshPhysicalMaterial
              color="#ddd8cc"
              roughness={0.62}
              roughnessMap={casePlastic}
              clearcoat={0.28}
              clearcoatRoughness={0.55}
              metalness={0}
            />
          </RoundedBox>
          {/* Rear housing: stepped in from the shell, then a smaller cap
              behind that, so the body narrows toward the back. */}
          <RoundedBox
            args={[CASING_W * 0.86, CASING_H * 0.84, 0.17]}
            radius={0.05}
            smoothness={5}
            position={[0, CASING_Y + 0.01, PANEL_FACE_Z - SHELL_DEPTH - 0.07]}
            castShadow
          >
            <meshStandardMaterial color="#d3cec2" roughness={0.66} roughnessMap={casePlastic} />
          </RoundedBox>
          <RoundedBox
            args={[CASING_W * 0.62, CASING_H * 0.6, 0.14]}
            radius={0.06}
            smoothness={5}
            position={[0, CASING_Y + 0.01, PANEL_FACE_Z - SHELL_DEPTH - 0.2]}
            castShadow
          >
            <meshStandardMaterial color="#cbc6ba" roughness={0.7} />
          </RoundedBox>

          {/* The lip round the glass. Four beige strips, angled inward, so the
              screen sits at the bottom of a shallow moulded well instead of
              being printed on the front of the case. This is the single detail
              that most separates a CRT from a flat panel. */}
          {[
            { pos: [0, SCREEN.y + SCREEN.h / 2 + 0.012, 0], size: [SCREEN.w + 0.05, 0.026, 0.012], rot: [0.5, 0, 0] },
            { pos: [0, SCREEN.y - SCREEN.h / 2 - 0.012, 0], size: [SCREEN.w + 0.05, 0.026, 0.012], rot: [-0.5, 0, 0] },
            { pos: [-SCREEN.w / 2 - 0.012, SCREEN.y, 0], size: [0.026, SCREEN.h + 0.05, 0.012], rot: [0, 0.5, 0] },
            { pos: [SCREEN.w / 2 + 0.012, SCREEN.y, 0], size: [0.026, SCREEN.h + 0.05, 0.012], rot: [0, -0.5, 0] },
          ].map((l, k) => (
            <mesh key={k} position={[l.pos[0], l.pos[1], PANEL_FACE_Z + 0.001]} rotation={l.rot}>
              <boxGeometry args={l.size} />
              <meshStandardMaterial color="#c9c4b8" roughness={0.6} />
            </mesh>
          ))}

          {/* The dark recess the tube sits in.

              A CRT's glass is not flush with the plastic — it is sunk behind a
              lip, and the gap between the two is in shadow. That dark ring is
              most of what distinguishes a tube from a flat panel, and at the
              old +0.02 it was a 10mm hairline nobody could see. At +0.075 it
              reads as a real recess with the case standing proud of it. */}
          <mesh position={[0, SCREEN.y, PANEL_FACE_Z - 0.001]}>
            <planeGeometry args={[SCREEN.w + 0.02, SCREEN.h + 0.02]} />
            <meshStandardMaterial color="#1a1816" roughness={0.8} />
          </mesh>

          {/* Top Vents */}
          {Array.from({ length: 8 }, (_, k) => (
            <mesh
              key={k}
              position={[-0.3 + k * 0.085, CASING_Y + 0.01 + (CASING_H * 0.84) / 2 + 0.0005, PANEL_FACE_Z - SHELL_DEPTH - 0.075]}
            >
              <boxGeometry args={[0.04, 0.003, 0.12]} />
              <meshStandardMaterial color="#22201b" roughness={0.8} />
            </mesh>
          ))}

          {/* The maker's mark, low and left on the chin — the position every
              one of these had, because the controls lived on the right. */}
          <mesh position={[-0.28, CHIN_Y, PANEL_FACE_Z + 0.0015]}>
            <planeGeometry args={[0.34, 0.085]} />
            <meshBasicMaterial map={badge} transparent depthWrite={false} toneMapped={false} />
          </mesh>

          {/* Controls and the power LED, on the right of the chin. */}
          <group position={[0.42, CHIN_Y, PANEL_FACE_Z + 0.002]}>
            <mesh position={[-0.05, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.008, 16]} />
              <meshStandardMaterial color="#a8a396" roughness={0.55} />
            </mesh>
            <mesh position={[-0.02, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.008, 16]} />
              <meshStandardMaterial color="#a8a396" roughness={0.55} />
            </mesh>
            <mesh position={[0.03, 0, 0]}>
              <sphereGeometry args={[0.006, 12, 12]} />
              <meshBasicMaterial color="#22c55e" toneMapped={false} />
            </mesh>
          </group>

          {/* Horizontal 1995 PC Desktop Case Unit under Monitor (Resting flat on desk) */}
          {/* Desk top is at 0.70 and the case is 0.146 tall, so its centre is
              0.773 and its lid lands at 0.846 — 7mm under the monitor, which
              the plinth below takes up. It was centred at 0.795, which left a
              2cm gap of daylight under the case and sank the monitor 1.7cm
              into its lid. */}
          <group position={[0, 0.773, -0.14]}>
            {/* Main Beige Desktop Case Chassis */}
            <RoundedBox
              args={[0.86, 0.146, 0.46]}
              radius={0.012}
              smoothness={4}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial
                color="#dad5c8"
                roughness={0.62}
                roughnessMap={casePlastic}
                clearcoat={0.2}
                clearcoatRoughness={0.55}
              />
            </RoundedBox>

            {/* Front Panel Inset Bezel Section */}
            <mesh position={[0, 0, 0.2305]}>
              <planeGeometry args={[0.83, 0.122]} />
              <meshStandardMaterial color="#d2ccbf" roughness={0.7} />
            </mesh>

            {/* 3.5" Floppy Disk Drive Slot (Right side of front face) */}
            <group position={[0.24, 0.008, 0.2315]}>
              {/* Drive Recess */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.14, 0.045, 0.008]} />
                <meshStandardMaterial color="#22201c" roughness={0.8} />
              </mesh>
              {/* Floppy Eject Slot */}
              <mesh position={[0, 0.003, 0.003]}>
                <boxGeometry args={[0.1, 0.005, 0.004]} />
                <meshStandardMaterial color="#0d0d0d" />
              </mesh>
              {/* Eject Button */}
              <mesh position={[0.04, -0.01, 0.004]}>
                <boxGeometry args={[0.015, 0.009, 0.006]} />
                <meshStandardMaterial color="#c0bba9" roughness={0.5} />
              </mesh>
              {/* Drive Activity LED */}
              <mesh position={[-0.04, -0.01, 0.004]}>
                <sphereGeometry args={[0.003, 10, 10]} />
                <meshBasicMaterial color="#ef4444" toneMapped={false} />
              </mesh>
            </group>

            {/* Power Push Button & Brand Badge (Left side of front face) */}
            <group position={[-0.26, -0.01, 0.2315]}>
              {/* Round Power Button */}
              <mesh position={[-0.05, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.008, 20]} />
                <meshStandardMaterial color="#aba696" roughness={0.5} />
              </mesh>
              {/* Reset Button */}
              <mesh position={[-0.02, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.006, 16]} />
                <meshStandardMaterial color="#8a8577" roughness={0.5} />
              </mesh>
              {/* Green Power LED */}
              <mesh position={[0.015, 0, 0]}>
                <sphereGeometry args={[0.004, 12, 12]} />
                <meshBasicMaterial color="#22c55e" toneMapped={false} />
              </mesh>
            </group>

            {/* Tilt-and-swivel plinth between the case lid and the monitor.
                Same beige as the rest of the machine: it was #cfcadc, a pale
                lilac, which is why there was a purple disc under the screen. */}
            <mesh position={[0, 0.0765, 0.02]}>
              <cylinderGeometry args={[0.3, 0.33, 0.012, 48]} />
              <meshStandardMaterial color="#cfc9bb" roughness={0.7} />
            </mesh>
            {/* Four rubber feet, so the case sits on the desk, not in it. */}
            {[
              [-0.38, -0.19],
              [0.38, -0.19],
              [-0.38, 0.19],
              [0.38, 0.19],
            ].map(([fx, fz]) => (
              <mesh key={`${fx}${fz}`} position={[fx, -0.0745, fz]}>
                <cylinderGeometry args={[0.016, 0.016, 0.004, 12]} />
                <meshStandardMaterial color="#2a2926" roughness={0.9} />
              </mesh>
            ))}
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
      {/* The aluminium arm and oval foot belong to the MODERN display only.
          They used to render in both eras, so the beige CRT had a brushed
          aluminium blade and a chrome foot buried inside its own base unit,
          poking out of the back and through the floppy drive. */}
      {era !== 'RETRO' && (
        <group>
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

        </group>
      )}

      {/* ---------------------------------------------------------- Screen Glass (ROOM View — 3D Wallpaper) */}
      {/* Sits at SCREEN.z, which layout.js guarantees is in front of the panel
          face. Put it behind and the casing swallows it — the display goes dead
          grey and the wallpaper never renders. */}
      {/* ---------------------------------------------------------- HTML Desktop OS (Permanently Mounted Virtual Display) */}
      {/* Kept permanently mounted at SCREEN.z so that everything done on the monitor
          (open windows, active tabs, inputs, scroll states) stays persistent when flying out to room view. */}
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
          borderRadius: '6px',
          opacity: 1,
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
          era={era}
          pendingApp={pendingApp}
          onPendingHandled={onPendingHandled}
          onScreenFocus={onScreenFocus}
          scanlines={isZoomed}
        />
      </Html>

      {/* Bloom Ambient Screen Glow.

          It sits BEHIND the panel now, not 26mm in front of the glass. In
          front, an additive plane 1.55x the size of the display painted a
          blue-white blob straight over the desktop — from the room the screen
          read as "a monitor that is on" and nothing more, and the whole point
          of painting a readable Windows desktop onto it was lost. Behind the
          casing, the same plane spills light around the monitor's edges onto
          the desk and the backdrop, which is what the glow was always for. */}
      <mesh
        ref={haloRef}
        position={[0, SCREEN.y, PANEL_FACE_Z - 0.02 - CASING_DEPTH]}
        {...(isZoomed ? noRaycast : {})}
      >
        <planeGeometry args={[SCREEN.w * 1.55, SCREEN.h * 1.65]} />
        <meshBasicMaterial
          map={halo}
          transparent
          opacity={0.18}
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
