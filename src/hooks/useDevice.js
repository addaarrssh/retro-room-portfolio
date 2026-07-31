import { useEffect, useRef, useState } from 'react'

/* ==========================================================================
   useDevice — decides whether this visitor gets the 3D room or the flat site.

   The 3D build assumes things a phone does not have: hover states on the
   interactive props, a drag to orbit, WASD for the car, ⌘K for Spotlight, and
   a 1024px desktop surface that has to stay legible. Shipping it to a phone
   produced a black screen, which is worse than not shipping it at all.

   The decision is deliberately STICKY.

   An earlier version re-evaluated on every resize event. That meant dragging a
   window narrower tore down the entire WebGL scene, and dragging it back
   rebuilt it from scratch — hundreds of meshes, a reflection probe and a
   shader recompile, several times a second, mid-drag. Worse, a browser that
   reports its viewport late (or a preview pane that opens small and then
   resizes) could flip the tree twice during startup and leave the canvas in a
   half-mounted state with no error to show for it.

   So: decide once, then only ever switch when the viewport crosses the
   threshold by a real margin, and only after it has settled.
   ========================================================================== */

const MOBILE_MAX_WIDTH = 900
/** Dead zone around the threshold so a few pixels of drag cannot flip modes. */
const HYSTERESIS = 120
const SETTLE_MS = 400

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

  const vw = window.innerWidth
  const vh = window.innerHeight

  /* A zero-size viewport means "not laid out yet", not "tiny phone". It shows
     up in hidden iframes, in some embedded webviews, and on the first tick in
     browsers that report layout asynchronously. Reading it as a 0px-wide
     screen sent those visitors to the flat site permanently, because the size
     checks below would all pass and nothing afterwards re-ran them. Treat it
     as unknown and let the resize listener decide once real numbers land. */
  const measured = vw > 0 && vh > 0

  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const narrow = measured && Math.min(vw, vh) < 520
  const small = measured && vw < MOBILE_MAX_WIDTH
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  if (!detectWebGL()) return { flat: true, reason: 'no-webgl' }
  if (reducedMotion) return { flat: true, reason: 'reduced-motion' }
  if (coarse && small) return { flat: true, reason: 'touch' }
  if (narrow) return { flat: true, reason: 'viewport' }

  return { flat: false, reason: measured ? 'desktop' : 'unmeasured' }
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
        if (next.flat === current.current.flat) return

        // Only cross the line with room to spare, so a window sitting near the
        // threshold does not thrash the whole scene in and out of existence.
        const w = window.innerWidth
        const clearlyOver = w > MOBILE_MAX_WIDTH + HYSTERESIS
        const clearlyUnder = w < MOBILE_MAX_WIDTH - HYSTERESIS
        const hardReason = next.reason === 'no-webgl' || next.reason === 'reduced-motion'

        if (hardReason || (next.flat && clearlyUnder) || (!next.flat && clearlyOver)) {
          setDevice(next)
        }
      }, SETTLE_MS)
    }

    window.addEventListener('resize', settle)
    const mq = window.matchMedia('(pointer: coarse)')
    mq.addEventListener?.('change', settle)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', settle)
      mq.removeEventListener?.('change', settle)
    }
  }, [])

  return device
}
