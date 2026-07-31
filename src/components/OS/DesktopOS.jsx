import { useEffect, useRef, useState } from 'react'
import { SCREEN_W, SCREEN_H, TASKBAR_H } from '../../hooks/useWindowManager'
import { OSThemeContext, OS_WIN95 } from './theme'
import Win95Icon from './Win95Icons'
import WindowContainer from './WindowContainer'
import ShowcaseApp from './apps/ShowcaseApp'
import ProjectsApp from './apps/ProjectsApp'
import ContactApp from './apps/ContactApp'
import AboutApp from './apps/AboutApp'
import ArcadeApp from './apps/ArcadeApp'
import ResumeApp from './apps/ResumeApp'
import TerminalApp from './apps/TerminalApp'
import audio from '../../audio/AudioEngine'

/* ==========================================================================
   DesktopOS — Windows 95, inside the monitor.

   This used to be a macOS desktop with a Win95 theme bolted on: an Apple menu
   bar across the top, a magnifying Dock along the bottom, wallpaper cycling,
   Spotlight. All of it has been removed, because none of it is a styling
   problem — the two systems put their furniture in different PLACES, and no
   amount of grey paint fixes a shell whose bones are in the wrong shape.

   What actually makes a desktop read as Windows 95:

   1. ONE BAR, AT THE BOTTOM. Not a menu bar at the top and a dock at the
      bottom — one taskbar, holding Start, the open windows, and the tray. The
      top edge of the screen is empty, and windows are free to sit against it.
   2. THE TASKBAR IS THE WINDOW LIST. Each open window has a button on it, and
      the focused one is drawn pressed IN. There is no other affordance for
      "what is running"; the dock's running-dot has no equivalent here.
   3. A TEAL DESKTOP. #008080 — a colour nobody would choose today, which is
      exactly why it dates the screen instantly and does more work than any
      other single value in the file.
   4. NO SOFT ANYTHING. Every raised surface is a four-tone bevel drawn with
      box-shadow: white outer top-left, light grey inner, dark grey inner,
      black outer bottom-right. Pressed states invert that bevel so the
      control physically sinks. No radius, no blur, no partial alpha.

   The Showcase window is open on arrival and is the point of the whole screen;
   everything else here is furniture around it.
   ========================================================================== */

/* The two bevels the entire shell is built from. Written once as strings
   because they appear on the Start button, every task button, the tray, and
   every icon — and hand-copying four box-shadow layers is how they drift. */
const RAISED =
  'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf'
const SUNKEN =
  'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #000000, inset -2px -2px 0 #dfdfdf'

/* App registry. Ordered as they appear down the left edge of the desktop —
   the site first, then the documents, then the toys, which is the order a
   visitor cares about them in. */
const APPS = [
  {
    id: 'showcase',
    label: 'My Showcase',
    title: 'Adarsh Sahu - Showcase 2026',
    width: 872,
    height: 668,
    component: ShowcaseApp,
    /* A browser window, not a control panel: opts out of the .retro-ui reset
       so the page inside keeps its own serif typography. See WindowContainer. */
    web: true,
  },
  {
    id: 'resume',
    label: 'Resume',
    title: 'Adarsh_Sahu_Resume.pdf',
    width: 720,
    height: 560,
    component: ResumeApp,
  },
  {
    id: 'projects',
    label: 'Projects',
    title: 'Projects',
    width: 700,
    height: 520,
    component: ProjectsApp,
  },
  {
    id: 'about',
    label: 'About Me',
    title: 'About Me',
    width: 640,
    height: 500,
    component: AboutApp,
  },
  {
    id: 'contact',
    label: 'Contact',
    title: 'Contact',
    width: 560,
    height: 470,
    component: ContactApp,
  },
  {
    id: 'arcade',
    label: 'Snake',
    title: 'Snake',
    width: 440,
    height: 470,
    component: ArcadeApp,
  },
  {
    id: 'terminal',
    label: 'MS-DOS Prompt',
    title: 'MS-DOS Prompt',
    width: 600,
    height: 400,
    component: TerminalApp,
  },
]

/* Which of them get a shortcut on the desktop. Not all of them: About,
   Projects and Contact are sections INSIDE the Showcase window now, so putting
   them on the desktop as well would advertise four doors into one room. They
   stay in the registry because the room's props deep-link straight to them. */
const DESKTOP_ICONS = ['showcase', 'resume', 'arcade', 'terminal']

export default function DesktopOS({
  powered,
  windowManager,
  muted,
  onToggleMute,
  pendingApp,
  onPendingHandled,
  onScreenFocus,
}) {
  const [time, setTime] = useState('')
  const [startOpen, setStartOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [deepLink, setDeepLink] = useState(null)
  const rootRef = useRef(null)

  const { windows, focusedId, open, close, focus, minimize, toggleMaximize, move, resize } =
    windowManager

  /* The tray clock. 12-hour with no seconds and no leading zero on the hour,
     which is exactly the format the real one used — `01:40 PM` is the wrong
     shape and reads as a digital watch. */
  useEffect(() => {
    const update = () => {
      const d = new Date()
      let h = d.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  /* The startup chime, once, as the panel lights. */
  useEffect(() => {
    audio.unlock()
    audio.classicChime()
  }, [])

  /* A room prop was clicked. Open what it referred to, now that the camera has
     landed — opening mid-flight animates a window onto a screen nobody can
     read yet. */
  useEffect(() => {
    if (!pendingApp) return
    const app = APPS.find((a) => a.id === pendingApp.appId)
    if (app) {
      open(app)
      if (pendingApp.focusId) setDeepLink(pendingApp.focusId)
    }
    onPendingHandled?.()
  }, [pendingApp, open, onPendingHandled])

  if (!powered) return null

  const openApp = (app) => {
    setStartOpen(false)
    open(app)
  }

  const handleNavigate = (appId) => {
    const app = APPS.find((a) => a.id === appId)
    if (app) openApp(app)
  }

  /* Clicking bare desktop clears the icon selection and closes Start — the
     behaviour that makes the shell feel like a shell rather than a picture. */
  const onDesktopDown = (e) => {
    if (e.target !== e.currentTarget) return
    setSelectedIcon(null)
    setStartOpen(false)
  }

  /* ------------------------------------------------------------- wheel scroll */
  /* Three.js canvas captures pointer/wheel events from the window. Adding a global
     wheel listener that checks if the cursor is over the virtual desktop OS screen
     guarantees 100% reliable scrolling for all app windows, documents, and lists. */
  useEffect(() => {
    const handleWheel = (e) => {
      const screenEl = rootRef.current
      if (!screenEl) return

      const rect = screenEl.getBoundingClientRect()
      const mx = e.clientX
      const my = e.clientY

      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        const target = document.elementFromPoint(mx, my)
        let scrollable = null
        if (target) {
          scrollable = target.closest('.overflow-y-auto') || target.closest('.overflow-auto') || target.closest('.showcase-doc')
        }
        if (!scrollable) {
          scrollable = screenEl.querySelector('.showcase-doc') || screenEl.querySelector('.overflow-y-auto')
        }
        if (scrollable) {
          scrollable.scrollTop += e.deltaY
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <OSThemeContext.Provider value={OS_WIN95}>
      <div
        ref={rootRef}
        /* `data-os-screen` marks this subtree as "inside the machine". App uses
           it to tell a click on the desktop apart from a click on the room
           behind it, which is what decides between using the computer and
           getting up from the desk. */
        data-os-screen=""
        /* Whether the pointer is on the glass is answered by the DOM, not by a
           raycast. Once the camera is at the desk this element covers the
           display, so it swallows the pointer events the 3D casing would
           otherwise receive — asking three.js would report the pointer as
           having LEFT the monitor the instant it moved onto the desktop, which
           is precisely backwards. */
        onPointerEnter={() => onScreenFocus?.(true)}
        onPointerLeave={() => onScreenFocus?.(false)}
        onWheel={(e) => e.stopPropagation()}
        className="crt-tube-container crt-glass-glare crt-scanlines crt-vignette relative select-none overflow-hidden antialiased"
        style={{
          width: `${SCREEN_W}px`,
          height: `${SCREEN_H}px`,
          background: '#008080',
          fontFamily: "'Tahoma', 'Verdana', 'Geneva', sans-serif",
          fontSize: '12px',
          color: '#000',
        }}
      >
        {/* ------------------------------------------------- desktop surface */}
        <div className="absolute inset-x-0 top-0" style={{ bottom: TASKBAR_H }} onPointerDown={onDesktopDown}>
          {/* Icon column. Windows stacked them down the LEFT edge in a single
              file with generous vertical spacing — not a grid, not centred. */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {DESKTOP_ICONS.map((id) => {
              const app = APPS.find((a) => a.id === id)
              if (!app) return null
              const selected = selectedIcon === id

              return (
                <button
                  key={id}
                  data-click-sound
                  onClick={() => setSelectedIcon(id)}
                  onDoubleClick={() => openApp(app)}
                  className="flex w-[76px] cursor-default flex-col items-center gap-1 px-1 py-1.5 focus:outline-none"
                >
                  {/* Selection in this era was a BLUE WASH over the icon plus an
                      inverted label, not a rounded highlight plate behind it. */}
                  <span
                    style={{
                      filter: selected ? 'brightness(0.72) sepia(1) hue-rotate(190deg) saturate(4)' : 'none',
                    }}
                  >
                    <Win95Icon appId={id} size={32} />
                  </span>
                  <span
                    className="max-w-full px-0.5 text-center text-[11px] leading-tight"
                    style={
                      selected
                        ? { background: '#000080', color: '#fff', outline: '1px dotted #fff' }
                        : {
                            color: '#fff',
                            /* White label on teal needs a hard 1px black drop,
                               not a soft glow — that shadow is in the original
                               and is what keeps the text legible on wallpaper. */
                            textShadow: '1px 1px 0 rgba(0,0,0,0.9)',
                          }
                    }
                  >
                    {app.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ------------------------------------------------------- windows */}
          {windows.map((win) => {
            const app = APPS.find((a) => a.id === win.appId)
            if (!app) return null
            const AppComponent = app.component

            return (
              <WindowContainer
                key={win.id}
                win={win}
                app={app}
                focused={focusedId === win.id}
                onFocus={() => focus(win.id)}
                onClose={() => close(win.id)}
                onMinimize={() => minimize(win.id)}
                onToggleMaximize={() => toggleMaximize(win.id)}
                onMove={move}
                onResize={resize}
              >
                <AppComponent onNavigate={handleNavigate} deepLink={deepLink} />
              </WindowContainer>
            )
          })}
        </div>

        {/* --------------------------------------------------- Start menu */}
        {startOpen && (
          <div
            className="absolute z-[300] flex"
            style={{
              left: 2,
              bottom: TASKBAR_H,
              width: 200,
              background: '#c0c0c0',
              boxShadow: RAISED,
              padding: 3,
            }}
          >
            {/* The vertical banner down the left edge. Purely decorative, and
                completely load-bearing for recognition — the menu is unmistakable
                with it and generic without it. */}
            <div
              className="mr-1 w-[22px] shrink-0"
              style={{ background: 'linear-gradient(#000080, #1084d0)' }}
            >
              <div
                className="whitespace-nowrap pb-2 pl-1 font-bold text-white"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: 13,
                  letterSpacing: '0.02em',
                }}
              >
                Adarsh<span className="font-normal">95</span>
              </div>
            </div>

            <div className="flex-1 py-0.5">
              {APPS.map((app) => (
                <button
                  key={app.id}
                  data-click-sound
                  onClick={() => openApp(app)}
                  className="flex w-full items-center gap-2 px-2 py-[5px] text-left text-[12px] hover:bg-[#000080] hover:text-white"
                >
                  <Win95Icon appId={app.id} size={18} />
                  <span>{app.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- taskbar */}
        <div
          className="absolute inset-x-0 bottom-0 z-[200] flex items-center gap-1 px-1"
          style={{ height: TASKBAR_H, background: '#c0c0c0', boxShadow: 'inset 0 1px 0 #ffffff, inset 0 2px 0 #dfdfdf' }}
        >
          {/* Start. Bold, with the flag, and it stays PRESSED while its menu is
              open — that latch is the detail most reproductions miss. */}
          <button
            data-click-sound
            onClick={() => setStartOpen((v) => !v)}
            className="flex h-[22px] shrink-0 items-center gap-1 px-1.5 text-[12px] font-bold focus:outline-none"
            style={{ background: '#c0c0c0', boxShadow: startOpen ? SUNKEN : RAISED }}
          >
            <WindowsFlag />
            <span style={{ transform: startOpen ? 'translate(1px,1px)' : 'none' }}>Start</span>
          </button>

          <span className="mx-0.5 h-[20px] w-[2px] shrink-0" style={{ boxShadow: 'inset 1px 0 0 #808080, inset -1px 0 0 #ffffff' }} />

          {/* One button per open window. Truncating at a fixed width rather
              than shrinking to fit is correct: the real taskbar gave every
              window an equal slot and clipped the title. */}
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {windows.map((win) => {
              const app = APPS.find((a) => a.id === win.appId)
              const active = focusedId === win.id && !win.minimized

              return (
                <button
                  key={win.id}
                  data-click-sound
                  onClick={() => (active ? minimize(win.id) : focus(win.id))}
                  className="flex h-[22px] w-[154px] shrink-0 items-center gap-1.5 px-1.5 text-left text-[11px] focus:outline-none"
                  style={{
                    background: active ? '#c0c0c0' : '#c0c0c0',
                    boxShadow: active ? SUNKEN : RAISED,
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  <span className="shrink-0" style={{ transform: active ? 'translate(1px,1px)' : 'none' }}>
                    <Win95Icon appId={win.appId} size={14} />
                  </span>
                  <span className="truncate" style={{ transform: active ? 'translate(1px,1px)' : 'none' }}>
                    {app?.label ?? win.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tray. A SUNKEN well, not a raised one — it is a recess in the bar
              holding indicators, and getting that inversion wrong makes the
              right end of the taskbar look like another button. */}
          <div
            className="flex h-[22px] shrink-0 items-center gap-1.5 px-2"
            style={{ boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff' }}
          >
            <button
              data-click-sound
              onClick={onToggleMute}
              title={muted ? 'Unmute' : 'Mute'}
              className="grid place-items-center focus:outline-none"
            >
              <SpeakerGlyph muted={muted} />
            </button>
            <span className="text-[11px] tabular-nums">{time}</span>
          </div>
        </div>
      </div>
    </OSThemeContext.Provider>
  )
}

/* --------------------------------------------------------------------------
   Glyphs. Drawn as pixels for the same reason the app icons are — a stroked
   line icon from a modern set is instantly the wrong century.
   -------------------------------------------------------------------------- */

/** The four-pane flag, waved. Four flat quads, no outline. */
function WindowsFlag() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" shapeRendering="crispEdges">
      <path d="M1 3 L7 1.5 L7 6.5 L1 7.5 z" fill="#ff0000" />
      <path d="M8 1.3 L15 0 L15 5.6 L8 6.4 z" fill="#00a000" />
      <path d="M1 8.3 L7 7.4 L7 12.4 L1 13.4 z" fill="#0000c0" />
      <path d="M8 7.2 L15 6.4 L15 12 L8 13 z" fill="#e0b000" />
    </svg>
  )
}

function SpeakerGlyph({ muted }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" shapeRendering="crispEdges">
      <path d="M2 5 h2 l3 -3 v10 l-3 -3 h-2 z" fill="#000000" />
      {muted ? (
        <path d="M9 4 L13 10 M13 4 L9 10" stroke="#ff0000" strokeWidth="1.5" fill="none" />
      ) : (
        <>
          <path d="M9 4.5 a4 4 0 0 1 0 5" stroke="#000" strokeWidth="1" fill="none" />
          <path d="M11 2.5 a7 7 0 0 1 0 9" stroke="#000" strokeWidth="1" fill="none" />
        </>
      )}
    </svg>
  )
}
