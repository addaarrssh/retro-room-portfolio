import { createContext, useContext } from 'react'

/* ==========================================================================
   palette.js — the room's material colours in one place.

   The room ships in a bright daytime studio finish: white walls, pale oak,
   light grey textiles. That reads as a professional workspace rather than a
   gaming setup, and — more practically — a light room is far more forgiving
   of the honest limits of real-time rendering. Dark rooms live or die on
   bounce light and global illumination that a browser cannot afford, which is
   why the old finish looked flat and muddy in the corners.

   DARK is kept because the appearance toggle switches between them, and
   because the desk lamp only really earns its place after sunset.
   ========================================================================== */

export const LIGHT = {
  id: 'LIGHT',

  /* The sweep. Warm paper rather than the old blue-white — a neutral with a
     little warmth in it photographs as "studio", a cold one as "hospital". */
  sweepFloor: '#ece8e1',
  sweepTop: '#c8c3ba',

  /* The desk used to be near-black (#3c3a37) on a warm-white sweep — roughly
     a 12:1 luminance ratio, which is a silhouette, not an object. Everything
     on top of it read as floating on a hole, and the eye had nowhere to rest
     between the bright backdrop and the dark slab.

     These values sit about two stops under the sweep instead of five: the desk
     is unmistakably darker than the ground it stands on, but it is now the
     same FAMILY of neutral, so the shot reads as one lit set rather than as a
     cut-out pasted onto a backdrop. The legs stay light because a dark top on
     pale legs is what actually holds a desk up visually. */
  deskTop: '#6f6b64',
  deskWood: '#635f59',
  deskWoodDark: '#55524c',
  deskMat: '#5a5751',
  deskLeg: '#a7a49e',

  shelf: '#b2b5c4',
  shelfWood: '#c7c9c0',
  shelfWoodDark: '#9ea1aa',

  /* Tan leather, and it is the only warm colour left in the scene.

     The chair was a dark blue-grey, which under this lighting rendered as a
     black mass — the highest-contrast object in frame, sitting right next to
     the monitor and competing with it. Worse, with the lamp gone there was no
     warmth anywhere: an entirely neutral set photographs as sterile, and every
     product shot of a workspace has exactly one warm object in it for that
     reason. A tan chair fixes both problems with one value. */
  chairShell: '#a97a52',
  chairAccent: '#8a5f3c',
  chairBase: '#9b9a9d',

  towerBody: '#8e8d8c',
  speaker: '#32343c',

  /* Sky through the window is the key light in this scheme, so it is bright
     and neutral rather than a night sky. */
  windowFrame: '#989bb0',
}

export const DARK = {
  id: 'DARK',

  sweepFloor: '#1a1917',
  sweepTop: '#0b0b0c',

  deskTop: '#2a2825',
  deskWood: '#232120',
  deskWoodDark: '#1a1918',
  deskMat: '#141313',
  deskLeg: '#4a4947',

  shelf: '#5c4738',
  shelfWood: '#2b1e16',
  shelfWoodDark: '#1a110c',

  chairShell: '#0f0f13',
  chairAccent: '#6b6a68',
  chairBase: '#141418',

  towerBody: '#1a1a1f',
  speaker: '#211e26',

  windowFrame: '#18181b',
}

export const OVERHEAD = {
  id: 'OVERHEAD',

  sweepFloor: '#f2efe9',
  sweepTop: '#d2cec6',

  deskTop: '#46443f',
  deskWood: '#3b3935',
  deskWoodDark: '#302e2b',
  deskMat: '#33322f',
  deskLeg: '#9d9c98',

  shelf: '#a2a5b4',
  shelfWood: '#b7b9b0',
  shelfWoodDark: '#8e919a',

  chairShell: '#4d505a',
  chairAccent: '#7d828d',
  chairBase: '#999cb6',

  towerBody: '#b0b3be',
  speaker: '#22242c',

  windowFrame: '#888ba0',
}

export const PALETTES = { LIGHT, DARK, OVERHEAD }

export const paletteFor = (appearance) => PALETTES[appearance] ?? LIGHT

/* Delivered by context rather than props: the room is thirty-odd components
   deep in places, and threading a colour object through every one of them
   would bury the geometry in plumbing. */
export const PaletteContext = createContext(LIGHT)
export const usePalette = () => useContext(PaletteContext)
