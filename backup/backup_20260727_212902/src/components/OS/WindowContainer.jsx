import { useCallback, useRef } from 'react'
import { Maximize2, Minus, Minimize2, X } from 'lucide-react'
import audio from '../../audio/AudioEngine'

function domScale(el) {
  if (!el) return 1
  const rect = el.getBoundingClientRect()
  const w = el.offsetWidth
  return w > 0 ? rect.width / w : 1
}

export default function WindowContainer({
  win,
  focused,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  children,
}) {
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

  if (win.minimized) return null

  const Icon = win.icon

  return (
    <div
      ref={rootRef}
      className={`window-open absolute flex flex-col overflow-hidden rounded-2xl border backdrop-blur-2xl transition-shadow select-none ${
        focused
          ? 'border-indigo-500/40 bg-zinc-950/85 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.2)]'
          : 'border-white/10 bg-zinc-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
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
        className={`flex h-10 shrink-0 select-none items-center justify-between border-b border-white/10 px-4 ${
          win.maximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90`}
      >
        {/* macOS Colored Window Control Dots */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={(e) => {
              e.stopPropagation()
              audio.click()
              onClose()
            }}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 transition cursor-pointer shadow"
            title="Close Window"
          />
          <button
            onPointerDown={(e) => {
              e.stopPropagation()
              audio.click()
              onMinimize()
            }}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 transition cursor-pointer shadow"
            title="Minimize Window"
          />
          <button
            onPointerDown={(e) => {
              e.stopPropagation()
              audio.click()
              onToggleMaximize()
            }}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 transition cursor-pointer shadow"
            title="Maximize Window"
          />
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-300">
          {Icon && <Icon size={14} className="text-indigo-400" />}
          <span>{win.title}</span>
        </div>

        <div className="w-12" />
      </div>

      {/* ---------------------------------------------------------- Content Area */}
      <div className="relative min-h-0 flex-1 bg-zinc-950/90 text-slate-100 font-sans overflow-hidden">
        {children}
      </div>

      {/* -------------------------------------------------- Resize Gripper */}
      {!win.maximized && (
        <div
          onPointerDown={startResize}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize z-50 opacity-40 hover:opacity-100"
          aria-label="Resize window"
        >
          <svg viewBox="0 0 16 16" className="h-full w-full text-indigo-400">
            <path d="M15 6 L6 15 M15 10 L10 15 M15 14 L14 15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  )
}
