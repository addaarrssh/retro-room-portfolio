import { useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '../../data/portfolio'
import { COMPACT, TOUCH } from '../../hooks/useDevice'

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
   4. IT HANDS OVER BY ITSELF. The last line prints, holds for a beat, and
      the screen dissolves into the room.

   It used to end on a dialog with a START button and wait. That was there
   because browsers refuse to start an AudioContext without a user gesture,
   and the click was the gesture. The site is silent on load now, so the
   button was a toll with nothing behind it: a visitor had to read a screen
   and press something before seeing a single thing about the person whose
   portfolio this is. Sound, if it is ever switched on, unlocks on the first
   tap in the room instead. A tap or a key still skips the hold.
   ========================================================================== */

/* Deliberately absurd faux-firmware, in the house style of every real BIOS:
   a company that does not exist, a version string that means nothing, and a
   memory count that is far too small to be true. */
const BIOS_HEAD = [
  { text: 'Sahu,', delay: 0 },
  { text: 'Adarsh Inc.', delay: 45 },
  { text: 'Released: 05/08/2005', delay: 90 },
  { text: '', delay: 120 },
  { text: 'ASBIOS (C)2005 Sahu Adarsh Inc.,', delay: 160 },
  { text: '', delay: 190 },
  { text: 'ASP S07 2005-2026 Special UC072S', delay: 230 },
  { text: '', delay: 260 },
  { text: 'ASP Showcase(tm) XX 072', delay: 300 },
  { text: '', delay: 330 },
  { text: 'Checking RAM : 14000 OK', delay: 380 },
  { text: '', delay: 410 },
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

const FADE_MS = 900
const HEAD_MS = 160
const RES_STEP = 22
/* How long the finished readout stays up before the room takes over. Long
   enough to read the last line, short enough not to feel like a wait. */
const HOLD_MS = 650

export default function LoadingScreen({ ready, onEnter, onGone }) {
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

  /* A phone gets the readout without its blank spacer lines, so the whole
     boot fits on the screen above the fold. */
  const headShown = BIOS_HEAD.filter((l) => tick >= l.delay && (!COMPACT || l.text))

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

  /* The hand-over. The room's intro glide begins at the same moment this
     screen starts to dissolve, so what the visitor sees is the room arriving
     out of the dark rather than a black screen cutting to a still. The unmount
     is on a timer, not transitionend — an event that never fires in a
     background tab would leave an invisible layer eating every tap. */
  const handleStart = () => {
    if (dismissing) return
    setDismissing(true)
    onEnter()
    timers.current.push(setTimeout(() => onGone?.(), FADE_MS + 60))
  }
  const enter = useRef(handleStart)
  enter.current = handleStart

  /* Once the scene is ready and the readout has finished: hold, then go. A
     key press skips the hold; so does a tap anywhere (onClick below). */
  useEffect(() => {
    if (!complete) return undefined
    const id = setTimeout(() => enter.current(), HOLD_MS)
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        enter.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [complete])

  return (
    <div
      onClick={complete ? handleStart : undefined}
      style={{ transitionDuration: `${FADE_MS}ms`, transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)' }}
      className={`absolute inset-0 z-[100] overflow-hidden bg-black transition-opacity ${
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
              All Content Loaded, launching &apos;{profile.name} Portfolio Showcase&apos; V1.0{' '}
              <span className="caret">_</span>
            </div>
          </>
        )}

        {!complete && <span className="caret">_</span>}
      </div>

      {/* Firmware footer. Present from the first frame, because a real BIOS
          prints its key hints immediately and leaves them up. */}
      <div className="absolute inset-x-0 bottom-0 p-5 font-mono text-[13px] text-white sm:p-7">
        {/* Key hints are for machines with keys. */}
        {!TOUCH && <div>Press DEL to enter SETUP , ESC to skip memory test</div>}
        <div>{today}</div>
      </div>
    </div>
  )
}
