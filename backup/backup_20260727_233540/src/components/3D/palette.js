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

  wall: '#e9e9ee',
  wallSide: '#e2e2e9',
  wallTint: '#f5f5f8',
  ceiling: '#f6f6f9',
  skirting: '#d7d7de',

  floor: '#c9ad8c',
  floorTint: '#b8916a',
  floorDark: '#8a6a4a',

  rug: '#a9a6b2',
  rugTint: '#9b98a5',

  deskTop: '#e4d3bd',
  deskWood: '#c9a988',
  deskWoodDark: '#a9866a',
  deskMat: '#3f4148',
  deskLeg: '#b6b8be',

  shelf: '#e6e6ea',
  shelfWood: '#eceae6',
  shelfWoodDark: '#ddd9d3',

  chairShell: '#6f737b',
  chairAccent: '#9aa0a8',
  chairBase: '#c2c4c9',

  towerBody: '#dcdce1',
  speaker: '#3a3d43',

  /* Sky through the window is the key light in this scheme, so it is bright
     and neutral rather than a night sky. */
  windowFrame: '#c6c6cd',
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

export const PALETTES = { LIGHT, DARK }

export const paletteFor = (appearance) => PALETTES[appearance] ?? LIGHT

/* Delivered by context rather than props: the room is thirty-odd components
   deep in places, and threading a colour object through every one of them
   would bury the geometry in plumbing. */
export const PaletteContext = createContext(LIGHT)
export const usePalette = () => useContext(PaletteContext)
