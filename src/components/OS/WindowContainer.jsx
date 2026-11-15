import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Maximize2, Minus, Minimize2, X } from 'lucide-react'
import audio from '../../audio/AudioEngine'
import { useOSTheme } from './theme'
import Win95Icon from './Win95Icons'
import { animate } from './motion'

/* Window motion. Short, and transform + opacity only: the desktop is one
   composited layer inside a 3D transform, so anything that touches layout or
   paint (size, box-shadow, filter) re-rasterises the whole screen per frame.

   · OPEN grows out of the window's taskbar button, which is where Windows
     drew its zoom rectangle from — it tells you where the window "lives".
   · MINIMISE shrinks back into that same button; RESTORE reverses it.
   · CLOSE is a quick fade with a hair of shrink. Windows closed instantly;
     a 120ms fade keeps that snap without the hard cut.
   · MAXIMISE is a FLIP: the geometry changes in one frame, then a transform
     plays the old rectangle into the new one. */
const OPEN_MS = 150
const CLOSE_MS = 120
const MIN_MS = 160
const MAX_MS = 150
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.25, 1)'
const EASE_IN = 'cubic-bezier(0.5, 0, 0.75, 0.2)'

/* The real Win95 frame: black outer bottom-right, light grey outer top-left,
   then dark grey / white inside it, on a 4px-thick grey border. */
const WIN95_FRAME =
  'inset -1px -1px 0 #000000, inset 1px 1px 0 #dfdfdf, inset -2px -2px 0 #808080, inset 2px 2px 0 #ffffff'

function domScale(el) {
  if (!el) return 1
  const rect = el.getBoundingClientRect()
  const w = el.offsetWidth
  return w > 0 ? rect.width / w : 1
}

export default function WindowContainer({
  win,
  app,
  focused,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  getTaskbarPoint,
  children,
}) {
  const T = useOSTheme()
  const rootRef = useRef(null)
  const drag = useRef(null)

  /* ------------------------------------------------------------- dragging */
  const startDrag = useCallback(
    (e) => {
      if (e.button !== 0 || win.maximized || e.target.closest('button')) return
      e.stopPropagation()
      onFocus()

      const scale = domScale(rootRef.current)
      drag.current = { x: e.clientX, y: e.clientY, ox: win.x, oy: win.y, scale }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [win.maximized, win.x, win.y, onFocus],
  )

  const onDragMove = useCallback(
    (e) => {
      const d = drag.current
      if (!d) return
      onMove(win.id, d.ox + (e.clientX - d.x) / d.scale, d.oy + (e.clientY - d.y) / d.scale)
    },
    [win.id, onMove],
  )

  const endDrag = useCallback((e) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }, [])

  /* ------------------------------------------------------------- resizing */
  const resize = useRef(null)

  const startResize = useCallback(
    (e) => {
      if (e.button !== 0) return
      e.stopPropagation()
      onFocus()

      const scale = domScale(rootRef.current)
      resize.current = { x: e.clientX, y: e.clientY, ow: win.w, oh: win.h, scale }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [win.w, win.h, onFocus],
  )

  const onResizeMove = useCallback(
    (e) => {
      const r = resize.current
      if (!r) return
      onResize(win.id, r.ow + (e.clientX - r.x) / r.scale, r.oh + (e.clientY - r.y) / r.scale)
    },
    [win.id, onResize],
  )

  const endResize = useCallback((e) => {
    if (!resize.current) return
    resize.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }, [])

  /* --------------------------------------------------------------- motion */
  /* Minimised windows stay mounted (see below), so minimise is a PHASE, not
     an unmount: 'minimizing' keeps the window visible while it shrinks into
     the taskbar, and only then does it go to display:none. Derived from the
     prop during render rather than in an effect, so there is never a frame
     where the window has vanished before its animation starts. */
  const [phase, setPhase] = useState(win.minimized ? 'hidden' : 'shown')
  const [prevMin, setPrevMin] = useState(win.minimized)
  if (prevMin !== win.minimized) {
    setPrevMin(win.minimized)
    setPhase(win.minimized ? 'minimizing' : 'restoring')
  }
  const [closing, setClosing] = useState(false)
  const cancelAnim = useRef(() => {})

  /* Where this window's taskbar button is, in this window's own coordinates —
     the transform-origin that makes it grow out of / shrink into the bar. */
  const taskbarOrigin = useCallback(() => {
    const p = getTaskbarPoint?.(win.id)
    if (!p) return `50% ${win.h + 40}px`
    return `${Math.round(p.x - win.x)}px ${Math.round(p.y - win.y)}px`
  }, [getTaskbarPoint, win.id, win.x, win.y, win.h])

  // Open: once, on mount.
  useLayoutEffect(() => {
    if (win.minimized) return undefined
    const origin = taskbarOrigin()
    cancelAnim.current = animate(
      rootRef.current,
      [
        { opacity: 0, transform: 'scale(0.86)', transformOrigin: origin },
        { opacity: 1, transform: 'none', transformOrigin: origin },
      ],
      { duration: OPEN_MS, easing: EASE_OUT },
    )
    return () => cancelAnim.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Minimise / restore.
  useLayoutEffect(() => {
    if (phase !== 'minimizing' && phase !== 'restoring') return
    cancelAnim.current()
    const origin = taskbarOrigin()
    const shown = { opacity: 1, transform: 'none', transformOrigin: origin }
    const tucked = { opacity: 0, transform: 'scale(0.12)', transformOrigin: origin }
    if (phase === 'minimizing') {
      cancelAnim.current = animate(rootRef.current, [shown, tucked], { duration: MIN_MS, easing: EASE_IN }, () =>
        setPhase('hidden'),
      )
    } else {
      cancelAnim.current = animate(rootRef.current, [tucked, shown], { duration: MIN_MS, easing: EASE_OUT }, () =>
        setPhase('shown'),
      )
    }
  }, [phase, taskbarOrigin])

  // Maximise / restore-down: FLIP from the previous rectangle.
  const prevGeom = useRef(null)
  useLayoutEffect(() => {
    const prev = prevGeom.current
    prevGeom.current = { x: win.x, y: win.y, w: win.w, h: win.h, max: win.maximized }
    if (!prev || prev.max === win.maximized || !win.w || !win.h) return
    const from = `translate(${prev.x - win.x}px, ${prev.y - win.y}px) scale(${prev.w / win.w}, ${prev.h / win.h})`
    cancelAnim.current()
    cancelAnim.current = animate(
      rootRef.current,
      [
        { transform: from, transformOrigin: '0 0' },
        { transform: 'none', transformOrigin: '0 0' },
      ],
      { duration: MAX_MS, easing: EASE_OUT },
    )
  }, [win.x, win.y, win.w, win.h, win.maximized])

  /* Close plays out before the window leaves the list. Guarded so a double
     click on the X cannot close twice. */
  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    cancelAnim.current()
    cancelAnim.current = animate(
      rootRef.current,
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'scale(0.96)' },
      ],
      { duration: CLOSE_MS, easing: EASE_IN },
      onClose,
    )
  }, [closing, onClose])

  /* Hidden, not unmounted. Returning null here threw away everything inside
     the window — a Snake game in progress, a half-typed message, the music
     player's transport state — every time someone minimised it. */

  const Icon = win.icon || app?.icon

  /* Two retro systems, opposite conventions, and the detection has to cover
     both — keying off one theme id meant switching to the other silently
     dropped every retro rule and rendered a macOS window again.

     Windows put minimise / maximise / close together at the RIGHT end of the
     bar, all three present. The classic Mac put a close box at the far left
     and a zoom box at the far right, with no minimise at all. Getting the
     SIDE wrong is the thing people notice before any pixel detail. */
  const isWin95 = T.id === 'WIN95'
  const isClassicMac = T.id === 'CLASSIC'
  const isRetro = isWin95 || isClassicMac

  /* Not every window on a 1995 desktop contained 1995 UI. A browser window
     contained a WEB PAGE — white, serif, purple underlined links — and the
     period chrome stopped at the frame. Snake and the DOS prompt are native
     apps and do want the grey-panel reset; the Showcase is a document and
     must not get it, or its typography is overwritten with Tahoma 12px on
     #c0c0c0 and the whole page turns into a control panel. */
  const isWebDoc = Boolean(app?.web)

  const controls = isClassicMac
    ? [
        { title: 'Close', fn: requestClose, Glyph: X, dot: '' },
        {
          title: win.maximized ? 'Restore' : 'Zoom',
          fn: onToggleMaximize,
          Glyph: win.maximized ? Minimize2 : Maximize2,
          dot: '',
        },
      ]
    : isWin95
    ? [
        { title: 'Minimize', fn: onMinimize, Glyph: PixelMin, dot: '' },
        {
          title: win.maximized ? 'Restore' : 'Maximize',
          fn: onToggleMaximize,
          Glyph: win.maximized ? PixelRestore : PixelMax,
          dot: '',
        },
        { title: 'Close', fn: requestClose, Glyph: PixelClose, dot: '' },
      ]
    : [
        { title: 'Close', fn: requestClose, Glyph: X, dot: 'bg-[#ff5f57]' },
        { title: 'Minimize', fn: onMinimize, Glyph: Minus, dot: 'bg-[#febc2e]' },
        {
          title: win.maximized ? 'Restore' : 'Zoom',
          fn: onToggleMaximize,
          Glyph: win.maximized ? Minimize2 : Maximize2,
          dot: 'bg-[#28c840]',
        },
      ]

  return (
    <div
      ref={rootRef}
      /* Corner radius, blur and shadow were all hardcoded macOS. On the
         classic theme every one of them is wrong: those windows are square,
         opaque, and cast a hard offset shadow with no falloff — there was no
         compositor to blur anything. The theme owns all three now. */
      data-window={win.id}
      className={`absolute flex select-none flex-col overflow-hidden ${
        isWin95 ? '' : 'border'
      } ${isRetro ? '' : 'rounded-[10px] backdrop-blur-2xl'} ${
        isWin95
          ? ''
          : focused
            ? `${T.windowChrome} ${isRetro ? '' : 'shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)]'}`
            : `${T.windowChromeIdle} ${isRetro ? '' : 'shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)]'}`
      }`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        display: phase === 'hidden' ? 'none' : undefined,
        /* Mid-animation (shrinking into the taskbar, or closing) the window
           must not catch a click meant for whatever is behind it. */
        pointerEvents: closing || phase === 'minimizing' ? 'none' : undefined,
        cursor: 'default',
        // Win95: the four-tone frame on a 3px grey border, drawn with
        // box-shadow so it stays exactly 1px per tone at any scale.
        ...(isWin95 ? { background: '#c0c0c0', boxShadow: WIN95_FRAME, padding: 3 } : null),
        // Hard offset shadow for the classic theme; the modern one uses the
        // Tailwind soft shadows above. Two style systems, one element, so the
        // shadow has to be merged into the same style object rather than
        // sitting in a second `style` prop that React would silently drop.
        ...(isClassicMac && focused ? { boxShadow: T.windowShadowFocused } : null),
      }}
      onPointerDown={onFocus}
    >
      {/* ------------------------------------------------------- Modern macOS Window Header */}
      <div
        onPointerDown={startDrag}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => {
          audio.classicClick()
          onToggleMaximize()
        }}
        className={`group/bar flex shrink-0 select-none items-center justify-between ${
          isWin95 ? 'h-[20px] pl-[2px] pr-[2px]' : 'h-[38px] px-3.5'
        } ${
          win.maximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } ${isWin95 ? 'text-white' : T.titlebar} ${isWin95 ? '' : 'border-b'}`}
        /* The active title bar was a LEFT-TO-RIGHT GRADIENT from navy to a
           lighter blue, not a flat navy fill — that ramp is the single most
           recognisable pixel in the system. Inactive bars drop to flat grey,
           which is how you tell at a glance which window has focus. */
        style={
          isWin95
            ? {
                background: focused
                  ? 'linear-gradient(90deg, #000080 0%, #1084d0 100%)'
                  : 'linear-gradient(90deg, #808080 0%, #b5b5b5 100%)',
              }
            : undefined
        }
      >
        {/* Title. Windows sets it flush LEFT next to the app icon; macOS and
            the classic Mac centre it. Getting the side wrong is the thing
            people register before any pixel detail, so it is driven by the
            theme rather than fixed. */}
        {isWin95 ? (
          /* The FULL document title, not the short launcher label. A browser of
             the era put the page's own title in the bar — "Adarsh Sahu -
             Showcase 2026", not "Showcase" — and that long, specific string is
             a surprising amount of what makes the window feel inhabited. The
             taskbar button below still uses the short label, which is exactly
             the split the real system used. */
          <div className="pointer-events-none flex min-w-0 items-center gap-1.5 pl-1 text-[11px] font-bold text-white">
            <span className="shrink-0">
              <Win95Icon appId={win.appId} size={14} />
            </span>
            <span className="truncate">{win.title ?? win.label}</span>
          </div>
        ) : (
          <div
            className={`pointer-events-none absolute inset-x-0 flex items-center justify-center gap-1.5 text-[13px] font-semibold ${
              focused ? T.text : T.textFaint
            }`}
          >
            {Icon && <Icon size={12} className="opacity-70" />}
            <span>{win.label ?? win.title}</span>
          </div>
        )}

        {/* Controls. Three raised bevelled boxes hard against the right edge
            on Windows; two hairline boxes split to the far corners on the
            classic Mac; three coloured circles on the left for modern macOS.
            The glyph is always visible on Windows — the hover-to-reveal
            behaviour is a macOS idea and looked like a rendering bug here. */}
        <div className={`group/lights flex items-center ${isWin95 ? '' : 'gap-0.5'}`}>
          {controls.map(({ title, fn, Glyph, dot }) => (
            <button
              key={title}
              type="button"
              aria-label={title}
              title={title}
              data-click-sound
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                audio.classicClick()
                fn()
              }}
              className={
                isWin95
                  ? /* Close sits 2px apart from the other two, as it did. */
                    `w95-cap-btn ${title === 'Close' ? 'ml-[2px]' : ''}`
                  : isClassicMac
                    ? `grid h-[13px] w-[13px] place-items-center border border-black bg-[#dddddd] text-black shadow-[inset_1px_1px_0_#ffffff] transition-opacity ${
                        focused ? 'opacity-100' : 'opacity-40'
                      }`
                    : `grid h-[15px] w-[15px] place-items-center rounded-full ${dot} text-black/60 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)] transition-opacity ${
                        focused ? 'opacity-100' : 'opacity-45'
                      }`
              }
            >
              {isWin95 ? (
                <span className="w95-press">
                  <Glyph />
                </span>
              ) : (
                <Glyph
                  size={isRetro ? 8 : 9}
                  strokeWidth={3}
                  className="opacity-0 transition-opacity group-hover/lights:opacity-100"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- Content Area */}
      {/* The era reset is applied here, at the boundary between chrome the
          theme controls and app markup it does not. One class, cascading. */}
      <div
        className={`relative min-h-0 flex-1 overflow-hidden font-sans ${T.windowBody} ${T.text} ${
          isRetro && !isWebDoc ? 'retro-ui' : ''
        } ${isWin95 && isWebDoc ? 'mt-[2px] p-[2px]' : ''} ${isWin95 && !isWebDoc ? 'mt-[1px]' : ''}`}
        /* A browser's page sat in a SUNKEN client edge, two pixels deep. It is
           what separates "a page inside a window" from "a window". */
        style={isWin95 && isWebDoc ? { boxShadow: SUNKEN_EDGE, background: '#ffffff' } : undefined}
      >
        {isWin95 && isWebDoc ? <div className="relative h-full w-full overflow-hidden">{children}</div> : children}
      </div>

      {/* ---------------------------------------------------- Status bar */}
      {/* Browser windows of the era ended in a segmented status strip: a wide
          sunken panel on the left carrying the copyright, then a few narrow
          empty panels for the zone and progress indicators. The empty ones are
          not filler — a status bar with a single panel reads as a footer, and
          the segmentation is what makes it read as a browser. */}
      {isWebDoc && isWin95 && app?.statusBar !== false && (
        <div className="mt-[2px] flex h-[20px] shrink-0 items-center gap-[2px]" style={{ background: '#c0c0c0' }}>
          <div
            className="flex h-full flex-1 items-center px-1.5 text-[11px] text-black"
            style={{ boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff' }}
          >
            © Copyright {new Date().getFullYear()} Adarsh Sahu
          </div>
          {[46, 22, 22].map((w, i) => (
            <div
              key={i}
              className="h-full shrink-0"
              style={{ width: w, boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff' }}
            />
          ))}
        </div>
      )}

      {/* -------------------------------------------------- Resize Gripper */}
      {!win.maximized && (
        <div
          onPointerDown={startResize}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          className="absolute bottom-0 right-0 z-50 grid h-[20px] w-[20px] cursor-nwse-resize place-items-end p-[4px]"
          aria-label="Resize window"
          title="Resize"
        >
          {isWin95 && <SizeGrip />}
        </div>
      )}
    </div>
  )
}

const SUNKEN_EDGE =
  'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #000000, inset -2px -2px 0 #dfdfdf'

/* --------------------------------------------------------------------------
   Caption-button glyphs, drawn on the pixel grid. A stroked line icon from a
   modern set renders soft and slightly too thin at this size; the originals
   were solid pixel shapes — a 2px bar, a box with a 2px lid, a 2px-thick X.
   -------------------------------------------------------------------------- */
function PixelMin() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
      <rect x="1" y="6" width="6" height="2" fill="#000" />
    </svg>
  )
}

function PixelMax() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden>
      <path d="M0 0h9v9H0z M1 2v6h7V2z" fill="#000" fillRule="evenodd" />
    </svg>
  )
}

function PixelRestore() {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" shapeRendering="crispEdges" aria-hidden>
      <path d="M2 0h6v6H6V5h1V2H3v1H2z" fill="#000" />
      <path d="M0 3h6v6H0z M1 5v3h4V5z" fill="#000" fillRule="evenodd" />
    </svg>
  )
}

function PixelClose() {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" shapeRendering="crispEdges" aria-hidden>
      <path
        d="M0 0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H5v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1V5h1V4h1V3H2V2H1V1H0z"
        fill="#000"
      />
    </svg>
  )
}

/** The diagonal size grip in the bottom-right corner of a resizable window. */
function SizeGrip() {
  /* Three diagonal ridges, each a white highlight then two grey shadow lines. */
  const lines = [1, 2, 3, 5, 6, 7, 9, 10, 11]
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>
      {lines.map((c) => (
        <line key={c} x1={12} y1={c} x2={c} y2={12} stroke={c % 4 === 1 ? '#ffffff' : '#808080'} strokeWidth="1" />
      ))}
    </svg>
  )
}
