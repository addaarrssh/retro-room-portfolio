import { useCallback, useRef } from 'react'
import { Maximize2, Minus, Minimize2, X } from 'lucide-react'
import audio from '../../audio/AudioEngine'
import { useOSTheme } from './theme'

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

  return (
    <div
      ref={rootRef}
      /* macOS window: 10px corners, hairline border, and depth carried by a
         big soft shadow rather than a coloured glow. An unfocused window sits
         back; a focused one comes forward. No accent ring — the system does
         not tint window frames, and it made every app look like an alert. */
      className={`window-open absolute flex select-none flex-col overflow-hidden rounded-[10px] border backdrop-blur-2xl transition-shadow ${
        focused
          ? `${T.windowChrome} shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)]`
          : `${T.windowChromeIdle} shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)]`
      }`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        display: win.minimized ? 'none' : undefined,
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
          audio.click()
          onToggleMaximize()
        }}
        className={`group/bar flex h-[38px] shrink-0 select-none items-center justify-between px-3.5 ${
          win.maximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } ${T.titlebar} border-b`}
      >
        {/* Traffic lights.
            Real macOS behaviour: plain colour at rest, glyphs appearing only
            when the pointer is over the group. Sized up from 14px because
            this desktop is rendered onto a surface inside a 3D scene and then
            scaled down — a control that is comfortable at 1:1 in a browser is
            a ~8px dot by the time the viewer sees it.
            They fire on click, not pointerdown, so a press that drifts off
            the button cancels instead of closing the window. */}
        <div className="group/lights flex items-center gap-2">
          {[
            { title: 'Close', fn: onClose, Glyph: X, dot: 'bg-[#ff5f57]' },
            { title: 'Minimize', fn: onMinimize, Glyph: Minus, dot: 'bg-[#febc2e]' },
            {
              title: win.maximized ? 'Restore' : 'Zoom',
              fn: onToggleMaximize,
              Glyph: win.maximized ? Minimize2 : Maximize2,
              dot: 'bg-[#28c840]',
            },
          ].map(({ title, fn, Glyph, dot }) => (
            <button
              key={title}
              type="button"
              aria-label={title}
              title={title}
              data-click-sound
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                audio.click()
                fn()
              }}
              className={`grid h-[15px] w-[15px] place-items-center rounded-full ${dot} text-black/60 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)] transition-opacity ${
                focused ? 'opacity-100' : 'opacity-45'
              }`}
            >
              <Glyph
                size={9}
                strokeWidth={3}
                className="opacity-0 transition-opacity group-hover/lights:opacity-100"
              />
            </button>
          ))}
        </div>

        {/* Centred title, system font, dimmed when the window is not focused
            — the two things that make a title bar read as macOS. */}
        <div
          className={`pointer-events-none absolute inset-x-0 flex items-center justify-center gap-1.5 text-[13px] font-semibold ${
            focused ? T.text : T.textFaint
          }`}
        >
          {Icon && <Icon size={12} className="opacity-70" />}
          <span>{win.label ?? win.title}</span>
        </div>

        <div className="w-12" />
      </div>

      {/* ---------------------------------------------------------- Content Area */}
      <div className={`relative min-h-0 flex-1 overflow-hidden font-sans ${T.windowBody} ${T.text}`}>
        {children}
      </div>

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
