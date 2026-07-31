import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Preload } from '@react-three/drei'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import CameraRig, { VIEWS } from './CameraRig'
import RoomScene from './RoomScene'
import CRTMonitor from './CRTMonitor'

/* ==========================================================================
   SceneCanvas — renderer setup, lighting, and the two things in the scene.

   Lighting is a three-source rig rather than a lit-from-everywhere ambient:

     · a warm ambient fill (#ffebd6) that keeps shadows from going pure black
     · the desk lamp, the only shadow caster, warm and close (in DeskLamp)
     · the CRT's cyan phosphor spilling forward onto the keyboard (in CRTMonitor)

   A cold rim from the window balances the lamp on the opposite side, so the
   room reads as "late night, one lamp on" instead of "evenly lit product shot".
   ========================================================================== */

export default function SceneCanvas({
  viewState,
  roomTheme = 'DEFAULT',
  lampOn = true,
  pcPower = true,
  onToggleLamp,
  onTogglePcPower,
  onMonitorClick,
  onReady,
  windowManager,
  hasBooted,
  powerCycle,
  muted,
  onToggleMute,
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows={{ type: PCFSoftShadowMap }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        // The DOM screen is opaque, so there is nothing to composite against.
        alpha: false,
        stencil: false,
      }}
      camera={{
        position: VIEWS.ROOM.position,
        fov: 42,
        near: 0.05,
        far: 60,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.5
      }}
    >
      <color attach="background" args={['#1e1e24']} />

      {/* ------------------------------------------------------------ lights */}
      <ambientLight color="#ffffff" intensity={1.8} />

      {/* Main Overhead Room Light */}
      <directionalLight position={[0, 4, 3]} color="#ffffff" intensity={2.0} castShadow />

      {/* Side Accent Counter-Light */}
      <directionalLight position={[4.5, 3.2, 1.5]} color="#93c5fd" intensity={0.8} />

      {/* Soft Floor Bounce */}
      <hemisphereLight args={['#ffffff', '#27272a', 0.8]} />

      <Suspense fallback={null}>
        <RoomScene
          viewState={viewState}
          roomTheme={roomTheme}
          lampOn={lampOn}
          pcPower={pcPower}
          onToggleLamp={onToggleLamp}
          onTogglePcPower={onTogglePcPower}
        />

        <CRTMonitor
          viewState={viewState}
          onClick={onMonitorClick}
          windowManager={windowManager}
          hasBooted={hasBooted}
          powerCycle={powerCycle}
          muted={muted}
          onToggleMute={onToggleMute}
        />

        <Preload all />
      </Suspense>

      <CameraRig viewState={viewState} />

      {/* Drop resolution rather than frame rate when the GPU is struggling. */}
      <AdaptiveDpr pixelated={false} />

      <ReadySignal onReady={onReady} />
    </Canvas>
  )
}

/** Fires once the renderer exists, so App can fade the loading screen out. */
function ReadySignal({ onReady }) {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    if (!gl) return
    // One frame of slack so the first paint has actually landed.
    const id = requestAnimationFrame(() => onReady?.())
    return () => cancelAnimationFrame(id)
  }, [gl, onReady])

  return null
}
