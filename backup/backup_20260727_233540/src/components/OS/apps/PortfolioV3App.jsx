import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

export default function PortfolioV3App() {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) {
          // Force virtual 1280px full desktop resolution
          const s = w / 1280
          setScale(s)
        }
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const virtualHeight = Math.round(100 / scale)

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col overflow-hidden relative">
      {/* Top Address & Action Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px] truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate">https://portfolio-copy-3.vercel.app</span>
        </div>
        <a
          href="https://portfolio-copy-3.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-[11px] transition shadow shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open in New Tab</span>
        </a>
      </div>

      {/* Embedded Virtual Desktop Viewport */}
      <div ref={containerRef} className="flex-1 w-full bg-black overflow-hidden relative">
        <iframe
          src="https://portfolio-copy-3.vercel.app"
          title="Portfolio V3 - Desktop Mode"
          className="border-0 select-auto origin-top-left"
          style={{
            width: '1280px',
            height: `${virtualHeight}%`,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        />
      </div>
    </div>
  )
}
