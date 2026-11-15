import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import Overlay from './components/UI/Overlay'
import LoadingScreen from './components/UI/LoadingScreen'
import FlatSite from './components/UI/FlatSite'
import PhotoMode from './components/UI/PhotoMode'
import { useDevice } from './hooks/useDevice'
import { useWindowManager } from './hooks/useWindowManager'
import audio from './audio/AudioEngine'

/* The 3D scene is its own chunk. three.js, the fibre renderer, drei and the
   post-processing library are roughly a megabyte of JavaScript between them,
   and they used to be in the same file as the BIOS screen — so on a slow
   connection the visitor stared at a blank black page until all of it had
   downloaded and parsed. Split out, the POST screen paints from a small first
   chunk almost immediately and the scene loads behind it, which is the job a
   loading screen is supposed to be doing in the first place. */
const SceneCanvas = lazy(() => import('./components/3D/SceneCanvas'))

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
  /* Phones, anything without WebGL, and anyone who asked for reduced motion
     get the readable site instead of a 3D scene they cannot drive. Checked
     before any of the room state exists, so none of it is even constructed. */
  const device = useDevice()

  const [viewState, setViewState] = useState('ROOM')
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)

  /* RETRO is the default now. The Win95 chrome was already built and sitting
     behind a toggle almost nobody would find — flat panels, hard bevels, no
     blur and no shadow. Against a restrained studio backdrop that reads as a
     deliberate period machine; the soft macOS chrome read as a second, unrelated
     design language competing with the room. MODERN is still one click away. */
  const [era, setEra] = useState(() => {
    try {
      return localStorage.getItem('portfolio_era') || 'RETRO'
    } catch {
      return 'RETRO'
    }
  })

  const toggleEra = useCallback(() => {
    audio.switchToggle()
    setEra((prev) => {
      const next = prev === 'MODERN' ? 'RETRO' : 'MODERN'
      try {
        localStorage.setItem('portfolio_era', next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  /* Set when a room prop is clicked. The app cannot open until the camera has
     actually arrived — opening it mid-flight means the window animates in on
     a screen the viewer cannot read yet. */
  const [pendingApp, setPendingApp] = useState(null)
  const [hoveredProp, setHoveredProp] = useState(null)

  /* Whether the pointer is on the glass. Reported by the desktop's own root
     element rather than by a raycast — see DesktopOS. Drives how far the
     camera leans in while seated. */
  const [screenFocused, setScreenFocused] = useState(false)

  /* One appearance drives both worlds: the room's materials and lighting, and
     the desktop's chrome. Splitting them would let you end up with a sunlit
     studio containing a monitor in dark mode. */
  const [appearance, setAppearance] = useState('LIGHT')
  const toggleAppearance = useCallback(() => {
    audio.switchToggle()
    setAppearance((a) => (a === 'LIGHT' ? 'DARK' : a === 'DARK' ? 'OVERHEAD' : 'LIGHT'))
  }, [])

  /* Readiness is whichever comes first: the canvas reporting a painted frame,
     or a wall-clock deadline. The deadline is a LAST RESORT, nine seconds, not
     the 600ms it used to be — at 600ms it always won, so START appeared before
     the scene existed and clicking it promptly showed an empty backdrop. The deadline is not a nicety — a throttled or
     backgrounded tab may deliver no frames at all, and without it the loading
     screen can stay up indefinitely on a scene that is actually finished. */
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 9000)
    return () => window.clearTimeout(id)
  }, [])

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
    // Minimising keeps the window alive, so it gets the softer click, not the
    // descending close tone.
    onMinimize: () => audio.click(),
    onFocus: () => audio.click(),
  })

  const transitionRef = useRef(null)

  /* SCROLL GUARD — the fix for the monitor going black.

     The desktop is DOM, projected onto the monitor by a CSS 3D transform
     inside a wrapper that is `overflow: hidden`. Hidden overflow stops the
     USER scrolling an element; it does not stop the BROWSER. Focusing an input
     (the MS-DOS prompt, the contact form), tabbing to a link, or any
     scrollIntoView makes the browser scroll that wrapper to bring the focused
     element "into view" — and because the wrapper's content is a perspective
     projection, a 25px scroll moves the desktop thousands of pixels off the
     glass. The screen goes dark, every click lands on the room instead of the
     desktop, and nothing recovers it short of a reload.

     Nothing outside the desktop is ever meant to scroll, so any scroll on an
     element that is not inside `[data-os-screen]` is put straight back. Scroll
     events do not bubble, hence the capture phase. */
  useEffect(() => {
    const onScroll = (e) => {
      const el = e.target
      if (!el || el === document || !el.closest) return
      if (el.closest('[data-os-screen]')) return
      if (el.scrollTop !== 0) el.scrollTop = 0
      if (el.scrollLeft !== 0) el.scrollLeft = 0
    }
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [])

  /* --------------------------------------------------------- transitions */

  const zoomToMonitor = useCallback(() => {
    if (viewState !== 'ROOM') return

    // Unlock Web Audio API on gesture
    audio.unlock()
    audio.setMuted(muted)

    setViewState('ZOOMING_IN')

    window.clearTimeout(transitionRef.current)
    transitionRef.current = window.setTimeout(() => {
      setViewState('MONITOR_ZOOMED')
      audio.powerOn()
    }, 850)
  }, [viewState, muted])

  /* Clicking an object in the room flies to the desk and opens what that
     object refers to. This is what turns the 3D from a lobby into an index. */
  const openFromRoom = useCallback(
    (appId, focusId) => {
      setPendingApp({ appId, focusId })
      setHoveredProp(null)
      zoomToMonitor()
    },
    [zoomToMonitor],
  )

  const zoomToRoom = useCallback(() => {
    if (viewState !== 'MONITOR_ZOOMED') return
    audio.powerOff()
    setViewState('ZOOMING_OUT')

    window.clearTimeout(transitionRef.current)
    transitionRef.current = window.setTimeout(() => setViewState('ROOM'), 850)
  }, [viewState])

  useEffect(() => () => window.clearTimeout(transitionRef.current), [])

  /* ------------------------------------------------------------ shortcuts */

  const [photoMode, setPhotoMode] = useState(false)

  const handleTakeSnap = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const offscreen = document.createElement('canvas')
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    const ctx = offscreen.getContext('2d')

    ctx.drawImage(canvas, 0, 0)

    const fontSize = Math.max(14, Math.floor(canvas.height * 0.025))
    ctx.font = `600 ${fontSize}px monospace`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
    ctx.shadowBlur = 6

    const text = 'adarshsahu.dev · 3D Portfolio'
    const textWidth = ctx.measureText(text).width
    const x = canvas.width - textWidth - 24
    const y = canvas.height - 24

    ctx.fillText(text, x, y)

    const dataUrl = offscreen.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `adarsh-room-${Date.now()}.png`
    a.click()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      if (e.key === 'Escape') {
        if (photoMode) {
          setPhotoMode(false)
          return
        }
        if (viewState === 'MONITOR_ZOOMED') {
          zoomToRoom()
          return
        }
      }
      if (!isInput && (e.key === 'p' || e.key === 'P')) {
        setPhotoMode((p) => !p)
        return
      }
      if (!isInput && (e.key === 't' || e.key === 'T') && viewState === 'ROOM') {
        cycleTheme()
        return
      }
      // Enter from the room view is the keyboard equivalent of clicking the CRT.
      if (e.key === 'Enter' && viewState === 'ROOM' && entered) {
        if (tag !== 'BUTTON' && !isInput) {
          e.preventDefault()
          zoomToMonitor()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewState, zoomToRoom, zoomToMonitor, cycleTheme, photoMode, entered])

  /* Entry gesture — enters the room and sets entered state */
  const enterRoom = useCallback(() => {
    setEntered(true)
  }, [])

  /* "Click anywhere to begin" has to mean anywhere, so entry is bound to the
     whole stage rather than to the monitor mesh — the room is one big button.

     The catch is that OrbitControls is also listening: a drag to look around
     ends in a click event too, and without this the camera would fly to the
     desk every time somebody swung the view. So the gesture is measured, not
     assumed. A pointer that travelled more than a few pixels between down and
     up was a drag and is ignored; anything below that threshold is a genuine
     click. Controls (the HUD slabs) opt out entirely — they run their own
     action and must not also enter the room. */
  const pressRef = useRef(null)

  const onStagePointerDown = useCallback((e) => {
    pressRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onStagePointerUp = useCallback(
    (e) => {
      const down = pressRef.current
      pressRef.current = null
      if (!down) return
      /* The BIOS screen is a child of this stage, so the click that dismisses
         it used to arrive here as well and fly the camera to the desk in the
         same instant: anyone who clicked beside the START button skipped the
         room entirely and landed at the monitor. */
      if (!entered) return
      if (e.target.closest?.('button, a, input, textarea')) return

      const travelled = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      if (travelled > 6) return

      if (viewState === 'ROOM') {
        zoomToMonitor()
        return
      }

      /* Clicking the room while seated stands you up.

         `[data-os-screen]` is the boundary. Everything inside it is the
         machine — the desktop is a real DOM tree, so a click on a window, an
         icon or the taskbar lands on an element inside that subtree and must
         be left entirely alone. A click that reaches here from anywhere else
         landed on the room: the desk, the sweep, the casing around the glass.
         That is the same gesture as pushing your chair back, so it is what it
         does. Without this the only way out was the ESC key, which is not a
         thing most visitors will try. */
      if (viewState === 'MONITOR_ZOOMED' && !e.target.closest?.('[data-os-screen]')) {
        zoomToRoom()
      }
    },
    [viewState, zoomToMonitor, zoomToRoom, entered],
  )

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      audio.unlock()
      audio.setMuted(next)
      if (!next) audio.click()
      return next
    })
  }, [])

  if (device.flat) return <FlatSite reason={device.reason} />

  return (
    <div
      className="relative h-full w-full bg-room"
      onPointerDown={onStagePointerDown}
      onPointerUp={onStagePointerUp}
    >
      <Suspense fallback={null}>
      <SceneCanvas
        viewState={viewState}
        roomTheme={roomTheme}
        appearance={appearance}
        era={era}
        onToggleEra={toggleEra}
        onToggleAppearance={toggleAppearance}
        lampOn={lampOn}
        pcPower={pcPower}
        onToggleLamp={toggleLamp}
        onTogglePcPower={togglePcPower}
        onMonitorClick={zoomToMonitor}
        screenFocused={screenFocused}
        onScreenFocus={setScreenFocused}
        onOpenApp={openFromRoom}
        onHoverProp={setHoveredProp}
        pendingApp={pendingApp}
        onPendingHandled={() => setPendingApp(null)}
        entered={entered}
        onReady={() => setReady(true)}
        windowManager={windowManager}
        muted={muted}
        onToggleMute={toggleMute}
      />
      </Suspense>

      {!photoMode && (
        <Overlay
          viewState={viewState}
          hoveredProp={hoveredProp}
          ready={entered}
          muted={muted}
          roomTheme={roomTheme}
          appearance={appearance}
          onToggleAppearance={toggleAppearance}
          onCycleTheme={cycleTheme}
          onToggleMute={toggleMute}
          onZoomOut={zoomToRoom}
        />
      )}

      <PhotoMode
        active={photoMode}
        onClose={() => setPhotoMode(false)}
        onTakeSnap={handleTakeSnap}
      />

      {!entered && <LoadingScreen ready={ready} onEnter={enterRoom} />}
    </div>
  )
}
