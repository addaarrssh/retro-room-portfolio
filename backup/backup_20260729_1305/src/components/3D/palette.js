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

  wall: '#d2d5e0',
  wallSide: '#c2c5d0',
  wallTint: '#e0e3ee',
  ceiling: '#eaecf4',
  skirting: '#989bb0',

  floor: '#b89874',
  floorTint: '#a68662',
  floorDark: '#785e42',

  rug: '#8a8798',
  rugTint: '#7a7788',

  deskTop: '#dfccb5',
  deskWood: '#be9f82',
  deskWoodDark: '#92765b',
  deskMat: '#383a42',
  deskLeg: '#9ea1ac',

  shelf: '#b2b5c4',
  shelfWood: '#c7c9c0',
  shelfWoodDark: '#9ea1aa',

  chairShell: '#5d606a',
  chairAccent: '#8d929d',
  chairBase: '#a9acb6',

  towerBody: '#c0c3ce',
  speaker: '#32343c',

  /* Sky through the window is the key light in this scheme, so it is bright
     and neutral rather than a night sky. */
  windowFrame: '#989bb0',
}

export const DARK = {
  id: 'DARK',

  wall: '#272533',
  wallSide: '#22202c',
  wallTint: '#141318',
  ceiling: '#0d0c10',
  skirting: '#1a1822',

  floor: '#5c4738',
  floorTint: '#2b1e16',
  floorDark: '#1a110c',

  rug: '#4c3254',
  rugTint: '#2a1b2e',

  deskTop: '#8c6a51',
  deskWood: '#3a261a',
  deskWoodDark: '#1e130c',
  deskMat: '#0a0a0c',
  deskLeg: '#121316',

  shelf: '#5c4738',
  shelfWood: '#2b1e16',
  shelfWoodDark: '#1a110c',

  chairShell: '#0f0f13',
  chairAccent: '#dc2626',
  chairBase: '#141418',

  towerBody: '#1a1a1f',
  speaker: '#211e26',

  windowFrame: '#18181b',
}

export const OVERHEAD = {
  id: 'OVERHEAD',

  wall: '#b5b8c5',
  wallSide: '#a2a5b2',
  wallTint: '#c2c5d2',
  ceiling: '#ffffff',
  skirting: '#808398',

  floor: '#a58562',
  floorTint: '#947451',
  floorDark: '#664c31',

  rug: '#787586',
  rugTint: '#686576',

  deskTop: '#cca892',
  deskWood: '#ab8b6e',
  deskWoodDark: '#806449',
  deskMat: '#282a32',
  deskLeg: '#8e919c',

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
