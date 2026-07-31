import { useEffect, useRef, useState } from 'react'
import { tracks } from '../../../data/portfolio'
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from 'lucide-react'
import audio from '../../../audio/AudioEngine'

/* ==========================================================================
   Music_Player.app — a front end for AudioEngine's procedural sequencer.

   Nothing here is a recording. Each "track" is a chord progression in
   data/portfolio.js that the engine plays live with oscillators, so the
   transport controls drive a real synth rather than an <audio> element.

   Two deliberate choices:
   · Playback is NOT stopped on unmount. Minimizing the window unmounts this
     component, and a music player that goes silent when you minimize it is
     just broken. The engine keeps going; state is re-read on the way back in.
   · The visualiser writes bar heights straight to the DOM from a rAF loop.
     Driving 16 bars through React state at 60fps would re-render the whole
     window every frame, inside a 3D scene that needs those frames.
   ========================================================================== */

const BAND_COUNT = 16

export default function MusicApp() {
  // Pick up whatever the engine is already doing, so reopening the window
  // shows the truth instead of resetting to track 1 / paused.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const i = tracks.findIndex((t) => t.id === audio.track?.id)
    return i === -1 ? 0 : i
  })
  const [isPlaying, setIsPlaying] = useState(() => audio.playing)
  const [volume, setVolume] = useState(() => Math.round(audio.musicVolume * 100))

  const currentTrack = tracks[currentTrackIndex]
  const barsRef = useRef([])

  /** Load a track into the engine and start it, unlocking audio if needed. */
  const playTrack = (index) => {
    audio.unlock()
    const wasPlaying = audio.playing
    if (tracks[index].id !== audio.track?.id) audio.loadTrack(tracks[index])
    if (!wasPlaying) audio.playMusic()
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }

  const togglePlay = () => {
    audio.unlock()
    if (audio.playing) {
      audio.pauseMusic()
      setIsPlaying(false)
      return
    }
    if (!audio.track) audio.loadTrack(currentTrack)
    audio.playMusic()
    setIsPlaying(true)
  }

  const step = (delta) => {
    const next = (currentTrackIndex + delta + tracks.length) % tracks.length
    playTrack(next)
  }

  const changeVolume = (e) => {
    const v = Number(e.target.value)
    setVolume(v)
    audio.setMusicVolume(v / 100)
  }

  /* Visualiser. Reads the engine's analyser and writes heights directly. */
  useEffect(() => {
    let raf
    const tick = () => {
      const levels = audio.getLevels(BAND_COUNT)
      for (let i = 0; i < BAND_COUNT; i++) {
        const bar = barsRef.current[i]
        if (bar) bar.style.height = `${Math.max(6, levels[i] * 100)}%`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* The engine is the source of truth — if something else pauses it, the
     transport button should not keep claiming it is playing. */
  useEffect(() => {
    const id = setInterval(() => setIsPlaying(audio.playing), 400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-full w-full overflow-y-auto p-6 text-[13px] leading-relaxed opacity-90 select-text flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-base font-bold text-current flex items-center gap-2">
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
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-current/[0.06] border-4 border-current/15 shadow-2xl relative">
              <div
                className={`h-8 w-8 rounded-full bg-purple-600 border-2 border-purple-300 flex items-center justify-center ${
                  isPlaying ? 'animate-spin' : ''
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-black" />
              </div>
            </div>
            <div className="text-base font-bold text-current">{currentTrack.title}</div>
            <div className="text-xs text-purple-400 mt-1 font-semibold">
              {currentTrack.artist} • {currentTrack.bpm} BPM
            </div>
          </div>

          {/* Live analyser bars */}
          <div className="mt-4 flex items-end justify-center gap-1.5 h-8">
            {Array.from({ length: BAND_COUNT }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  barsRef.current[i] = el
                }}
                className="w-1 rounded-t bg-gradient-to-t from-purple-700 to-fuchsia-400"
                style={{ height: '6%' }}
              />
            ))}
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => step(-1)}
            aria-label="Previous track"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 bg-current/[0.08] opacity-90 hover:bg-current/10 hover:text-white transition"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition transform active:scale-95"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next track"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 bg-current/[0.08] opacity-90 hover:bg-current/10 hover:text-white transition"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Volume */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <Volume2 size={15} className="shrink-0 text-purple-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={changeVolume}
            aria-label="Music volume"
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-purple-500"
          />
          <span className="w-9 shrink-0 text-right text-[11px] opacity-60">{volume}%</span>
        </div>
      </div>

      {/* Playlist Tracks */}
      <div className="rounded-lg border border-current/10 bg-current/[0.04] p-3">
        <div className="text-xs font-bold opacity-60 uppercase mb-2">Track Listing</div>
        <div className="space-y-1">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => playTrack(index)}
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-xs transition ${
                index === currentTrackIndex
                  ? 'bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold'
                  : 'opacity-90 hover:bg-current/[0.06]'
              }`}
            >
              <span>
                {index + 1}. {track.title}
              </span>
              <span className="text-[10px] opacity-50">{track.bpm} BPM</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
