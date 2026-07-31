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

  for (let i = 0; i < 220; i++) {
    const y = Math.random() * 512
    ctx.strokeStyle = Math.random() > 0.5 ? dark : '#5c422f'
    ctx.globalAlpha = 0.06 + Math.random() * 0.16
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

/** Low-pile carpet */
export function carpetTexture(base = '#3a2b3f') {
  const [c, ctx] = makeCanvas(256, 256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6)
  }
  return finish(c, { repeat: [3, 3] })
}

/** Wall texture */
export function wallTexture(base = '#1c1822') {
  const [c, ctx] = makeCanvas(256, 256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.05)'
    const s = 1 + Math.random() * 3
    ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s)
  }
  return finish(c, { repeat: [4, 2] })
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

/** Modern ASUS Gaming Monitor Wallpaper — 1:1 Match to User Reference Image */
export function asusGamingWallpaperTexture() {
  const [c, ctx] = makeCanvas(1024, 768)

  // Neon City Skyline Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 768)
  bgGrad.addColorStop(0, '#040b1a')
  bgGrad.addColorStop(0.5, '#0c1b3a')
  bgGrad.addColorStop(1, '#250838')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, 1024, 768)

  // Glowing Cyber Skyscrapers
  ctx.fillStyle = '#0f2042'
  for (let i = 0; i < 28; i++) {
    const x = i * 38
    const w = 28 + (i % 4) * 8
    const h = 250 + (Math.sin(i * 17) * 0.5 + 0.5) * 350
    ctx.fillRect(x, 768 - h, w, h)

    // Window Lights
    ctx.fillStyle = (i % 3 === 0) ? '#00f0ff' : (i % 2 === 0) ? '#ff0055' : '#ffea00'
    ctx.globalAlpha = 0.35
    for (let wy = 768 - h + 15; wy < 720; wy += 22) {
      for (let wx = x + 4; wx < x + w - 6; wx += 8) {
        ctx.fillRect(wx, wy, 4, 10)
      }
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#0f2042'
  }

  // Perspective Speed Trails & Light Rays
  ctx.strokeStyle = '#ff0055'
  ctx.lineWidth = 4
  ctx.shadowColor = '#ff0055'
  ctx.shadowBlur = 15
  for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.moveTo(0, 300 + i * 35)
    ctx.lineTo(1024, 150 + i * 45)
    ctx.stroke()
  }

  ctx.strokeStyle = '#00f0ff'
  ctx.lineWidth = 3
  ctx.shadowColor = '#00f0ff'
  ctx.shadowBlur = 15
  for (let i = 0; i < 10; i++) {
    ctx.beginPath()
    ctx.moveTo(1024, 200 + i * 40)
    ctx.lineTo(0, 400 + i * 30)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  // Yellow Supercar Drawing Silhouette
  ctx.save()
  ctx.translate(560, 420)
  ctx.rotate(-0.15)
  // Car Main Body
  ctx.fillStyle = '#ffea00'
  ctx.shadowColor = '#ffea00'
  ctx.shadowBlur = 25
  ctx.beginPath()
  ctx.moveTo(-160, 20)
  ctx.lineTo(-80, -40)
  ctx.lineTo(80, -50)
  ctx.lineTo(170, 0)
  ctx.lineTo(180, 50)
  ctx.lineTo(-140, 60)
  ctx.closePath()
  ctx.fill()

  // Canopy Glass
  ctx.fillStyle = '#1e1b4b'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.moveTo(-40, -35)
  ctx.lineTo(50, -42)
  ctx.lineTo(70, -5)
  ctx.lineTo(-30, -5)
  ctx.closePath()
  ctx.fill()

  // Headlight Projector Beams
  ctx.fillStyle = '#00f0ff'
  ctx.shadowColor = '#00f0ff'
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(140, 15, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ASUS GAMING MONITOR Typography Logo
  ctx.shadowColor = '#00f0ff'
  ctx.shadowBlur = 20
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 64px "Inter", sans-serif'
  ctx.fillText('ASUS', 70, 240)

  ctx.shadowBlur = 0
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 28px "Inter", sans-serif'
  ctx.fillText('GAMING MONITOR', 70, 285)

  // Scanline CRT / Gaming Panel Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  for (let y = 0; y < 768; y += 4) {
    ctx.fillRect(0, y, 1024, 2)
  }

  return finish(c)
}
