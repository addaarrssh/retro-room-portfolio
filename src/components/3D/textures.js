import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/* ==========================================================================
   textures.js — Procedural High-Aesthetic Wall Art & Room Textures
   ========================================================================== */

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function finish(canvas, { repeat = null, srgb = true } = {}) {
  const tex = new CanvasTexture(canvas)
  if (srgb) tex.colorSpace = SRGBColorSpace
  if (repeat) {
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
  }
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

/* ==========================================================================
   woodTexture — a walnut veneer, drawn the way the tree grew.

   The old version was a fill with a hundred random sine strokes: it read as
   brushed paint. Real flat-sawn walnut has four things, layered:
   · colour BANDS a few centimetres wide, heartwood darker than sapwood;
   · long flowing GRAIN lines that bunch together and spread apart;
   · CATHEDRAL arches, where the saw cut across the growth rings, as nested
     V/U shapes in the middle of the board;
   · PORES, tiny dark dashes along the grain, which are what make it look
     like wood rather than a printed photo of wood at close range.
   Grain runs along U, i.e. along the long axis of a desk top.
   ========================================================================== */
export function woodTexture(base = '#4a3527', dark = '#2f2018') {
  const W = 1024
  const H = 512
  const [c, ctx] = makeCanvas(W, H)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // 1. Broad colour bands, blurred so they never show an edge.
  ctx.save()
  ctx.filter = 'blur(10px)'
  for (let i = 0; i < 26; i++) {
    const y = rnd() * H
    const h = 8 + rnd() * 40
    ctx.globalAlpha = 0.05 + rnd() * 0.12
    ctx.fillStyle = rnd() > 0.45 ? dark : '#a98261'
    ctx.beginPath()
    ctx.moveTo(-20, y)
    for (let x = -20; x <= W + 20; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.004 + i) * 10)
    ctx.lineTo(W + 20, y + h)
    for (let x = W + 20; x >= -20; x -= 40) ctx.lineTo(x, y + h + Math.sin(x * 0.005 + i * 2) * 10)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // 2 + 3. Grain lines, some of them bent into cathedral arches.
  const arches = [
    { xc: W * 0.34, yc: H * 0.42, s: W * 0.16 },
    { xc: W * 0.78, yc: H * 0.7, s: W * 0.12 },
  ]
  const lineY = (y0, x, i) => {
    let y = y0 + Math.sin(x * 0.0035 + i * 0.7) * 6 + Math.sin(x * 0.011 + i) * 1.6
    for (const a of arches) {
      const dy = y0 - a.yc
      if (Math.abs(dy) < 70) {
        const k = 1 - Math.abs(dy) / 70
        y += k * 46 * Math.exp(-(((x - a.xc) / (a.s * (0.4 + Math.abs(dy) / 90))) ** 2))
      }
    }
    return y
  }
  for (let i = 0; i < 230; i++) {
    const y0 = rnd() * H
    ctx.globalAlpha = 0.05 + rnd() * 0.14
    ctx.strokeStyle = rnd() > 0.25 ? dark : '#b48c69'
    ctx.lineWidth = 0.5 + rnd() * 1.8
    ctx.beginPath()
    for (let x = -10; x <= W + 10; x += 8) {
      const y = lineY(y0, x, i)
      if (x === -10) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // 4. Pores.
  ctx.globalAlpha = 0.35
  ctx.fillStyle = dark
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * W
    const y0 = rnd() * H
    const y = lineY(y0, x, (y0 | 0) % 40)
    ctx.fillRect(x, y, 1.5 + rnd() * 5, 0.8)
  }

  ctx.globalAlpha = 1
  return finish(c, { repeat: [1, 1] })
}

/** Low-pile carpet with optional chair roll wear arc */
export function carpetTexture(base = '#3a2b3f', wearArc = true) {
  const [c, ctx] = makeCanvas(256, 256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  const pale = isLightHex(base)
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = pale
      ? Math.random() > 0.5
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.045)'
      : Math.random() > 0.5
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.12)'
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6)
  }

  if (wearArc) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 18
    ctx.beginPath()
    ctx.arc(128, 180, 75, Math.PI * 0.9, Math.PI * 2.1)
    ctx.stroke()
  }

  return finish(c, { repeat: [3, 3] })
}

/** Desk surface wear & coffee ring roughness map */
export function deskWearTexture() {
  const [c, ctx] = makeCanvas(512, 512)
  // Mid-grey base roughness (0.5)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 512, 512)

  // Coffee ring near mug position (UV around 0.3, 0.4)
  const cx = 512 * 0.32
  const cy = 512 * 0.42
  const r = 512 * 0.05

  ctx.strokeStyle = '#404040' // Darker = smoother/shinier wet stain residue
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Inner drip stain
  ctx.fillStyle = '#484848'
  ctx.globalAlpha = 0.15
  ctx.beginPath()
  ctx.arc(cx + 3, cy - 2, r * 0.85, 0, Math.PI * 2)
  ctx.fill()

  // Subtle keyboard/mouse scuffs
  ctx.strokeStyle = '#999999' // Lighter = rougher scratch
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.18
  for (let i = 0; i < 16; i++) {
    const sx = 100 + Math.random() * 300
    const sy = 200 + Math.random() * 200
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + (Math.random() - 0.5) * 35, sy + (Math.random() - 0.5) * 10)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  return finish(c, { srgb: false })
}

/** Screen glass fingerprint smudges texture */
/* ==========================================================================
   moldedPlasticTexture — the surface of a 1990s computer case.

   Injection-moulded ABS is never smooth. The mould itself is bead-blasted, so
   the plastic comes out with a fine stipple — the "orange peel" you can feel
   with a thumbnail. On a screen that texture is almost invisible as BUMP, but
   it is very visible in the SPECULAR: it breaks the highlight into thousands
   of tiny facets so the case never shows a clean mirror reflection.

   That is the entire difference between plastic and painted metal, and it is
   why a flat `roughness={0.5}` reads as clay. Feeding this in as a roughness
   map means the highlight scatters the way it should, and the case picks up
   the slightly blotchy, unevenly-aged look real beige plastic has.

   Two scales are layered, because one grain size is a pattern and two is a
   texture: a coarse mottle for the aging, a fine stipple for the mould.
   Returned as a tiling greyscale map — mid-grey is the base roughness, so the
   noise is centred on ~0.55 rather than swinging the whole surface.
   ========================================================================== */
export function moldedPlasticTexture({ size = 512, base = 140, coarse = 16, fine = 26, repeat = 3 } = {}) {
  const [c, ctx] = makeCanvas(size, size)

  ctx.fillStyle = `rgb(${base},${base},${base})`
  ctx.fillRect(0, 0, size, size)

  /* Coarse mottle: large soft blotches, the uneven way pigment and UV aging
     settle across a big flat panel. Blurred, so it never reads as spots. */
  ctx.save()
  ctx.filter = 'blur(9px)'
  for (let i = 0; i < 90; i++) {
    const v = base + (Math.random() - 0.5) * coarse * 2
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, 14 + Math.random() * 34, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  /* Fine stipple: single pixels, no blur. This is the mould grain, and it has
     to stay hard — blur it and the specular goes back to being a clean sheet. */
  const img = ctx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * fine
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = d[i]
    d[i + 2] = d[i]
  }
  ctx.putImageData(img, 0, 0)

  // Linear, not sRGB: this is material data, not colour.
  return finish(c, { repeat: [repeat, repeat], srgb: false })
}

/* ==========================================================================
   crtBadgeTexture — the maker's mark on the chin of the monitor.

   Every CRT had one, and it is a surprisingly large part of why a beige box
   reads as a specific manufactured object rather than as a grey rectangle: a
   small logotype, a line of tiny legal-looking type under it, and nothing
   else. Drawn at 4x the size it renders at, because this sits a few
   centimetres from the camera in the seated view and anything softer than the
   surrounding geometry would look like a decal.

   Transparent background so it composites onto the case plastic and picks up
   the same lighting, rather than sitting on its own lit quad.
   ========================================================================== */
export function crtBadgeTexture(name = 'Sahu', sub = 'adarsh inc') {
  const [c, ctx] = makeCanvas(1024, 256)
  ctx.clearRect(0, 0, 1024, 256)

  const ink = '#4a463d'

  /* The globe. Almost every beige-era badge had a little meridian mark next to
     the wordmark; it is the detail that dates the object instantly. */
  ctx.strokeStyle = ink
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.arc(96, 118, 52, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(44, 118)
  ctx.lineTo(148, 118)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(96, 118, 22, 52, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  ctx.font = 'italic 700 84px Georgia, "Times New Roman", serif'
  ctx.fillText(name, 176, 116)

  ctx.font = '400 42px Georgia, "Times New Roman", serif'
  ctx.fillText(sub, 178, 170)

  return finish(c)
}

export function fingerprintTexture() {
  const [c, ctx] = makeCanvas(512, 512)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 512, 512)

  // 5-6 soft elliptical smudge spots
  const smudges = [
    { x: 180, y: 160, rx: 35, ry: 20, rot: 0.3 },
    { x: 340, y: 220, rx: 42, ry: 25, rot: -0.4 },
    { x: 260, y: 310, rx: 30, ry: 18, rot: 0.1 },
    { x: 150, y: 380, rx: 38, ry: 22, rot: 0.6 },
    { x: 380, y: 130, rx: 28, ry: 16, rot: -0.2 },
    { x: 420, y: 360, rx: 45, ry: 26, rot: 0.5 },
  ]

  ctx.fillStyle = '#ffffff'
  smudges.forEach((s) => {
    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate(s.rot)
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, s.rx)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  return finish(c, { srgb: false })
}

/** Wall texture */
export function wallTexture(base = '#1c1822') {
  const [c, ctx] = makeCanvas(256, 256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)

  /* Speckle strength has to follow the base tone. The same flecks that read as
     paint texture on a dark wall read as dirt on a white one, so a light base
     gets a fraction of the contrast and no dark specks at all. */
  const light = isLightHex(base)
  const count = light ? 900 : 2600
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = light
      ? 'rgba(0,0,0,0.012)'
      : Math.random() > 0.5
        ? 'rgba(255,255,255,0.018)'
        : 'rgba(0,0,0,0.05)'
    const s = 1 + Math.random() * (light ? 2 : 3)
    ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s)
  }
  return finish(c, { repeat: [4, 2] })
}

/** Rough luminance test so texture generators can adapt to a light palette. */
function isLightHex(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5
}

/** CRT Ambient Screen Glow Texture */
export function glowTexture() {
  const [c, ctx] = makeCanvas(256, 256)
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(56, 189, 248, 0.4)')
  g.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return finish(c)
}

/** Poster 1 — Gradient Descent Topology & Gold Optimization Path */
export function posterGradientTexture() {
  const [c, ctx] = makeCanvas(512, 700)
  ctx.fillStyle = '#080c14'
  ctx.fillRect(0, 0, 512, 700)

  // Glowing Cyberpunk Grid
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 700)
    ctx.stroke()
  }
  for (let y = 0; y < 700; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }

  // Concentric Topological Loss Contours
  const cx = 256
  const cy = 360
  for (let r = 240; r > 12; r -= 18) {
    const t = 1 - r / 240
    ctx.strokeStyle = `hsl(${190 + t * 50}, 85%, ${20 + t * 45}%)`
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.ellipse(cx, cy, r, r * 0.65, -0.3, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Gradient Descent Path
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  let px = 60
  let py = 140
  ctx.moveTo(px, py)
  for (let i = 0; i < 14; i++) {
    const decay = Math.pow(0.75, i)
    px += (cx - px) * 0.42 + (Math.random() - 0.5) * 60 * decay
    py += (cy - py) * 0.42 + (Math.random() - 0.5) * 60 * decay
    ctx.lineTo(px, py)
  }
  ctx.stroke()

  ctx.fillStyle = '#f59e0b'
  ctx.beginPath()
  ctx.arc(cx, cy, 7, 0, Math.PI * 2)
  ctx.fill()

  // Header Title
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 36px "Inter", sans-serif'
  ctx.fillText('GRADIENT DESCENT', 34, 70)
  ctx.fillStyle = '#38bdf8'
  ctx.font = '16px "Fira Code", monospace'
  ctx.fillText('OPTIMIZATION & CONVERGENCE', 34, 100)

  // Subtitle
  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px "Fira Code", monospace'
  ctx.fillText('learning_rate = 0.001', 34, 630)
  ctx.fillText('loss -> 0.0000', 34, 655)

  return finish(c)
}

/** Poster 2 — Neural Networks & Deep Learning Matrix Print */
export function posterRocTexture() {
  const [c, ctx] = makeCanvas(620, 440)
  ctx.fillStyle = '#0b0914'
  ctx.fillRect(0, 0, 620, 440)

  // Draw Neural Network Nodes & Synapses
  const layers = [4, 6, 6, 3]
  const layerX = [80, 230, 390, 540]
  const nodes = []

  layers.forEach((count, lIdx) => {
    const x = layerX[lIdx]
    const spacing = 320 / (count + 1)
    for (let i = 0; i < count; i++) {
      const y = 60 + (i + 1) * spacing
      nodes.push({ layer: lIdx, x, y })
    }
  })

  // Draw Synaptic Connections
  ctx.lineWidth = 1.2
  nodes.forEach((n1) => {
    nodes.forEach((n2) => {
      if (n2.layer === n1.layer + 1) {
        ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(99, 102, 241, 0.4)' : 'rgba(236, 72, 153, 0.3)'
        ctx.beginPath()
        ctx.moveTo(n1.x, n1.y)
        ctx.lineTo(n2.x, n2.y)
        ctx.stroke()
      }
    })
  })

  // Draw Glowing Nodes
  nodes.forEach((n) => {
    ctx.fillStyle = n.layer === 0 ? '#38bdf8' : n.layer === 3 ? '#10b981' : '#ec4899'
    ctx.beginPath()
    ctx.arc(n.x, n.y, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Header Title
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 24px "Inter", sans-serif'
  ctx.fillText('NEURAL NETWORKS & DEEP LEARNING', 36, 36)

  return finish(c)
}

/** Corkboard with Sticky Notes */
export function corkboardTexture() {
  const [c, ctx] = makeCanvas(512, 380)
  ctx.fillStyle = '#b48356'
  ctx.fillRect(0, 0, 512, 380)

  // Cork Grain
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#8e623b' : '#cba074'
    ctx.fillRect(Math.random() * 512, Math.random() * 380, 2, 2)
  }

  // Sticky Notes
  const notes = [
    { x: 30, y: 30, w: 130, h: 120, color: '#fef08a', text: 'SHIP V2.0 🚀' },
    { x: 180, y: 40, w: 140, h: 110, color: '#fbcfe8', text: 'LEARN PYTORCH' },
    { x: 340, y: 30, w: 130, h: 120, color: '#bae6fd', text: 'TRAIN MODEL' },
    { x: 100, y: 190, w: 140, h: 120, color: '#bbf7d0', text: 'STAY CURIOUS' },
    { x: 270, y: 190, w: 150, h: 120, color: '#fed7aa', text: 'DEBUG AT 2 AM' },
  ]

  notes.forEach((n) => {
    ctx.fillStyle = n.color
    ctx.shadowColor = 'rgba(0,0,0,0.2)'
    ctx.shadowBlur = 6
    ctx.fillRect(n.x, n.y, n.w, n.h)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 13px "Fira Code", monospace'
    ctx.fillText(n.text, n.x + 12, n.y + 60)
  })

  return finish(c)
}

export function daySkyTexture() {
  const [c, ctx] = makeCanvas(512, 512)

  /* Overcast daylight through the window. Deliberately soft and almost
     colourless: this is the room's key light, and anything saturated out here
     tints every white surface inside. */
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#cfe0f5')
  g.addColorStop(0.45, '#e6eef8')
  g.addColorStop(1, '#f4f6f8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)

  // Soft cloud banding, built from wide translucent strokes.
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 40 + i * 12
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let x = -40; x <= 552; x += 24) {
      const y = 90 + i * 52 + Math.sin(x * 0.008 + i) * 18
      if (x === -40) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'

  // A neighbouring rooftop line so the window reads as a view, not a lightbox.
  ctx.fillStyle = 'rgba(150,163,182,0.55)'
  ctx.fillRect(0, 392, 512, 120)
  ctx.fillStyle = 'rgba(128,142,163,0.7)'
  ctx.fillRect(30, 350, 120, 60)
  ctx.fillRect(210, 368, 96, 44)
  ctx.fillRect(360, 340, 130, 72)

  return finish(c)
}

export function nightSkyTexture() {

  const [c, ctx] = makeCanvas(512, 512)
  ctx.fillStyle = '#05070f'
  ctx.fillRect(0, 0, 512, 512)

  // Moon
  ctx.fillStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.arc(380, 100, 45, 0, Math.PI * 2)
  ctx.fill()

  // Stars
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 150; i++) {
    const s = Math.random() * 2
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s)
  }

  return finish(c)
}

/** Breathtaking Synthwave / Cyberpunk 4K Desktop Wallpaper for CRT Monitor & OS */
export function desktopWallpaperTexture() {
  const [c, ctx] = makeCanvas(1024, 768)

  // Deep Cosmic Space Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 768)
  bgGrad.addColorStop(0, '#090514')
  bgGrad.addColorStop(0.4, '#130c2a')
  bgGrad.addColorStop(0.65, '#2a0845')
  bgGrad.addColorStop(1, '#641549')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, 1024, 768)

  // Starfield
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 240; i++) {
    const sx = (Math.sin(i * 91) * 0.5 + 0.5) * 1024
    const sy = (Math.cos(i * 37) * 0.5 + 0.5) * 450
    const size = (i % 3 === 0) ? 2 : 1
    ctx.globalAlpha = 0.4 + (i % 5) * 0.12
    ctx.fillRect(sx, sy, size, size)
  }
  ctx.globalAlpha = 1

  // Neon Synthwave Sun with Horizontal Slices
  const sunX = 512
  const sunY = 400
  const sunR = 140
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR)
  sunGrad.addColorStop(0, '#ffea00')
  sunGrad.addColorStop(0.5, '#ff0055')
  sunGrad.addColorStop(1, '#d500f9')

  ctx.save()
  ctx.beginPath()
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2)
  ctx.fillStyle = sunGrad
  ctx.shadowColor = '#ff0055'
  ctx.shadowBlur = 40
  ctx.fill()
  ctx.restore()

  // Sun horizontal cuts
  for (let y = sunY - 20; y < sunY + sunR; y += 14) {
    const cutH = 3 + (y - (sunY - 20)) * 0.06
    ctx.fillStyle = '#1a0526'
    ctx.fillRect(sunX - sunR - 10, y, sunR * 2 + 20, cutH)
  }

  // Perspective Cyber Neon Grid Horizon Floor
  const horizonY = 420
  ctx.strokeStyle = '#00f0ff'
  ctx.lineWidth = 1.8
  ctx.shadowColor = '#00f0ff'
  ctx.shadowBlur = 10

  // Horizontal perspective grid lines
  for (let i = 0; i <= 16; i++) {
    const t = Math.pow(i / 16, 2.2)
    const y = horizonY + t * (768 - horizonY)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
  }

  // Perspective vanishing lines
  for (let x = -800; x <= 1824; x += 90) {
    ctx.beginPath()
    ctx.moveTo(sunX, horizonY)
    ctx.lineTo(x, 768)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  // Wireframe Neon Mountain Horizons
  ctx.strokeStyle = '#d500f9'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, horizonY)
  const mountainPts = [
    [0, horizonY],
    [120, horizonY - 90],
    [220, horizonY - 40],
    [360, horizonY - 140],
    [480, horizonY - 50],
    [580, horizonY - 110],
    [720, horizonY - 30],
    [840, horizonY - 130],
    [940, horizonY - 60],
    [1024, horizonY],
  ]
  mountainPts.forEach(([x, y]) => ctx.lineTo(x, y))
  ctx.stroke()

  // Subtle Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
  for (let y = 0; y < 768; y += 4) {
    ctx.fillRect(0, y, 1024, 2)
  }

  return finish(c)
}

export function macWallpaperTexture() {
  const [c, ctx] = makeCanvas(1024, 768)

  /* The Windows 95 desktop, painted at 1:1 with the virtual screen.

     This is what the CRT shows FROM ACROSS THE ROOM, and it used to be a
     macOS desktop picture — deep blue, blurred ribbons, corner blooms. It was
     the nicest thing in the file and it was doing real damage: from the desk
     you saw an Apple wallpaper, then flew in and a Windows 95 desktop appeared
     in its place. The cut announced that the screen is a texture swapped for a
     DOM tree, which is the one thing the whole illusion depends on hiding.

     So this now paints the same furniture the real desktop has, in the same
     places: teal field, icon column down the left, one window with a gradient
     title bar, taskbar along the bottom. Nobody reads it at this distance —
     it just has to be UNCHANGED across the swap, and it is.

     Drawn with hard rectangles and no blur anywhere, because every pixel of
     the era was hard. */

  const TEAL = '#008080'
  const FACE = '#c0c0c0'
  const WHITE = '#ffffff'
  const SHADOW = '#808080'
  const BLACK = '#000000'

  ctx.fillStyle = TEAL
  ctx.fillRect(0, 0, 1024, 768)

  /* A raised 3D bevel, the shape everything in this system is built from:
     lit on the top-left, dark on the bottom-right. */
  const raised = (x, y, w, h) => {
    ctx.fillStyle = FACE
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = WHITE
    ctx.fillRect(x, y, w, 2)
    ctx.fillRect(x, y, 2, h)
    ctx.fillStyle = SHADOW
    ctx.fillRect(x, y + h - 2, w, 2)
    ctx.fillRect(x + w - 2, y, 2, h)
  }

  // Icon column: a plate and two label lines each, which is all that resolves.
  for (let i = 0; i < 5; i++) {
    const y = 20 + i * 74
    raised(24, y, 32, 30)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.fillRect(14, y + 36, 52, 5)
    ctx.fillRect(24, y + 44, 32, 5)
  }

  // The Showcase window, matching the real one's geometry.
  const WX = 108
  const WY = 26
  const WW = 872
  const WH = 668
  raised(WX, WY, WW, WH)

  // Title bar: the navy-to-blue ramp, with the three control boxes.
  const bar = ctx.createLinearGradient(WX, 0, WX + WW, 0)
  bar.addColorStop(0, '#000080')
  bar.addColorStop(1, '#1084d0')
  ctx.fillStyle = bar
  ctx.fillRect(WX + 3, WY + 3, WW - 6, 20)
  ctx.fillStyle = WHITE
  ctx.font = 'bold 13px Tahoma, sans-serif'
  ctx.fillText('Adarsh Sahu - Showcase 2026', WX + 26, WY + 17)
  for (let i = 0; i < 3; i++) raised(WX + WW - 60 + i * 19, WY + 5, 17, 16)

  // Content well: the page itself, near-white.
  ctx.fillStyle = '#fdfdfb'
  ctx.fillRect(WX + 5, WY + 26, WW - 10, WH - 52)

  // Left rail: the name in slab serif, then the nav links in link-violet.
  ctx.fillStyle = BLACK
  ctx.font = 'bold 26px Georgia, serif'
  ctx.fillText('Adarsh', WX + 22, WY + 66)
  ctx.fillText('Sahu', WX + 22, WY + 92)
  ctx.font = 'bold 15px Georgia, serif'
  ctx.fillText("Showcase '26", WX + 22, WY + 122)

  ctx.fillStyle = '#4b0082'
  ctx.font = '12px Georgia, serif'
  ;['HOME', 'ABOUT', 'EXPERIENCE', 'PROJECTS', 'CONTACT'].forEach((label, i) => {
    const y = WY + 170 + i * 33
    ctx.fillText(label, WX + 34, y)
    ctx.fillRect(WX + 34, y + 3, ctx.measureText(label).width, 1)
  })

  // The centred wordmark on the home page.
  ctx.fillStyle = BLACK
  ctx.textAlign = 'center'
  ctx.font = 'bold 46px Georgia, serif'
  ctx.fillText('Adarsh Sahu', WX + 180 + (WW - 180) / 2, WY + 300)
  ctx.font = 'bold 19px Georgia, serif'
  ctx.fillText('Machine Learning & Data Science', WX + 180 + (WW - 180) / 2, WY + 330)
  ctx.textAlign = 'left'

  // Taskbar: Start, one task button, and the tray.
  raised(0, 768 - 30, 1024, 30)
  raised(4, 768 - 26, 66, 22)
  ctx.fillStyle = BLACK
  ctx.font = 'bold 12px Tahoma, sans-serif'
  ctx.fillText('Start', 26, 768 - 11)
  raised(80, 768 - 26, 154, 22)
  ctx.font = '11px Tahoma, sans-serif'
  ctx.fillText('My Showcase', 102, 768 - 11)
  ctx.fillStyle = SHADOW
  ctx.fillRect(940, 768 - 26, 80, 22)
  ctx.fillStyle = BLACK
  ctx.fillText('1:55 PM', 962, 768 - 11)

  return finish(c)
}

/* ==========================================================================
   groundShadowTexture — the soft pool an object sits in.

   A directional light gives a geometrically correct CAST shadow, and for this
   scene that is exactly the problem: the desk is only 0.7m tall, so with the
   key overhead its own shadow lands underneath it and is hidden by the thing
   casting it. The desk reads as pasted onto the backdrop.

   What a real studio shot has instead is a soft pool — the darkening directly
   beneath an object where the big overhead source cannot reach. That is
   ambient occlusion, not a cast shadow, and the honest cheap way to get it is
   to paint it: a radial falloff on a plane under the furniture, multiplied
   into the sweep.

   It is a fake, and worth being clear about that. But it is the same fake
   every product render uses, it costs one transparent quad, and it survives
   on hardware where a real AO pass would not. (N8AO and drei's SoftShadows
   were both tried in this project and broke shader compilation on three r185.)
   ========================================================================== */
export function groundShadowTexture({ size = 512, strength = 0.5, falloff = 2.1 } = {}) {
  const [c, ctx] = makeCanvas(size, size)
  const img = ctx.createImageData(size, size)
  const half = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Normalised distance from centre, 0 in the middle to 1 at the edge.
      const dx = (x - half) / half
      const dy = (y - half) / half
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy))

      // Raised falloff keeps the core dark and lets the rim vanish, so there
      // is no visible ellipse edge on a plain backdrop — a linear ramp reads
      // as a grey disc, which is worse than no shadow at all.
      const a = Math.pow(1 - d, falloff) * strength

      const i = (y * size + x) * 4
      img.data[i] = 0
      img.data[i + 1] = 0
      img.data[i + 2] = 0
      img.data[i + 3] = Math.round(a * 255)
    }
  }

  ctx.putImageData(img, 0, 0)
  return finish(c, { srgb: false })
}

/* ==========================================================================
   keyboardLegendTexture — every legend on the board, on one canvas.

   Laid out on the same unit grid as keyboardModel, so each cap's decal quad
   samples exactly its own patch. One texture, one draw call, and the text is
   real type at ~128px per key rather than a blurry decal per cap.

   Period conventions: letters top-left, shifted symbols stacked over the
   unshifted one, modifier words small, numpad digits with their navigation
   function underneath. Dark grey, not black — pad-printed legends on beige
   ABS were never full black.
   ========================================================================== */
export function keyboardLegendTexture(model, ppu = 128) {
  const { keys, decals, bounds } = model
  const Wc = Math.round((bounds.x1 - bounds.x0) * ppu)
  const Hc = Math.round((bounds.y1 - bounds.y0) * ppu)
  const [c, ctx] = makeCanvas(Wc, Hc)
  ctx.clearRect(0, 0, Wc, Hc)
  const X = (u) => (u - bounds.x0) * ppu
  const Y = (u) => (u - bounds.y0) * ppu
  const ink = '#3b3934'
  const font = (px, weight = 500) => `${weight} ${Math.round(px)}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  ctx.fillStyle = ink
  ctx.textBaseline = 'top'

  for (const k of keys) {
    if (!k.leg || !k.face) continue
    const f = k.face
    const x0 = X(f.x0)
    const y0 = Y(f.y0)
    const w = X(f.x1) - x0
    const h = Y(f.y1) - y0
    const pad = ppu * 0.08
    const L = k.leg
    ctx.textAlign = 'left'
    if (L.t === 'a') {
      ctx.font = font(ppu * 0.27)
      ctx.fillText(L.a, x0 + pad, y0 + pad)
    } else if (L.t === '2') {
      ctx.font = font(ppu * 0.22)
      ctx.fillText(L.top, x0 + pad, y0 + pad)
      ctx.fillText(L.bot, x0 + pad, y0 + h - pad - ppu * 0.22)
    } else if (L.t === 'np') {
      ctx.font = font(ppu * 0.25)
      ctx.fillText(L.top, x0 + pad, y0 + pad)
      ctx.font = font(ppu * 0.13)
      ctx.fillText(L.bot, x0 + pad, y0 + h - pad - ppu * 0.13)
    } else if (L.t === 'w') {
      const lines = L.a.split('\n')
      const big = lines.length === 1 && L.a.length <= 3
      const px = big ? ppu * (L.align === 'c' ? 0.26 : 0.17) : ppu * 0.12
      ctx.font = font(px)
      if (L.align === 'c') {
        ctx.textAlign = 'center'
        ctx.fillText(lines[0], x0 + w / 2, y0 + h / 2 - px * 0.55)
      } else {
        lines.forEach((ln, i) => ctx.fillText(ln, x0 + pad, y0 + pad + i * px * 1.12))
      }
    }
  }

  for (const d of decals) {
    const x0 = X(d.x0)
    const y0 = Y(d.y0)
    const w = X(d.x1) - x0
    const h = Y(d.y1) - y0
    if (d.kind === 'leds') {
      // Three captions over three windows, with the period pictograms.
      const labels = [
        ['Num', 'Lock'],
        ['Caps', 'Lock'],
        ['Scroll', 'Lock'],
      ]
      ctx.font = font(ppu * 0.11)
      ctx.textAlign = 'center'
      labels.forEach((l, i) => {
        const cx = x0 + (w * (i + 0.5)) / 3
        ctx.fillText(l[0], cx, y0 + h * 0.08)
        ctx.fillText(l[1], cx, y0 + h * 0.08 + ppu * 0.12)
      })
      // A recessed dark strip the windows sit in.
      ctx.fillStyle = 'rgba(40,38,34,0.85)'
      roundRect(ctx, x0 + w * 0.06, y0 + h * 0.5, w * 0.88, h * 0.26, ppu * 0.05)
      ctx.fill()
      ctx.fillStyle = ink
    } else if (d.kind === 'badge') {
      // Dark grey nameplate with a silver logotype, matching the monitor.
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h)
      g.addColorStop(0, '#4a4945')
      g.addColorStop(1, '#2f2e2b')
      ctx.fillStyle = g
      roundRect(ctx, x0, y0, w, h, ppu * 0.06)
      ctx.fill()
      ctx.fillStyle = '#d9d6cf'
      ctx.textAlign = 'left'
      ctx.font = `italic 700 ${Math.round(h * 0.52)}px Georgia, "Times New Roman", serif`
      ctx.fillText('Sahu', x0 + h * 0.32, y0 + h * 0.2)
      ctx.font = font(h * 0.2, 500)
      ctx.fillStyle = '#a9a69e'
      ctx.textAlign = 'right'
      ctx.fillText('ENHANCED', x0 + w - h * 0.25, y0 + h * 0.3)
      ctx.fillText('KEYBOARD', x0 + w - h * 0.25, y0 + h * 0.55)
      ctx.fillStyle = ink
    }
  }

  const tex = finish(c)
  tex.anisotropy = 16
  return tex
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Seeded random for the texture generators below, so hot reload is stable. */
function seeded(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/* ==========================================================================
   fabricTexture — the cloth face of a mousepad.

   A fine plain weave: alternating over/under threads, each with a little
   tone of its own, and a faint low-frequency mottle so it does not look
   printed. Tiles; the caller sets repeat in metres-per-tile.
   ========================================================================== */
export function fabricTexture(base = '#30343b', size = 256) {
  const [c, ctx] = makeCanvas(size, size)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const rnd = seeded(5)
  const step = 4
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const over = ((x + y) / step) % 2 === 0
      const v = (rnd() - 0.5) * 0.06
      ctx.fillStyle = over ? `rgba(255,255,255,${0.05 + v})` : `rgba(0,0,0,${0.12 + v})`
      if (over) ctx.fillRect(x, y + 0.5, step, step - 1)
      else ctx.fillRect(x + 0.5, y, step - 1, step)
    }
  }
  return finish(c, { repeat: [1, 1] })
}

/** A run of stitches, for a tube's U axis: thread, gap, thread, gap. */
export function stitchTexture(thread = '#8d9097', ground = '#1d1f23') {
  const [c, ctx] = makeCanvas(64, 16)
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, 64, 16)
  ctx.fillStyle = thread
  for (let x = 0; x < 64; x += 16) {
    ctx.fillRect(x + 2, 0, 11, 16)
  }
  return finish(c, { repeat: [1, 1] })
}

/* ==========================================================================
   Paper. A loose sheet with handwriting, the top page of a printout, and the
   edge of a page block.
   ========================================================================== */
export function handwrittenSheetTexture() {
  const W = 512
  const H = 384
  const [c, ctx] = makeCanvas(W, H)
  ctx.fillStyle = '#f7f5ef'
  ctx.fillRect(0, 0, W, H)
  const rnd = seeded(23)
  // Faint ruling and a margin, like a sheet torn from a pad.
  ctx.strokeStyle = 'rgba(120,150,190,0.28)'
  ctx.lineWidth = 1
  for (let y = 46; y < H; y += 24) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(210,110,110,0.35)'
  ctx.beginPath()
  ctx.moveTo(52, 0)
  ctx.lineTo(52, H)
  ctx.stroke()
  // Words as joined loops of ink: illegible from a metre away, which is
  // exactly what handwriting is.
  ctx.strokeStyle = 'rgba(30,45,95,0.85)'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  for (let row = 0; row < 11; row++) {
    const yb = 42 + row * 24
    let x = 62 + (row === 0 ? 0 : rnd() * 10)
    const end = row % 4 === 3 ? 260 + rnd() * 120 : 430 + rnd() * 50
    while (x < end) {
      const len = 18 + rnd() * 46
      ctx.beginPath()
      ctx.moveTo(x, yb)
      for (let t = 0; t < len; t += 2.2) {
        const px = x + t
        const py = yb - 4 - Math.abs(Math.sin(t * 0.55 + row)) * (5 + (rnd() > 0.85 ? 7 : 0))
        ctx.lineTo(px, py + Math.sin(t * 1.3) * 1.2)
      }
      ctx.stroke()
      x += len + 7 + rnd() * 6
    }
  }
  // A boxed sum and an underline — the working out.
  ctx.lineWidth = 1.8
  ctx.strokeRect(300, 300, 120, 38)
  ctx.beginPath()
  ctx.moveTo(62, 70)
  ctx.lineTo(200, 69)
  ctx.stroke()
  return finish(c)
}

export function printedPageTexture() {
  const W = 512
  const H = 680
  const [c, ctx] = makeCanvas(W, H)
  ctx.fillStyle = '#fbfaf6'
  ctx.fillRect(0, 0, W, H)
  const rnd = seeded(41)
  ctx.fillStyle = 'rgba(40,40,40,0.82)'
  ctx.fillRect(48, 52, 220, 14)
  ctx.fillStyle = 'rgba(40,40,40,0.5)'
  ctx.fillRect(48, 76, 150, 7)
  let y = 112
  while (y < H - 60) {
    const lines = 3 + Math.floor(rnd() * 5)
    for (let i = 0; i < lines && y < H - 60; i++) {
      const w = i === lines - 1 ? 120 + rnd() * 200 : 400 + rnd() * 16
      ctx.fillStyle = 'rgba(45,45,45,0.42)'
      // Words, not a bar: break each line into runs.
      let x = 48
      while (x < 48 + w) {
        const ww = 12 + rnd() * 38
        ctx.fillRect(x, y, Math.min(ww, 48 + w - x), 5)
        x += ww + 5
      }
      y += 13
    }
    y += 14
  }
  ctx.fillStyle = 'rgba(45,45,45,0.35)'
  ctx.fillRect(W / 2 - 8, H - 40, 16, 6)
  return finish(c)
}

/** The edge of a page block: tight, slightly uneven lines. */
export function pageEdgeTexture() {
  const [c, ctx] = makeCanvas(64, 256)
  ctx.fillStyle = '#efe9da'
  ctx.fillRect(0, 0, 64, 256)
  const rnd = seeded(9)
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(120,105,80,${0.08 + rnd() * 0.14})`
    ctx.fillRect(0, y, 64, 1)
  }
  return finish(c, { repeat: [1, 1] })
}

/** A typed spine label for a lever-arch file. */
export function binderLabelTexture(title = 'ACCOUNTS', year = '1996') {
  const [c, ctx] = makeCanvas(128, 320)
  ctx.fillStyle = '#f2ecdc'
  ctx.fillRect(0, 0, 128, 320)
  ctx.strokeStyle = 'rgba(60,60,60,0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(8, 8, 112, 304)
  ctx.fillStyle = '#2b2a28'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 22px "Helvetica Neue", Helvetica, Arial, sans-serif'
  title.split('').forEach((ch, i) => ctx.fillText(ch, 64, 40 + i * 24))
  ctx.font = '600 26px "Courier New", monospace'
  ctx.fillText(year, 64, 280)
  return finish(c)
}

/* ==========================================================================
   Plant materials: a leaf's veining and the soil it grows from.
   ========================================================================== */
export function leafTexture() {
  const W = 128
  const H = 256
  const [c, ctx] = makeCanvas(W, H)
  // Near-white so the material colour sets the hue; the map only carries
  // the light midrib, the paler lateral veins and a slight mottle.
  ctx.fillStyle = '#d8d8d8'
  ctx.fillRect(0, 0, W, H)
  const rnd = seeded(17)
  ctx.save()
  ctx.filter = 'blur(6px)'
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    ctx.beginPath()
    ctx.arc(rnd() * W, rnd() * H, 6 + rnd() * 16, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // Lateral veins, angled up toward the tip (v=1 is the tip; canvas y=0).
  ctx.strokeStyle = 'rgba(255,255,240,0.55)'
  ctx.lineWidth = 1.2
  for (let y = 20; y < H - 6; y += 11) {
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(W / 2, y)
      ctx.quadraticCurveTo(W / 2 + side * 26, y - 10, W / 2 + side * 62, y - 26)
      ctx.stroke()
    }
  }
  // Midrib.
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, 'rgba(255,255,235,0.6)')
  g.addColorStop(1, 'rgba(255,250,225,1)')
  ctx.strokeStyle = g
  ctx.lineWidth = 3.2
  ctx.beginPath()
  ctx.moveTo(W / 2, H)
  ctx.lineTo(W / 2, 0)
  ctx.stroke()
  return finish(c)
}

export function soilTexture() {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  ctx.fillStyle = '#2e2219'
  ctx.fillRect(0, 0, S, S)
  const rnd = seeded(31)
  for (let i = 0; i < 2600; i++) {
    const v = rnd()
    ctx.fillStyle = v > 0.97 ? 'rgba(225,220,205,0.9)' : v > 0.6 ? 'rgba(80,60,44,0.7)' : 'rgba(10,6,4,0.55)'
    const s = v > 0.97 ? 1.5 + rnd() * 2 : 0.8 + rnd() * 2.6
    ctx.beginPath()
    ctx.arc(rnd() * S, rnd() * S, s, 0, Math.PI * 2)
    ctx.fill()
  }
  // A few slivers of bark mulch.
  for (let i = 0; i < 40; i++) {
    ctx.save()
    ctx.translate(rnd() * S, rnd() * S)
    ctx.rotate(rnd() * Math.PI)
    ctx.fillStyle = `rgba(${90 + rnd() * 40},${60 + rnd() * 25},${38 + rnd() * 15},0.9)`
    ctx.fillRect(-5, -1.5, 8 + rnd() * 8, 3)
    ctx.restore()
  }
  return finish(c)
}

export function corkTexture() {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  ctx.fillStyle = '#b08c62'
  ctx.fillRect(0, 0, S, S)
  const rnd = seeded(13)
  for (let i = 0; i < 4200; i++) {
    const v = rnd()
    ctx.fillStyle = v > 0.55 ? 'rgba(90,60,30,0.45)' : 'rgba(230,200,150,0.35)'
    ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.5, 1 + rnd() * 2.5)
  }
  return finish(c)
}
