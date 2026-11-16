import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  Matrix4,
  Path,
  PlaneGeometry,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

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

   One geometry is built per cap size and merged into the board, so all 104
   caps are a single draw call — the extra triangles cost nothing next to a
   second draw call.
   ========================================================================== */
export function keycapGeometry({
  width = 0.0345,
  depth = 0.0345,
  height = 0.02,
  radius = 0.0032,
  /* Absolute, not a ratio: every cap on a real board steps in by the same
     few millimetres whatever its width, so a space bar is not 70% as wide at
     the top as at the base — it is 9mm narrower, like a letter key. */
  inset = 0.0045,
  dish = 0.0016,
  curveSegments = 3,
} = {}) {
  const bevelSize = radius * 0.45
  const bevelThickness = height * 0.12
  // Build the outline inside the bevel, so the finished footprint is exactly
  // width x depth and neighbouring caps keep the gap they were given.
  const hw = width / 2 - bevelSize
  const hd = depth / 2 - bevelSize
  const r = Math.min(radius, hw * 0.9, hd * 0.9)
  const w = hw - r
  const d = hd - r

  const shape = new Shape()
  shape.moveTo(-w, -d - r)
  shape.lineTo(w, -d - r)
  shape.quadraticCurveTo(w + r, -d - r, w + r, -d)
  shape.lineTo(w + r, d)
  shape.quadraticCurveTo(w + r, d + r, w, d + r)
  shape.lineTo(-w, d + r)
  shape.quadraticCurveTo(-w - r, d + r, -w - r, d)
  shape.lineTo(-w - r, -d)
  shape.quadraticCurveTo(-w - r, -d - r, -w, -d - r)

  const geo = new ExtrudeGeometry(shape, {
    depth: height - bevelThickness * 2,
    curveSegments,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 2,
  })

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
    const t = top === 0 ? 0 : y / top
    // Taper: the same absolute step-in on every side.
    pos.setX(i, x * (1 - (inset * t) / halfW))
    pos.setZ(i, z * (1 - (inset * t) / halfD))
    // Cylindrical dish across the row, the way sculpted caps are cut: it only
    // depends on depth, so a long cap is a trough rather than a bowl.
    if (t > 0.7) {
      const zz = Math.min(1, Math.abs(z / halfD))
      pos.setY(i, y - dish * zz * zz * ((t - 0.7) / 0.3))
    }
  }

  pos.needsUpdate = true
  // Smooth across the moulded radii, crisp only where the plastic really
  // turns a corner — flat per-face normals make a cap look cut from card.
  const smooth = creased(geo, Math.PI / 5)
  geo.dispose()
  // What a legend decal needs to sit exactly on the top face.
  smooth.userData = { top, topHalfW: halfW - inset, topHalfD: halfD - inset, dish }
  return smooth
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
  weldNormals(geo)
  return geo
}

/**
 * A BoxGeometry keeps separate vertices per face, so after inflating it the
 * normals still break along the old cube edges — the hard "chamfer" line that
 * made every cushion end look cut flat. Averaging the normals of vertices that
 * share a position welds the shading across those edges (UVs stay per face).
 */
function weldNormals(geo) {
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const key = (i) => `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`
  const acc = new Map()
  for (let i = 0; i < pos.count; i++) {
    const k = key(i)
    const a = acc.get(k) || [0, 0, 0]
    a[0] += nor.getX(i)
    a[1] += nor.getY(i)
    a[2] += nor.getZ(i)
    acc.set(k, a)
  }
  for (let i = 0; i < pos.count; i++) {
    const a = acc.get(key(i))
    const l = Math.hypot(a[0], a[1], a[2]) || 1
    nor.setXYZ(i, a[0] / l, a[1] / l, a[2] / l)
  }
  nor.needsUpdate = true
}

/* ==========================================================================
   coveGeometry — a seamless studio sweep, as one continuous surface.

   A room built from a floor plane and a wall plane always shows the corner
   where they meet. You can soften the lighting all you like; the hard line is
   geometry, and the eye finds it immediately. Photographers solve this with a
   cyclorama — a floor that curves up into the wall through a large radius so
   there is no corner at all, and the subject appears to float on an infinite
   surface with no horizon.

   That is what this builds: ONE mesh whose profile runs flat along the floor,
   turns through a quarter-circle fillet, and continues flat up the back wall.
   There is no seam because there is no second mesh to seam against, and the
   normals are computed along the profile so the shading flows continuously
   through the bend instead of faceting.

   Built as a swept grid rather than an ExtrudeGeometry because an extrusion
   needs a CLOSED shape — we want an open surface with exact control of the
   normals through the curve, which is the whole point of the object.

   Vertex colours carry a subtle floor-to-top value shift, so the sweep reads
   as lit paper rather than a flat fill, without needing a texture that would
   visibly tile across a surface this large.
   ========================================================================== */
export function coveGeometry({
  width = 26,
  floorDepth = 15,
  wallHeight = 7,
  backZ = -1.6,
  radius = 2.2,
  arcSegments = 24,
  widthSegments = 2,
  colorFloor = '#e6e2da',
  colorTop = '#cfcac1',
} = {}) {
  /* The profile, sampled as {z, y, nz, ny} from the front edge of the floor,
     round the fillet, and up the wall. Normals point into the room. */
  const profile = []

  const filletStartZ = backZ + radius
  const frontZ = backZ + floorDepth

  // Floor run. Two points is enough — it is planar, and the shading across it
  // comes from the lighting, not from tessellation.
  profile.push({ z: frontZ, y: 0, nz: 0, ny: 1 })
  profile.push({ z: filletStartZ, y: 0, nz: 0, ny: 1 })

  // The fillet. Centre sits one radius up from the floor and one radius
  // forward of the wall, so the arc is tangent to both — that tangency is
  // what makes the join invisible.
  for (let i = 1; i <= arcSegments; i++) {
    const phi = (i / arcSegments) * (Math.PI / 2)
    profile.push({
      z: filletStartZ - radius * Math.sin(phi),
      y: radius - radius * Math.cos(phi),
      nz: Math.sin(phi),
      ny: Math.cos(phi),
    })
  }

  // Wall run, up to the top edge (which fog is expected to swallow).
  profile.push({ z: backZ, y: wallHeight, nz: 1, ny: 0 })

  const rows = profile.length
  const cols = widthSegments + 1
  const positions = new Float32Array(rows * cols * 3)
  const normals = new Float32Array(rows * cols * 3)
  const uvs = new Float32Array(rows * cols * 2)
  const colors = new Float32Array(rows * cols * 3)

  const cf = hexToRgb(colorFloor)
  const ct = hexToRgb(colorTop)
  const maxY = wallHeight

  for (let r = 0; r < rows; r++) {
    const p = profile[r]
    // Blend by height so the floor stays light and the wall falls off gently.
    const t = Math.min(1, p.y / maxY)
    const shade = Math.pow(t, 0.65)

    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = -width / 2 + (c / widthSegments) * width

      positions[i * 3] = x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z

      normals[i * 3] = 0
      normals[i * 3 + 1] = p.ny
      normals[i * 3 + 2] = p.nz

      uvs[i * 2] = c / widthSegments
      uvs[i * 2 + 1] = r / (rows - 1)

      colors[i * 3] = cf[0] + (ct[0] - cf[0]) * shade
      colors[i * 3 + 1] = cf[1] + (ct[1] - cf[1]) * shade
      colors[i * 3 + 2] = cf[2] + (ct[2] - cf[2]) * shade
    }
  }

  const indices = []
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c
      const b = a + 1
      const d = (r + 1) * cols + c
      const e = d + 1
      indices.push(a, d, b, b, d, e)
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('normal', new BufferAttribute(normals, 3))
  geo.setAttribute('uv', new BufferAttribute(uvs, 2))
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.setIndex(indices)
  return geo
}

/** sRGB hex to linear-ish 0..1 triple, for writing into a colour attribute. */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  const srgb = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  // three reads vertex colours as linear, so convert or the sweep comes out
  // noticeably paler than the hex it was given.
  return srgb.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
}

/* ==========================================================================
   leafGeometry — one broad leaf, as a bent sheet rather than a squashed ball.

   The plant used to be made of flattened spheres. From across the room that
   reads as a cluster of green lozenges: no tip, no stalk end, no fold, and the
   same thickness everywhere. A real leaf is a thin sheet with three features,
   and each one is a line of the loop below:

   · an OUTLINE that swells quickly from the stalk, is widest about a third of
     the way along, and tapers to a point;
   · a FOLD along the midrib, so the two halves catch the light differently —
     that crease is what makes it read as a leaf at any distance;
   · a DROOP toward the tip under its own weight.

   Local space: the stalk end is at the origin, the leaf runs along +Y for one
   unit and is at most one unit wide in X. +Z is the underside, so droop is
   positive Z and the fold lifts the edges toward -Z.
   ========================================================================== */
export function leafGeometry({ segL = 14, segW = 6, droop = 0.34, fold = 0.32 } = {}) {
  const geo = new PlaneGeometry(1, 1, segW, segL)
  const pos = geo.attributes.position

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const t = pos.getY(i) + 0.5
    const w = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.8)
    const nx = x * w
    pos.setXYZ(i, nx, t, droop * t * t - fold * Math.abs(nx))
  }

  geo.computeVertexNormals()
  return geo
}

/* ==========================================================================
   Small shared helpers.
   ========================================================================== */

/** Deterministic PRNG, so procedural props do not reshuffle on hot reload. */
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Rounded rectangle as a Shape (or Path, for holes), centred on cx, cy. */
export function roundedRectShape(w, h, r, cx = 0, cy = 0, PathType = Shape) {
  const s = new PathType()
  const x0 = cx - w / 2
  const y0 = cy - h / 2
  const rr = Math.min(r, w / 2, h / 2)
  s.moveTo(x0 + rr, y0)
  s.lineTo(x0 + w - rr, y0)
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rr)
  s.lineTo(x0 + w, y0 + h - rr)
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rr, y0 + h)
  s.lineTo(x0 + rr, y0 + h)
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rr)
  s.lineTo(x0, y0 + rr)
  s.quadraticCurveTo(x0, y0, x0 + rr, y0)
  return s
}

/**
 * toCreasedNormals leaves a zero normal on degenerate (zero-area) faces, which
 * ExtrudeGeometry makes where a contour closes on itself. In a shader that is
 * normalize(0) = NaN, and a single NaN pixel reaching the bloom pass blacks out
 * the whole frame. Point them up; they cover no area, so the value is moot.
 */
function creased(geo, angle) {
  const out = toCreasedNormals(geo, angle)
  const n = out.attributes.normal
  for (let i = 0; i < n.count; i++) {
    if (Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) < 1e-6) n.setXYZ(i, 0, 1, 0)
  }
  return out
}

/**
 * Extrude a plan Shape upward. Shape coordinates are (x, -z), so a shape
 * drawn in plan lands the right way round on the desk; the slab runs from
 * y = 0 to y = height, bevel included.
 */
export function slabGeometry(shape, height, { bevel = 0.002, bevelSegments = 3, curveSegments = 8 } = {}) {
  const b = Math.min(bevel, height * 0.45)
  const geo = new ExtrudeGeometry(shape, {
    depth: Math.max(0.0001, height - b * 2),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments,
    curveSegments,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, b, 0)
  // Smooth round the bevels and rounded corners, crisp on real edges.
  const smooth = creased(geo, Math.PI / 5)
  geo.dispose()
  return smooth
}

function paintVertices(geo, color) {
  const n = geo.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = color.r
    arr[i * 3 + 1] = color.g
    arr[i * 3 + 2] = color.b
  }
  geo.setAttribute('color', new BufferAttribute(arr, 3))
  return geo
}

/* ==========================================================================
   keyboardModel — a full-size 104-key board of the early-'90s kind.

   Laid out in key units (u) exactly as a real ANSI board is: a function row
   in groups of four with half-unit gaps, the alphanumeric block with its
   real stagger (Tab 1.5u, Caps 1.75u, Shift 2.25u…), the six-key navigation
   cluster, the inverted-T arrows and the numpad with its tall + and Enter.
   Getting those widths right is most of what makes a keyboard read as a
   keyboard; a grid of identical squares reads as a calculator.

   Everything that repeats is merged:
   · caps    — one BufferGeometry, vertex-coloured (ivory alphas, grey
               modifiers, a little per-key ageing), one draw call;
   · print   — one geometry of decal quads that hug each cap's dished top,
               plus the LED captions and the badge, all UV'd into ONE canvas
               laid out on the same unit grid (see keyboardLegendTexture).

   Local frame: front-bottom edge of the case at the origin, the case runs
   back to z = -D. That puts the pivot for the typing tilt on the desk.
   ========================================================================== */
export const KB_U = 0.038

/* Border round the key field, in u. Deep at the back, where the LEDs and the
   badge live, the way every board of the period was. */
const KB_BORDER = { left: 0.55, right: 0.55, back: 1.25, front: 0.6 }

function kbLayout() {
  const keys = []
  const add = (x, y, w, leg, dark, row, h = 1) => keys.push({ x, y, w, h, leg, dark, row })
  const A = (a) => ({ t: 'a', a })
  const T2 = (top, bot) => ({ t: '2', top, bot })
  const W = (a, align = 'l') => ({ t: 'w', a, align })
  const NP = (top, bot) => ({ t: 'np', top, bot })

  // Function row.
  add(0, 0, 1, W('Esc'), true, 0)
  ;[2, 3, 4, 5].forEach((x, i) => add(x, 0, 1, W(`F${i + 1}`), true, 0))
  ;[6.5, 7.5, 8.5, 9.5].forEach((x, i) => add(x, 0, 1, W(`F${i + 5}`), true, 0))
  ;[11, 12, 13, 14].forEach((x, i) => add(x, 0, 1, W(`F${i + 9}`), true, 0))
  add(15.5, 0, 1, W('Print Screen\nSysRq'), true, 0)
  add(16.5, 0, 1, W('Scroll\nLock'), true, 0)
  add(17.5, 0, 1, W('Pause\nBreak'), true, 0)

  // Number row.
  const num = [['~', '`'], ['!', '1'], ['@', '2'], ['#', '3'], ['$', '4'], ['%', '5'], ['^', '6'], ['&', '7'], ['*', '8'], ['(', '9'], [')', '0'], ['_', '-'], ['+', '=']]
  num.forEach(([a, b], i) => add(i, 1.5, 1, T2(a, b), false, 1))
  add(13, 1.5, 2, W('←'), true, 1)
  // Top alpha row.
  add(0, 2.5, 1.5, W('Tab ↹'), true, 2)
  'QWERTYUIOP'.split('').forEach((c, i) => add(1.5 + i, 2.5, 1, A(c), false, 2))
  add(11.5, 2.5, 1, T2('{', '['), false, 2)
  add(12.5, 2.5, 1, T2('}', ']'), false, 2)
  add(13.5, 2.5, 1.5, T2('|', '\\'), false, 2)
  // Home row.
  add(0, 3.5, 1.75, W('Caps Lock'), true, 3)
  'ASDFGHJKL'.split('').forEach((c, i) => add(1.75 + i, 3.5, 1, A(c), false, 3))
  add(10.75, 3.5, 1, T2(':', ';'), false, 3)
  add(11.75, 3.5, 1, T2('"', "'"), false, 3)
  add(12.75, 3.5, 2.25, W('Enter ↵'), true, 3)
  // Shift row.
  add(0, 4.5, 2.25, W('⇧ Shift'), true, 4)
  'ZXCVBNM'.split('').forEach((c, i) => add(2.25 + i, 4.5, 1, A(c), false, 4))
  add(9.25, 4.5, 1, T2('<', ','), false, 4)
  add(10.25, 4.5, 1, T2('>', '.'), false, 4)
  add(11.25, 4.5, 1, T2('?', '/'), false, 4)
  add(12.25, 4.5, 2.75, W('⇧ Shift'), true, 4)
  // Bottom row.
  add(0, 5.5, 1.25, W('Ctrl'), true, 5)
  add(1.25, 5.5, 1.25, W('⊞', 'c'), true, 5)
  add(2.5, 5.5, 1.25, W('Alt'), true, 5)
  add(3.75, 5.5, 6.25, null, false, 5)
  add(10, 5.5, 1.25, W('Alt'), true, 5)
  add(11.25, 5.5, 1.25, W('⊞', 'c'), true, 5)
  add(12.5, 5.5, 1.25, W('☰', 'c'), true, 5)
  add(13.75, 5.5, 1.25, W('Ctrl'), true, 5)

  // Navigation cluster and arrows.
  add(15.5, 1.5, 1, W('Insert'), true, 1)
  add(16.5, 1.5, 1, W('Home'), true, 1)
  add(17.5, 1.5, 1, W('Page\nUp'), true, 1)
  add(15.5, 2.5, 1, W('Delete'), true, 2)
  add(16.5, 2.5, 1, W('End'), true, 2)
  add(17.5, 2.5, 1, W('Page\nDown'), true, 2)
  add(16.5, 4.5, 1, W('↑', 'c'), true, 4)
  add(15.5, 5.5, 1, W('←', 'c'), true, 5)
  add(16.5, 5.5, 1, W('↓', 'c'), true, 5)
  add(17.5, 5.5, 1, W('→', 'c'), true, 5)

  // Numpad. Digits are ivory with their navigation legend underneath.
  add(19, 1.5, 1, W('Num\nLock'), true, 1)
  add(20, 1.5, 1, W('/', 'c'), true, 1)
  add(21, 1.5, 1, W('*', 'c'), true, 1)
  add(22, 1.5, 1, W('−', 'c'), true, 1)
  add(19, 2.5, 1, NP('7', 'Home'), false, 2)
  add(20, 2.5, 1, NP('8', '↑'), false, 2)
  add(21, 2.5, 1, NP('9', 'PgUp'), false, 2)
  add(22, 2.5, 1, W('+', 'c'), true, 2, 2)
  add(19, 3.5, 1, NP('4', '←'), false, 3)
  add(20, 3.5, 1, A('5'), false, 3)
  add(21, 3.5, 1, NP('6', '→'), false, 3)
  add(19, 4.5, 1, NP('1', 'End'), false, 4)
  add(20, 4.5, 1, NP('2', '↓'), false, 4)
  add(21, 4.5, 1, NP('3', 'PgDn'), false, 4)
  add(22, 4.5, 1, W('Enter'), true, 4, 2)
  add(19, 5.5, 2, NP('0', 'Ins'), false, 5)
  add(21, 5.5, 1, NP('.', 'Del'), false, 5)
  return keys
}

/* Sculpted row profile: each row's cap is tilted so the whole field forms a
   shallow concave cylinder under the fingers. Number row leans furthest
   toward the typist, the bottom row away. (radians, metres) */
const KB_ROWS = [
  { tilt: 0.06, dy: 0.0 },
  { tilt: 0.2, dy: 0.0022 },
  { tilt: 0.11, dy: 0.0006 },
  { tilt: 0.0, dy: -0.0004 },
  { tilt: -0.09, dy: 0.0 },
  { tilt: -0.14, dy: 0.0008 },
]

export function keyboardModel({ u = KB_U, seed = 7 } = {}) {
  const keys = kbLayout()
  const B = KB_BORDER
  const fieldW = 23
  const fieldD = 6.5
  const W = (fieldW + B.left + B.right) * u
  const D = (fieldD + B.back + B.front) * u

  /* Heights in the case's own frame. */
  const H = {
    base: 0.024, // lower tray
    bezelBottom: 0.021,
    bezelTop: 0.041,
    plate: 0.027, // floor of the key well
    capBase: 0.029,
    capH: 0.0205,
  }

  // u-grid -> case frame. x centred, z runs from -D (back) to 0 (front).
  const toX = (xu) => (xu - fieldW / 2) * u
  const toZ = (yu) => (yu - (fieldD + B.front)) * u
  const bounds = { x0: -B.left, y0: -B.back, x1: fieldW + B.right, y1: fieldD + B.front }
  const uvOf = (xu, yu) => [
    (xu - bounds.x0) / (bounds.x1 - bounds.x0),
    1 - (yu - bounds.y0) / (bounds.y1 - bounds.y0),
  ]

  const R = rng(seed)
  const capCache = new Map()
  const capFor = (w, h) => {
    const k = `${w}x${h}`
    if (!capCache.has(k)) {
      capCache.set(k, keycapGeometry({ width: w * u - 0.0035, depth: h * u - 0.0035, height: H.capH }))
    }
    return capCache.get(k)
  }

  const IVORY = new Color('#e0d8c4')
  const GREY = new Color('#988f7c')
  const caps = []
  const prints = []
  const m = new Matrix4()
  const rot = new Matrix4()
  const tmp = new Color()

  for (const k of keys) {
    const geo = capFor(k.w, k.h)
    const { top, topHalfW, topHalfD, dish } = geo.userData
    const prof = KB_ROWS[k.row]
    const tilt = k.h > 1 ? 0.0 : prof.tilt
    const cx = toX(k.x + k.w / 2)
    const cz = toZ(k.y + k.h / 2)
    m.makeTranslation(cx, H.capBase + prof.dy, cz)
    rot.makeRotationX(tilt)
    m.multiply(rot)

    // Caps age unevenly — a fraction of a percent per key, never a pattern.
    tmp.copy(k.dark ? GREY : IVORY)
    const age = (R() - 0.5) * 0.035
    tmp.offsetHSL(0, age * 0.3, age)
    const c = paintVertices(geo.clone().applyMatrix4(m), tmp)
    c.deleteAttribute('uv')
    caps.push(c)

    if (!k.leg) continue
    // A decal quad shaped to the dished top face, UV'd into the shared atlas.
    const q = new PlaneGeometry(topHalfW * 2, topHalfD * 2, 1, 6)
    q.rotateX(-Math.PI / 2)
    const qp = q.attributes.position
    const quv = q.attributes.uv
    const fw = topHalfW / u
    const fd = topHalfD / u
    const ucx = k.x + k.w / 2
    const ucy = k.y + k.h / 2
    const [u0, v0] = uvOf(ucx - fw, ucy + fd)
    const [u1, v1] = uvOf(ucx + fw, ucy - fd)
    for (let i = 0; i < qp.count; i++) {
      const z = qp.getZ(i)
      const zz = z / topHalfD
      qp.setY(i, top - dish * zz * zz + 0.00025)
      quv.setXY(i, u0 + quv.getX(i) * (u1 - u0), v0 + quv.getY(i) * (v1 - v0))
    }
    q.applyMatrix4(m)
    prints.push(q)
    k.face = { x0: ucx - fw, y0: ucy - fd, x1: ucx + fw, y1: ucy + fd }
  }

  /* Printing on the case itself: the LED captions above the numpad and the
     badge in the top-left corner. Flat quads just above the bezel. */
  const decals = [
    { kind: 'leds', x0: 19.05, y0: -0.05, x1: 22.95, y1: 0.95 },
    { kind: 'badge', x0: 0.0, y0: -0.98, x1: 2.6, y1: -0.36 },
  ]
  for (const d of decals) {
    const q = new PlaneGeometry((d.x1 - d.x0) * u, (d.y1 - d.y0) * u)
    q.rotateX(-Math.PI / 2)
    const quv = q.attributes.uv
    const [u0, v0] = uvOf(d.x0, d.y1)
    const [u1, v1] = uvOf(d.x1, d.y0)
    for (let i = 0; i < quv.count; i++) {
      quv.setXY(i, u0 + quv.getX(i) * (u1 - u0), v0 + quv.getY(i) * (v1 - v0))
    }
    q.translate(toX((d.x0 + d.x1) / 2), H.bezelTop + 0.0003, toZ((d.y0 + d.y1) / 2))
    prints.push(q)
  }

  const capsGeo = mergeGeometries(caps)
  const printGeo = mergeGeometries(prints)
  caps.forEach((g) => g.dispose())
  prints.forEach((g) => g.dispose())
  capCache.forEach((g) => g.dispose())

  /* Case. The plan outline is a rounded rectangle; shapes are drawn as
     (x, -z), so z = -D/2 is shape y = +D/2. */
  const cz = -D / 2
  const lower = slabGeometry(roundedRectShape(W, D, 0.02, 0, -cz), H.base, { bevel: 0.006 })

  // Top bezel with the key wells cut out of it. Each hole is the cluster's
  // key rectangle plus a small margin, so the bezel stands proud round every
  // group of keys the way the moulded top case does.
  const mgn = 0.07
  const rectHole = (x0, y0, x1, y1) => {
    const w = (x1 - x0 + mgn * 2) * u
    const h = (y1 - y0 + mgn * 2) * u
    return roundedRectShape(w, h, 0.004, toX((x0 + x1) / 2), -toZ((y0 + y1) / 2), Path)
  }
  const bezelShape = roundedRectShape(W - 0.006, D - 0.006, 0.018, 0, -cz)
  bezelShape.holes.push(
    rectHole(0, 0, 15, 1),
    rectHole(0, 1.5, 15, 6.5),
    rectHole(15.5, 0, 18.5, 1),
    rectHole(15.5, 1.5, 18.5, 3.5),
    rectHole(19, 1.5, 23, 6.5),
  )
  // Inverted-T arrow well.
  const tHole = new Path()
  const P = (xu, yu) => [toX(xu), -toZ(yu)]
  const tPts = [
    P(15.5 - mgn, 6.5 + mgn),
    P(18.5 + mgn, 6.5 + mgn),
    P(18.5 + mgn, 5.5 - mgn),
    P(17.5 + mgn, 5.5 - mgn),
    P(17.5 + mgn, 4.5 - mgn),
    P(16.5 - mgn, 4.5 - mgn),
    P(16.5 - mgn, 5.5 - mgn),
    P(15.5 - mgn, 5.5 - mgn),
  ]
  tHole.moveTo(...tPts[0])
  tPts.slice(1).forEach((p) => tHole.lineTo(...p))
  tHole.closePath()
  bezelShape.holes.push(tHole)
  const bezel = slabGeometry(bezelShape, H.bezelTop - H.bezelBottom, { bevel: 0.0028, curveSegments: 6 })
  bezel.translate(0, H.bezelBottom, 0)

  // Floor of the wells: a flat plate sitting just under the cap skirts.
  const plate = new BoxGeometry(W - 0.03, 0.004, D - 0.03)
  plate.translate(0, H.plate - 0.002, cz)

  /* Three indicator windows, Num / Caps / Scroll, under their captions. */
  const leds = [19.7, 21.0, 22.3].map((xu) => [toX(xu), H.bezelTop + 0.0008, toZ(0.585)])

  return {
    W,
    D,
    H,
    u,
    keys,
    decals,
    bounds,
    caps: capsGeo,
    print: printGeo,
    lower,
    bezel,
    plate,
    leds,
    toX,
    toZ,
  }
}

/* ==========================================================================
   mouseModel — a two-button mouse of the early '90s, as one moulded shell.

   The shell is a superellipse in plan (a rounded oblong, not an ellipse)
   lifted by a superellipse in section, then shaped by two profiles along its
   length: it is TALLER at the rear, where the palm sits, and NARROWER at the
   front, where the fingers lie on the buttons. That is the whole silhouette
   of a period mouse, and a squashed sphere has neither.

   `surface(x, z)` evaluates the very same function, so the button seams can
   be laid ON the shell rather than floating near it.

   Local frame: -Z is the nose (toward the computer), +Z the heel, y = 0 the
   desk. The shell sits on a thin base tray of height `baseH`.
   ========================================================================== */
export function mouseModel({
  halfL = 0.1,
  halfW = 0.057,
  height = 0.044,
  baseH = 0.008,
  nPlan = 2.6,
  pSect = 2.3,
  rings = 26,
  segs = 72,
  seamZ = -0.012,
} = {}) {
  const Wz = (z) => {
    const back = (z + 1) / 2
    const waist = 1 - 0.045 * Math.exp(-(((z - 0.05) / 0.38) ** 2))
    return halfW * (0.74 + 0.26 * Math.sqrt(back)) * waist
  }
  const Hz = (z) => height * (0.5 + 0.5 * Math.sin((Math.PI / 2) * Math.min(1, (z + 1) / 1.5)))
  const sect = (rho) => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, rho), pSect)), 1 / pSect)

  const surface = (x, z) => {
    const zu = Math.max(-1, Math.min(1, z / halfL))
    const xu = x / Wz(zu)
    const rho = Math.pow(Math.abs(xu) ** nPlan + Math.abs(zu) ** nPlan, 1 / nPlan)
    return baseH + Hz(zu) * sect(rho)
  }

  // Plan outline at unit radius, used for both the shell rim and the base.
  const planPoint = (theta, rho) => {
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    const k = Math.pow(Math.abs(c) ** nPlan + Math.abs(s) ** nPlan, -1 / nPlan)
    const zu = rho * s * k
    const xu = rho * c * k
    return [xu * Wz(zu), zu * halfL, zu]
  }

  const positions = []
  const index = []
  // Pole.
  positions.push(0, baseH + Hz(0), 0)
  for (let j = 1; j <= rings; j++) {
    const rho = Math.sin((j / rings) * (Math.PI / 2))
    for (let i = 0; i < segs; i++) {
      const th = (i / segs) * Math.PI * 2
      const [X, Z, zu] = planPoint(th, rho)
      positions.push(X, baseH + Hz(zu) * sect(rho), Z)
    }
  }
  const at = (j, i) => 1 + (j - 1) * segs + (i % segs)
  for (let i = 0; i < segs; i++) index.push(0, at(1, i + 1), at(1, i))
  for (let j = 1; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const a = at(j, i)
      const b = at(j, i + 1)
      const c = at(j + 1, i)
      const d = at(j + 1, i + 1)
      index.push(a, b, d, a, d, c)
    }
  }
  const shell = new BufferGeometry()
  shell.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  shell.setIndex(index)
  shell.computeVertexNormals()
  // Make sure the winding faces out (the pole normal must point up).
  if (shell.attributes.normal.getY(0) < 0) {
    const idx = shell.index.array
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1]
      idx[i + 1] = idx[i + 2]
      idx[i + 2] = t
    }
    shell.computeVertexNormals()
  }

  // Base tray: the same outline, extruded, so the parting line follows the
  // shell exactly. Its bevel is what reads as the seam between the halves.
  const outline = new Shape()
  for (let i = 0; i <= 96; i++) {
    const [X, Z] = planPoint((i / 96) * Math.PI * 2, 1)
    if (i === 0) outline.moveTo(X * 0.995, -Z * 0.995)
    else outline.lineTo(X * 0.995, -Z * 0.995)
  }
  const base = slabGeometry(outline, baseH + 0.001, { bevel: 0.0022, curveSegments: 4 })

  /* Button seams: one across the shell behind the buttons, running down to
     the parting line on both sides, and one down the middle from there over
     the nose. Points are sampled densely where the shell turns down. */
  const seamPts = (pts) => new CatmullRomCurve3(pts.map(([x, z]) => new Vector3(x, surface(x, z) + 0.0002, z)))
  const zs = seamZ
  const zuS = zs / halfL
  const xMax = Wz(zuS) * Math.pow(1 - Math.abs(zuS) ** nPlan, 1 / nPlan) * 0.995
  const across = []
  for (let i = 0; i <= 40; i++) across.push([xMax * Math.sin(((i / 40) * 2 - 1) * (Math.PI / 2)), zs])
  const down = []
  for (let i = 0; i <= 30; i++) down.push([0, zs + (-halfL * 0.997 - zs) * Math.sin((i / 30) * (Math.PI / 2))])
  // Continue the transverse seam straight down the sides to the base.
  const acrossCurve = seamPts(across)
  const ends = [across[0], across[across.length - 1]]
  const sideDrop = ends.map(([x, z]) => [new Vector3(x, surface(x, z), z), new Vector3(x * 1.003, baseH + 0.001, z)])
  const tubes = [
    new TubeGeometry(acrossCurve, 80, 0.00095, 5, false),
    new TubeGeometry(seamPts(down), 50, 0.00095, 5, false),
    ...sideDrop.map(([a, b]) => new TubeGeometry(new CatmullRomCurve3([a, b]), 4, 0.00095, 5, false)),
  ]
  const seams = mergeGeometries(tubes)
  tubes.forEach((t) => t.dispose())

  return { shell, base, seams, surface, halfL, halfW, height: baseH + Hz(0.3), baseH }
}

/* ==========================================================================
   paperStackGeometry — a stack of paper as sheets, not a slab.

   A ream seen side-on is a hundred slightly misaligned edges, and that ragged
   layering is the only thing that distinguishes it from a white brick. Each
   "sheet" here stands in for a few real ones: thin boxes, each nudged and
   turned a fraction, with a little colour drift between them. Merged, so a
   whole stack is still one draw call.
   ========================================================================== */
export function paperStackGeometry({
  width = 0.21,
  depth = 0.297,
  height = 0.02,
  sheets = 14,
  jitter = 0.0025,
  twist = 0.012,
  seed = 3,
  color = '#f3f1ea',
} = {}) {
  const R = rng(seed)
  const t = height / sheets
  const parts = []
  const base = new Color(color)
  const c = new Color()
  for (let i = 0; i < sheets; i++) {
    const g = new BoxGeometry(width, t * 0.96, depth)
    g.rotateY((R() - 0.5) * twist * 2)
    g.translate((R() - 0.5) * jitter * 2, t * (i + 0.5), (R() - 0.5) * jitter * 2)
    c.copy(base).offsetHSL(0, (R() - 0.5) * 0.04, (R() - 0.5) * 0.035)
    paintVertices(g, c)
    parts.push(g)
  }
  const geo = mergeGeometries(parts)
  parts.forEach((g) => g.dispose())
  return geo
}

/* ==========================================================================
   binderShellGeometry — a lever-arch file's case: two boards and a spine.

   Cross-section is a U: front and back boards a few millimetres thick,
   joined by a spine with properly rounded corners, open at the fore-edge so
   the pages show. A box with a label on it reads as a brick; the rounded
   spine catching a soft highlight down its length is what reads as a file.

   Local frame: spine faces +Z, height runs up Y from 0, width along X.
   ========================================================================== */
export function binderShellGeometry({ w = 0.058, h = 0.28, d = 0.23, t = 0.003, r = 0.011 } = {}) {
  const s = new Shape()
  // Drawn in plan as (x, -z): spine at z = +d/2 is shape y = -d/2.
  const yS = -d / 2 // spine side
  const yO = d / 2 // open side
  const ri = r - t
  s.moveTo(-w / 2, yO)
  s.lineTo(-w / 2, yS + r)
  s.absarc(-w / 2 + r, yS + r, r, Math.PI, Math.PI * 1.5, false)
  s.lineTo(w / 2 - r, yS)
  s.absarc(w / 2 - r, yS + r, r, Math.PI * 1.5, Math.PI * 2, false)
  s.lineTo(w / 2, yO)
  s.lineTo(w / 2 - t, yO)
  s.lineTo(w / 2 - t, yS + r)
  s.absarc(w / 2 - r, yS + r, ri, 0, -Math.PI / 2, true)
  s.lineTo(-w / 2 + r, yS + t)
  s.absarc(-w / 2 + r, yS + r, ri, -Math.PI / 2, -Math.PI, true)
  s.lineTo(-w / 2 + t, yO)
  s.lineTo(-w / 2, yO)
  return slabGeometry(s, h, { bevel: 0.0009, bevelSegments: 2, curveSegments: 8 })
}

/* ==========================================================================
   Mug profiles. The old mug was a shell of zero thickness at the rim, which
   is what made it read as paper. A real stoneware mug has a 5-6mm wall, a
   rounded lip, and an unglazed foot ring it stands on.
   ========================================================================== */
export function mugOuterProfile({ rBottom = 0.04, rTop = 0.044, height = 0.094 } = {}) {
  return [
    new Vector2(rBottom - 0.008, 0.0025),
    new Vector2(rBottom - 0.006, 0),
    new Vector2(rBottom - 0.0035, 0),
    ...arc(rBottom - 0.0035, 0.0035, 0.0035, -Math.PI / 2, 0, 4).slice(1),
    new Vector2(rBottom + 0.0003, 0.012),
    new Vector2((rBottom + rTop) / 2 + 0.0008, height * 0.55),
    new Vector2(rTop, height - 0.004),
  ]
}

export function thickMugProfile({ rBottom = 0.04, rTop = 0.044, height = 0.094, wall = 0.0055 } = {}) {
  const outer = mugOuterProfile({ rBottom, rTop, height })
  const lipR = wall / 2
  return [
    new Vector2(0, 0.0025),
    ...outer,
    // Rounded lip, half a wall thick, turning over into the inside.
    ...arc(rTop - lipR, height - 0.004, lipR, 0, Math.PI, 8).slice(1),
    new Vector2(rTop - wall, height - 0.006),
    new Vector2(rBottom - wall + 0.0005, 0.02),
    ...arc(rBottom - wall - 0.006, 0.02, 0.0065, 0, -Math.PI / 2, 4).slice(1),
    new Vector2(0, 0.0135),
  ]
}

/** Inner radius of thickMugProfile at height y — where the coffee meets the wall. */
export function mugInnerRadius(y, { rBottom = 0.04, rTop = 0.044, height = 0.094, wall = 0.0055 } = {}) {
  const y0 = 0.02
  const y1 = height - 0.006
  const k = Math.max(0, Math.min(1, (y - y0) / (y1 - y0)))
  return rBottom - wall + 0.0005 + (rTop - wall - (rBottom - wall + 0.0005)) * k
}

/** The dipped glaze band: the outer profile below `bandY`, pushed out a hair. */
export function mugBandProfile(opts = {}, bandY = 0.03, push = 0.0004) {
  const outer = mugOuterProfile(opts)
  const out = []
  for (let i = 0; i < outer.length; i++) {
    const p = outer[i]
    if (p.y <= bandY) out.push(new Vector2(p.x + push, p.y))
    else {
      const q = outer[i - 1]
      const k = (bandY - q.y) / (p.y - q.y)
      out.push(new Vector2(q.x + (p.x - q.x) * k + push, bandY))
      break
    }
  }
  return out
}

/* ==========================================================================
   letterTrayGeometry — one moulded desk tray, merged into a single mesh.

   Floor, two side walls that sweep down from a tall back to a low front, a
   back wall and a rolled front lip. The swept sides are what make it a
   letter tray rather than a box with no lid: you can see the paper from the
   front, which is the point of the thing.
   ========================================================================== */
export function letterTrayGeometry({ w = 0.3, d = 0.23, back = 0.046, front = 0.017, t = 0.005 } = {}) {
  const parts = []
  const floor = slabGeometry(roundedRectShape(w, d, 0.01), t, { bevel: 0.0015 })
  parts.push(floor)

  // Side profile in (z, y), extruded across X by the wall thickness.
  const side = new Shape()
  side.moveTo(-d / 2, 0)
  side.lineTo(d / 2, 0)
  side.lineTo(d / 2, front)
  side.quadraticCurveTo(d * 0.1, front + 0.002, -d * 0.2, back * 0.86)
  side.quadraticCurveTo(-d * 0.38, back, -d / 2, back)
  side.lineTo(-d / 2, 0)
  for (const sx of [-1, 1]) {
    const g = new ExtrudeGeometry(side, { depth: t, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 2, curveSegments: 10 })
    // Shape x -> world z, shape y -> world y, extrusion -> world -x.
    g.rotateY(-Math.PI / 2)
    g.translate(sx > 0 ? w / 2 : -w / 2 + t, 0, 0)
    parts.push(g)
  }
  const backWall = new BoxGeometry(w, back, t)
  backWall.translate(0, back / 2, -d / 2 + t / 2)
  parts.push(backWall)
  // Rolled lip along the front edge.
  const lip = new TubeGeometry(
    new CatmullRomCurve3([new Vector3(-w / 2 + t, front - 0.002, d / 2 - t / 2), new Vector3(w / 2 - t, front - 0.002, d / 2 - t / 2)]),
    2,
    t * 0.65,
    10,
    false,
  )
  const lipWall = new BoxGeometry(w - t * 2, front - 0.002, t * 0.8)
  lipWall.translate(0, (front - 0.002) / 2, d / 2 - t / 2)
  parts.push(lip, lipWall)

  const clean = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k)
    return n
  })
  const geo = mergeGeometries(clean)
  parts.forEach((g) => g.dispose())
  return geo
}
