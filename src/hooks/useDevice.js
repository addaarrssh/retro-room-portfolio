import { useEffect, useRef, useState } from 'react'

/* ==========================================================================
   useDevice — decides whether this visitor gets the 3D room or the flat site.

   Phones get the room now. The flat site is only for the two cases where the
   room genuinely cannot be shown: no WebGL, or a visitor who asked for reduced
   motion. Everything a phone lacks (hover, a wide viewport, a keyboard) is
   handled inside the room instead: the camera widens for a portrait frame, a
   touch drag looks around, and the desktop renders at double size.

   COMPACT is decided ONCE, at load. It changes the desktop's virtual
   resolution and the render tier, and re-deciding it on a resize would mean
   rebuilding the window list and the WebGL scene mid-drag.
   ========================================================================== */

const SETTLE_MS = 400

function readCompact() {
  if (typeof window === 'undefined') return false
  const vw = window.innerWidth
  const vh = window.innerHeight
  // A zero-size viewport is "not laid out yet", not "tiny phone".
  if (!(vw > 0 && vh > 0)) return false
  return Math.min(vw, vh) < 600
}

/** A phone-sized viewport: the short side is under 600px. */
export const COMPACT = readCompact()

/** Whether the wording should say "tap" rather than "click". */
export const TOUCH =
  COMPACT || (typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false))

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

function evaluate() {
  if (typeof window === 'undefined') return { flat: false, reason: 'ssr' }
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  if (!detectWebGL()) return { flat: true, reason: 'no-webgl' }
  if (reducedMotion) return { flat: true, reason: 'reduced-motion' }
  return { flat: false, reason: COMPACT ? 'mobile-3d' : 'desktop' }
}

export function useDevice() {
  const [device, setDevice] = useState(evaluate)
  const current = useRef(device)
  current.current = device

  useEffect(() => {
    let timer
    const settle = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const next = evaluate()
        if (next.flat !== current.current.flat) setDevice(next)
      }, SETTLE_MS)
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener?.('change', settle)
    return () => {
      window.clearTimeout(timer)
      mq.removeEventListener?.('change', settle)
    }
  }, [])

  return device
}
