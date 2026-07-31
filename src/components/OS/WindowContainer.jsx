import { useCallback, useRef } from 'react'
import { Maximize2, Minus, Minimize2, X } from 'lucide-react'
import audio from '../../audio/AudioEngine'
import { useOSTheme } from './theme'
import Win95Icon from './Win95Icons'

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
        { title: 'Close', fn: onClose, Glyph: X, dot: '' },
        {
          title: win.maximized ? 'Restore' : 'Zoom',
          fn: onToggleMaximize,
          Glyph: win.maximized ? Minimize2 : Maximize2,
          dot: '',
        },
      ]
    : isWin95
    ? [
        { title: 'Minimize', fn: onMinimize, Glyph: Minus, dot: '' },
        {
          title: win.maximized ? 'Restore' : 'Maximize',
          fn: onToggleMaximize,
          Glyph: win.maximized ? Minimize2 : Maximize2,
          dot: '',
        },
        { title: 'Close', fn: onClose, Glyph: X, dot: '' },
      ]
    : [
        { title: 'Close', fn: onClose, Glyph: X, dot: 'bg-[#ff5f57]' },
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
      className={`window-open absolute flex select-none flex-col overflow-hidden border transition-shadow ${
        isRetro ? '' : 'rounded-[10px] backdrop-blur-2xl'
      } ${
        focused
          ? `${T.windowChrome} ${
              isRetro ? '' : 'shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)]'
            }`
          : `${T.windowChromeIdle} ${
              isRetro ? '' : 'shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)]'
            }`
      }`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        display: win.minimized ? 'none' : undefined,
        // Hard offset shadow for the classic theme; the modern one uses the
        // Tailwind soft shadows above. Two style systems, one element, so the
        // shadow has to be merged into the same style object rather than
        // sitting in a second `style` prop that React would silently drop.
        ...(isRetro && focused ? { boxShadow: T.windowShadowFocused } : null),
      }}
      onPointerDown={onFocus}
      onWheel={(e) => e.stopPropagation()}
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
          isWin95 ? 'h-[20px] px-[3px]' : 'h-[38px] px-3.5'
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
        <div className="group/lights flex items-center gap-0.5">
          {controls.map(({ title, fn, Glyph, dot }) => (
            <button
              key={title}
              type="button"
              aria-label={title}
              title={title}
              data-click-sound
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                audio.classicClick()
                fn()
              }}
              className={
                isWin95
                  ? 'grid h-[18px] w-[18px] place-items-center bg-[#c0c0c0] text-black shadow-[inset_-1px_-1px_0_#000000,inset_1px_1px_0_#ffffff,inset_-2px_-2px_0_#808080,inset_2px_2px_0_#dfdfdf] active:shadow-[inset_1px_1px_0_#000000,inset_-1px_-1px_0_#ffffff]'
                  : isClassicMac
                    ? `grid h-[13px] w-[13px] place-items-center border border-black bg-[#dddddd] text-black shadow-[inset_1px_1px_0_#ffffff] transition-opacity ${
                        focused ? 'opacity-100' : 'opacity-40'
                      }`
                    : `grid h-[15px] w-[15px] place-items-center rounded-full ${dot} text-black/60 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)] transition-opacity ${
                        focused ? 'opacity-100' : 'opacity-45'
                      }`
              }
            >
              <Glyph
                size={isRetro ? 8 : 9}
                strokeWidth={3}
                className={
                  isWin95 ? '' : 'opacity-0 transition-opacity group-hover/lights:opacity-100'
                }
              />
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
        }`}
      >
        {children}
      </div>

      {/* ---------------------------------------------------- Status bar */}
      {/* Browser windows of the era ended in a segmented status strip: a wide
          sunken panel on the left carrying the copyright, then a few narrow
          empty panels for the zone and progress indicators. The empty ones are
          not filler — a status bar with a single panel reads as a footer, and
          the segmentation is what makes it read as a browser. */}
      {isWebDoc && isWin95 && (
        <div className="flex h-[20px] shrink-0 items-center gap-[2px] px-[2px] pb-[2px]" style={{ background: '#c0c0c0' }}>
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
          className="absolute bottom-0 right-0 z-50 h-4 w-4 cursor-nwse-resize"
          aria-label="Resize window"
          title="Resize"
        />

      )}
    </div>
  )
}
