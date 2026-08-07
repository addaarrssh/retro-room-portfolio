/* ==========================================================================
   Win95Icons — the desktop's icon set, drawn as pixels.

   The rest of this project already has a beautiful macOS icon set: squircles,
   continuous corners, specular sheens, tinted drop shadows. Every one of those
   techniques is WRONG here, and not by a little.

   A Windows 95 icon was 32x32 pixels with a 16-colour palette and no
   antialiasing whatsoever. Its depth came from exactly three tones — a white
   top-left highlight, the mid fill, and a black bottom-right edge — placed by
   hand, one pixel wide. There is no gradient, no blur, no radius, and no
   partial alpha anywhere in the format. Rendering a soft, rounded, glossy icon
   inside a period window is the single loudest anachronism available, which is
   why these are redrawn rather than restyled.

   Everything below is on a 32x32 viewBox with `shapeRendering="crispEdges"`,
   so the icons stay hard-edged at any size the 3D screen happens to render at
   — including the fractional scales that the CSS transform produces, where a
   normal SVG would go soft and give the whole illusion away.
   ========================================================================== */

/* The 16-colour VGA palette, as far as it is actually needed. Named rather
   than inlined so the same three-tone shading reads consistently across every
   icon: LIGHT catches, MID fills, DARK closes the form. */
const C = {
  white: '#ffffff',
  light: '#dfdfdf',
  mid: '#c0c0c0',
  dark: '#808080',
  black: '#000000',
  navy: '#000080',
  blue: '#0000ff',
  teal: '#008080',
  cyan: '#00ffff',
  green: '#008000',
  lime: '#00ff00',
  maroon: '#800000',
  red: '#ff0000',
  olive: '#808000',
  yellow: '#ffff00',
  purple: '#800080',
}

function Svg({ children, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {children}
    </svg>
  )
}

/** A sheet of paper: white face, grey right/bottom edge, folded top corner. */
function Page({ x = 5, y = 2, w = 22, h = 28, fold = 7 }) {
  return (
    <>
      <path
        d={`M${x} ${y} h${w - fold} l${fold} ${fold} v${h - fold} h-${w} z`}
        fill={C.white}
        stroke={C.black}
        strokeWidth="1"
      />
      {/* The fold is drawn as its own lit triangle — without it the page reads
          as a plain rectangle and stops being a document. */}
      <path d={`M${x + w - fold} ${y} l${fold} ${fold} h-${fold} z`} fill={C.mid} stroke={C.black} strokeWidth="1" />
    </>
  )
}

/** Ruled lines of "text" on a page. */
function Lines({ x, y, w, rows = 5, gap = 3, color = C.dark }) {
  return Array.from({ length: rows }, (_, i) => (
    <rect key={i} x={x} y={y + i * gap} width={i === rows - 1 ? w * 0.6 : w} height="1" fill={color} />
  ))
}

/* ---------------------------------------------------------------- showcase */
/* A monitor showing a page — the site, inside a machine. Recessed screen with
   a lit lower lip, which is how every display icon of the era was built. */
function Showcase({ size }) {
  return (
    <Svg size={size}>
      <rect x="2" y="4" width="28" height="20" fill={C.mid} stroke={C.black} strokeWidth="1" />
      <rect x="2" y="4" width="27" height="1" fill={C.white} />
      <rect x="2" y="4" width="1" height="19" fill={C.white} />
      <rect x="4" y="6" width="24" height="16" fill={C.white} stroke={C.dark} strokeWidth="1" />
      <rect x="5" y="7" width="22" height="3" fill={C.navy} />
      <rect x="6" y="12" width="14" height="1" fill={C.black} />
      <rect x="6" y="15" width="18" height="1" fill={C.dark} />
      <rect x="6" y="18" width="11" height="1" fill={C.dark} />
      {/* Stand and base. */}
      <rect x="13" y="24" width="6" height="3" fill={C.dark} />
      <rect x="8" y="27" width="16" height="3" fill={C.mid} stroke={C.black} strokeWidth="1" />
    </Svg>
  )
}

/* ------------------------------------------------------------------ resume */
function Resume({ size }) {
  return (
    <Svg size={size}>
      <Page />
      <Lines x={8} y={9} w={14} rows={6} />
      {/* The red seal is the one saturated pixel in the icon, so the eye lands
          on it — the same trick the era used for "official" documents. */}
      <circle cx="22" cy="24" r="4" fill={C.red} stroke={C.maroon} strokeWidth="1" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- projects */
/* A manila folder, open. The tab is what makes it a folder rather than a box. */
function Projects({ size }) {
  return (
    <Svg size={size}>
      <path d="M2 8 h10 l3 3 h15 v17 h-28 z" fill={C.yellow} stroke={C.black} strokeWidth="1" />
      <path d="M2 8 h10 l3 3 h14" fill="none" stroke={C.white} strokeWidth="1" />
      <rect x="5" y="15" width="22" height="10" fill={C.olive} opacity="0.35" />
      <rect x="7" y="17" width="8" height="1" fill={C.black} />
      <rect x="7" y="20" width="14" height="1" fill={C.black} />
    </Svg>
  )
}

/* ----------------------------------------------------------------- contact */
function Contact({ size }) {
  return (
    <Svg size={size}>
      <rect x="2" y="7" width="28" height="18" fill={C.white} stroke={C.black} strokeWidth="1" />
      {/* The flap is a filled triangle, not two strokes — a V drawn in line
          reads as a crease, a filled shape reads as a flap lying on top. */}
      <path d="M2 7 L16 18 L30 7 z" fill={C.mid} stroke={C.black} strokeWidth="1" />
      <path d="M2 25 L12 16 M30 25 L20 16" stroke={C.dark} strokeWidth="1" fill="none" />
    </Svg>
  )
}

/* ------------------------------------------------------------------ arcade */
/* Snake, on its grid, because the app is Snake. */
function Arcade({ size }) {
  return (
    <Svg size={size}>
      <rect x="2" y="3" width="28" height="26" fill={C.mid} stroke={C.black} strokeWidth="1" />
      <rect x="2" y="3" width="27" height="1" fill={C.white} />
      <rect x="4" y="5" width="24" height="22" fill={C.black} />
      {[8, 12, 16, 20].map((cy) => (
        <rect key={cy} x={8} y={cy} width="3" height="3" fill={C.lime} />
      ))}
      <rect x="11" y="20" width="3" height="3" fill={C.lime} />
      <rect x="14" y="20" width="3" height="3" fill={C.lime} />
      <rect x="21" y="11" width="3" height="3" fill={C.red} />
    </Svg>
  )
}

/* ------------------------------------------------------------------- music */
/* A CD, which is what a media icon meant in 1995. The centre hole has to be
   the desktop colour showing through, not white, or it reads as a button. */
function MusicDisc({ size }) {
  return (
    <Svg size={size}>
      <circle cx="16" cy="16" r="13" fill={C.light} stroke={C.black} strokeWidth="1" />
      <circle cx="16" cy="16" r="13" fill="none" stroke={C.white} strokeWidth="1" opacity="0.9" />
      <circle cx="16" cy="16" r="9" fill={C.cyan} stroke={C.dark} strokeWidth="1" opacity="0.55" />
      <circle cx="16" cy="16" r="4" fill={C.white} stroke={C.dark} strokeWidth="1" />
      <circle cx="16" cy="16" r="1.5" fill={C.teal} />
    </Svg>
  )
}

/* ---------------------------------------------------------------- terminal */
/* The MS-DOS prompt: a black window with C:\> and a solid block cursor. */
function TerminalIcon({ size }) {
  return (
    <Svg size={size}>
      <rect x="3" y="5" width="26" height="22" fill={C.mid} stroke={C.black} strokeWidth="1" />
      <rect x="3" y="5" width="25" height="1" fill={C.white} />
      <rect x="4" y="6" width="24" height="3" fill={C.navy} />
      <rect x="5" y="10" width="22" height="16" fill={C.black} />
      <text x="7" y="18" fill={C.white} fontFamily="monospace" fontSize="7">
        C:\
      </text>
      <rect x="19" y="12" width="4" height="6" fill={C.white} />
    </Svg>
  )
}

/* ------------------------------------------------------------ portfolio v3 */
function PortfolioV3Icon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      {/* Globe / Internet Explorer style icon */}
      <circle cx="16" cy="16" r="12" fill="#4169E1" stroke="#000080" strokeWidth="1" />
      <ellipse cx="16" cy="16" rx="6" ry="12" fill="none" stroke="#87CEEB" strokeWidth="1" />
      <line x1="4" y1="16" x2="28" y2="16" stroke="#87CEEB" strokeWidth="1" />
      <line x1="6" y1="10" x2="26" y2="10" stroke="#87CEEB" strokeWidth="0.8" />
      <line x1="6" y1="22" x2="26" y2="22" stroke="#87CEEB" strokeWidth="0.8" />
      {/* Orbiting "e" ring */}
      <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#FFD700" strokeWidth="1.5" transform="rotate(-25 16 16)" />
    </svg>
  )
}

const REGISTRY = {
  showcase: Showcase,
  resume: Resume,
  projects: Projects,
  about: Contact,
  contact: Contact,
  arcade: Arcade,
  music: MusicDisc,
  terminal: TerminalIcon,
  portfoliov3: PortfolioV3Icon,
}

export default function Win95Icon({ appId, size = 32 }) {
  const Art = REGISTRY[appId] ?? Showcase
  return <Art size={size} />
}
