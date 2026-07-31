import { useEffect, useState } from 'react'
import { Volume2, VolumeX, LogOut, CornerDownLeft } from 'lucide-react'

export default function Overlay({
  viewState,
  ready,
  muted,
  roomTheme = 'DEFAULT',
  onCycleTheme,
  onToggleMute,
  onZoomOut,
  onEnter,
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isRoom = viewState === 'ROOM'
  const isZoomed = viewState === 'MONITOR_ZOOMED'

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between p-6 select-none">
      {/* ------------------------------------------------ Loading Overlay */}
      {!ready && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-emerald-400 font-mono">
          <div className="relative flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-sm font-semibold tracking-wider uppercase">Loading 3D Retro Room...</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ Top Navigation HUD */}
      <div className="flex items-center justify-between">
        {/* Brand / Status Badge */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>{isZoomed ? 'SYS_ONLINE: WORKSTATION' : 'LOCATION: 90S_BEDROOM'}</span>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={onCycleTheme}
            className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-3.5 py-2 text-xs font-mono text-purple-300 backdrop-blur-md transition hover:bg-purple-900/80 active:scale-95 shadow-md"
            title="Cycle Room Lighting Theme [T]"
          >
            <span>🎨</span>
            <span>THEME: {roomTheme}</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-2 text-xs font-mono text-zinc-300 backdrop-blur-md transition hover:bg-zinc-800 hover:text-white active:scale-95"
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX size={15} className="text-zinc-500" /> : <Volume2 size={15} className="text-emerald-400" />}
            <span>{muted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          {/* Exit / Return to Room Button */}
          {isZoomed && (
            <button
              onClick={onZoomOut}
              className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-mono font-medium text-amber-300 backdrop-blur-md transition hover:bg-amber-500/20 active:scale-95 shadow-lg animate-fade-in"
            >
              <LogOut size={14} />
              <span>EXIT DESK [ESC]</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------ Bottom Instructions Banner & Car HUD */}
      {isRoom && ready && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-4xl mx-auto">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 px-6 py-3 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-2xl transition hover:border-emerald-500/50 hover:bg-zinc-900">
            <CornerDownLeft size={16} className="animate-pulse text-emerald-400" />
            <span>
              Click <strong className="text-emerald-400">CRT Monitor / Lamp / PC Tower</strong> or press{' '}
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-200">[Enter]</kbd>
            </span>
            <button
              onClick={onEnter}
              className="ml-2 rounded-lg bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
            >
              SIT DOWN
            </button>
          </div>

          {/* Interactive Vehicle HUD */}
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/70 px-4 py-2.5 text-xs font-mono text-rose-200 backdrop-blur-md shadow-xl">
            <span className="text-sm">🏎️</span>
            <span>
              <strong className="text-rose-400">Car:</strong> WASD (Drive) | <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-zinc-200">[L]</kbd> Lights | <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-zinc-200">[H]</kbd> Horn | <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-zinc-200">[T]</kbd> Theme | <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-zinc-200">[R]</kbd> Reset
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
