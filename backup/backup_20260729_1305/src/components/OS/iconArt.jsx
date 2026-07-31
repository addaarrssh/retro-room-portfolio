/* ==========================================================================
   iconArt — bespoke interiors for each app icon.

   A dock where every icon is the same squircle with a different stock glyph
   and a different hue is the clearest tell that an interface was themed rather
   than designed. Look at a real dock: the icons do not vary by colour, they
   vary by STRUCTURE. Some are a flat symbol on a coloured field. Some are an
   object with its own material sitting on that field — a sheet of paper, a
   vinyl record. Some are a screen recessed *into* the plate, with the plate
   acting as a bezel. That variety of construction is the whole effect.

   So each app gets a composition instead of a glyph:

     showcase   a display, recessed, with a play triangle on it
     resume     a sheet of paper with a folded corner, lying on the field
     about      a portrait medallion, struck like a coin
     projects   angle brackets, cut out of the field rather than drawn on it
     portfolio  a globe with real meridian foreshortening
     contact    an envelope with a genuine flap fold and a lit inner edge
     music      a record with grooves and a centre label
     arcade     a snake on a pixel grid, because the app is Snake
     terminal   a dark screen with a prompt, inset behind the plate's bezel

   All drawn on a 0-100 viewBox and scaled by the icon, so one set works at
   28px in Spotlight and 46px on the desktop without a second asset.
   ========================================================================== */

/* Shared paint. Interiors are built from white at varying opacity rather than
   from named colours, so a single composition sits correctly on any of the
   nine gradient plates without being retuned per app. */
const INK = 'rgba(255,255,255,0.96)'
const INK_SOFT = 'rgba(255,255,255,0.74)'
const INK_FAINT = 'rgba(255,255,255,0.4)'
/** Recess: what a screen or cut-out looks like sunk into the plate. */
const WELL = 'rgba(6,10,20,0.55)'

function Defs() {
  return (
    <defs>
      {/* Paper is never pure white and never flat — it takes a gradient from
          the light above it. */}
      <linearGradient id="ia-paper" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dfe4ee" />
      </linearGradient>
      {/* The lit top edge of anything with thickness. */}
      <linearGradient id="ia-lip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <radialGradient id="ia-globe" cx="0.34" cy="0.28" r="0.85">
        <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
      </radialGradient>
      <linearGradient id="ia-disc" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
        <stop offset="48%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
      </linearGradient>
    </defs>
  )
}

/** A display recessed into the plate, with a play mark. */
function Showcase() {
  return (
    <>
      <Defs />
      <rect x="16" y="22" width="68" height="45" rx="7" fill={WELL} />
      <rect x="16" y="22" width="68" height="45" rx="7" fill="none" stroke={INK_FAINT} strokeWidth="2" />
      <path d="M43 36 L60 44.5 L43 53 Z" fill={INK} />
      {/* Stand and foot, so it reads as a monitor rather than a window. */}
      <rect x="45" y="67" width="10" height="7" fill={INK_SOFT} />
      <rect x="34" y="74" width="32" height="4.5" rx="2.25" fill={INK} />
    </>
  )
}

/** A sheet of paper with a folded corner, lying on the coloured field. */
function Resume() {
  return (
    <>
      <Defs />
      <path
        d="M26 16 h32 l18 18 v50 a4 4 0 0 1 -4 4 H26 a4 4 0 0 1 -4 -4 V20 a4 4 0 0 1 4 -4 z"
        fill="url(#ia-paper)"
      />
      {/* The fold. A dog-ear only reads if the underside is a different value
          from the face — otherwise it is a triangle drawn on a rectangle. */}
      <path d="M58 16 l18 18 H62 a4 4 0 0 1 -4 -4 z" fill="rgba(120,135,160,0.55)" />
      {/* Ruled lines, shortest last, the way a paragraph actually ends. */}
      {[46, 55, 64, 73].map((y, i) => (
        <rect
          key={y}
          x="32"
          y={y}
          width={i === 3 ? 22 : 36}
          height="3.4"
          rx="1.7"
          fill="rgba(90,105,130,0.5)"
        />
      ))}
    </>
  )
}

/** A portrait struck into a medallion. */
function About() {
  return (
    <>
      <Defs />
      <circle cx="50" cy="50" r="31" fill="rgba(255,255,255,0.14)" />
      <circle cx="50" cy="50" r="31" fill="none" stroke={INK_FAINT} strokeWidth="2.4" />
      <circle cx="50" cy="42" r="11.5" fill={INK} />
      {/* Shoulders clipped by the medallion edge, as on a real coin. */}
      <path d="M31 74 a19 19 0 0 1 38 0 z" fill={INK} />
    </>
  )
}

/** Angle brackets cut out of the field rather than drawn on top of it. */
function Projects() {
  return (
    <>
      <Defs />
      <rect x="14" y="20" width="72" height="60" rx="9" fill={WELL} />
      <path
        d="M36 40 L24 50 L36 60"
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64 40 L76 50 L64 60"
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M56 34 L44 66" stroke={INK_SOFT} strokeWidth="5" strokeLinecap="round" />
    </>
  )
}

/** A globe whose meridians actually foreshorten toward the limb. */
function Portfolio() {
  return (
    <>
      <Defs />
      <circle cx="50" cy="50" r="32" fill="url(#ia-globe)" opacity="0.22" />
      <circle cx="50" cy="50" r="32" fill="none" stroke={INK} strokeWidth="3" />
      <ellipse cx="50" cy="50" rx="32" ry="12" fill="none" stroke={INK_SOFT} strokeWidth="2.4" />
      <ellipse cx="50" cy="50" rx="14" ry="32" fill="none" stroke={INK_SOFT} strokeWidth="2.4" />
      <line x1="18" y1="50" x2="82" y2="50" stroke={INK_SOFT} strokeWidth="2.4" />
    </>
  )
}

/** An envelope with a real flap, lit along the fold. */
function Contact() {
  return (
    <>
      <Defs />
      <rect x="16" y="28" width="68" height="45" rx="6" fill="url(#ia-paper)" />
      {/* Back of the flap — darker, because you are seeing its underside. */}
      <path d="M16 34 L50 57 L84 34 v-1 a5 5 0 0 0 -5 -5 H21 a5 5 0 0 0 -5 5 z" fill="rgba(120,135,160,0.5)" />
      {/* The fold's lit edge. This single stroke is what gives the flap depth. */}
      <path d="M16 33 L50 56 L84 33" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" />
    </>
  )
}

/** A record: grooves, centre label, off-axis sheen. */
function MusicArt() {
  return (
    <>
      <Defs />
      <circle cx="50" cy="50" r="33" fill="rgba(10,12,20,0.5)" />
      <circle cx="50" cy="50" r="33" fill="url(#ia-disc)" />
      {[27, 22, 17].map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" />
      ))}
      <circle cx="50" cy="50" r="11" fill={INK} />
      <circle cx="50" cy="50" r="3" fill="rgba(10,12,20,0.6)" />
      {/* A note riding the label, small enough to read as a printed mark. */}
      <path d="M55 34 v13 a4.6 4.6 0 1 1 -3 -4.3 V37 l-9 2.4 v12 a4.6 4.6 0 1 1 -3 -4.3 V36 z" fill={INK} opacity="0.92" />
    </>
  )
}

/** Snake on its grid — the icon names the actual game. */
function Arcade() {
  return (
    <>
      <Defs />
      <rect x="14" y="14" width="72" height="72" rx="10" fill={WELL} />
      {[28, 42, 56, 70].map((v) => (
        <g key={v}>
          <line x1={v} y1="18" x2={v} y2="82" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
          <line x1="18" y1={v} x2="82" y2={v} stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
        </g>
      ))}
      {/* The body, drawn as separate cells so it reads as a grid creature
          rather than a smooth path. */}
      {[
        [24, 52],
        [38, 52],
        [52, 52],
        [52, 38],
        [52, 24],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" rx="2.6" fill={INK} />
      ))}
      <circle cx="72" cy="30" r="6" fill="rgba(255,120,120,0.98)" />
    </>
  )
}

/** A terminal screen inset behind the plate's bezel. */
function TerminalArt() {
  return (
    <>
      <Defs />
      <rect x="13" y="17" width="74" height="66" rx="8" fill="rgba(4,6,10,0.82)" />
      <rect x="13" y="17" width="74" height="66" rx="8" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.6" />
      {/* Title strip, the way a shell window has one. */}
      <path d="M13 25 a8 8 0 0 1 8 -8 h58 a8 8 0 0 1 8 8 v3 H13 z" fill="rgba(255,255,255,0.1)" />
      <path
        d="M25 44 L36 53 L25 62"
        fill="none"
        stroke="rgba(126,231,160,0.98)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="42" y="58" width="24" height="4.6" rx="2.3" fill="rgba(126,231,160,0.85)" />
    </>
  )
}

const ART = {
  showcase: Showcase,
  resume: Resume,
  about: About,
  projects: Projects,
  'portfolio-v3': Portfolio,
  contact: Contact,
  music: MusicArt,
  arcade: Arcade,
  terminal: TerminalArt,
}

/**
 * The interior for an app, or null when there is no bespoke art — callers fall
 * back to the app's lucide glyph so a newly added app still renders.
 */
export default function IconArt({ appId, size }) {
  const Art = ART[appId]
  if (!Art) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.3))' }}
    >
      <Art />
    </svg>
  )
}

export function hasIconArt(appId) {
  return Boolean(ART[appId])
}
