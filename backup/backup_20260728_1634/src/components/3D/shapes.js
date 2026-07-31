import { Vector2 } from 'three'

/* ==========================================================================
   shapes.js — profile builders for turned and moulded objects.

   Most of the props in a room are rotationally symmetric: a mug, a lampshade,
   a planter, a speaker cone, a caster. Built from stacked cylinders they read
   as stacked cylinders — you can see the steps. Built as a LATHE, revolving a
   silhouette around the Y axis, they read as one turned object, and the
   silhouette is where all the character lives.

   Each builder returns Vector2 points for <latheGeometry>. Points run bottom
   to top; x is radius, y is height. Small fillets at the ends matter more
   than they look: a hard 90° lip is the thing that says "primitive".
   ========================================================================== */

/** Quarter-arc fillet, so profiles can turn corners instead of breaking them. */
function arc(cx, cy, r, from, to, steps = 5) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps
    pts.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return pts
}

/**
 * A drinking mug: slight outward taper, rolled rim, recessed base.
 * Revolved as a shell so the inside is visible from above.
 */
export function mugProfile({ rBottom = 0.038, rTop = 0.045, height = 0.098, wall = 0.004 } = {}) {
  return [
    new Vector2(0, 0),
    new Vector2(rBottom - 0.006, 0),
    ...arc(rBottom - 0.006, 0.004, 0.004, -Math.PI / 2, 0, 4),
    new Vector2(rBottom, 0.008),
    new Vector2(rTop, height - 0.006),
    // rolled rim
    ...arc(rTop - 0.003, height - 0.006, 0.003, 0, Math.PI / 2, 4),
    new Vector2(rTop - 0.003, height),
    new Vector2(rTop - wall - 0.003, height - 0.002),
    // inner wall back down
    new Vector2(rBottom - wall, 0.012),
    new Vector2(0, 0.012),
  ]
}

/**
 * A conical lampshade. Open at the bottom, filleted at the top where it meets
 * the arm, with a small returned lip at the mouth — real shades are pressed
 * metal and always have that lip.
 */
export function lampShadeProfile({ rMouth = 0.115, rTop = 0.026, height = 0.135 } = {}) {
  return [
    new Vector2(rMouth, 0),
    ...arc(rMouth - 0.008, 0.006, 0.008, -Math.PI / 2, 0, 4),
    new Vector2(rMouth - 0.002, 0.012),
    new Vector2(rTop + 0.01, height - 0.02),
    ...arc(rTop + 0.01, height - 0.01, 0.01, -Math.PI / 2, 0, 4),
    new Vector2(rTop, height),
  ]
}

/** Weighted lamp base: a low dome with a soft edge, not a disc. */
export function lampBaseProfile({ radius = 0.115, height = 0.028 } = {}) {
  return [
    new Vector2(0, 0),
    new Vector2(radius - 0.012, 0),
    ...arc(radius - 0.012, 0.012, 0.012, -Math.PI / 2, Math.PI / 2, 6),
    new Vector2(radius - 0.02, height),
    new Vector2(0, height),
  ]
}

/** Tapered ceramic planter with a rolled rim and a foot. */
export function planterProfile({ rTop = 0.17, rBottom = 0.115, height = 0.32 } = {}) {
  return [
    new Vector2(0, 0),
    new Vector2(rBottom - 0.018, 0),
    ...arc(rBottom - 0.018, 0.01, 0.01, -Math.PI / 2, 0, 4),
    new Vector2(rBottom, 0.022),
    new Vector2(rTop - 0.006, height - 0.028),
    // rim
    new Vector2(rTop, height - 0.018),
    ...arc(rTop - 0.008, height - 0.01, 0.008, 0, Math.PI / 2, 4),
    new Vector2(rTop - 0.008, height),
    new Vector2(rTop - 0.02, height - 0.004),
    new Vector2(rBottom - 0.01, 0.03),
    new Vector2(0, 0.03),
  ]
}

/** Speaker driver: a dished cone with a dust cap and a surround roll. */
export function speakerConeProfile({ radius = 0.042, depth = 0.018 } = {}) {
  return [
    new Vector2(0, depth * 0.55), // dust cap apex
    new Vector2(radius * 0.28, depth * 0.42),
    new Vector2(radius * 0.32, depth * 0.3),
    new Vector2(radius * 0.8, 0.002), // cone
    // rubber surround
    ...arc(radius * 0.88, 0.004, radius * 0.1, -Math.PI, 0, 5),
    new Vector2(radius, 0),
  ]
}

/** Caster wheel: a tyre with a crowned tread, not a flat cylinder. */
export function wheelProfile({ radius = 0.036, width = 0.026 } = {}) {
  const half = width / 2
  return [
    new Vector2(0, -half),
    new Vector2(radius * 0.55, -half),
    new Vector2(radius * 0.95, -half * 0.72),
    ...arc(radius * 0.95, 0, half * 0.72, -Math.PI / 2, Math.PI / 2, 6),
    new Vector2(radius * 0.55, half),
    new Vector2(0, half),
  ]
}

/** Generic soft cylinder — a can, a tin, a speaker port. */
export function cylinderProfile({ radius = 0.05, height = 0.1, fillet = 0.006 } = {}) {
  return [
    new Vector2(0, 0),
    new Vector2(radius - fillet, 0),
    ...arc(radius - fillet, fillet, fillet, -Math.PI / 2, 0, 4),
    new Vector2(radius, height - fillet),
    ...arc(radius - fillet, height - fillet, fillet, 0, Math.PI / 2, 4),
    new Vector2(radius - fillet, height),
    new Vector2(0, height),
  ]
}
