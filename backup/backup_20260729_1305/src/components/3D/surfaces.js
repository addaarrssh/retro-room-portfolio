import { CanvasTexture, RepeatWrapping } from 'three'

/* ==========================================================================
   surfaces.js — one material vocabulary for the whole room.

   Three things separate "arranged primitives" from "objects", and none of
   them is polygon count:

   1. EDGES. Nothing real has a mathematically perfect edge. Every physical
      object has a chamfer — often under a millimetre — and that chamfer
      catches a thin highlight. The brain reads that highlight as "solid
      thing". Without it, geometry reads as computer graphics no matter how
      dense it is. That is handled by geometry (RoundedBox) rather than here,
      but BEVEL gives every component the same radius vocabulary so a desk and
      a keycap are not chamfered by wildly different amounts.

   2. FINISH. A single flat roughness value per material is the giveaway that
      says "preset". Real surfaces vary: wood grain changes gloss along the
      grain, plastic wears on the edges you touch, powder coat is uniform but
      never perfectly so. The maps below add that variation.

   3. RESPONSE. Painted wood, anodised aluminium and ABS plastic reflect light
      in genuinely different ways. Clearcoat on lacquered wood, sheen on
      fabric, a high specular on ceramic. Picking these per material is what
      makes a room look photographed rather than shaded.

   Everything is generated with Canvas2D at runtime, so the room still ships
   with no binary assets.
   ========================================================================== */

/* --------------------------------------------------------------- bevels */

/**
 * Chamfer radii in metres, by object scale. Real bevels are small — a desk
 * edge is a couple of millimetres, not a couple of centimetres — and getting
 * this wrong in the generous direction is what makes furniture look inflated.
 */
export const BEVEL = {
  hairline: 0.0015, // panel edges, thin plates
  fine: 0.004, // keycaps, small props
  soft: 0.008, // shelves, drawer fronts, speaker boxes
  chunky: 0.014, // desk top, chair shell, tower
}

/* ---------------------------------------------------------------- maps */

const cache = new Map()

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function tile(tex, repeat) {
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.anisotropy = 4
  return tex
}

/**
 * Roughness variation. Mid-grey is the material's stated roughness; darker is
 * glossier, lighter is more matte. Kept low-contrast on purpose — the goal is
 * for a surface to stop being perfectly uniform, not to look dirty.
 */
export function roughnessMap(kind = 'fine', repeat = 3) {
  const key = `rough:${kind}:${repeat}`
  if (cache.has(key)) return cache.get(key)

  const [c, ctx] = makeCanvas(256, 256)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)

  if (kind === 'grain') {
    // Wood: gloss follows the grain, so the variation is directional.
    for (let i = 0; i < 160; i++) {
      const y = Math.random() * 256
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'
      ctx.lineWidth = 0.6 + Math.random() * 2
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= 256; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.4)
      ctx.stroke()
    }
  } else if (kind === 'brushed') {
    // Anodised aluminium: fine unidirectional brushing.
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * 256
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(256, y)
      ctx.stroke()
    }
  } else if (kind === 'weave') {
    // Fabric: a coarse cross-hatch so the seat is not glassy.
    for (let i = 0; i < 256; i += 3) {
      ctx.fillStyle = i % 6 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'
      ctx.fillRect(i, 0, 1.5, 256)
      ctx.fillRect(0, i, 256, 1.5)
    }
  } else {
    // Moulded plastic / powder coat: faint mottling.
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)'
      const s = 1 + Math.random() * 3
      ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s)
    }
  }

  const tex = tile(new CanvasTexture(c), repeat)
  cache.set(key, tex)
  return tex
}

/**
 * A gentle normal map — the "bump" that stops large flat panels reading as
 * perfectly planar. Encoded the usual way: flat is (128,128,255), and the R/G
 * channels lean where the surface tilts.
 */
export function bumpNormalMap(kind = 'fine', repeat = 3) {
  const key = `norm:${kind}:${repeat}`
  if (cache.has(key)) return cache.get(key)

  const [c, ctx] = makeCanvas(256, 256)
  ctx.fillStyle = 'rgb(128,128,255)'
  ctx.fillRect(0, 0, 256, 256)

  const strokes = kind === 'grain' ? 120 : kind === 'weave' ? 0 : 60
  for (let i = 0; i < strokes; i++) {
    const y = Math.random() * 256
    // Two adjacent lines leaning opposite ways read as a shallow ridge.
    ctx.strokeStyle = 'rgba(150,128,255,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= 256; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(106,128,255,0.5)'
    ctx.beginPath()
    ctx.moveTo(0, y + 1.4)
    for (let x = 0; x <= 256; x += 24) ctx.lineTo(x, y + 1.4 + Math.sin(x * 0.02 + i) * 2)
    ctx.stroke()
  }

  if (kind === 'weave') {
    for (let i = 0; i < 256; i += 4) {
      ctx.strokeStyle = 'rgba(150,128,255,0.45)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 256)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(128,150,255,0.45)'
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(256, i)
      ctx.stroke()
    }
  }

  const tex = tile(new CanvasTexture(c), repeat)
  cache.set(key, tex)
  return tex
}

/* ----------------------------------------------------------- surfaces */

/**
 * Spread onto <meshPhysicalMaterial> to give an object a real-world finish.
 *
 *   <RoundedBox radius={BEVEL.soft} ...>
 *     <meshPhysicalMaterial {...surface('lacqueredWood', { color: '#c9a988' })} />
 *   </RoundedBox>
 *
 * Values are chosen to be physically plausible rather than pretty: lacquered
 * wood really does have a clearcoat, powder coat really is that matte, and
 * anodised aluminium really is that dark in the diffuse with most of its
 * appearance coming from the environment.
 */
export function surface(kind, overrides = {}) {
  const base = SURFACES[kind] ?? SURFACES.plastic
  return { ...base, ...overrides }
}

const SURFACES = {
  /* Desk tops, shelves. Clearcoat is what makes a lacquered finish read as
     finished rather than raw. */
  lacqueredWood: {
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
    roughnessMap: null, // filled by useSurfaceMaps
    sheen: 0,
  },

  /* Untreated / painted carcass wood — no clearcoat, higher roughness. */
  paintedWood: {
    roughness: 0.68,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.7,
  },

  /* Monitor enclosures, desk legs, lamp arm. Most of its look comes from the
     environment probe, which is why metalness sits so high. */
  anodisedAluminium: {
    roughness: 0.32,
    metalness: 0.92,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  },

  /* Keycaps, tower shell, mouse. ABS is matte with a slight sheen. */
  plastic: {
    roughness: 0.55,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
  },

  /* Soft-touch coating — speakers, chair trim. Nearly no specular. */
  softTouch: {
    roughness: 0.85,
    metalness: 0,
    clearcoat: 0,
  },

  /* Chair seat, rug. Sheen is the property that makes cloth look like cloth. */
  fabric: {
    roughness: 0.92,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.7,
  },

  /* Mug, planter. */
  ceramic: {
    roughness: 0.18,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  },

  /* Caster wheels, feet, cable. */
  rubber: {
    roughness: 0.95,
    metalness: 0,
    clearcoat: 0.05,
  },

  /* Screen glass, window. */
  glass: {
    roughness: 0.06,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  },
}

/** Map presets, keyed to the surface kind. */
export const SURFACE_MAPS = {
  lacqueredWood: { rough: 'grain', normal: 'grain', repeat: 2 },
  paintedWood: { rough: 'grain', normal: 'grain', repeat: 3 },
  anodisedAluminium: { rough: 'brushed', normal: 'fine', repeat: 4 },
  plastic: { rough: 'fine', normal: 'fine', repeat: 3 },
  softTouch: { rough: 'fine', normal: 'fine', repeat: 4 },
  fabric: { rough: 'weave', normal: 'weave', repeat: 6 },
  ceramic: { rough: 'fine', normal: null, repeat: 2 },
  rubber: { rough: 'fine', normal: 'fine', repeat: 5 },
  glass: { rough: null, normal: null, repeat: 1 },
}

/**
 * Full material props including the generated maps. Separate from surface()
 * so a caller can opt out of maps on very small props, where a 256px tile
 * repeated across a 2cm object just looks like noise.
 */
export function surfaceWithMaps(kind, overrides = {}) {
  const cfg = SURFACE_MAPS[kind] ?? SURFACE_MAPS.plastic
  const props = surface(kind, overrides)
  if (cfg.rough) props.roughnessMap = roughnessMap(cfg.rough, cfg.repeat)
  if (cfg.normal) {
    props.normalMap = bumpNormalMap(cfg.normal, cfg.repeat)
    props.normalScale = overrides.normalScale ?? [0.35, 0.35]
  }
  return props
}
