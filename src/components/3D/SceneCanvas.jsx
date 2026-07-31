import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Environment, Lightformer, Preload } from '@react-three/drei'
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
import WorldCursor from './WorldCursor'

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

   <Environment> is a REFLECTION probe, not a light source. That distinction
   is the whole reason this room used to look like clay: at the default
   environmentIntensity of 1 the env map was supplying most of the actual
   illumination, and image-based light cannot cast a shadow — so no object had
   a dark side and nothing sat on the floor, no matter how many lights were
   added. Keeping envI low and letting the shadow-casting key carry the
   exposure is what gives every object its form. Without any env map at all,
   metal and glossy plastic have nothing to reflect and read as flat paint, so
   it still earns its place; it just must not do the lighting.
   ========================================================================== */

/* Two completely different lighting problems, not one with a slider.
   A bright room is dominated by a big soft sky source and needs almost no
   bloom; a night room is dominated by one warm practical and needs the bloom
   to sell it. Trying to serve both from one rig is what made the old scene
   read as muddy grey rather than as either. */
const LIGHTING = {
  LIGHT: {
    background: '#c8c3ba',
    fog: ['#c8c3ba', 9, 26],
    ambient: '#d0d6e8',
    ambientI: 0.12,
    hemi: ['#ffffff', '#b8bdcc', 0.12],
    keyI: 3.6,
    envI: 0.3,
    rimI: 0.35,
    exposure: 1.0,
    bloom: 0.15,
    bloomThreshold: 0.85,
    vignette: 0.26,
    contrast: 0.1,
  },
  DARK: {
    background: '#0b0b0c',
    fog: ['#0b0b0c', 7, 20],
    ambient: '#9aa0c0',
    ambientI: 0.16,
    hemi: ['#3a3850', '#12101a', 0.14],
    keyI: 1.1,
    envI: 0.5,
    rimI: 0.8,
    exposure: 1.05,
    bloom: 0.6,
    bloomThreshold: 0.72,
    vignette: 0.55,
    contrast: 0.12,
  },
  OVERHEAD: {
    background: '#d2cec6',
    fog: ['#d2cec6', 10, 28],
    ambient: '#d8dce8',
    ambientI: 0.24,
    hemi: ['#ffffff', '#a8acbc', 0.22],
    keyI: 3.6,
    envI: 0.4,
    rimI: 0.3,
    exposure: 0.9,
    bloom: 0.05,
    bloomThreshold: 0.95,
    vignette: 0.18,
    contrast: 0.06,
  },
}

export default function SceneCanvas({
  viewState,
  appearance = 'LIGHT',
  era = 'MODERN',
  onToggleEra,
  lampOn = true,
  pcPower = true,
  onToggleLamp,
  onTogglePcPower,
  onMonitorClick,
  screenFocused,
  onScreenFocus,
  onOpenApp,
  onHoverProp,
  pendingApp,
  onPendingHandled,
  onReady,
  windowManager,
  muted,
  onToggleMute,
  onToggleAppearance,
}) {
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
        preserveDrawingBuffer: true,
      }}
      camera={{
        position: VIEWS.ROOM.position,
        fov: 34,
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

      {/* NOTE: do not reintroduce drei's <SoftShadows> here.
          It patches three's shadow shader with a PCSS implementation that
          three r185 has outgrown: r185 defines vogelDiskSample() itself (so
          the injection redefines it — "function already has a body") and its
          shadow maps are now depth textures, so the injected
          unpackRGBAToDepth(texture2D(shadowMap, …)) no longer type-checks.
          The result is that EVERY MeshStandardMaterial and
          MeshPhysicalMaterial fails to compile and the room renders empty
          white — which is exactly what it was doing.
          r185's built-in PCF already does Vogel-disk soft shadows, so the
          softness comes for free from shadow-radius on the light. */}
      {/* ------------------------------------------------------------ lights */}
      <ambientLight color={L.ambient} intensity={L.ambientI} />
      <hemisphereLight args={L.hemi} />

      {/* Cold rim from the window side. Its job is to peel the furniture off
          the back wall, not to cast anything, so no shadow map. */}
      <directionalLight position={[4.5, 3.0, 1.2]} color="#dfe4ec" intensity={L.rimI} />

      {/* Weak top-down fill so the room still has a floor with the lamp off,
          without ever becoming the dominant source. */}
      {/* In LIGHT this is the key: broad daylight from the window side, and
          the only thing lighting the room when the lamp is off. */}
      {/* This is the only light in the room with a shadow map, and it is what
          separates the scene from a clay render. Without it every surface was
          lit from all sides at once: no shape had a dark side, nothing sat on
          the floor, and the corners were as bright as the middle. One ortho
          shadow camera sized to the room is a single extra pass over the ~54
          casters — cheap for the thing that gives every object its form. */}
      <directionalLight
        position={[5.2, 3.6, 2.4]}
        color={isLight ? '#ffffff' : '#ffe9d0'}
        intensity={isLight ? L.keyI : lampOn ? L.keyI : 0.8}
        castShadow
        shadow-mapSize={[3072, 3072]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        // Softness comes from the radius; r185's PCF does the Vogel disk.
        shadow-radius={1.1}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
      />

      <Suspense fallback={null}>
        {/* Reflection probe. frames={1} bakes it once — nothing in the room
            moves enough to justify re-rendering it every frame. */}
        <Environment resolution={256} frames={1} background={false} environmentIntensity={L.envI}>
          <Lightformer
            intensity={isLight ? 1.0 : 2.4}
            color={isLight ? '#fff2df' : '#ffb057'}
            position={[-1.2, 1.6, 0.4]}
            scale={[1.2, 1.2, 1]}
          />
          <Lightformer
            intensity={1.6}
            color="#dfe4ec"
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
          appearance={appearance}
          onToggleAppearance={onToggleAppearance}
          era={era}
          onToggleEra={onToggleEra}
          lampOn={lampOn}
          pcPower={pcPower}
          onToggleLamp={onToggleLamp}
          onTogglePcPower={onTogglePcPower}
          onOpenApp={onOpenApp}
          onHoverProp={onHoverProp}
        />
        {/* WorldCursor is unmounted. It drew a glowing blue orb on a plane in
            front of the desk that tracked the pointer, carried its own point
            light, and swapped to a cyan cone near the screen. On an empty grey
            sweep it read as a rendering artefact — a small blue dot floating in
            the middle of nothing — and it was the only saturated colour in the
            room view. It also ran a raycast every single frame to place it. */}

        <CRTMonitor
          viewState={viewState}
          onClick={onMonitorClick}
          windowManager={windowManager}
          muted={muted}
          onToggleMute={onToggleMute}
          appearance={appearance}
          onToggleAppearance={onToggleAppearance}
          era={era}
          pendingApp={pendingApp}
          onPendingHandled={onPendingHandled}
          onScreenFocus={onScreenFocus}
        />

        {/* Compile every material up front so the first camera move does not
            stutter while shaders build. */}
        <Preload all />
      </Suspense>

      <CameraRig viewState={viewState} screenFocused={screenFocused} />

      {/* The composer gets its own boundary. Effects that fetch lookup
          textures suspend, and an unbounded suspend in here takes the whole
          canvas with it — no renderer, no first frame, and the loading screen
          never lifts. */}
      <Suspense fallback={null}>
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={zoomed ? Math.min(0.28, L.bloom) : L.bloom}
            luminanceThreshold={zoomed ? 0.9 : L.bloomThreshold}
            luminanceSmoothing={0.3}
            kernelSize={KernelSize.MEDIUM}
            mipmapBlur
          />
          <HueSaturation saturation={0} />
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
        framesRendered: gl.info.render.frame,
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
