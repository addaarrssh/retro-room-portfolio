import { useCallback, useState } from 'react'

/* ==========================================================================
   useWindowManager — the desktop's window list, stacking order and focus.

   Coordinates are in *virtual desktop pixels* (SCREEN_W x SCREEN_H), never
   in browser pixels. The whole OS is rendered inside a CSS-transformed plane
   in 3D, so browser pixels are meaningless in here; WindowContainer converts
   pointer deltas back into this space before calling move()/resize().
   ========================================================================== */

export const SCREEN_W = 1024
export const SCREEN_H = 768

/* Windows 95 chrome: one bar, at the BOTTOM, and nothing at the top.
   That single fact is most of why this desktop reads as Windows rather than
   as a Mac — so the top reserve is genuinely zero rather than a small value,
   and windows are free to sit flush against the top edge of the screen. */
export const MENUBAR_H = 0
export const TASKBAR_H = 30
/* Kept as an alias because the taskbar occupies the role the dock used to. */
export const DOCK_H = TASKBAR_H

const CASCADE_STEP = 26
const MIN_W = 300
const MIN_H = 200

/* The Showcase window is open on arrival, and it is deliberately large and
   near-centred: it is not one app among several, it is the site. Everything
   else on this desktop is an aside. Left inset clears the icon column. */
const DEFAULT_INITIAL_WINDOWS = [
  {
    id: 'showcase-default',
    appId: 'showcase',
    title: 'Adarsh Sahu - Showcase 2026',
    label: 'My Showcase',
    x: 108,
    y: 26,
    w: 872,
    h: 668,
    restore: null,
    minimized: false,
    maximized: false,
    z: 10,
  },
]

export function useWindowManager({ onOpen, onClose, onFocus, onMinimize } = {}) {
  const [windows, setWindows] = useState(DEFAULT_INITIAL_WINDOWS)
  const [topZ, setTopZ] = useState(10)

  const focus = useCallback(
    (id, { silent = false } = {}) => {
      setWindows((prev) => {
        const target = prev.find((w) => w.id === id)
        if (!target) return prev
        // Already on top and not minimized — nothing to do, so no re-render.
        if (target.z === topZ && !target.minimized) return prev
        return prev.map((w) => (w.id === id ? { ...w, z: topZ + 1, minimized: false } : w))
      })
      setTopZ((z) => z + 1)
      if (!silent) onFocus?.(id)
    },
    [topZ, onFocus],
  )

  const open = useCallback(
    (app) => {
      /* Read from the rendered list, not from inside the updater.

         This used to set a local `existed` flag from within the setWindows
         callback and check it on the next line. That check always saw `false`:
         React does not run a functional updater at the call site, it runs it
         while processing the update — so re-opening an app that was already
         on screen fired the open sound instead of the focus sound, every time.
         Writing to a closure from inside an updater is also impure, and React
         invokes updaters twice in StrictMode. */
      const existed = windows.some((w) => w.appId === app.id)

      setWindows((prev) => {
        const already = prev.find((w) => w.appId === app.id)
        if (already) {
          return prev.map((w) => (w.appId === app.id ? { ...w, minimized: false, z: topZ + 1 } : w))
        }

        // Cascade each new window down-right from the last one.
        const n = prev.length
        const w = Math.min(app.width, SCREEN_W - 40)
        const h = Math.min(app.height, SCREEN_H - TASKBAR_H - 40)
        const x = Math.max(10, Math.min(SCREEN_W - w - 10, Math.round((SCREEN_W - w) / 2) + n * CASCADE_STEP))
        const usableTop = MENUBAR_H + 12
        const y = Math.max(
          usableTop,
          Math.min(
            SCREEN_H - DOCK_H - h - 10,
            usableTop + Math.round((SCREEN_H - MENUBAR_H - DOCK_H - h) / 2) + n * CASCADE_STEP,
          ),
        )

        return [
          ...prev,
          {
            id: `${app.id}-${Date.now()}`,
            appId: app.id,
            title: app.title,
            label: app.label,
            icon: app.icon,
            x,
            y,
            w,
            h,
            // Remember the floating geometry so un-maximizing restores it.
            restore: null,
            minimized: false,
            maximized: app.id === 'portfolio-v3',
            z: topZ + 1,
          },
        ]
      })
      setTopZ((z) => z + 1)
      if (!existed) onOpen?.(app.id)
      else onFocus?.(app.id)
    },
    [windows, topZ, onOpen, onFocus],
  )

  const close = useCallback(
    (id) => {
      setWindows((prev) => prev.filter((w) => w.id !== id))
      onClose?.(id)
    },
    [onClose],
  )

  const minimize = useCallback(
    (id) => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)))
      onMinimize?.(id)
    },
    [onMinimize],
  )

  const toggleMaximize = useCallback(
    (id) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w
          if (w.maximized) {
            const r = w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h }
            return { ...w, ...r, maximized: false, restore: null }
          }
          return {
            ...w,
            restore: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: 0,
            y: MENUBAR_H,
            w: SCREEN_W,
            h: SCREEN_H - MENUBAR_H - DOCK_H,
            maximized: true,
          }
        }),
      )
      onFocus?.(id)
    },
    [onFocus],
  )

  /** Move by absolute virtual-pixel position, clamped to stay grabbable. */
  const move = useCallback((id, x, y) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id || w.maximized) return w
        return {
          ...w,
          // Keep at least 80px of title bar reachable on every edge.
          x: Math.max(80 - w.w, Math.min(SCREEN_W - 80, x)),
          y: Math.max(MENUBAR_H, Math.min(SCREEN_H - DOCK_H - 26, y)),
        }
      }),
    )
  }, [])

  const resize = useCallback((id, w, h) => {
    setWindows((prev) =>
      prev.map((win) => {
        if (win.id !== id || win.maximized) return win
        return {
          ...win,
          w: Math.max(MIN_W, Math.min(SCREEN_W - Math.max(0, win.x), w)),
          h: Math.max(MIN_H, Math.min(SCREEN_H - DOCK_H - Math.max(0, win.y), h)),
        }
      }),
    )
  }, [])

  const closeAll = useCallback(() => setWindows([]), [])

  const focusedId = windows.reduce(
    (best, w) => (!w.minimized && (!best || w.z > best.z) ? w : best),
    null,
  )?.id

  return {
    windows,
    focusedId,
    open,
    close,
    focus,
    minimize,
    toggleMaximize,
    move,
    resize,
    closeAll,
  }
}
