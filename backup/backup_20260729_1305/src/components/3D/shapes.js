import { BoxGeometry, ExtrudeGeometry, Shape, Vector2 } from 'three'

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

/* ==========================================================================
   keycapGeometry — a real keycap, not a small box.

   A keycap is the single most-photographed object on any desk, and the camera
   in this scene ends up about 20cm from these. Three things separate a keycap
   from a cuboid, and none of them is the corner radius alone:

   · TAPER. The top face is meaningfully smaller than the base — roughly 76%
     on a Cherry-profile cap. This is what gives a keyboard its texture under
     raking light: every cap throws a sliver of shadow onto its neighbour.
   · DISH. The top is scooped so a fingertip sits in it. Cylindrically on most
     profiles, but a spherical dish reads better at this scale because it
     catches a highlight in the centre rather than along a line.
   · ROUNDED PLAN + BEVELLED LIP. Injection-moulded ABS cannot hold a sharp
     edge, so every corner in plan is radiused and the top lip is broken.

   Built once and handed to <Instances>, so all ~70 caps stay a single draw
   call — the extra triangles here cost nothing next to a second draw call.
   ========================================================================== */
export function keycapGeometry({
  width = 0.046,
  depth = 0.021,
  height = 0.012,
  radius = 0.0035,
  taper = 0.78,
  dish = 0.0022,
  curveSegments = 3,
} = {}) {
  const w = width / 2 - radius
  const d = depth / 2 - radius

  const shape = new Shape()
  shape.moveTo(-w, -d - radius)
  shape.lineTo(w, -d - radius)
  shape.quadraticCurveTo(w + radius, -d - radius, w + radius, -d)
  shape.lineTo(w + radius, d)
  shape.quadraticCurveTo(w + radius, d + radius, w, d + radius)
  shape.lineTo(-w, d + radius)
  shape.quadraticCurveTo(-w - radius, d + radius, -w - radius, d)
  shape.lineTo(-w - radius, -d)
  shape.quadraticCurveTo(-w - radius, -d - radius, -w, -d - radius)

  const geo = new ExtrudeGeometry(shape, {
    depth: height,
    curveSegments,
    bevelEnabled: true,
    bevelThickness: height * 0.14,
    bevelSize: radius * 0.45,
    bevelSegments: 2,
  })

  // Extrude runs along +Z; stand it up and sit the base on the origin.
  geo.rotateX(-Math.PI / 2)
  geo.computeBoundingBox()
  const { min, max } = geo.boundingBox
  geo.translate(0, -min.y, 0)
  const top = max.y - min.y

  const pos = geo.attributes.position
  const halfW = width / 2
  const halfD = depth / 2

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)

    // Taper: full width at the base, `taper` of it at the lip.
    const t = top === 0 ? 0 : y / top
    const k = 1 + (taper - 1) * t
    pos.setX(i, x * k)
    pos.setZ(i, z * k)

    // Dish: only the top face, falling away from the centre. Weighted by t so
    // the bevel ring blends into it instead of stepping.
    if (t > 0.72) {
      const r = Math.min(1, Math.hypot(x / halfW, z / halfD))
      const blend = (t - 0.72) / 0.28
      pos.setY(i, y - dish * r * r * blend)
    }
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/* ==========================================================================
   bookGeometry — a hardback, not a cuboid.

   A shelf of books is where "boxy" is hardest to hide: forty identical
   rectangles side by side, all catching the light along one flat plane. What
   a real hardback does instead is CURVE ITS SPINE — the back is rounded so
   the signatures can hinge, which means every book on the shelf returns a
   soft vertical highlight in a slightly different place. That single curve is
   what makes a shelf look photographed rather than modelled.

   Returned normalised to a centred unit cube, so it is a drop-in replacement
   for <boxGeometry args={[1,1,1]} /> and every existing per-instance scale
   keeps working. Local axes: X = spine width, Y = height, Z = depth, with the
   rounded spine facing +Z.
   ========================================================================== */
export function bookGeometry({ cap = 0.14, cornerRadius = 0.06 } = {}) {
  const r = cornerRadius
  const shape = new Shape()

  // Cross-section in the XY plane: +Y is the spine side, -Y the fore-edge.
  shape.moveTo(-0.5, -0.5 + r)
  shape.quadraticCurveTo(-0.5, -0.5, -0.5 + r, -0.5)
  shape.lineTo(0.5 - r, -0.5)
  shape.quadraticCurveTo(0.5, -0.5, 0.5, -0.5 + r)
  shape.lineTo(0.5, 0.5 - cap)
  // The rounded back. Control point solved so the curve peaks at exactly 0.5.
  shape.quadraticCurveTo(0, 0.5 + cap, -0.5, 0.5 - cap)
  shape.lineTo(-0.5, -0.5 + r)

  const geo = new ExtrudeGeometry(shape, {
    depth: 1,
    curveSegments: 6,
    bevelEnabled: true,
    // Breaks the head and tail edges — the crushed corners every read book has.
    bevelThickness: 0.014,
    bevelSize: 0.01,
    bevelSegments: 1,
  })

  // Stand it up: extrusion axis becomes height, spine ends up facing +Z.
  geo.rotateX(Math.PI / 2)

  // Normalise to a centred unit cube so per-instance scale means what it did
  // before. Per-axis, so the bevel growing one axis cannot skew the others.
  geo.computeBoundingBox()
  const { min, max } = geo.boundingBox
  const sx = max.x - min.x
  const sy = max.y - min.y
  const sz = max.z - min.z
  geo.translate(-(min.x + max.x) / 2, -(min.y + max.y) / 2, -(min.z + max.z) / 2)
  geo.scale(1 / sx, 1 / sy, 1 / sz)

  geo.computeVertexNormals()
  return geo
}

/* ==========================================================================
   cushionGeometry — an upholstered panel, between a box and a sphere.

   Foam under vinyl is neither. A RoundedBox keeps flat faces, so a seat reads
   as a chamfered plank. A scaled sphere loses the rectangular silhouette, so
   a backrest reads as a lozenge. What a real cushion does is keep its
   rectangular outline while CROWNING every face outward and letting the
   corners melt — it is a box being slowly inflated.

   Built as a spherified cube: each vertex is blended from its cube position
   toward the sphere that circumscribes it, by `crown`. At 0 it is a box, at 1
   a sphere; the useful range for upholstery is 0.2-0.4.

   Spans -1..1 on every axis, matching <sphereGeometry args={[1, …]} />, so a
   mesh's existing scale means the same thing after the swap.
   ========================================================================== */
export function cushionGeometry({ crown = 0.3, segments = 14 } = {}) {
  const geo = new BoxGeometry(2, 2, 2, segments, segments, segments)
  const pos = geo.attributes.position

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)

    // Cube-to-sphere mapping that keeps the grid even, rather than bunching
    // vertices at the corners the way plain normalisation does.
    const x2 = x * x
    const y2 = y * y
    const z2 = z * z
    const sx = x * Math.sqrt(Math.max(0, 1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3))
    const sy = y * Math.sqrt(Math.max(0, 1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3))
    const sz = z * Math.sqrt(Math.max(0, 1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3))

    pos.setXYZ(i, x + (sx - x) * crown, y + (sy - y) * crown, z + (sz - z) * crown)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}
