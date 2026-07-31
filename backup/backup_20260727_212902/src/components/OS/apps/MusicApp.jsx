import { useState } from 'react'
import { tracks } from '../../../data/portfolio'
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from 'lucide-react'

export default function MusicApp() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentTrack = tracks[currentTrackIndex]

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
  }

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6 font-mono text-sm leading-relaxed text-slate-300 select-text flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Music className="text-purple-400" size={18} />
            <span>Procedural Lofi Synthesizer</span>
          </h1>
          <span className="text-[10px] rounded bg-purple-950 border border-purple-500/40 px-2 py-0.5 text-purple-300 font-bold">
            WEB AUDIO
          </span>
        </div>

        {/* Player Vinyl Display */}
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-950/20 p-6 text-center backdrop-blur-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border-4 border-zinc-700 shadow-2xl relative">
              <div className={`h-8 w-8 rounded-full bg-purple-600 border-2 border-purple-300 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="h-2 w-2 rounded-full bg-black" />
              </div>
            </div>
            <div className="text-base font-bold text-slate-100">{currentTrack.title}</div>
            <div className="text-xs text-purple-400 mt-1 font-semibold">{currentTrack.artist} • {currentTrack.bpm} BPM</div>
          </div>

          {/* Equalizer Visualizer Bars */}
          <div className="mt-4 flex items-end justify-center gap-1.5 h-8">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-t bg-purple-500 transition-all duration-150 ${isPlaying ? 'animate-pulse' : 'h-1 opacity-30'}`}
                style={{
                  height: isPlaying ? `${Math.floor(20 + Math.sin(i * 3) * 40 + Math.random() * 40)}%` : '10%',
                }}
              />
            ))}
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={prevTrack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-slate-200 hover:bg-zinc-700 hover:text-white transition"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition transform active:scale-95"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button
            onClick={nextTrack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-slate-200 hover:bg-zinc-700 hover:text-white transition"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {/* Playlist Tracks */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Track Listing</div>
        <div className="space-y-1">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => {
                setCurrentTrackIndex(index)
                setIsPlaying(true)
              }}
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-xs transition ${
                index === currentTrackIndex
                  ? 'bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold'
                  : 'text-slate-300 hover:bg-zinc-800/60'
              }`}
            >
              <span>{index + 1}. {track.title}</span>
              <span className="text-[10px] text-zinc-500">{track.bpm} BPM</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
