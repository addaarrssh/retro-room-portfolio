import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { profile } from '../../data/portfolio'

/* ==========================================================================
   LoadingScreen — the first thing anyone sees, so it does three jobs.

   1. It sets the tone before a single polygon is on screen. A bare spinner
      wastes the only moment where the visitor has nothing else to look at.
   2. It gates entry behind a real click. Browsers refuse to start an
      AudioContext without a user gesture, so the ENTER button is what makes
      sound possible at all — rather than silently failing on first load.
   3. Its progress is driven by wall-clock time and an explicit `ready` flag,
      never by the render loop. Tying it to frames means a throttled or
      backgrounded tab can leave a visitor staring at a spinner forever.
   ========================================================================== */

const BOOT_LINES = [
  'initialising renderer',
  'compiling shaders',
  'building room geometry',
  'baking reflection probe',
  'placing lights',
  'mounting virtual display',
]

export default function LoadingScreen({ ready, onEnter }) {
  const [progress, setProgress] = useState(0)
  const [line, setLine] = useState(0)
  const [dismissing, setDismissing] = useState(false)
  const startRef = useRef(performance.now())

  /* Progress creeps toward 90% on its own, then snaps to 100 once the scene
     actually reports ready — so the bar never lies about being finished, and
     never stalls at 0 if an asset is slow. */
  useEffect(() => {
    let raf
    const tick = () => {
      const elapsed = performance.now() - startRef.current
      setProgress((p) => {
        if (ready) return Math.min(100, p + (100 - p) * 0.18 + 0.8)
        const ceiling = 90
        return Math.min(ceiling, (elapsed / 2600) * ceiling)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // rAF can be throttled to nothing in a background tab; this keeps the bar
    // honest either way.
    const interval = setInterval(() => {
      const elapsed = performance.now() - startRef.current
      setProgress((p) => Math.max(p, ready ? 100 : Math.min(90, (elapsed / 2600) * 90)))
    }, 250)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(interval)
    }
  }, [ready])

  useEffect(() => {
    const id = setInterval(() => setLine((n) => Math.min(BOOT_LINES.length - 1, n + 1)), 420)
    return () => clearInterval(id)
  }, [])

  const complete = ready && progress > 99

  const handleEnter = () => {
    setDismissing(true)
    // Let the fade play out before handing the room over.
    setTimeout(() => onEnter(), 420)
  }

  // Auto-dismiss loading screen automatically once complete (no button click needed)
  useEffect(() => {
    if (complete && !dismissing) {
      const timer = setTimeout(() => {
        handleEnter()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [complete, dismissing])

  /* Deterministic star field — Math.random() in the render body would
     reshuffle every frame and shimmer. */
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${(i * 37.4) % 100}%`,
        top: `${(i * 61.7) % 100}%`,
        delay: `${(i % 8) * 0.35}s`,
        size: i % 5 === 0 ? 2 : 1,
      })),
    [],
  )

  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#07070a] transition-opacity duration-500 ${
        dismissing ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop: drifting glow + faint grid, no assets. */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_65%)] blur-2xl" />
        <div className="absolute bottom-0 left-1/2 h-[45vmin] w-[90vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.14),transparent_70%)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 75%)',
          }}
        />
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/50"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animation: `twinkle 3.2s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-[min(90vw,520px)] flex-col items-center px-6 text-center">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.42em] text-cyan-300/70">
          Portfolio · 3D Workspace
        </div>

        <h1 className="text-[clamp(2rem,7vw,3.4rem)] font-bold leading-none tracking-tight text-white">
          {profile.name}
        </h1>

        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          {profile.role}
        </p>

        {/* Progress */}
        <div className="mt-10 w-full">
          <div className="mb-2 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <span className="truncate">
              {complete ? 'ready' : BOOT_LINES[line]}
              {!complete && <span className="caret">_</span>}
            </span>
            <span className="tabular-nums text-zinc-400">{Math.floor(progress)}%</span>
          </div>

          <div className="h-px w-full overflow-hidden bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Auto-Entering Status Indicator */}
        <div className="mt-10 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
          <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
          <span>{complete ? 'Entering room...' : 'Loading room...'}</span>
        </div>

        <p className="mt-6 font-mono text-[10px] leading-relaxed text-zinc-600">
          Drag to look around · Drive car with WASD · Click CRT Monitor to zoom
        </p>
      </div>
    </div>
  )
}
