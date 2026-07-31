import { useEffect, useRef, useState } from 'react'

/* ==========================================================================
   BootSequence — the moment the screen wakes up as the camera arrives.

   The old transition was `opacity: 0 → 1` over 400ms on the whole desktop.
   That is not a computer turning on; it is a div appearing. A real display
   coming to life is a sequence of distinct physical events, and reproducing
   them in order is what sells it:

   1. BACKLIGHT. The panel lights before it shows anything — a flat dark grey
      wash, not black, because an LCD backlight leaks through a black frame.
   2. MARK. The logo fades up alone, centred, over a long beat. Nothing else
      on screen. The confidence to hold on an empty screen is most of what
      makes a boot feel expensive.
   3. PROGRESS. A hairline determinate bar that fills on an ease-out curve —
      quick to 70%, then slow. Never linear: a linear bar reads as a fake,
      because real work does not arrive at a constant rate.
   4. HANDOFF. The whole layer wipes to transparent while the desktop behind
      it is already composited, so you see the wallpaper arrive underneath
      rather than a cut.

   Total 1900ms, which is long enough to register and short enough that a
   second visit is not annoying — and it is spent while the camera is still
   flying, so it costs the viewer nothing.

   Driven by one rAF loop against wall-clock time rather than a chain of
   setTimeouts or CSS animations, for the same reason the camera rig is — plus
   a timer deadline as a second, independent clock, because this layer covers
   the whole desktop and must hand over even if rAF never runs at all.
   ========================================================================== */

export const BOOT_MS = 1900

const PHASES = {
  backlight: 260,
  mark: 900,
  progress: 1500,
  handoff: BOOT_MS,
}

/** Quick then slow. Real progress bars decelerate; linear ones look fake. */
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)

export default function BootSequence({ run, onDone }) {
  const [t, setT] = useState(0)
  const [done, setDone] = useState(!run)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (!run) return undefined
    setDone(false)
    setT(0)

    let frame
    const start = performance.now()

    const finish = () => {
      setDone(true)
      doneRef.current?.()
    }

    const tick = () => {
      const elapsed = performance.now() - start
      setT(elapsed)
      if (elapsed >= PHASES.handoff) {
        finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    /* Deadline, because this layer covers the entire desktop. requestAnimation-
       Frame does not merely slow down when the page is not being painted — it
       stops completely, and a boot screen frozen at 40% over an unreachable
       desktop is a far worse failure than a boot screen that never played. The
       timer is a different clock with different failure modes, so if rAF never
       ticks at all this still hands over. */
    const deadline = setTimeout(finish, PHASES.handoff + 250)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(deadline)
    }
  }, [run])

  if (!run || done) return null

  const backlight = Math.min(1, t / PHASES.backlight)
  const markIn = Math.min(1, Math.max(0, (t - PHASES.backlight) / 420))
  const barIn = Math.min(1, Math.max(0, (t - PHASES.mark) / 180))
  const barT = Math.min(1, Math.max(0, (t - PHASES.mark) / (PHASES.progress - PHASES.mark)))
  const fill = easeOutQuart(barT)
  const out = Math.min(1, Math.max(0, (t - PHASES.progress) / (PHASES.handoff - PHASES.progress)))

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[300] flex flex-col items-center justify-center"
      style={{
        // The layer wipes out as a whole; the desktop is already behind it.
        opacity: 1 - out,
        // A hair of scale-up on the way out, so the desktop feels like it is
        // coming toward you rather than the boot screen just vanishing.
        transform: `scale(${1 + out * 0.03})`,
        background: `rgba(8,9,12,${backlight})`,
      }}
    >
      {/* Backlight bloom. An LCD is never uniformly black — the panel glows
          faintly from the centre before anything is drawn on it. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: backlight,
          background:
            'radial-gradient(120% 80% at 50% 46%, rgba(120,140,190,0.10) 0%, rgba(0,0,0,0) 60%)',
        }}
      />

      {/* The mark. Held alone for a beat before anything else appears. */}
      <div
        style={{
          opacity: markIn,
          transform: `translateY(${(1 - markIn) * 6}px)`,
          filter: `blur(${(1 - markIn) * 3}px)`,
        }}
      >
        <Monogram />
      </div>

      {/* Progress. Sits a fixed distance below the mark, the way every boot
          screen since 2001 has, and never moves. */}
      <div
        className="mt-9 h-[3px] w-[168px] overflow-hidden rounded-full"
        style={{ opacity: barIn, background: 'rgba(255,255,255,0.14)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${fill * 100}%`,
            background: 'linear-gradient(90deg, #7dd3fc 0%, #a5b4fc 55%, #f0abfc 100%)',
            boxShadow: '0 0 10px rgba(165,180,252,0.65)',
          }}
        />
      </div>
    </div>
  )
}

/* The mark. Built from FILLED shapes rather than strokes: this renders onto a
   surface inside a 3D scene and then gets scaled down, and a 3.6px stroke
   becomes sub-pixel by the time the viewer sees it — the first version lost its
   crossbar entirely and read as a chevron. A solid plate with the letter
   knocked out of it holds at any size, and it matches the app icons' plate
   construction so the boot screen and the dock look like one system. */
function Monogram() {
  return (
    <svg width="76" height="76" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="bootPlate" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.97" />
          <stop offset="55%" stopColor="#dbe2ec" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9aa6b8" stopOpacity="0.85" />
        </linearGradient>
        <filter id="bootGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#bootGlow)">
        {/* Plate, at the app icons' 22.5% corner ratio. */}
        <rect x="6" y="6" width="52" height="52" rx="11.7" fill="url(#bootPlate)" />
        {/* The A, knocked through the plate. evenodd turns the apex triangle
            into a real counter instead of painting over it. */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M32 15 L47 49 L39.6 49 L36.4 41.6 L27.6 41.6 L24.4 49 L17 49 Z
             M32 25.4 L28.9 34.6 L35.1 34.6 Z"
          fill="rgba(10,13,20,0.92)"
        />
      </g>
    </svg>
  )
}
