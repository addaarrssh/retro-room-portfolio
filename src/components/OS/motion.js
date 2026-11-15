/* ==========================================================================
   motion.js — the two pieces of movement the desktop needs, in one place.

   1. animate(): a Web Animations call that ALWAYS hands back control. The
      desktop is composited inside a 3D-transformed plane, and a window that
      waits on an animation to finish before it closes or hides must not be
      left half-faded if the animation never reports back (hidden tab,
      throttled timeline, cancelled by a newer animation). So every call
      carries a setTimeout deadline as a second clock, the same rule the boot
      overlay follows. Transform and opacity only — layout, box-shadow and
      filter all re-rasterise the whole plane and judder.

   2. smoothScrollBy(): wheel scrolling for the containers INSIDE the screen.
      Native scrolling is switched off in here (it chains to ancestors, and one
      scrolled ancestor throws the whole desktop off the glass), so every wheel
      notch is applied by hand — to the container's own scrollTop and nothing
      else. A discrete notch is eased over ~120ms rather than jumped, which is
      most of what makes in-window reading feel smooth; small trackpad deltas
      arrive dozens of times a second and are applied directly, because
      easing them only adds lag.
   ========================================================================== */

export function reducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Run keyframes on `el`, then call `done` exactly once — when the animation
 * finishes, or at the deadline, whichever comes first. With reduced motion
 * (or no WAAPI) `done` runs synchronously and nothing moves.
 */
export function animate(el, keyframes, { duration = 150, easing = 'ease-out' } = {}, done) {
  let called = false
  const finish = () => {
    if (called) return
    called = true
    done?.()
  }

  if (!el || typeof el.animate !== 'function' || reducedMotion()) {
    finish()
    return () => {}
  }

  let anim
  try {
    anim = el.animate(keyframes, { duration, easing, fill: 'none' })
    anim.onfinish = finish
  } catch {
    finish()
    return () => {}
  }
  const deadline = setTimeout(finish, duration + 120)

  /* Cancel: stop the motion and drop the callback. Used when a newer state
     change supersedes this one, e.g. restore pressed mid-minimise. */
  return () => {
    called = true
    clearTimeout(deadline)
    try {
      anim.cancel()
    } catch {
      /* already gone */
    }
  }
}

/* Per-element scroll target, so several quick notches add up instead of each
   restarting from wherever the previous ease had got to. */
const scrollState = new WeakMap()

export function smoothScrollBy(el, dy) {
  if (!el || !dy) return
  const max = el.scrollHeight - el.clientHeight
  const s = scrollState.get(el)

  /* Small, frequent deltas: a trackpad. Apply directly. */
  if (Math.abs(dy) < 40 || reducedMotion()) {
    if (s) s.cancelled = true
    scrollState.delete(el)
    el.scrollTop = Math.max(0, Math.min(max, el.scrollTop + dy))
    return
  }

  const base = s && !s.cancelled ? s.target : el.scrollTop
  const target = Math.max(0, Math.min(max, base + dy))

  if (s && !s.cancelled) {
    s.target = target
    return
  }

  const state = { target, last: el.scrollTop, cancelled: false }
  scrollState.set(el, state)

  let lastT = performance.now()
  const step = (now) => {
    if (state.cancelled) return
    /* Someone else moved the container (a page change resetting it to the
       top, a scrollbar drag) — give up rather than fight them. */
    if (Math.abs(el.scrollTop - state.last) > 2) {
      state.cancelled = true
      scrollState.delete(el)
      return
    }
    const dt = Math.min(64, now - lastT)
    lastT = now
    /* Frame-rate independent exponential approach: ~90% of the way in 120ms. */
    const k = 1 - Math.pow(0.001, dt / 360)
    const cur = el.scrollTop
    const diff = state.target - cur
    if (Math.abs(diff) < 0.75) {
      el.scrollTop = state.target
      state.cancelled = true
      scrollState.delete(el)
      return
    }
    el.scrollTop = cur + diff * k
    state.last = el.scrollTop
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)

  /* If rAF never runs (hidden tab), land on the target anyway. */
  setTimeout(() => {
    if (state.cancelled) return
    el.scrollTop = state.target
    state.cancelled = true
    scrollState.delete(el)
  }, 400)
}
