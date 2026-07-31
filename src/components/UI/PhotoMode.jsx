import { Camera, X, Download } from 'lucide-react'

export default function PhotoMode({ active, onClose, onTakeSnap }) {
  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[120] flex flex-col justify-between p-6">
      {/* Top Banner */}
      <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-white/15 bg-black/60 px-4 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 text-white">
          <Camera className="text-cyan-400" size={20} />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-200">
            Photo Mode · 3D Viewport
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-400">Press ESC to exit</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-300 transition hover:bg-white/15 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Shutter Controls */}
      <div className="pointer-events-auto flex justify-center">
        <button
          onClick={onTakeSnap}
          className="flex items-center gap-3 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-cyan-200 shadow-xl backdrop-blur-md transition hover:bg-cyan-500/35 hover:scale-105 active:scale-95"
        >
          <Download size={16} />
          <span>Capture Watermarked PNG</span>
        </button>
      </div>
    </div>
  )
}
