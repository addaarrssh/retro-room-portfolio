import { useEffect, useRef, useState } from 'react'
import { Download, LogOut, Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import { profile } from '../../data/portfolio'
import TypewriterText from './TypewriterText'
import { COMPACT, TOUCH } from '../../hooks/useDevice'

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
  monitorHover = false,
  ready,
  muted,
  appearance = 'LIGHT',
  onToggleAppearance,
  onToggleMute,
  onZoomOut,
}) {
  const [mounted, setMounted] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const typedOnce = useRef(false)
  const shownOnce = useRef(false)

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
  /* The room HUD belongs to the room. It leaves the moment you start to sit
     (it used to ride along over the flight and sit on top of the monitor)
     and comes back as you stand, so it is in place by the time you land. */
  const showRoomHud = isRoom || viewState === 'ZOOMING_OUT'
  /* Typed out once, on the first arrival. Retyping the name every time you
     stood up from the desk made the page look like it was reloading. */
  if (showRoomHud && ready) shownOnce.current = true
  else if (shownOnce.current) typedOnce.current = true
  const animateType = !typedOnce.current
  const isLight = appearance === 'LIGHT'

  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between p-3 select-none sm:p-6"
      /* Keeps the slabs clear of a notch and of the home indicator. */
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
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
        {showRoomHud && (
          <>
            <Slab>
              {animateType ? (
                <TypewriterText text={profile.name} speed={26} delay={150} playSound={false} cursorChar="_" />
              ) : (
                <span className="animate-fade-in">{profile.name}</span>
              )}
            </Slab>
            <Slab>
              {animateType ? (
                <TypewriterText
                  text={profile.role}
                  speed={16}
                  delay={150 + profile.name.length * 26 + 100}
                  playSound={false}
                  cursorChar="_"
                />
              ) : (
                <span className="animate-fade-in">{profile.role}</span>
              )}
            </Slab>

            {/* Clock and appearance share one slab */}
            <div className="pointer-events-auto flex items-center gap-1 animate-fade-in" style={{ animationDelay: '1.2s' }}>
              <Slab tabular>{clock}</Slab>
              <SlabButton
                label={isLight ? 'Dark appearance' : 'Light appearance'}
                onClick={onToggleAppearance}
              >
                {isLight ? <Moon size={12} /> : <Sun size={12} />}
              </SlabButton>
            </div>

            {/* The shortcuts. Some visitors have ninety seconds and want a
                document, not an experience — a recruiter with forty tabs open
                is one of them. These four are everything they came for, and
                they are reachable from the first frame without sitting down at
                the desk. Anchors, so the room's click-to-enter ignores them. */}
            <div className="pointer-events-auto mt-1 flex max-w-full flex-wrap items-center gap-1 animate-fade-in" style={{ animationDelay: '1.6s' }}>
              <SlabLink href="/Adarsh_Sahu_Resume_DataScience.pdf" download="Adarsh_Sahu_Resume_DataScience.pdf" primary>
                <Download size={12} />
                <span>R&eacute;sum&eacute;</span>
              </SlabLink>
              {profile.linkedin && <SlabLink href={profile.linkedin}>LinkedIn</SlabLink>}
              {profile.github && <SlabLink href={profile.github}>GitHub</SlabLink>}
              {profile.email && <SlabLink href={`mailto:${profile.email}`}>Email</SlabLink>}
            </div>
          </>
        )}

        {isZoomed && !COMPACT && (
          <button
            onClick={onZoomOut}
            className="animate-fade-in pointer-events-auto flex min-h-[34px] items-center gap-2 bg-[#111] px-3 py-1.5 font-mono text-[12px] tracking-wide text-white transition hover:bg-[#222] active:scale-95"
          >
            <LogOut size={12} />
            <span>Back to room</span>
            {!TOUCH && (
              <kbd className="ml-1 border border-white/30 px-1 text-[10px] leading-[14px] text-zinc-300">Esc</kbd>
            )}
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
          {/* Says the one thing to do. When the pointer is on the monitor the
              prompt brightens and names the action, so the hover and the
              click read as one gesture: point at it, then take the seat. */}
          <div
            className={`bg-[#111] px-3 py-1.5 text-center font-mono text-[13px] tracking-wide text-white sm:px-3.5 transition-[opacity,transform] duration-300 ${
              monitorHover ? 'translate-y-[-2px] opacity-100' : hintDismissed ? 'opacity-55' : 'opacity-100'
            }`}
          >
            {TOUCH
              ? 'Tap to sit down · drag to look around'
              : monitorHover
                ? 'Click to sit at the computer'
                : 'Click anywhere to sit down'}{' '}
            <span className="caret">_</span>
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
      className={`pointer-events-auto inline-block max-w-full bg-[#111] px-2.5 py-1 font-mono text-[13px] leading-snug text-white ${
        tabular ? 'tabular-nums' : ''
      }`}
    >
      {children}
    </span>
  )
}

function SlabLink({ children, href, download, primary }) {
  const external = /^https?:/.test(href)
  return (
    <a
      href={href}
      download={download || undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`inline-flex ${TOUCH ? 'h-[36px] px-3 text-[13px]' : 'h-[26px] px-2.5 text-[12px]'} items-center gap-1.5 font-mono leading-none transition active:scale-95 ${
        primary ? 'bg-white text-[#111] ring-1 ring-inset ring-[#111] hover:bg-zinc-200' : 'bg-[#111] text-white hover:bg-[#2a2a2a]'
      }`}
    >
      {children}
    </a>
  )
}

function SlabButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`pointer-events-auto grid ${TOUCH ? 'h-[28px] w-[34px]' : 'h-[26px] w-[26px]'} place-items-center bg-[#111] text-white transition hover:bg-[#2a2a2a] active:scale-95`}
    >
      {children}
    </button>
  )
}

