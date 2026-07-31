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

/** Warm wood with visible grain */
export function woodTexture(base = '#4a3527', dark = '#2f2018') {
  const [c, ctx] = makeCanvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)

  const soft = isLightHex(base)
  for (let i = 0; i < (soft ? 130 : 220); i++) {
    const y = Math.random() * 512
    ctx.strokeStyle = Math.random() > 0.5 ? dark : '#5c422f'
    ctx.globalAlpha = soft ? 0.03 + Math.random() * 0.05 : 0.06 + Math.random() * 0.16
    ctx.lineWidth = 0.6 + Math.random() * 2.4
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, y + Math.sin((x + i * 40) * 0.012) * 5)
    }
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  return finish(c, { repeat: [2, 1] })
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
  const [c, ctx] = makeCanvas(1536, 1152)

  /* A macOS-style desktop picture: deep field, silky ribbons, no hard edges.

     Two things do the work here and neither is the colour ramp:

     · ctx.filter = 'blur(...)'. Canvas2D blur is what turns a stroked path
       into light rather than a line. Every ribbon below is drawn wide and
       then blurred heavily, which is why they read as glow instead of paint.
     · Many stops, not two. A two-stop gradient blends linearly and looks
       computed; real gradients have a mid-tone that is off the straight line
       between the ends, and that is what makes them feel photographic.

     Rendered at 1536x1152 because this sits on a 1.1m panel the camera flies
     right up to — at 1024 the banding is visible from the desk. */

  const bg = ctx.createLinearGradient(0, 0, 1100, 1152)
  bg.addColorStop(0.0, '#0b1030')
  bg.addColorStop(0.28, '#16205c')
  bg.addColorStop(0.52, '#2a2a76')
  bg.addColorStop(0.74, '#4a2568')
  bg.addColorStop(1.0, '#120a2a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1536, 1152)

  // Deep corner blooms, heavily blurred so they are fields not circles.
  const bloom = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.10)'))
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1536, 1152)
  }
  bloom(250, 160, 820, 'rgba(96,140,255,0.42)')
  bloom(1320, 980, 860, 'rgba(214,104,232,0.34)')
  bloom(820, 560, 620, 'rgba(72,210,255,0.16)')

  /* Ribbons. Each is a wide stroke along a sine path, drawn under a large
     blur and additively composited, so where they cross they brighten rather
     than overprint. */
  ctx.globalCompositeOperation = 'lighter'
  const ribbons = [
    { y: 430, amp: 118, w: 150, blur: 70, phase: 0.0, color: 'rgba(120,170,255,0.16)' },
    { y: 540, amp: 152, w: 116, blur: 58, phase: 1.3, color: 'rgba(196,128,255,0.15)' },
    { y: 650, amp: 96, w: 88, blur: 46, phase: 2.6, color: 'rgba(90,225,255,0.12)' },
    { y: 350, amp: 74, w: 62, blur: 38, phase: 4.0, color: 'rgba(255,196,232,0.09)' },
  ]
  ribbons.forEach((r) => {
    ctx.save()
    ctx.filter = `blur(${r.blur}px)`
    ctx.strokeStyle = r.color
    ctx.lineWidth = r.w
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let x = -120; x <= 1660; x += 18) {
      const y = r.y + Math.sin(x * 0.0034 + r.phase) * r.amp + Math.sin(x * 0.0011 + r.phase) * 34
      if (x === -120) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
  })

  // A single bright filament riding the main ribbon — the specular highlight
  // that keeps the whole thing from being uniformly soft.
  ctx.save()
  ctx.filter = 'blur(6px)'
  ctx.strokeStyle = 'rgba(220,238,255,0.30)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let x = -120; x <= 1660; x += 14) {
    const y = 430 + Math.sin(x * 0.0034) * 118 + Math.sin(x * 0.0011) * 34
    if (x === -120) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'

  // Corner falloff, so the desktop icons always sit on a darker field.
  const vig = ctx.createRadialGradient(768, 520, 260, 768, 576, 1080)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, 1536, 1152)

  // Grain. Without it a gradient this large bands visibly on a good display.
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.025)'
    ctx.fillRect(Math.random() * 1536, Math.random() * 1152, 1.6, 1.6)
  }

  return finish(c)
}
