import { useEffect, useState } from 'react'
import { LogOut, Moon, Music, Pause, Sun, Volume2, VolumeX } from 'lucide-react'
import { profile } from '../../data/portfolio'

/* ==========================================================================
   Overlay — the 2D chrome floating over the 3D room.

   Deliberately small. This layer had grown to six floating panels: a location
   badge, a theme cycler, a music pill, an audio pill, an instruction banner
   and a five-key car legend — all in loud monospace with emoji. That is more
   interface than the room it sits on, and it is the single thing that made a
   careful 3D scene read as a toy rather than as somebody's portfolio.

   What survives is what a visitor actually needs:
     · who this is                        (top left, quiet)
     · sound and appearance               (top right, icons only)
     · what to do next                    (bottom, one line, fades once used)
     · how to get out again               (only while zoomed in)

   The car keys moved behind a hover, because they matter to the one person in
   fifty who finds the car — not to the recruiter who has been here nine
   seconds.
   ========================================================================== */

export default function Overlay({
  viewState,
  hoveredProp,
  ready,
  muted,
  isPlayingMusic = false,
  appearance = 'LIGHT',
  onToggleAppearance,
  onToggleMute,
  onToggleMusic,
  onZoomOut,
  onEnter,
}) {
  const [mounted, setMounted] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)

  useEffect(() => setMounted(true), [])

  /* The prompt has done its job once you have sat down once; nagging after
     that is just noise on every return trip. */
  useEffect(() => {
    if (viewState === 'MONITOR_ZOOMED') setHintDismissed(true)
  }, [viewState])

  if (!mounted) return null

  const isRoom = viewState === 'ROOM'
  const isZoomed = viewState === 'MONITOR_ZOOMED'
  const isLight = appearance === 'LIGHT'

  // One chip style for every control, so the cluster reads as a set.
  const chip = isLight
    ? 'border-black/10 bg-white/70 text-neutral-700 hover:bg-white hover:text-neutral-900'
    : 'border-white/10 bg-black/40 text-zinc-300 hover:bg-black/60 hover:text-white'

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between p-6 select-none">
      {/* ------------------------------------------------------------ top */}
      <div
        className={`flex items-start justify-between transition-opacity duration-700 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Identity, not telemetry. A visitor needs to know whose desk this
            is; they do not need a fake location readout. */}
        {!isZoomed ? (
          <div className={`pointer-events-auto ${isLight ? 'text-neutral-800' : 'text-zinc-200'}`}>
            <div className="text-[15px] font-semibold leading-none tracking-tight">
              {profile.name}
            </div>
            <div
              className={`mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] ${
                isLight ? 'text-neutral-500' : 'text-zinc-500'
              }`}
            >
              {profile.role}
            </div>
          </div>
        ) : (
          <span />
        )}

        <div className="pointer-events-auto flex items-center gap-1.5">
          {!isZoomed && (
            <>
              <IconChip
                className={chip}
                label={isPlayingMusic ? 'Pause music' : 'Play music'}
                onClick={onToggleMusic}
                active={isPlayingMusic}
              >
                {isPlayingMusic ? <Pause size={14} /> : <Music size={14} />}
              </IconChip>

              <IconChip className={chip} label={muted ? 'Unmute' : 'Mute'} onClick={onToggleMute}>
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </IconChip>

              <IconChip
                className={chip}
                label={isLight ? 'Dark appearance' : 'Light appearance'}
                onClick={onToggleAppearance}
              >
                {isLight ? <Moon size={14} /> : <Sun size={14} />}
              </IconChip>
            </>
          )}

          {isZoomed && (
            <button
              onClick={onZoomOut}
              className="animate-fade-in flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-[11px] text-zinc-300 shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:text-white active:scale-95"
            >
              <LogOut size={13} />
              <span>ESC</span>
            </button>
          )}
        </div>
      </div>

      {/* Hover label for interactive room objects. One shared element rather
          than an <Html> per prop — three always-mounted DOM layers inside the
          canvas cost more than one that appears on demand. */}
      {isRoom && hoveredProp && (
        <div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 text-center animate-fade-in">
          <div
            className={`inline-block rounded-xl border px-4 py-2 shadow-lg backdrop-blur-md ${
              isLight ? 'border-black/10 bg-white/80' : 'border-white/10 bg-black/60'
            }`}
          >
            <div
              className={`text-[13px] font-semibold ${isLight ? 'text-neutral-900' : 'text-white'}`}
            >
              {hoveredProp.label}
            </div>
            {hoveredProp.hint && (
              <div
                className={`mt-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  isLight ? 'text-neutral-500' : 'text-zinc-400'
                }`}
              >
                {hoveredProp.hint}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- bottom */}
      {isRoom && ready && (
        <div className="flex items-end justify-between gap-4">
          {/* Primary call to action. One sentence, one button. */}
          <button
            onClick={onEnter}
            className={`pointer-events-auto flex items-center gap-3 rounded-full border px-5 py-2.5 text-[13px] shadow-lg backdrop-blur-md transition active:scale-[0.98] ${chip} ${
              hintDismissed ? 'opacity-45 hover:opacity-100' : 'opacity-100'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
            </span>
            <span className="font-medium">Sit down at the desk</span>
            <kbd
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                isLight ? 'bg-black/[0.07]' : 'bg-white/10'
              }`}
            >
              ↵
            </kbd>
          </button>

          {/* Easter egg, kept as one. Expands on hover for the curious. */}
          <div
            className={`group pointer-events-auto rounded-full border px-3.5 py-2 font-mono text-[10.5px] backdrop-blur-md transition-all ${chip}`}
          >
            <span className="opacity-70 transition group-hover:opacity-100">🏎️ Drive me</span>
            <span className="ml-0 inline-block max-w-0 overflow-hidden whitespace-nowrap align-middle opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-md group-hover:opacity-70">
              WASD · Shift boost · L lights · H horn · R reset
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function IconChip({ children, label, onClick, className, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-full border shadow-sm backdrop-blur-md transition active:scale-95 ${className} ${
        active ? 'ring-1 ring-sky-400/50' : ''
      }`}
    >
      {children}
    </button>
  )
}
