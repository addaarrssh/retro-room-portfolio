import { createContext, useContext } from 'react'

/* ==========================================================================
   theme.js — macOS light and dark appearance for the virtual desktop.

   Tokens rather than per-component conditionals. Every surface in the OS
   picks its colours from here, so adding a window or an app cannot
   accidentally hardcode a dark background that then looks broken in Light —
   which is exactly how the old build ended up with a white serif Showcase
   page sitting inside a synthwave desktop.

   Values track the real system: #f5f5f7 window chrome and #1e1e1e in dark,
   with the same #0a84ff / #007aff accent macOS uses for selection.
   ========================================================================== */

export const OS_LIGHT = {
  id: 'LIGHT',
  accent: '#e08c42',
  accentText: '#ffffff',

  desktop: 'linear-gradient(165deg, #dfe6f2 0%, #e9edf5 34%, #f2f3f7 68%, #e6e9f1 100%)',
  bloomA: 'rgba(120,160,255,0.30)',
  bloomB: 'rgba(210,150,255,0.22)',

  menubar: 'bg-white/55 border-black/[0.08]',
  menubarText: 'text-neutral-800',
  menubarMuted: 'text-neutral-600',

  dock: 'bg-white/45 border-white/60',

  windowChrome: 'bg-[#e8e8ea]/92 border-black/[0.12]',
  windowChromeIdle: 'bg-[#efeff1]/85 border-black/[0.08]',
  titlebar: 'bg-[#e4e4e7]/85 border-black/[0.08]',
  windowBody: 'bg-[#fbfbfd]',
  windowShadowFocused: '0 24px_64px_-12px_rgba(0,0,0,0.28),0_0_0_0.5px_rgba(0,0,0,0.12)',

  text: 'text-neutral-900',
  textMuted: 'text-neutral-500',
  textFaint: 'text-neutral-400',

  sidebar: 'bg-black/[0.03] border-black/[0.07]',
  fill: 'bg-black/[0.05]',
  fillHover: 'hover:bg-black/[0.08]',
  divider: 'border-black/[0.08]',
}

export const OS_DARK = {
  id: 'DARK',
  accent: '#e08c42',
  accentText: '#ffffff',

  desktop: 'linear-gradient(165deg, #1b2450 0%, #16203f 28%, #101728 58%, #0a0d16 100%)',
  bloomA: 'rgba(88,120,255,0.28)',
  bloomB: 'rgba(196,92,214,0.20)',

  menubar: 'bg-black/35 border-white/[0.06]',
  menubarText: 'text-white',
  menubarMuted: 'text-white/75',

  dock: 'bg-white/[0.10] border-white/[0.14]',

  windowChrome: 'bg-[#1c1c1e]/92 border-white/[0.16]',
  windowChromeIdle: 'bg-[#1c1c1e]/78 border-white/[0.08]',
  titlebar: 'bg-[#2c2c2e]/85 border-black/40',
  windowBody: 'bg-[#1c1c1e]',
  windowShadowFocused: '0 24px_64px_-12px_rgba(0,0,0,0.85),0_0_0_0.5px_rgba(0,0,0,0.6)',

  text: 'text-white',
  textMuted: 'text-zinc-400',
  textFaint: 'text-zinc-500',

  sidebar: 'bg-white/[0.03] border-white/[0.07]',
  fill: 'bg-white/[0.07]',
  fillHover: 'hover:bg-white/[0.12]',
  divider: 'border-white/[0.07]',
}

export const OS_WIN95 = {
  id: 'WIN95',
  accent: '#000080',
  accentText: '#ffffff',

  desktop: '#008080',
  bloomA: 'transparent',
  bloomB: 'transparent',

  menubar: 'bg-[#c0c0c0] border-b-2 border-white',
  menubarText: 'text-black font-sans text-xs font-bold',
  menubarMuted: 'text-zinc-700',

  dock: 'bg-[#c0c0c0] border-t-2 border-white',

  windowChrome: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080]',
  windowChromeIdle: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080]',
  titlebar: 'bg-[#000080] text-white font-bold',
  windowBody: 'bg-[#ffffff] text-black',
  windowShadowFocused: 'none',

  text: 'text-black',
  textMuted: 'text-zinc-600',
  textFaint: 'text-zinc-500',

  sidebar: 'bg-[#c0c0c0] border-r-2 border-[#808080]',
  fill: 'bg-[#d4d4d4]',
  fillHover: 'hover:bg-[#000080] hover:text-white',
  divider: 'border-[#808080]',
}

/* ==========================================================================
   OS_CLASSIC — Mac OS, the Platinum era.

   Deliberately NOT Windows 95, which is the obvious choice for a retro
   desktop and therefore the one everybody makes. The two systems solved the
   same problems in opposite directions, and the Mac answer is the quieter one:

   · NO COLOUR AT ALL in the chrome. Win95 puts a saturated navy bar across the
     top of every window; Platinum's active title bar is the same grey as the
     window, distinguished only by horizontal pinstripes. The colour budget
     goes entirely to content.
   · HAIRLINE OUTLINES, not chunky bevels. Win95 draws a 2px light/dark bevel
     on every edge to fake depth. Platinum uses a 1px black outline and a
     single inner highlight — the form is described, not embossed.
   · SQUARE EVERYTHING. No radius anywhere, which is what lets it sit next to
     the flat HUD slabs on the room layer without arguing with them.

   The pinstripes are a repeating-linear-gradient rather than an image, so they
   stay crisp at any scale the 3D screen renders at.
   ========================================================================== */
export const OS_CLASSIC = {
  id: 'CLASSIC',
  accent: '#000000',
  accentText: '#ffffff',

  desktop: '#8b8b93',
  bloomA: 'transparent',
  bloomB: 'transparent',

  menubar: 'bg-[#dddddd] border-b border-black',
  menubarText: 'text-black text-xs',
  menubarMuted: 'text-black',

  dock: 'bg-[#dddddd] border border-black',

  /* The window frame: one black outline, one white inner highlight along the
     top-left. That pair is the whole of Platinum's depth model. */
  windowChrome: 'bg-[#dddddd] border border-black shadow-[inset_1px_1px_0_#ffffff]',
  windowChromeIdle: 'bg-[#dddddd] border border-black',
  titlebar: 'bg-[#dddddd] text-black border-b border-black',
  windowBody: 'bg-[#ffffff] text-black',
  /* A hard offset shadow, not a soft blur — the era had no compositor, and a
     gaussian falloff here is the one detail that would read as modern. */
  windowShadowFocused: '2px 2px 0 rgba(0,0,0,0.35)',

  text: 'text-black',
  textMuted: 'text-neutral-700',
  textFaint: 'text-neutral-500',

  sidebar: 'bg-[#dddddd] border-r border-black',
  fill: 'bg-[#dddddd]',
  fillHover: 'hover:bg-black hover:text-white',
  divider: 'border-black',
}

export const OS_THEMES = { LIGHT: OS_LIGHT, DARK: OS_DARK, WIN95: OS_WIN95, CLASSIC: OS_CLASSIC }
export const osThemeFor = (appearance, era = 'MODERN') =>
  era === 'RETRO' ? OS_WIN95 : (OS_THEMES[appearance] ?? OS_LIGHT)

export const OSThemeContext = createContext(OS_LIGHT)
export const useOSTheme = () => useContext(OSThemeContext)
