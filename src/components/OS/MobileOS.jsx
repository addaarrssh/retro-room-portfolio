import { useCallback, useEffect, useRef, useState } from 'react'
import ShowcaseApp from './apps/ShowcaseApp'

/* ==========================================================================
   MobileOS — the computer, on a phone.

   On a desktop the camera sits you in front of the monitor and you use the
   machine through the glass. On a phone that glass is 370px wide: whatever is
   drawn on it, the type is small and every control is a fingertip's width
   from its neighbour. So on a phone, sitting down OPENS the screen. The
   Showcase window grows out of the monitor until it is the whole display,
   and from there it is an ordinary page: real type sizes, the browser's own
   momentum scrolling, and targets a thumb can hit.

   It is still the same window. Navy title bar, grey bevels, the sunken white
   page well: the phone has not left Windows 95, it has just been handed a
   screen of its own.

   Only the Showcase lives here. The other desktop apps need things a phone
   does not have (arrow keys for Snake, a keyboard for the prompt, an inline
   PDF viewer for the resume), and everything a visitor came for is on the
   Showcase, resume downloads included.
   ========================================================================== */

const CLOSE_MS = 170

/* Room props name desktop apps. Here they all resolve to a Showcase page. */
const SECTION_FOR_APP = { projects: 'projects', about: 'about', contact: 'contact', showcase: 'home', resume: 'home' }

export default function MobileOS({ pendingApp, onPendingHandled, onClose }) {
  const [deepLink, setDeepLink] = useState(null)
  const [closing, setClosing] = useState(false)
  const timer = useRef(0)

  useEffect(() => {
    if (!pendingApp) return
    setDeepLink(pendingApp.focusId || SECTION_FOR_APP[pendingApp.appId] || 'home')
    onPendingHandled?.()
  }, [pendingApp, onPendingHandled])

  /* The window shrinks away first and the camera stands up after, so the two
     moves read as one gesture instead of the page vanishing mid-frame. */
  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    timer.current = window.setTimeout(() => onClose?.(), CLOSE_MS)
  }, [closing, onClose])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div
      /* Marks this subtree as "inside the machine": App's scroll guard leaves
         it alone, and the room's tap-to-sit and drag-to-look ignore it. */
      data-os-screen=""
      /* Above drei's <Html> layer (the desktop projected onto the monitor),
         which claims z-indices up to 100. */
      className={`mobile-os fixed inset-0 z-[1000] flex flex-col bg-[#c0c0c0] ${closing ? 'mobile-os-out' : 'mobile-os-in'}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        fontFamily: "'Tahoma', 'Verdana', 'Geneva', sans-serif",
      }}
    >
      {/* ---------------------------------------------------- title bar */}
      <div
        className="flex h-[46px] shrink-0 items-center gap-2 px-1.5 text-white"
        style={{ background: 'linear-gradient(90deg, #000080, #1084d0)' }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Back to the room"
          className="w95-btn flex h-[34px] shrink-0 items-center gap-1.5 px-3 text-[14px] font-bold"
        >
          <span className="w95-press">
            <span aria-hidden className="mr-1.5 text-[11px]">&#9664;</span>
            Room
          </span>
        </button>
        <div className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-[0.01em]">
          Adarsh Sahu &ndash; Showcase 2026
        </div>
      </div>

      {/* ------------------------------------------------------ the page */}
      <div className="min-h-0 flex-1 p-[3px]">
        <div
          className="h-full w-full overflow-hidden bg-[#fdfdfb]"
          style={{ boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #000000' }}
        >
          <ShowcaseApp mobile deepLink={deepLink} />
        </div>
      </div>
    </div>
  )
}
