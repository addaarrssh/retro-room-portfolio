import { useEffect, useRef } from 'react'

export default function Screensaver({ active, onDismiss }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    let animId
    const stars = Array.from({ length: 140 }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 800,
    }))

    const render = () => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2

      ctx.fillStyle = '#ffffff'
      stars.forEach((s) => {
        s.z -= 4
        if (s.z <= 0) s.z = 800

        const k = 300 / s.z
        const px = s.x * k + cx
        const py = s.y * k + cy

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          const size = Math.max(0.8, (1 - s.z / 800) * 3)
          ctx.beginPath()
          ctx.arc(px, py, size, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animId = requestAnimationFrame(render)
    }

    render()

    const handleInput = () => onDismiss?.()
    window.addEventListener('mousemove', handleInput)
    window.addEventListener('keydown', handleInput)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleInput)
      window.removeEventListener('keydown', handleInput)
    }
  }, [active, onDismiss])

  if (!active) return null

  return (
    <div className="absolute inset-0 z-[150] bg-black">
      <canvas ref={canvasRef} width={1024} height={768} className="w-full h-full" />
    </div>
  )
}
