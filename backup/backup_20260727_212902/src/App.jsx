import { useCallback, useEffect, useRef, useState } from 'react'
import SceneCanvas from './components/3D/SceneCanvas'
import Overlay from './components/UI/Overlay'
import { useWindowManager } from './hooks/useWindowManager'
import audio from './audio/AudioEngine'
import { tracks } from './data/portfolio'

/* ==========================================================================
   App — the root state machine.

   viewState drives everything: the camera rig reads it to know where to fly,
   the monitor reads it to know whether it is hoverable, and DesktopOS reads
   it to know whether the screen should accept pointer events.

     ROOM ──click monitor──▶ ZOOMING_IN ──▶ MONITOR_ZOOMED
      ▲                                            │
      └────────── ZOOMING_OUT ◀──── ESC / button ──┘

   The two ZOOMING_* states are not decoration — they exist so nothing is
   clickable mid-flight, which is what stops a second click from firing a
   transition on top of the one already running.
   ========================================================================== */

export default function App() {
  const [viewState, setViewState] = useState('ROOM')
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)
  const [hasBooted, setHasBooted] = useState(false)
  const [powerCycle, setPowerCycle] = useState(0)

  // Interactive Room States & Lighting Themes
  const [roomTheme, setRoomTheme] = useState('DEFAULT') // DEFAULT, CYBERPUNK, SUNSET, MATRIX
  const [lampOn, setLampOn] = useState(true)
  const [pcPower, setPcPower] = useState(true)

  const toggleLamp = useCallback(() => {
    audio.unlock()
    audio.switchToggle()
    setLampOn((v) => !v)
  }, [])

  const togglePcPower = useCallback(() => {
    audio.unlock()
    audio.switchToggle()
    setPcPower((v) => !v)
  }, [])

  const cycleTheme = useCallback(() => {
    audio.unlock()
    audio.switchToggle()
    const themes = ['DEFAULT', 'CYBERPUNK', 'SUNSET', 'MATRIX']
    setRoomTheme((curr) => {
      const idx = themes.indexOf(curr)
      return themes[(idx + 1) % themes.length]
    })
  }, [])

  const windowManager = useWindowManager({
    onOpen: () => audio.blip(true),
    onClose: () => audio.blip(false),
    onFocus: () => audio.click(),
  })
  const { closeAll } = windowManager

  const transitionRef = useRef(null)

  /* --------------------------------------------------------- transitions */

  const zoomToMonitor = useCallback(() => {
    if (viewState !== 'ROOM') return

    // Unlock Web Audio API on gesture
    audio.unlock()
    audio.setMuted(muted)

    setViewState('ZOOMING_IN')
    setPowerCycle((n) => n + 1)

    window.clearTimeout(transitionRef.current)
    transitionRef.current = window.setTimeout(() => {
      setViewState('MONITOR_ZOOMED')
      setHasBooted(true)
      audio.powerOn()
    }, 1400)
  }, [viewState, muted])

  const zoomToRoom = useCallback(() => {
    if (viewState !== 'MONITOR_ZOOMED') return
    audio.powerOff()
    setViewState('ZOOMING_OUT')

    window.clearTimeout(transitionRef.current)
    transitionRef.current = window.setTimeout(() => setViewState('ROOM'), 1400)
  }, [viewState])

  useEffect(() => () => window.clearTimeout(transitionRef.current), [])

  /* ------------------------------------------------------------ shortcuts */

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      if (e.key === 'Escape' && viewState === 'MONITOR_ZOOMED') {
        zoomToRoom()
        return
      }
      if (!isInput && (e.key === 't' || e.key === 'T') && viewState === 'ROOM') {
        cycleTheme()
        return
      }
      // Enter from the room view is the keyboard equivalent of clicking the CRT.
      if ((e.key === 'Enter' || e.key === ' ') && viewState === 'ROOM') {
        if (tag !== 'BUTTON' && !isInput) {
          e.preventDefault()
          zoomToMonitor()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewState, zoomToRoom, zoomToMonitor, cycleTheme])

  // Global Mouse Click Sound (Henry Heffernan tactile clicks only)
  useEffect(() => {
    const handleGlobalClick = () => {
      audio.unlock()
      audio.setMuted(muted)
      // Play crisp tactile mouse click sound on every gesture
      audio.click()
    }

    window.addEventListener('pointerdown', handleGlobalClick)
    return () => window.removeEventListener('pointerdown', handleGlobalClick)
  }, [muted])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      audio.unlock()
      audio.setMuted(next)
      if (!next) audio.click()
      return next
    })
  }, [])

  return (
    <div className="relative h-full w-full bg-room">
      <SceneCanvas
        viewState={viewState}
        roomTheme={roomTheme}
        lampOn={lampOn}
        pcPower={pcPower}
        onToggleLamp={toggleLamp}
        onTogglePcPower={togglePcPower}
        onMonitorClick={zoomToMonitor}
        onReady={() => setReady(true)}
        windowManager={windowManager}
        hasBooted={hasBooted}
        powerCycle={powerCycle}
        muted={muted}
        onToggleMute={toggleMute}
      />

      <Overlay
        viewState={viewState}
        ready={ready}
        muted={muted}
        roomTheme={roomTheme}
        onCycleTheme={cycleTheme}
        onToggleMute={toggleMute}
        onZoomOut={zoomToRoom}
        onEnter={zoomToMonitor}
      />
    </div>
  )
}
