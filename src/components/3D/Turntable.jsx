import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { MathUtils } from 'three'
import { DESK_TOP } from './layout'
import { surface, surfaceWithMaps } from './surfaces'
import InteractiveProp from './InteractiveProp'
import audio from '../../audio/AudioEngine'
import { tracks } from '../../data/portfolio'

/* ==========================================================================
   Turntable — the room's music, as an object you operate rather than a button.

   The desktop already has Music_Player.app, but a player you can only reach by
   flying into a monitor and clicking a window is software. A record deck on
   the desk is a THING: you drop the needle and the room starts playing. Both
   drive the same AudioEngine singleton, so whichever one you touch, the other
   agrees — the engine is the single source of truth and this polls it rather
   than keeping its own idea of what is playing.

   What makes it read as a real deck rather than a disc on a box:

   · IT SPINS AT THE RIGHT SPEED. 33 1/3 rpm is 3.49 rad/s. Not "some rotation
     that looks about right" — a deck running visibly fast is the first thing
     anyone who owns one will notice.
   · IT SPINS UP AND DOWN. A platter has mass. It takes about a second to reach
     speed and coasts down slower than it started, so play/pause is a physical
     event instead of a toggle.
   · THE ARM CUES. At rest it sits on its rest post, outside the record. On
     play it lifts, swings over the lead-in groove and lowers. That sequence,
     in that order, is the whole gesture of putting a record on.
   · THE ARM TRACKS INWARD. As the side plays the arm creeps toward the centre,
     which is the only way a still image of a deck tells you how far in it is.

   Click the record to start or stop it. Click the arm for the next track.
   ========================================================================== */

/** Where it sits on the desk: right of the mouse, clear of the speaker. */
const POS = { x: 1.15, z: -0.3, rot: -0.22 }

/** 33 1/3 rpm in radians per second. */
const RPM_33 = (33 + 1 / 3) * ((Math.PI * 2) / 60)

/** Tonearm yaw at rest (on its post) and at the lead-in groove. */
const ARM_REST = 0.5
const ARM_LEAD_IN = -0.28
/** How much further it swings by the end of a side. */
const ARM_TRAVEL = 0.3

const RECORD_R = 0.108

/* Label colours per catalogue section, so the record on the platter actually
   corresponds to what is playing. */
const LABEL_COLOR = {
  INDIAN: '#d97706',
  ENGLISH: '#1d4ed8',
  GHAZAL: '#9333ea',
}

export default function Turntable({ enabled = true, onHoverProp }) {
  const platterRef = useRef()
  const armRef = useRef()
  const ledRef = useRef()

  /* The engine owns playback; this only mirrors it. Polling rather than
     holding local state is what keeps the deck and Music_Player.app in
     agreement when the other one is used. */
  const [playing, setPlaying] = useState(() => audio.playing)
  const [trackId, setTrackId] = useState(() => audio.track?.id ?? null)

  useEffect(() => {
    const id = setInterval(() => {
      setPlaying(audio.playing)
      setTrackId(audio.track?.id ?? null)
    }, 400)
    return () => clearInterval(id)
  }, [])

  const track = useMemo(
    () => tracks.find((t) => t.id === trackId) ?? tracks[0],
    [trackId],
  )

  const spin = useRef(0) // current angular velocity, rad/s
  const progress = useRef(0) // 0..1 through the side, drives arm travel

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    /* Spin-up and spin-down. Different rates on purpose: a platter reaches
       speed under drive but coasts to a stop on its own bearing. */
    const target = playing ? RPM_33 : 0
    const rate = playing ? 3.2 : 1.1
    spin.current = MathUtils.lerp(spin.current, target, 1 - Math.exp(-rate * dt))

    if (platterRef.current) platterRef.current.rotation.y += spin.current * dt

    // A side is about 20 minutes; this is the arm's slow creep inward.
    if (playing) progress.current = Math.min(1, progress.current + dt / 1200)
    else progress.current = 0

    if (armRef.current) {
      const wanted = playing ? ARM_LEAD_IN - progress.current * ARM_TRAVEL : ARM_REST
      armRef.current.rotation.y = MathUtils.lerp(armRef.current.rotation.y, wanted, 1 - Math.exp(-3 * dt))
      // Cueing: the arm rides a little high while it is swinging across and
      // settles once it is over the groove.
      const swinging = Math.abs(armRef.current.rotation.y - wanted) > 0.02
      const lift = playing && !swinging ? 0 : 0.006
      armRef.current.position.y = MathUtils.lerp(armRef.current.position.y, 0.028 + lift, 1 - Math.exp(-6 * dt))
    }

    if (ledRef.current) {
      ledRef.current.material.emissiveIntensity = MathUtils.lerp(
        ledRef.current.material.emissiveIntensity,
        playing ? 2.4 : 0.15,
        1 - Math.exp(-6 * dt),
      )
    }
  })

  const toggle = () => {
    audio.unlock()
    if (audio.playing) {
      audio.pauseMusic()
      setPlaying(false)
      return
    }
    if (!audio.track) audio.loadTrack(track)
    audio.playMusic()
    setPlaying(true)
  }

  const nextTrack = () => {
    audio.unlock()
    const i = tracks.findIndex((t) => t.id === audio.track?.id)
    const next = tracks[(i + 1 + tracks.length) % tracks.length]
    const wasPlaying = audio.playing
    audio.loadTrack(next)
    if (!wasPlaying) audio.playMusic()
    setTrackId(next.id)
    setPlaying(true)
  }

  const walnut = surfaceWithMaps('lacqueredWood')
  const alu = surface('anodisedAluminium')
  const rubber = surface('rubber')
  const vinyl = surface('plastic', { roughness: 0.34, clearcoat: 0.6 })

  return (
    <group position={[POS.x, DESK_TOP, POS.z]} rotation={[0, POS.rot, 0]}>
      {/* Plinth. A deck is a heavy damped box — the mass is the point of it,
          so it gets a deep chamfer rather than a thin sharp slab. */}
      <RoundedBox
        args={[0.34, 0.044, 0.3]}
        radius={0.007}
        smoothness={4}
        position={[0, 0.022, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial color="#4a3527" {...walnut} />
      </RoundedBox>

      {/* Isolation feet, so it stands off the desk instead of sinking into it. */}
      {[
        [-0.14, -0.12],
        [0.14, -0.12],
        [-0.14, 0.12],
        [0.14, 0.12],
      ].map(([fx, fz], i) => (
        <mesh key={i} position={[fx, 0.004, fz]}>
          <cylinderGeometry args={[0.009, 0.011, 0.008, 14]} />
          <meshPhysicalMaterial color="#111316" {...rubber} />
        </mesh>
      ))}

      {/* ------------------------------------------------- platter and record */}
      <InteractiveProp
        label={`${track.title} — ${track.artist}`}
        hint={playing ? 'Click to stop the record' : 'Click to drop the needle'}
        enabled={enabled}
        onSelect={toggle}
        onHover={onHoverProp}
        lift={0.004}
        position={[-0.03, 0.044, 0]}
      >
        <group ref={platterRef}>
          {/* Machined aluminium platter. */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.118, 0.116, 0.014, 56]} />
            <meshPhysicalMaterial color="#b9bec6" {...alu} />
          </mesh>

          {/* Felt slipmat, a hair proud of the platter. */}
          <mesh position={[0, 0.0075, 0]}>
            <cylinderGeometry args={[0.114, 0.114, 0.0015, 48]} />
            <meshPhysicalMaterial color="#22252b" {...surface('fabric')} />
          </mesh>

          {/* The record. Vinyl is not black — it is a very dark grey with a
              hard clearcoat, which is why it throws a sharp reflection. */}
          <mesh position={[0, 0.0092, 0]} castShadow>
            <cylinderGeometry args={[RECORD_R, RECORD_R, 0.0016, 64]} />
            <meshPhysicalMaterial color="#15171b" {...vinyl} />
          </mesh>

          {/* Groove bands. Real light on a record breaks into concentric arcs;
              a few raised rings do that job far more cheaply than a texture. */}
          {[0.098, 0.086, 0.074, 0.062, 0.05].map((r) => (
            <mesh key={r} position={[0, 0.0101, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.0006, 6, 72]} />
              <meshPhysicalMaterial color="#0d0f12" roughness={0.28} clearcoat={0.5} />
            </mesh>
          ))}

          {/* Centre label, coloured by what is actually on the deck. */}
          <mesh position={[0, 0.0104, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.0004, 40]} />
            <meshStandardMaterial color={LABEL_COLOR[track.category] ?? '#b45309'} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.0107, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.0004, 24]} />
            <meshStandardMaterial color="#f4efe6" roughness={0.9} />
          </mesh>

          {/* Spindle. */}
          <mesh position={[0, 0.016, 0]}>
            <cylinderGeometry args={[0.0028, 0.0028, 0.02, 12]} />
            <meshPhysicalMaterial color="#d6dae0" {...alu} />
          </mesh>
        </group>
      </InteractiveProp>

      {/* --------------------------------------------------------- tonearm */}
      <InteractiveProp
        label={`Next: ${tracks[(tracks.findIndex((t) => t.id === track.id) + 1) % tracks.length].title}`}
        hint="Click the arm to skip to the next record"
        enabled={enabled}
        onSelect={nextTrack}
        onHover={onHoverProp}
        lift={0.003}
        position={[0.125, 0.044, -0.1]}
      >
        {/* Pivot housing, which stays put — the arm above it is what moves. */}
        <mesh position={[0, 0.012, 0]} castShadow>
          <cylinderGeometry args={[0.019, 0.021, 0.024, 24]} />
          <meshPhysicalMaterial color="#2a2d33" {...alu} />
        </mesh>

        <group ref={armRef} position={[0, 0.028, 0]} rotation={[0, ARM_REST, 0]}>
          {/* Arm tube, running out from the pivot. */}
          <mesh position={[-0.075, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.0035, 0.0035, 0.15, 14]} />
            <meshPhysicalMaterial color="#c9ced6" {...alu} />
          </mesh>

          {/* Counterweight behind the pivot — this is what balances the arm,
              and without it the whole thing reads as a stick on a peg. */}
          <mesh position={[0.032, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.02, 20]} />
            <meshPhysicalMaterial color="#1c1f24" {...surface('softTouch')} />
          </mesh>

          {/* Headshell, angled the way a real one is so the stylus sits
              tangent to the groove rather than square to the arm. */}
          <group position={[-0.152, -0.004, 0]} rotation={[0, 0.38, 0]}>
            <RoundedBox args={[0.026, 0.008, 0.014]} radius={0.002} smoothness={3} castShadow>
              <meshPhysicalMaterial color="#e8e4dc" {...surface('plastic')} />
            </RoundedBox>
            {/* Cartridge and stylus. */}
            <mesh position={[-0.004, -0.008, 0]}>
              <boxGeometry args={[0.014, 0.009, 0.01]} />
              <meshStandardMaterial color="#8b1e2d" roughness={0.5} />
            </mesh>
            <mesh position={[-0.008, -0.014, 0]}>
              <cylinderGeometry args={[0.0004, 0.0008, 0.005, 6]} />
              <meshStandardMaterial color="#cfd4da" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Arm rest post, which is what the arm is sitting on when stopped. */}
        <mesh position={[0.052, 0.02, 0.084]} castShadow>
          <cylinderGeometry args={[0.005, 0.006, 0.04, 12]} />
          <meshPhysicalMaterial color="#2a2d33" {...alu} />
        </mesh>
      </InteractiveProp>

      {/* ------------------------------------------------- controls and lamp */}
      {/* Speed selector, sitting proud of the plinth. */}
      {[-0.02, 0.024].map((z, i) => (
        <RoundedBox
          key={z}
          args={[0.022, 0.006, 0.014]}
          radius={0.002}
          smoothness={3}
          position={[-0.142, 0.046, z]}
        >
          <meshPhysicalMaterial color={i === 0 ? '#d8d3c9' : '#3a3d44'} {...surface('plastic')} />
        </RoundedBox>
      ))}

      {/* Power lamp. Dim at rest, lit while the platter turns. */}
      <mesh ref={ledRef} position={[-0.142, 0.047, -0.06]}>
        <sphereGeometry args={[0.0045, 14, 14]} />
        <meshStandardMaterial
          color="#8ef0c0"
          emissive="#22c07a"
          emissiveIntensity={0.15}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
