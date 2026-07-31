/* ==========================================================================
   AudioEngine — every sound in this project is synthesised in the browser.

   Nothing is streamed, bundled or borrowed: the UI clicks, the CRT power-on
   thunk and the four "lofi" tracks in Music_Player.app are all built from
   oscillators and filtered noise at runtime. That keeps the repo free of any
   third-party audio and means the whole site is one JS bundle.

   Browsers refuse to start an AudioContext without a user gesture, so nothing
   here does anything until unlock() is called from a real click.
   ========================================================================== */

const MASTER_CEILING = 0.85

class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.analyser = null
    this.sfxBus = null
    this.musicBus = null
    this.noiseBuffer = null

    this.muted = false
    this.musicVolume = 0.55
    this.unlocked = false

    // Sequencer state
    this.track = null
    this.playing = false
    this.stepIndex = 0
    this.nextNoteTime = 0
    this.timerId = null
    this.voices = new Set()

    this._freqData = null
  }

  /* ---------------------------------------------------------------- setup */

  unlock() {
    if (this.unlocked) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return this.ctx
    }

    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null

    const ctx = new Ctor()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : MASTER_CEILING

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 128
    this.analyser.smoothingTimeConstant = 0.75
    this._freqData = new Uint8Array(this.analyser.frequencyBinCount)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = 0.5

    this.musicBus = ctx.createGain()
    this.musicBus.gain.value = this.musicVolume

    this.sfxBus.connect(this.master)
    this.musicBus.connect(this.master)
    this.master.connect(this.analyser)
    this.analyser.connect(ctx.destination)

    // 2s of white noise, reused by every percussive and textural sound.
    const frames = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = buf

    this.unlocked = true
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  setMuted(muted) {
    this.muted = muted
    if (!this.master) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(muted ? 0 : MASTER_CEILING, t, 0.02)
  }

  setMusicVolume(v) {
    this.musicVolume = v
    if (!this.musicBus) return
    this.musicBus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03)
  }

  /** Frequency bands for the Music_Player visualiser, 0..1. */
  getLevels(bands = 20) {
    if (!this.analyser) return new Array(bands).fill(0)
    this.analyser.getByteFrequencyData(this._freqData)
    const out = new Array(bands)
    const perBand = Math.floor(this._freqData.length / bands) || 1
    for (let b = 0; b < bands; b++) {
      let sum = 0
      for (let i = 0; i < perBand; i++) sum += this._freqData[b * perBand + i]
      // Tilt the top end up so the high bands are not permanently flat.
      const tilt = 1 + (b / bands) * 1.4
      out[b] = Math.min(1, (sum / perBand / 255) * tilt)
    }
    return out
  }

  /* ------------------------------------------------------------- voicing */

  _noise(dest, { start, dur, type = 'highpass', freq = 2000, q = 1, gain = 0.3 }) {
    const ctx = this.ctx
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = q

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(gain, start + 0.002)
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur)

    src.connect(filter).connect(env).connect(dest)
    src.start(start)
    src.stop(start + dur + 0.02)
    this._track(src)
    return { filter, env }
  }

  _tone(dest, { start, dur, freq, type = 'sine', gain = 0.2, attack = 0.005, detune = 0, glideTo = null }) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = type
    osc.detune.value = detune
    osc.frequency.setValueAtTime(freq, start)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur * 0.9)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, start)
    env.gain.linearRampToValueAtTime(gain, start + attack)
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur)

    osc.connect(env).connect(dest)
    osc.start(start)
    osc.stop(start + dur + 0.02)
    this._track(osc)
    return osc
  }

  _track(node) {
    this.voices.add(node)
    node.onended = () => this.voices.delete(node)
  }

  /* ----------------------------------------------------------------- sfx */

  /** Soft mouse click for window chrome and buttons. */
  click() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, { start: t, dur: 0.035, type: 'bandpass', freq: 2400, q: 1.4, gain: 0.22 })
    this._tone(this.sfxBus, { start: t, dur: 0.04, freq: 880, type: 'triangle', gain: 0.05 })
  }

  /** Mechanical keyboard clack — pitch jitters so runs never sound looped. */
  keyClick() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    const f = 1500 + Math.random() * 900
    this._noise(this.sfxBus, { start: t, dur: 0.028, type: 'bandpass', freq: f, q: 2.2, gain: 0.17 })
    this._tone(this.sfxBus, { start: t, dur: 0.03, freq: 180 + Math.random() * 60, type: 'square', gain: 0.035 })
  }

  /** Window open / app launch — a short rising blip. */
  blip(up = true) {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, {
      start: t,
      dur: 0.14,
      freq: up ? 520 : 720,
      glideTo: up ? 1040 : 320,
      type: 'square',
      gain: 0.05,
      attack: 0.004,
    })
  }

  /** Error / denied. */
  bonk() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, { start: t, dur: 0.16, freq: 220, glideTo: 110, type: 'square', gain: 0.07 })
  }

  /** Snake pellet pickup. */
  pickup() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, { start: t, dur: 0.07, freq: 880, type: 'square', gain: 0.05 })
    this._tone(this.sfxBus, { start: t + 0.06, dur: 0.09, freq: 1320, type: 'square', gain: 0.05 })
  }

  /**
   * CRT power-on: the relay thunk, the degauss shudder, the flyback whine
   * settling in, and a mains hum that lingers under the desktop.
   */
  /**
   * Modern Workstation power-on: sleek startup chime (C major arpeggio)
   * followed by a warm, relaxing ambient synth glow.
   */
  powerOn() {
    if (!this.unlocked || this.muted) return
    const ctx = this.ctx
    const t = ctx.currentTime

    // Modern crisp startup chime (C5 -> E5 -> G5 -> C6 arpeggio)
    const freqs = [523.25, 659.25, 783.99, 1046.5]
    freqs.forEach((f, i) => {
      this._tone(this.sfxBus, {
        start: t + i * 0.06,
        dur: 0.8,
        freq: f,
        type: 'sine',
        gain: 0.07,
        attack: 0.01,
      })
    })

    // Soft warm ambient synth pad underneath
    this._tone(this.sfxBus, {
      start: t + 0.15,
      dur: 2.2,
      freq: 261.63,
      type: 'triangle',
      gain: 0.04,
      attack: 0.25,
    })
  }

  /** Modern power-off: soft descending chime. */
  powerOff() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, { start: t, dur: 0.3, freq: 659.25, glideTo: 329.63, type: 'sine', gain: 0.04 })
  }

  /** Toy car horn sound (H key) */
  horn() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, { start: t, dur: 0.22, freq: 440, type: 'sawtooth', gain: 0.06 })
    this._tone(this.sfxBus, { start: t, dur: 0.22, freq: 554.37, type: 'sawtooth', gain: 0.06 })
  }

  /** Light switch / toggle click */
  switchToggle() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, { start: t, dur: 0.04, type: 'highpass', freq: 3000, q: 1.2, gain: 0.25 })
    this._tone(this.sfxBus, { start: t, dur: 0.05, freq: 1200, glideTo: 400, type: 'sine', gain: 0.08 })
  }

  /* ----------------------------------------------------- music sequencer */

  static midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12)
  }

  loadTrack(track) {
    const wasPlaying = this.playing
    this.stopMusic()
    this.track = track
    this.stepIndex = 0
    if (wasPlaying) this.playMusic()
  }

  playMusic() {
    if (!this.unlocked || !this.track || this.playing) return
    this.playing = true
    this.nextNoteTime = this.ctx.currentTime + 0.08
    this.timerId = window.setInterval(() => this._scheduler(), 25)
  }

  pauseMusic() {
    this.playing = false
    if (this.timerId) window.clearInterval(this.timerId)
    this.timerId = null
  }

  stopMusic() {
    this.pauseMusic()
    this.stepIndex = 0
    this.voices.forEach((v) => {
      try {
        v.stop()
      } catch {
        /* already stopped */
      }
    })
    this.voices.clear()
  }

  /** Look ahead 120ms and schedule anything that falls inside the window. */
  _scheduler() {
    if (!this.playing || !this.track) return
    const secondsPerStep = 60 / this.track.bpm / 4 // 16th notes
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this._scheduleStep(this.stepIndex, this.nextNoteTime, secondsPerStep)
      this.nextNoteTime += secondsPerStep
      this.stepIndex = (this.stepIndex + 1) % 64 // 4 bars
    }
  }

  _scheduleStep(step, time, spb) {
    const t = this.track
    const bus = this.musicBus
    const bar = Math.floor(step / 16)
    const beat = step % 16
    const chord = t.progression[bar % t.progression.length]
    const swing = beat % 2 === 1 ? spb * t.swing : 0
    const at = time + swing
    const f = AudioEngine.midiToFreq

    // --- Pad: the chord, held across the whole bar, gently detuned.
    if (beat === 0) {
      const dur = spb * 16 * 0.98
      chord.forEach((interval, i) => {
        const midi = t.root + 12 + interval
        const voiceGain = 0.055 / Math.sqrt(chord.length)
        // Two slightly detuned oscillators per note give the tape-wow shimmer.
        this._tone(bus, {
          start: at,
          dur,
          freq: f(midi),
          type: 'triangle',
          gain: voiceGain,
          attack: 0.22 + i * 0.04,
          detune: -5,
        })
        this._tone(bus, {
          start: at,
          dur,
          freq: f(midi),
          type: 'sine',
          gain: voiceGain * 0.7,
          attack: 0.3 + i * 0.04,
          detune: 6,
        })
      })
    }

    // --- Bass: root on the downbeat, a fifth on the and-of-three.
    if (beat === 0 || beat === 6 || beat === 11) {
      const midi = t.root + (beat === 11 ? chord[1] : chord[0])
      this._tone(bus, {
        start: at,
        dur: spb * 3.6,
        freq: f(midi),
        type: 'sine',
        gain: 0.16,
        attack: 0.012,
      })
    }

    // --- Kick
    if (beat === 0 || beat === 10) {
      this._tone(bus, {
        start: at,
        dur: 0.3,
        freq: 120,
        glideTo: 44,
        type: 'sine',
        gain: 0.34,
        attack: 0.004,
      })
    }

    // --- Snare / rimshot on the backbeat
    if (beat === 4 || beat === 12) {
      this._noise(bus, { start: at, dur: 0.16, type: 'bandpass', freq: 1900, q: 0.9, gain: 0.09 })
    }

    // --- Hats, thinned out so it breathes
    if (beat % 2 === 0 && Math.random() > 0.22) {
      this._noise(bus, {
        start: at,
        dur: 0.045,
        type: 'highpass',
        freq: 7800,
        q: 0.8,
        gain: beat % 4 === 0 ? 0.05 : 0.028,
      })
    }

    // --- Lead: sparse, only on even 8ths, and never every bar.
    if (beat % 2 === 0 && bar % 2 === 1) {
      const idx = (beat / 2) % t.lead.length
      if (Math.random() > 0.45) {
        this._tone(bus, {
          start: at,
          dur: spb * 2.4,
          freq: f(t.root + 12 + t.lead[idx]),
          type: 'triangle',
          gain: 0.045,
          attack: 0.02,
        })
      }
    }

    // --- Vinyl crackle, one grain per beat
    if (beat % 4 === 0) {
      this._noise(bus, { start: at, dur: spb * 4, type: 'highpass', freq: 5200, q: 0.5, gain: 0.007 })
    }
  }
}

/* One engine for the whole app — the AudioContext limit makes a singleton the
   only sane shape here. */
export const audio = new AudioEngine()
export default audio
