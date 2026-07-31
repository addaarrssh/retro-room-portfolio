import { useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '../../data/portfolio'

/* ==========================================================================
   LoadingScreen — the BIOS power-on self-test.

   This is the first thing anyone sees and it is doing the same job Henry
   Heffernan's does: it establishes, before a single polygon is on screen,
   that you are not looking at a website — you are looking at a machine
   booting. A spinner would say "loading". A POST screen says "1998".

   The rules that make it read as a real POST rather than as an animation:

   1. LEFT ALIGNED, TOP ANCHORED, MONOSPACE, PURE WHITE ON PURE BLACK. No
      centring, no colour, no easing. Firmware had no design.
   2. The lines ARRIVE ONE AT A TIME on a fixed cadence, and each one stays.
      A block of text that fades in as a unit is a div; a list that grows
      downward a line at a time is a machine reporting progress.
   3. The resource lines carry REAL percentages counting to 100. That is the
      detail that makes it feel like it is actually doing something, and it
      costs nothing because the scene genuinely is loading behind this.
   4. It ENDS ON A DIALOG WITH A BUTTON and waits. It does not auto-advance.

   That last point is not styling. Browsers refuse to start an AudioContext
   without a real user gesture, so the START click is the only thing that
   makes sound possible for the rest of the visit. A screen that dismissed
   itself would ship a silent site.
   ========================================================================== */

/* Deliberately absurd faux-firmware, in the house style of every real BIOS:
   a company that does not exist, a version string that means nothing, and a
   memory count that is far too small to be true. */
const BIOS_HEAD = [
  { text: 'Sahu,', delay: 0 },
  { text: 'Adarsh Inc.', delay: 90 },
  { text: 'Released: 05/08/2005', delay: 180 },
  { text: '', delay: 240 },
  { text: 'ASBIOS (C)2005 Sahu Adarsh Inc.,', delay: 320 },
  { text: '', delay: 380 },
  { text: 'ASP S07 2005-2026 Special UC072S', delay: 460 },
  { text: '', delay: 520 },
  { text: 'ASP Showcase(tm) XX 072', delay: 600 },
  { text: '', delay: 660 },
  { text: 'Checking RAM : 14000 OK', delay: 760 },
  { text: '', delay: 820 },
]

/* The resource manifest. These are the actual things the scene builds, which
   is what keeps the readout honest rather than decorative. */
const RESOURCES = [
  'roomGeometry',
  'deskSurface',
  'monitorPanel',
  'keyboardKeycaps',
  'shadowMap',
  'environmentProbe',
  'audioEngine',
  'virtualDisplay',
]

const HEAD_MS = 300
const RES_STEP = 35

export default function LoadingScreen({ ready, onEnter }) {
  const [tick, setTick] = useState(0)
  const [dismissing, setDismissing] = useState(false)
  const startRef = useRef(performance.now())
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /* One wall-clock interval drives the whole readout. Not rAF: this layer
     covers the entire viewport, and rAF does not merely slow down when a page
     is not painted, it stops — which would leave a visitor staring at a frozen
     half-finished POST until they came back to the tab. */
  useEffect(() => {
    const id = setInterval(() => setTick(performance.now() - startRef.current), 60)
    return () => clearInterval(id)
  }, [])

  const headShown = BIOS_HEAD.filter((l) => tick >= l.delay)

  /* Resource lines resolve in order, each one printing the running total. The
     last line cannot print until the scene actually reports ready, so the
     readout can never claim 100% on a scene that has not finished. */
  const resCount = Math.min(RESOURCES.length, Math.floor(Math.max(0, tick - HEAD_MS) / RES_STEP))
  const complete = ready && resCount >= RESOURCES.length

  const resLines = useMemo(
    () =>
      RESOURCES.slice(0, resCount).map((name, i) => ({
        name,
        pct: Math.round(((i + 1) / RESOURCES.length) * 100),
      })),
    [resCount],
  )

  const today = useMemo(() => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`
  }, [])

  const handleStart = () => {
    if (dismissing) return
    setDismissing(true)
    timers.current.push(setTimeout(() => onEnter(), 240))
  }

  /* ENTER is the keyboard equivalent of clicking START, and it counts as the
     same user gesture as far as the audio unlock is concerned. */
  useEffect(() => {
    if (!complete) return undefined
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleStart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // handleStart only closes over onEnter, stable for this screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete])

  return (
    <div
      onClick={complete ? handleStart : undefined}
      className={`absolute inset-0 z-[100] cursor-pointer overflow-hidden bg-black transition-opacity duration-200 ${
        dismissing ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* The POST readout. Fixed to the top-left corner with a hard margin,
          exactly as firmware writes to a text-mode framebuffer. */}
      <div className="absolute inset-0 p-5 font-mono text-[13px] leading-[1.45] text-white sm:p-7">
        {headShown.map((l, i) => (
          <div key={i}>{l.text || ' '}</div>
        ))}

        {resCount > 0 && (
          <>
            <div>&nbsp;</div>
            <div>FINISHED LOADING RESOURCES</div>
            <div>&nbsp;</div>
            {resLines.map((r) => (
              <div key={r.name}>
                Loaded {r.name} ... {r.pct}%
              </div>
            ))}
          </>
        )}

        {complete && (
          <>
            <div>&nbsp;</div>
            <div>
              All Content Loaded, launching &apos;{profile.name} Portfolio Showcase&apos; V1.0
            </div>
          </>
        )}

        {!complete && <span className="caret">_</span>}
      </div>

      {/* Firmware footer. Present from the first frame, because a real BIOS
          prints its key hints immediately and leaves them up. */}
      <div className="absolute inset-x-0 bottom-0 p-5 font-mono text-[13px] text-white sm:p-7">
        <div>Press DEL to enter SETUP , ESC to skip memory test</div>
        <div>{today}</div>
      </div>

      {/* The launcher. A double-ruled box in the dead centre — the one piece
          of the screen that is centred, which is what makes it read as a
          dialog interrupting the readout rather than as more of the readout. */}
      {complete && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="animate-fade-in w-[min(90vw,520px)] border-[3px] border-white bg-black p-1">
            <div className="border border-white/0 px-6 py-6">
              <div className="font-mono text-[15px] leading-relaxed text-white">
                {profile.name} Portfolio Showcase {new Date().getFullYear()}
                <br />
                Click start to begin <span className="caret">_</span>
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  autoFocus
                  onClick={handleStart}
                  className="border-2 border-white bg-black px-4 py-1.5 font-mono text-[15px] tracking-wide text-white transition-colors hover:bg-white hover:text-black focus:bg-white focus:text-black focus:outline-none"
                >
                  START
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
