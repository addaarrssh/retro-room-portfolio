import { useCallback, useEffect, useRef, useState } from 'react'
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
import PortfolioV3App from './apps/PortfolioV3App'
import audio from '../../audio/AudioEngine'
import { smoothScrollBy } from './motion'

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

/* The raised bevel, for the Start menu panel. Buttons take theirs from the
   .w95-btn class in index.css, which also owns the pressed inversion. */
const RAISED =
  'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf'

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
    title: 'Adarsh_Sahu_Resume_DataScience.pdf',
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
    /* A console is the one window that must NOT be Win95 grey: the .retro-ui
       reset forces a #c0c0c0 background and black Tahoma, which turned the
       prompt into black text on grey. Opting out lets it be a black console. */
    web: true,
    /* ...but it is not a browser, so no browser status bar under it. */
    statusBar: false,
  },
  {
    id: 'portfoliov3',
    label: 'Portfolio V3',
    title: 'Portfolio Journey 3 — Internet Explorer',
    width: 900,
    height: 680,
    component: PortfolioV3App,
    web: true,
  },
]

const DESKTOP_ICONS = ['showcase', 'resume', 'arcade', 'terminal', 'portfoliov3']

/* Index in APPS where the Start menu's groove goes: the site's own pages
   (Showcase, Resume, Projects, About, Contact) above, the toys below. */
const DESKTOP_GROUP_BREAK = APPS.findIndex((a) => a.id === 'arcade')

export default function DesktopOS({
  powered,
  windowManager,
  muted,
  onToggleMute,
  pendingApp,
  onPendingHandled,
  onScreenFocus,
  /* Scanlines only while seated. They are a 4px pattern; from across the room
     the desktop is drawn at about a third of its size, where a 4px pattern
     aliases against the pixel grid and turns the white page into diagonal
     moire stripes. */
  scanlines = true,
}) {
  const [time, setTime] = useState('')
  const [dateLong, setDateLong] = useState('')
  const [startOpen, setStartOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [deepLink, setDeepLink] = useState(null)
  const rootRef = useRef(null)
  const startBtnRef = useRef(null)
  const startMenuRef = useRef(null)
  /* Set when Start was opened from the keyboard, so the first item takes
     focus. A mouse user gets no focus ring jumping into the menu. */
  const focusFirstItem = useRef(false)

  const { windows, focusedId, open, close, focus, minimize, toggleMaximize, move, resize } =
    windowManager

  /* The tray clock. 12-hour with no seconds and no leading zero on the hour,
     which is exactly the format the real one used — `01:40 PM` is the wrong
     shape and reads as a digital watch. Hovering it shows the full date, as
     the real one did. */
  useEffect(() => {
    const update = () => {
      const d = new Date()
      let h = d.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`)
      setDateLong(
        d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      )
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

  const closeStart = useCallback(({ returnFocus = false } = {}) => {
    setStartOpen(false)
    /* preventScroll, always: a plain focus() scrolls every scrollable
       ancestor to reveal the element, and one of those ancestors is the 3D
       wrapper — which is how the desktop gets knocked off the glass. */
    if (returnFocus) startBtnRef.current?.focus({ preventScroll: true })
  }, [])

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

  /* Start closes on any press outside it — a window, the taskbar, an icon —
     not only on bare desktop. Capture phase, so it runs before whatever was
     pressed handles the event. */
  useEffect(() => {
    if (!startOpen) return undefined
    const root = rootRef.current
    const onDown = (e) => {
      if (startMenuRef.current?.contains(e.target) || startBtnRef.current?.contains(e.target)) return
      setStartOpen(false)
    }
    root?.addEventListener('pointerdown', onDown, true)
    return () => root?.removeEventListener('pointerdown', onDown, true)
  }, [startOpen])

  /* Esc closes Start, and ONLY closes Start. The room listens for Escape on
     window to stand up from the desk, so this runs in the capture phase and
     stops the event: one Esc dismisses the menu, a second one leaves. */
  useEffect(() => {
    if (!startOpen) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      e.preventDefault()
      closeStart({ returnFocus: true })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [startOpen, closeStart])

  /* Keyboard-opened Start: put focus on the first item once it exists. */
  useEffect(() => {
    if (!startOpen || !focusFirstItem.current) return
    focusFirstItem.current = false
    startMenuRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true })
  }, [startOpen])

  /* Up/Down/Home/End walk a list of buttons, wrapping. Shared by the Start
     menu and the desktop icon column. */
  const onListKeys = (e, selector) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const items = Array.from(e.currentTarget.querySelectorAll(selector))
    if (!items.length) return
    e.preventDefault()
    e.stopPropagation()
    const i = items.indexOf(document.activeElement)
    let next = 0
    if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % items.length
    if (e.key === 'ArrowUp') next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length
    if (e.key === 'End') next = items.length - 1
    items[next].focus({ preventScroll: true })
    return items[next]
  }

  /* Where a window's taskbar button is, in desktop coordinates — the point a
     window grows out of when it opens and shrinks into when minimised. */
  const getTaskbarPoint = useCallback((winId) => {
    const root = rootRef.current
    if (!root) return null
    const btn = root.querySelector(`[data-task-id="${CSS.escape(winId)}"]`)
    if (!btn) return null
    const r = root.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const scale = r.width / SCREEN_W || 1
    return { x: (b.left + b.width / 2 - r.left) / scale, y: (b.top + b.height / 2 - r.top) / scale }
  }, [])

  /* ------------------------------------------------------------- 2-Finger & Wheel Scroll */
  /* Native scrolling is switched OFF inside the screen and done by hand,
     because a native wheel scroll that reaches the end of its container
     chains to the next scrollable ancestor — and the ancestors here are the
     3D wrapper. One chained scroll throws the desktop off the glass.

     Bound natively on the screen element itself, not on window: React's
     synthetic stopPropagation on the wrapper would otherwise swallow the
     event before a window listener ever saw it. The container scrolled is the
     nearest scrollable ancestor of whatever is under the pointer, within the
     window it belongs to; on bare desktop nothing scrolls. */
  useEffect(() => {
    if (!powered) return undefined
    const screenEl = rootRef.current
    if (!screenEl) return undefined
    let touchStartY = 0

    const isScrollable = (el) => {
      if (el.scrollHeight <= el.clientHeight + 1) return false
      const oy = getComputedStyle(el).overflowY
      return oy === 'auto' || oy === 'scroll'
    }

    const findScrollable = (target, dy) => {
      let fallback = null
      for (let el = target; el && el !== screenEl; el = el.parentElement) {
        if (!isScrollable(el)) continue
        const atTop = el.scrollTop <= 0
        const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
        // Prefer a container that can still move in this direction, so a
        // nested list at its end hands the wheel to the page around it.
        if ((dy < 0 && !atTop) || (dy > 0 && !atEnd)) return el
        fallback ??= el
      }
      if (fallback) return fallback
      // The pointer is on a window's fixed furniture (a sidebar, a toolbar):
      // scroll that window's main scrollable area.
      const winEl = target?.closest?.('[data-window]')
      if (!winEl) return null
      let best = null
      for (const c of winEl.querySelectorAll('*')) {
        if (isScrollable(c) && (!best || c.clientHeight > best.clientHeight)) best = c
      }
      return best
    }

    const handleWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 32
      if (e.deltaMode === 2) dy *= 600
      const scrollable = findScrollable(e.target, dy)
      if (scrollable) smoothScrollBy(scrollable, dy)
    }

    const handleTouchStart = (e) => {
      if (e.touches.length >= 1) touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e) => {
      if (e.touches.length < 1) return
      const my = e.touches[0].clientY
      const deltaY = touchStartY - my
      touchStartY = my
      const scrollable = findScrollable(e.target, deltaY)
      if (scrollable) {
        scrollable.scrollTop += deltaY * 1.5
        e.preventDefault()
        e.stopPropagation()
      }
    }

    screenEl.addEventListener('wheel', handleWheel, { passive: false })
    screenEl.addEventListener('touchstart', handleTouchStart, { passive: true })
    screenEl.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      screenEl.removeEventListener('wheel', handleWheel)
      screenEl.removeEventListener('touchstart', handleTouchStart)
      screenEl.removeEventListener('touchmove', handleTouchMove)
    }
  }, [powered])

  if (!powered) return null

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
        className={`crt-tube-container crt-glass-glare ${scanlines ? 'crt-scanlines' : ''} crt-vignette relative overflow-hidden antialiased`}
        style={{
          width: `${SCREEN_W}px`,
          height: `${SCREEN_H}px`,
          background: '#008080',
          fontFamily: "'Tahoma', 'Verdana', 'Geneva', sans-serif",
          fontSize: '12px',
          color: '#000',
          /* The room sets the BODY cursor (pointer over the monitor, hidden
             near the 3D cursor). Inside the screen the arrow is the default
             and only live controls ask for a hand. */
          cursor: 'default',
        }}
      >
        {/* ------------------------------------------------- desktop surface */}
        <div className="absolute inset-x-0 top-0" style={{ bottom: TASKBAR_H }} onPointerDown={onDesktopDown}>
          {/* Icon column. Windows stacked them down the LEFT edge in a single
              file with generous vertical spacing — not a grid, not centred.

              ONE click opens. Double-click is the period behaviour, but a
              visitor who has never used Windows 95 single-clicks, sees a
              highlight, and concludes the icon is dead. The click still
              SELECTS first (on press), so the shell keeps its feel; it just
              also opens on release. Double-clicking still works — opening an
              app that is already open only brings it forward. */}
          <div
            role="toolbar"
            aria-orientation="vertical"
            aria-label="Desktop"
            className="absolute left-1 top-1.5 flex flex-col gap-0.5"
            onKeyDown={(e) => {
              const next = onListKeys(e, '.w95-icon')
              if (next) setSelectedIcon(next.dataset.appId)
            }}
          >
            {DESKTOP_ICONS.map((id) => {
              const app = APPS.find((a) => a.id === id)
              if (!app) return null
              const selected = selectedIcon === id

              return (
                <button
                  key={id}
                  type="button"
                  data-click-sound
                  data-app-id={id}
                  title={`Open ${app.label}`}
                  onPointerDown={() => setSelectedIcon(id)}
                  onFocus={() => setSelectedIcon(id)}
                  onClick={() => openApp(app)}
                  className="w95-icon flex w-[80px] flex-col items-center gap-1 px-1 pb-2 pt-1.5"
                >
                  {/* Selection in this era was a BLUE WASH over the icon plus an
                      inverted label, not a rounded highlight plate behind it. */}
                  <span
                    className="w95-icon-art"
                    style={{
                      filter: selected ? 'brightness(0.72) sepia(1) hue-rotate(190deg) saturate(4)' : 'none',
                    }}
                  >
                    <Win95Icon appId={id} size={32} />
                  </span>
                  <span
                    className="w95-icon-label max-w-full px-[3px] py-px text-center text-[11px] leading-tight"
                    data-selected={selected ? 'true' : 'false'}
                    style={
                      selected
                        ? { background: '#000080', color: '#fff' }
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
                getTaskbarPoint={getTaskbarPoint}
              >
                <AppComponent onNavigate={handleNavigate} deepLink={deepLink} />
              </WindowContainer>
            )
          })}
        </div>

        {/* --------------------------------------------------- Start menu */}
        {startOpen && (
          /* The clip. Its bottom edge is the taskbar's top edge, and the menu
             inside slides up through it — so the reveal is a transform, and
             the menu never draws over the taskbar while it moves. */
          <div className="absolute z-[300] overflow-hidden" style={{ left: 2, bottom: TASKBAR_H - 2 }}>
            <div
              ref={startMenuRef}
              role="menu"
              aria-label="Start"
              className="w95-start-menu flex"
              onKeyDown={(e) => onListKeys(e, '[role="menuitem"]')}
              style={{
                width: 214,
                background: '#c0c0c0',
                boxShadow: RAISED,
                padding: 3,
              }}
            >
              {/* The vertical banner down the left edge. Purely decorative, and
                  completely load-bearing for recognition — the menu is
                  unmistakable with it and generic without it. */}
              <div
                className="mr-0.5 flex w-[24px] shrink-0 items-end"
                style={{ background: 'linear-gradient(#000080, #1084d0)' }}
              >
                <div
                  className="whitespace-nowrap pb-2 pl-[3px] font-bold text-white"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: 15,
                    letterSpacing: '0.02em',
                  }}
                >
                  Adarsh<span className="font-normal">95</span>
                </div>
              </div>

              <div className="flex-1 py-px">
                {APPS.map((app, i) => (
                  <div key={app.id}>
                    {/* A groove between the site's own pages and the toys,
                        the way Win95 separated Programs from Shut Down. */}
                    {i === DESKTOP_GROUP_BREAK && (
                      <div className="mx-0.5 my-[3px] h-[2px]" style={{ boxShadow: 'inset 0 1px 0 #808080, inset 0 -1px 0 #ffffff' }} />
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      data-click-sound
                      onClick={() => openApp(app)}
                      className="w95-menu-item flex h-[34px] w-full items-center gap-2.5 pl-1.5 pr-2 text-left text-[12px]"
                    >
                      <Win95Icon appId={app.id} size={24} />
                      <span className="truncate">{app.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- taskbar */}
        <div
          role="toolbar"
          aria-label="Taskbar"
          className="absolute inset-x-0 bottom-0 z-[200] flex items-center gap-1 px-[3px]"
          style={{ height: TASKBAR_H, background: '#c0c0c0', boxShadow: 'inset 0 1px 0 #dfdfdf, inset 0 2px 0 #ffffff' }}
        >
          {/* Start. Bold, with the flag, and it stays PRESSED while its menu is
              open — that latch is the detail most reproductions miss. */}
          <button
            ref={startBtnRef}
            type="button"
            data-click-sound
            aria-haspopup="menu"
            aria-expanded={startOpen}
            data-pressed={startOpen ? 'true' : 'false'}
            onClick={(e) => {
              // detail === 0 is a keyboard activation (Enter / Space).
              if (!startOpen && e.detail === 0) focusFirstItem.current = true
              setStartOpen((v) => !v)
            }}
            className="w95-btn flex h-[24px] shrink-0 items-center px-[5px] text-[12px] font-bold"
          >
            <span className="w95-press gap-1">
              <WindowsFlag />
              <span>Start</span>
            </span>
          </button>

          <span className="mx-px h-[22px] w-[2px] shrink-0" style={{ boxShadow: 'inset 1px 0 0 #808080, inset -1px 0 0 #ffffff' }} />

          {/* One button per open window, each an equal slot that shrinks when
              the bar fills rather than running off the end. Clicking the
              focused window's button minimises it; clicking any other one
              brings it forward (restoring it if minimised). */}
          <div className="flex min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
            {windows.map((win) => {
              const app = APPS.find((a) => a.id === win.appId)
              const active = focusedId === win.id && !win.minimized
              const label = app?.label ?? win.label

              return (
                <button
                  key={win.id}
                  type="button"
                  data-click-sound
                  data-task-id={win.id}
                  data-pressed={active ? 'true' : 'false'}
                  aria-pressed={active}
                  title={win.minimized ? `Restore ${label}` : active ? `Minimize ${label}` : label}
                  onClick={() => (active ? minimize(win.id) : focus(win.id))}
                  className="w95-btn flex h-[24px] min-w-[44px] items-center px-[5px] text-left text-[11px]"
                  style={{ flex: '0 1 160px', fontWeight: active ? 700 : 400 }}
                >
                  <span className="w95-press w-full gap-1.5">
                    <span className="shrink-0">
                      <Win95Icon appId={win.appId} size={16} />
                    </span>
                    <span className="truncate">{label}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tray. A SUNKEN well, not a raised one — it is a recess in the bar
              holding indicators, and getting that inversion wrong makes the
              right end of the taskbar look like another button. */}
          <div
            className="flex h-[24px] shrink-0 items-center gap-1 pl-[3px] pr-2"
            style={{ boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff' }}
          >
            <button
              type="button"
              data-click-sound
              onClick={onToggleMute}
              title={muted ? 'Sound is off — click to turn on' : 'Sound is on — click to mute'}
              aria-label={muted ? 'Unmute' : 'Mute'}
              aria-pressed={muted}
              className="w95-tray-btn grid h-[20px] w-[22px] cursor-pointer place-items-center"
            >
              <SpeakerGlyph muted={muted} />
            </button>
            <span className="cursor-default text-[11px] tabular-nums" title={dateLong}>
              {time}
            </span>
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
