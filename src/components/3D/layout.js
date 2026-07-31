/* ==========================================================================
   layout.js — the handful of measurements the room and the monitor must agree
   on. Everything is in metres, and the origin is the middle of the room at
   floor level.

   PANEL is the physical slab of plastic. SCREEN is the lit area inside it.
   Keeping them separate matters: SCREEN.z must stay *in front of* the panel's
   front face, or the display ends up buried inside the casing and renders as a
   dead grey rectangle. The front face sits at PANEL.z + PANEL.d / 2, so:

       SCREEN.z  >  PANEL.z + PANEL.d / 2

   SCREEN is also kept at exactly the SCREEN_PX aspect ratio (4:3). The desktop
   is mapped onto it with a uniform scale, so any mismatch shows up as unused
   black bars inside the display area.
   ========================================================================== */

export const ROOM = {
  width: 6.0,
  height: 3.0,
  backZ: -1.35,
  frontZ: 2.6,
  halfX: 3.0,
}

export const DESK_TOP = 0.7

/** Virtual desktop resolution. SCREEN.w x SCREEN.h must match this aspect. */
export const SCREEN_PX = { w: 1024, h: 768 }

/** The monitor's physical panel — casing, bezel, the thing you see edge-on. */
export const PANEL = {
  w: 1.144,
  h: 0.854,
  d: 0.024,
  y: 1.265,
  z: -0.043, // front face lands at -0.031
}

/**
 * The lit display. 4:3 to match SCREEN_PX, inset inside PANEL so there is a
 * real bezel (22mm at the sides, ~14mm top and bottom), and sitting 3mm proud
 * of the panel face so nothing can swallow it.
 */
export const SCREEN = {
  w: 1.1,
  h: 0.825,
  y: 1.2645,
  z: -0.028,
}

/**
 * drei's <Html transform> maps CSS pixels to world units as
 * `px * distanceFactor / 400`. Deriving the factor instead of hard-coding it
 * means the desktop always fills the display exactly, whatever SCREEN.w becomes.
 */
export const SCREEN_HTML_FACTOR = (400 * SCREEN.w) / SCREEN_PX.w

/**
 * Camera distance from the display for the seated view.
 *
 * `margin` is the amount of air left around the display, and 1.05 was too
 * tight: the desktop ran edge to edge and the monitor it is supposed to be
 * inside disappeared off the sides of the frame. You were looking at a
 * full-screen web page, not at a screen in a room, which throws away the whole
 * premise about two seconds after arriving.
 *
 * 1.24 puts the lit area at roughly 85% of the frame height, which leaves the
 * beige casing, the bezel and the power LED visible all the way around — the
 * framing the reference site settles into, and what PROJECT_REQUIREMENTS asks
 * for in rule 1.
 */
export function monitorViewDistance(fovDeg, aspect, margin = 1.48) {
  const halfFov = Math.tan((fovDeg * Math.PI) / 180 / 2)
  const fitHeight = SCREEN.h / (2 * halfFov)
  const fitWidth = SCREEN.w / (2 * halfFov * aspect)
  return Math.max(fitHeight, fitWidth) * margin
}
