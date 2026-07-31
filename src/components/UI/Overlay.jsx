import { useEffect, useState } from 'react'
import { LogOut, Moon, Sun, Volume2, VolumeX } from 'lucide-react'
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
  appearance = 'LIGHT',
  onToggleAppearance,
  onToggleMute,
  onZoomOut,
}) {
  const [mounted, setMounted] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)

  /* A running clock is the cheapest possible signal that the scene is alive
     rather than a still render — it ticks before you have touched anything.
     Declared up here with the other hooks, above the `!mounted` bail-out: a
     hook after an early return runs in a different order on the render that
     takes the branch, which is the one rule React does not forgive. */
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('en-GB'))

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB')), 1000)
    return () => clearInterval(id)
  }, [])

  /* The prompt has done its job once you have sat down once; nagging after
     that is just noise on every return trip. */
  useEffect(() => {
    if (viewState === 'MONITOR_ZOOMED') setHintDismissed(true)
  }, [viewState])

  if (!mounted) return null

  const isRoom = viewState === 'ROOM'
  const isZoomed = viewState === 'MONITOR_ZOOMED'
  const isLight = appearance === 'LIGHT'

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between p-6 select-none">
      {/* ------------------------------------------------------------ top */}
      {/* Stacked slabs in one corner, not a name on the left and a row of
          round buttons on the right. Two clusters at opposite ends of the
          frame make the eye travel; one block reads as a single instrument
          panel bolted to the view, and leaves the rest of the frame to the
          room. Solid fill, no radius, no blur — the type does the work. */}
      <div
        className={`flex flex-col items-start gap-1 transition-opacity duration-700 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {!isZoomed && (
          <>
            <Slab>{profile.name}</Slab>
            <Slab>{profile.role}</Slab>

            {/* Clock and controls share one slab, so the panel stays a column
                of three rather than sprawling. */}
            <div className="pointer-events-auto flex items-center gap-1">
              <Slab tabular>{clock}</Slab>
              <SlabButton label={muted ? 'Unmute' : 'Mute'} onClick={onToggleMute}>
                {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </SlabButton>
              <SlabButton
                label={isLight ? 'Dark appearance' : 'Light appearance'}
                onClick={onToggleAppearance}
              >
                {isLight ? <Moon size={12} /> : <Sun size={12} />}
              </SlabButton>
            </div>
          </>
        )}

        {isZoomed && (
          <button
            onClick={onZoomOut}
            className="animate-fade-in pointer-events-auto flex items-center gap-2 bg-[#111] px-3 py-1.5 font-mono text-[12px] tracking-wide text-white transition hover:bg-[#222] active:scale-95"
          >
            <LogOut size={12} />
            <span>ESC</span>
          </button>
        )}
      </div>

      {/* Hover label for interactive room objects. One shared element rather
          than an <Html> per prop — three always-mounted DOM layers inside the
          canvas cost more than one that appears on demand. */}
      {isRoom && hoveredProp && (
        <div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 text-center animate-fade-in">
          {/* Fixed white on the slab, not appearance-driven. The label used to
              sit on a translucent panel that followed the room's light/dark
              theme; on a solid black slab the light-theme value would be near
              black text on near black. */}
          <div className="inline-block bg-[#111] px-3.5 py-2">
            <div className="font-mono text-[13px] text-white">{hoveredProp.label}</div>
            {hoveredProp.hint && (
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                {hoveredProp.hint}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- bottom */}
      {/* One line, centred, and it does NOT say what to click — because the
          whole room is the target. A button sitting in a corner implies the
          rest of the frame is inert; a centred instruction implies the scene
          itself is waiting for you. The blinking caret is what marks it as a
          prompt rather than a caption. */}
      {isRoom && ready && (
        <div className="flex items-end justify-center gap-4">
          <div
            className={`bg-[#111] px-3.5 py-1.5 font-mono text-[13px] tracking-wide text-white transition-opacity duration-500 ${
              hintDismissed ? 'opacity-45' : 'opacity-100'
            }`}
          >
            Click anywhere to begin <span className="caret">_</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* The HUD's one shape: a solid black slab with monospace type. No radius, no
   border, no blur — every one of those would soften an element whose whole job
   is to sit hard against a soft 3D image and stay readable over any of it. */
function Slab({ children, tabular }) {
  return (
    <span
      className={`pointer-events-auto inline-block bg-[#111] px-2.5 py-1 font-mono text-[13px] leading-snug text-white ${
        tabular ? 'tabular-nums' : ''
      }`}
    >
      {children}
    </span>
  )
}

function SlabButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto grid h-[26px] w-[26px] place-items-center bg-[#111] text-white transition hover:bg-[#2a2a2a] active:scale-95"
    >
      {children}
    </button>
  )
}

