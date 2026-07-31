import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Environment, Lightformer, Preload, SoftShadows } from '@react-three/drei'
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { ACESFilmicToneMapping, PCFShadowMap, Vector2 } from 'three'
import CameraRig, { VIEWS } from './CameraRig'
import RoomScene from './RoomScene'
import CRTMonitor from './CRTMonitor'

/* ==========================================================================
   SceneCanvas — renderer setup, lighting rig and post.

   The look is "late evening, desk lamp on, monitor doing most of the work".
   That only reads if ambient stays low: a bright uniform ambient flattens
   every material into the same matte grey no matter how good the geometry is.
   So the budget goes into practical sources instead —

     KEY    desk lamp, warm tungsten, the only shadow caster (in DeskLamp)
     FILL   window, cold moonlight, opposite side, casts nothing
     GLOW   the monitor's own light spilling onto the keyboard (in CRTMonitor)
     BOUNCE hemisphere, very low, so undersides are not solid black

   <Environment> does the heavy lifting for realism: without an env map, metal
   and glossy plastic have nothing to reflect and read as flat paint. The
   lightformers are shaped and coloured to match the practicals, so the
   reflections agree with the lights instead of fighting them.
   ========================================================================== */

/* Accent presets retint the practicals rather than swapping materials, so the
   room stays physically coherent in every mood. */
const THEMES = {
  DEFAULT: { rim: '#cfe0ff', sat: 0.0 },
  CYBERPUNK: { rim: '#f0abfc', sat: 0.2 },
  SUNSET: { rim: '#ffc9a3', sat: 0.14 },
  MATRIX: { rim: '#b6f0c8', sat: 0.1 },
}

/* Two completely different lighting problems, not one with a slider.
   A bright room is dominated by a big soft sky source and needs almost no
   bloom; a night room is dominated by one warm practical and needs the bloom
   to sell it. Trying to serve both from one rig is what made the old scene
   read as muddy grey rather than as either. */
const LIGHTING = {
  LIGHT: {
    background: '#eef0f4',
    fog: ['#e8eaf0', 12, 30],
    ambient: '#eef2ff',
    ambientI: 1.5,
    hemi: ['#ffffff', '#cbc7d2', 1.0],
    keyI: 2.0,
    rimI: 0.55,
    exposure: 1.0,
    bloom: 0.22,
    bloomThreshold: 0.92,
    vignette: 0.28,
    contrast: 0.02,
  },
  DARK: {
    background: '#07070a',
    fog: ['#0a0910', 7, 20],
    ambient: '#c8bfd6',
    ambientI: 0.34,
    hemi: ['#4a4260', '#140f18', 0.28],
    keyI: 0.35,
    rimI: 0.9,
    exposure: 1.05,
    bloom: 0.8,
    bloomThreshold: 0.55,
    vignette: 0.85,
    contrast: 0.09,
  },
}

export default function SceneCanvas({
  viewState,
  roomTheme = 'DEFAULT',
  appearance = 'LIGHT',
  lampOn = true,
  pcPower = true,
  onToggleLamp,
  onTogglePcPower,
  onMonitorClick,
  onReady,
  windowManager,
  muted,
  onToggleMute,
  onToggleAppearance,
}) {
  const theme = THEMES[roomTheme] ?? THEMES.DEFAULT
  const L = LIGHTING[appearance] ?? LIGHTING.LIGHT
  const isLight = appearance === 'LIGHT'

  // Sat at the desk, post has to get out of the way: a vignette would crush
  // the corners of the desktop and bloom would smear white UI text.
  const zoomed = viewState === 'MONITOR_ZOOMED'

  return (
    <Canvas
      /* Capped at 1.5 rather than 2. On a Retina panel dpr 2 means rendering
         2880x1620 — 4.7 million pixels — through a shadow pass, a bloom
         convolution and an effect pass. At 1.5 that is 2.6 million, a 44% cut
         in every per-pixel cost, and with bloom and a vignette over the top
         the difference is not visible. AdaptiveDpr drops it further if the
         machine still struggles. */
      dpr={[1, 1.5]}
      shadows={{ type: PCFShadowMap }}
      gl={{
        // MSAA is handled by the composer, which is where the final image is.
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      camera={{
        position: VIEWS.ROOM.position,
        fov: 42,
        near: 0.05,
        far: 60,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
      }}
    >
      <ToneExposure value={L.exposure} />
      <color attach="background" args={[L.background]} />
      <fog attach="fog" args={L.fog} />

      {/* Percentage-closer soft shadows — hard at contact, soft with distance,
          which is most of what separates "3D render" from "game asset".
          `samples` is a per-fragment loop in the shadow shader, so it is paid
          on every shadowed pixel: 6 keeps the softness and costs half of 12. */}
      <SoftShadows size={18} samples={6} focus={0.9} />

      {/* ------------------------------------------------------------ lights */}
      <ambientLight color={L.ambient} intensity={L.ambientI} />
      <hemisphereLight args={L.hemi} />

      {/* Cold rim from the window side. Its job is to peel the furniture off
          the back wall, not to cast anything, so no shadow map. */}
      <directionalLight position={[4.5, 3.0, 1.2]} color={theme.rim} intensity={L.rimI} />

      {/* Weak top-down fill so the room still has a floor with the lamp off,
          without ever becoming the dominant source. */}
      {/* In LIGHT this is the key: broad daylight from the window side, and
          the only thing lighting the room when the lamp is off. */}
      <directionalLight
        position={[2.6, 4.2, 2.2]}
        color={isLight ? '#ffffff' : '#ffe9d0'}
        intensity={isLight ? L.keyI : lampOn ? L.keyI : 0.8}
      />

      <Suspense fallback={null}>
        {/* Reflection probe. frames={1} bakes it once — nothing in the room
            moves enough to justify re-rendering it every frame. */}
        <Environment resolution={256} frames={1} background={false}>
          <Lightformer
            intensity={isLight ? 1.0 : 2.4}
            color={isLight ? '#fff2df' : '#ffb057'}
            position={[-1.2, 1.6, 0.4]}
            scale={[1.2, 1.2, 1]}
          />
          <Lightformer
            intensity={1.6}
            color={theme.rim}
            position={[3.2, 1.8, 0.2]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[2, 1.6, 1]}
          />
          <Lightformer
            intensity={1.1}
            color="#8ad9ff"
            position={[0, 1.3, 1.2]}
            scale={[1.6, 1.1, 1]}
          />
          {/* Ceiling bounce. In a white room this is most of what you see in
              the aluminium and the desk finish, so it is bright; in the dark
              room it is barely there. */}
          <Lightformer
            intensity={isLight ? 2.2 : 0.5}
            color={isLight ? '#ffffff' : '#2a2438'}
            position={[0, 4, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[8, 8, 1]}
          />
        </Environment>

        <RoomScene
          viewState={viewState}
          roomTheme={roomTheme}
          appearance={appearance}
          lampOn={lampOn}
          pcPower={pcPower}
          onToggleLamp={onToggleLamp}
          onTogglePcPower={onTogglePcPower}
        />

        <CRTMonitor
          viewState={viewState}
          onClick={onMonitorClick}
          windowManager={windowManager}
          muted={muted}
          onToggleMute={onToggleMute}
          appearance={appearance}
          onToggleAppearance={onToggleAppearance}
        />

        <Preload all />
      </Suspense>

      <CameraRig viewState={viewState} />

      {/* The composer gets its own boundary. Effects that fetch lookup
          textures suspend, and an unbounded suspend in here takes the whole
          canvas with it — no renderer, no first frame, and the loading screen
          never lifts. */}
      <Suspense fallback={null}>
        {/* multisampling 0: MSAA on a full-resolution HDR buffer is one of
            the most expensive things a composer can do, and the remaining
            four effects are merged by postprocessing into a single pass, so
            bloom is the only real cost left. */}
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={zoomed ? Math.min(0.28, L.bloom) : L.bloom}
            luminanceThreshold={zoomed ? 0.9 : L.bloomThreshold}
            luminanceSmoothing={0.3}
            kernelSize={KernelSize.MEDIUM}
            mipmapBlur
          />
          <HueSaturation saturation={theme.sat} />
          <BrightnessContrast brightness={0.0} contrast={zoomed ? 0.02 : L.contrast} />
          <ChromaticAberration
            offset={new Vector2(zoomed ? 0.0002 : 0.0005, zoomed ? 0.0002 : 0.0005)}
            blendFunction={BlendFunction.NORMAL}
            radialModulation
            modulationOffset={0.35}
          />
          <Vignette eskil={false} offset={0.32} darkness={zoomed ? 0.3 : L.vignette} />
        </EffectComposer>
      </Suspense>

      <AdaptiveDpr pixelated={false} />
      <ReadySignal onReady={onReady} />
    </Canvas>
  )
}

/** Exposure lives on the renderer, so it needs applying imperatively. */
function ToneExposure({ value }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMappingExposure = value
  }, [gl, value])
  return null
}

/**
 * Tells App the first real frame has landed.
 *
 * onReady is read through a ref rather than listed in the deps: App passes a
 * fresh arrow function on every render, so depending on it meant the pending
 * rAF was cancelled and rescheduled on each re-render — on a busy startup it
 * could be cancelled indefinitely and the loading screen would never lift.
 */
function ReadySignal({ onReady }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const latest = useRef(onReady)
  latest.current = onReady

  /* Scene budget probe, dev only. Draw calls scale with mesh count and again
     with every shadow caster, so these two numbers are the ones to watch when
     the frame rate drops. Call __perf() from the console. */
  useEffect(() => {
    if (!gl || !import.meta.env.DEV) return
    window.__perf = () => {
      let meshes = 0
      let shadowCasters = 0
      let lights = 0
      let shadowLights = 0
      scene.traverse((o) => {
        if (o.isMesh) {
          meshes++
          if (o.castShadow) shadowCasters++
        }
        if (o.isLight) {
          lights++
          if (o.castShadow) shadowLights++
        }
      })
      return {
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        meshes,
        shadowCasters,
        lights,
        shadowLights,
      }
    }
  }, [gl, scene])

  useEffect(() => {
    if (!gl) return undefined
    const fire = () => latest.current?.()
    let raf1 = 0
    let raf2 = 0
    // Two frames: one to flush the first render, one to be sure it painted.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(fire)
    })
    // Fallback for throttled or backgrounded tabs where rAF may never run.
    const timeout = window.setTimeout(fire, 2500)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.clearTimeout(timeout)
    }
  }, [gl])

  return null
}
