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
    /* The <audio> element's tap into the Web Audio graph. An element can only
       be captured once, so this is created a single time and reused across
       every track change. */
    this.mediaSource = null

    this.muted = false
    this.musicVolume = 0.55
    this.unlocked = false

    /** The running room-tone nodes, or null. See startAmbience(). */
    this.ambience = null

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

  /* Route the MP3 element into the graph.

     Without this the element played straight to the system output and never
     passed through musicBus -> master -> analyser, so getLevels() returned
     silence for the entire time a real track was playing. Every one of the 11
     tracks ships as an MP3, which means the desktop visualiser's bars sat flat
     whenever music was actually on — the only time they were ever alive was on
     the synth fallback, i.e. when a file was MISSING. */
  _routeMusicElement() {
    if (!this.ctx || !this.audioElement || this.mediaSource) return
    try {
      this.mediaSource = this.ctx.createMediaElementSource(this.audioElement)
      this.mediaSource.connect(this.musicBus)
      /* musicBus now owns the level. Leaving element.volume set as well would
         apply the same fraction twice — 0.55 would land at 0.30. */
      this.audioElement.volume = 1
    } catch {
      // Capture failed (already taken, or the context is not ready). The
      // element keeps playing directly and element.volume stays in charge.
      this.mediaSource = null
    }
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master && this.ctx) {
      const t = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(t)
      this.master.gain.setTargetAtTime(muted ? 0 : MASTER_CEILING, t, 0.02)
    }
    if (this.audioElement) {
      this.audioElement.muted = muted
    }
  }

  setMusicVolume(v) {
    this.musicVolume = v
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03)
    }
    // Only when the element is playing outside the graph; once routed, the
    // bus above is the single place the level is applied.
    if (this.audioElement && !this.mediaSource) {
      this.audioElement.volume = Math.max(0, Math.min(1, v))
    }
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

  /* ================================================================== sfx

     THE SOUND SET, and why it is synthesised rather than sampled.

     The reference site ships nine short mp3s: a mouse press, a mouse release,
     six keyboard clacks, a startup chime and a looping room tone. Those files
     are that author's assets, so they are not copied here — but the DESIGN is
     the part that matters, and the design is entirely reproducible from an
     oscillator and a noise buffer. Nothing third-party ships in this build.

     Three ideas carry the whole thing:

     1. A CLICK IS TWO EVENTS. Pressing a mouse button and releasing it are
        different sounds — the press is a sharper, lower snap because the
        switch is being loaded, the release is quieter and higher because it
        is only the spring returning. Firing one sound for a whole click is
        the single clearest tell that an interface was given "a click sound"
        rather than sound design, and it is why real hardware feels physical.

     2. SIX KEYS, NOT RANDOM JITTER. The old keyClick() randomised its pitch
        continuously, which sounds like one key through a wobble effect. Real
        keyboards have a handful of distinct-sounding keys and you hear the
        SAME clack recur — so this picks from six fixed characters, each with
        its own body and brightness, exactly as six sample files would.

     3. AMBIENCE IS THE FLOOR. A room is never silent. A very quiet filtered
        noise bed under everything is what makes the clicks sound like they
        happen in a place instead of in a vacuum, and it is doing more work
        than any single effect on this list.
     ================================================================== */

  /** Mouse button going DOWN: the switch loading. Sharp, low, short. */
  mouseDown() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, { start: t, dur: 0.022, type: 'bandpass', freq: 1750, q: 1.1, gain: 0.26 })
    this._tone(this.sfxBus, { start: t, dur: 0.026, freq: 320, type: 'square', gain: 0.05, attack: 0.001 })
  }

  /** Mouse button coming UP: just the spring. Quieter and brighter. */
  mouseUp() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, { start: t, dur: 0.016, type: 'bandpass', freq: 2900, q: 1.6, gain: 0.14 })
    this._tone(this.sfxBus, { start: t, dur: 0.018, freq: 520, type: 'triangle', gain: 0.022, attack: 0.001 })
  }

  /* Six keys. Each row is one "sample": the click's centre frequency and Q,
     then the pitch and level of the body thump underneath it. The spread is
     deliberately uneven — evenly spaced values read as a synthesised scale. */
  static KEYS = [
    { freq: 1420, q: 2.0, body: 168, gain: 0.17 },
    { freq: 1880, q: 2.6, body: 152, gain: 0.15 },
    { freq: 1610, q: 2.2, body: 196, gain: 0.18 },
    { freq: 2240, q: 3.0, body: 141, gain: 0.14 },
    { freq: 1540, q: 1.9, body: 205, gain: 0.19 },
    { freq: 2020, q: 2.4, body: 175, gain: 0.16 },
  ]

  /** One keystroke, drawn from the six. */
  key() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    const k = AudioEngine.KEYS[(Math.random() * AudioEngine.KEYS.length) | 0]
    // A few cents of drift on top, so a long run never phases into a pattern.
    const wobble = 1 + (Math.random() - 0.5) * 0.06
    this._noise(this.sfxBus, {
      start: t,
      dur: 0.026,
      type: 'bandpass',
      freq: k.freq * wobble,
      q: k.q,
      gain: k.gain,
    })
    this._tone(this.sfxBus, {
      start: t,
      dur: 0.03,
      freq: k.body * wobble,
      type: 'square',
      gain: 0.034,
      attack: 0.001,
    })
  }

  /* ------------------------------------------------------------ ambience */

  /** The room tone. Starts once and runs until stopped. */
  startAmbience() {
    if (!this.unlocked || this.ambience) return
    const ctx = this.ctx

    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true

    /* Two filters in series. A lowpass alone leaves a hiss that reads as tape
       noise; rolling the bottom off as well leaves a narrow band that sits
       under everything and is felt more than heard. */
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 70

    const gain = ctx.createGain()
    gain.gain.value = 0
    // Fade in over a couple of seconds; a room tone that snaps on is a click.
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.2)

    /* A very slow drift on the cutoff. Without it the loop is audibly a loop
       within about thirty seconds — the ear locks onto static noise fast. */
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.045
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 90
    lfo.connect(lfoGain).connect(lp.frequency)
    lfo.start()

    src.connect(hp).connect(lp).connect(gain).connect(this.sfxBus)
    src.start()

    this.ambience = { src, gain, lfo }
  }

  stopAmbience() {
    if (!this.ambience) return
    const { src, gain, lfo } = this.ambience
    this.ambience = null
    try {
      gain.gain.cancelScheduledValues(this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4)
      src.stop(this.ctx.currentTime + 0.5)
      lfo.stop(this.ctx.currentTime + 0.5)
    } catch {
      /* already stopped */
    }
  }

  /** Soft mouse click for window chrome and buttons. */
  click() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, { start: t, dur: 0.035, type: 'bandpass', freq: 2400, q: 1.4, gain: 0.22 })
    this._tone(this.sfxBus, { start: t, dur: 0.04, freq: 880, type: 'triangle', gain: 0.05 })
  }

  /** Mechanical keyboard clack — pitch jitters so runs never sound looped. */
  keyClick() {
    if (!this.unlocked) {
      try {
        this.unlock()
      } catch {
        /* wait for gesture */
      }
    }
    if (this.muted || !this.ctx) return
    const t = this.ctx.currentTime
    const f = 1600 + Math.random() * 800
    this._noise(this.sfxBus, { start: t, dur: 0.035, type: 'bandpass', freq: f, q: 2.2, gain: 0.38 })
    this._tone(this.sfxBus, { start: t, dur: 0.04, freq: 220 + Math.random() * 80, type: 'square', gain: 0.08 })
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

  /* ------------------------------------------------------- classic Mac OS */

  /* The startup chime, as a chord rather than an arpeggio.

     The arpeggio in powerOn() is a modern sound — notes arriving one after
     another, the way a phone or a game console announces itself. The machine
     this desktop is imitating did something different: every voice struck at
     once, slightly detuned against itself, and then rang for a long time with
     no percussive attack at all. That single difference — simultaneous, not
     sequential — is most of what makes it read as a specific era rather than
     as generic "nice chime".

     Built from a stack of fifths with a long soft attack, which is what gives
     it the bell-like body without needing a sample. */
  classicChime() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime + 0.02

    // A major chord voiced wide, plus its octave — struck together.
    const voices = [
      { freq: 130.81, gain: 0.05, type: 'triangle' },
      { freq: 196.0, gain: 0.045, type: 'triangle' },
      { freq: 261.63, gain: 0.05, type: 'sine' },
      { freq: 329.63, gain: 0.038, type: 'sine' },
      { freq: 392.0, gain: 0.034, type: 'sine' },
      { freq: 523.25, gain: 0.026, type: 'sine' },
    ]

    for (const v of voices) {
      // Two oscillators per voice, detuned a few cents apart. The slow beating
      // between them is the chorus that stops it sounding like a synth patch.
      for (const detune of [-4, 4]) {
        this._tone(this.sfxBus, {
          start: t,
          dur: 3.4,
          freq: v.freq,
          type: v.type,
          gain: v.gain / 2,
          // Long attack: no click on the front edge, it swells in.
          attack: 0.16,
          detune,
        })
      }
    }
  }

  /** The flat, dry click of a Platinum control. No pitch sweep, no ring. */
  classicClick() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, {
      start: t,
      dur: 0.028,
      type: 'bandpass',
      freq: 2600,
      q: 1.4,
      gain: 0.16,
    })
  }

  /** System beep: one square tone, deliberately plain and slightly rude. */
  classicBeep() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, { start: t, dur: 0.13, freq: 800, type: 'square', gain: 0.05 })
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

  /** Block impact / collision thock sound */
  thock() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._noise(this.sfxBus, { start: t, dur: 0.045, type: 'lowpass', freq: 500, q: 1.4, gain: 0.25 })
    this._tone(this.sfxBus, { start: t, dur: 0.05, freq: 150, glideTo: 50, type: 'sine', gain: 0.22 })
  }

  /** Heavy explosion / impact boom sound */
  explode() {
    if (!this.unlocked || this.muted) return
    const t = this.ctx.currentTime
    this._tone(this.sfxBus, { start: t, dur: 0.5, freq: 180, glideTo: 24, type: 'triangle', gain: 0.45 })
    this._noise(this.sfxBus, { start: t, dur: 0.4, type: 'lowpass', freq: 900, q: 0.7, gain: 0.38 })
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

    if (track.audioUrl) {
      if (!this.audioElement) {
        this.audioElement = new Audio()
      }
      this.audioElement.onerror = () => {
        // If local MP3 file is not present yet, fall back to live Web Audio synth
        this._startSynthLoop()
      }
      this.audioElement.src = track.audioUrl
      this.audioElement.loop = true
      this._routeMusicElement()
      if (!this.mediaSource) this.audioElement.volume = this.muted ? 0 : this.musicVolume
    }

    if (wasPlaying) this.playMusic()
  }

  _startSynthLoop() {
    if (!this.unlocked || !this.ctx) return
    if (this.ctx.state === 'suspended') this.ctx.resume()
    if (this.timerId) window.clearInterval(this.timerId)
    this.nextNoteTime = this.ctx.currentTime + 0.08
    this.timerId = window.setInterval(() => this._scheduler(), 25)
  }

  playMusic() {
    if (!this.track) return
    this.playing = true

    if (this.track.audioUrl) {
      if (!this.audioElement) {
        this.loadTrack(this.track)
      }
      this._routeMusicElement()
      if (!this.mediaSource) this.audioElement.volume = this.muted ? 0 : this.musicVolume
      this.audioElement.play().catch(() => {
        this._startSynthLoop()
      })
      return
    }

    this._startSynthLoop()
  }

  pauseMusic() {
    this.playing = false
    if (this.audioElement) {
      this.audioElement.pause()
    }
    if (this.timerId) window.clearInterval(this.timerId)
    this.timerId = null
  }

  stopMusic() {
    this.pauseMusic()
    this.stepIndex = 0
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }
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
