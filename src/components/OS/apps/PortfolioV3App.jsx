import { useState } from 'react'

/* ==========================================================================
   PortfolioV3App — Embeds the full Portfolio Journey 3 website inside the
   virtual monitor, scaled down to fit like a desktop screen preview.
   The iframe renders at full desktop resolution (1440×900) and is CSS-
   transformed to fit the window, so all UI components render correctly.
   ========================================================================== */

const SITE_URL = 'https://portfolio-copy-3.vercel.app'

/* The iframe renders at this "virtual" resolution, then gets scaled to fit
   the actual window. This prevents the site's responsive breakpoints from
   collapsing into mobile layout inside the small window. */
const VIRTUAL_W = 1440
const VIRTUAL_H = 900

export default function PortfolioV3App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="flex h-full w-full flex-col bg-[#c0c0c0]">

      {/* ── Top toolbar with Open in Browser button ── */}
      <div
        className="flex shrink-0 items-center justify-between px-2 py-1 border-b border-[#808080]"
        style={{
          background: '#c0c0c0',
          boxShadow: 'inset 0 -1px 0 #808080, inset 0 1px 0 #ffffff',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px]">🌐</span>
          <span
            className="truncate border border-[#808080] bg-white px-2 py-0.5 text-[11px] text-[#333]"
            style={{
              boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #dfdfdf',
              maxWidth: 320,
              fontFamily: 'Tahoma, Verdana, sans-serif',
            }}
          >
            {SITE_URL}
          </span>
        </div>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-click-sound
          className="flex items-center gap-1 px-2.5 py-[3px] text-[11px] font-bold"
          style={{
            background: '#c0c0c0',
            boxShadow: 'inset -1px -1px 0 #000, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
            fontFamily: 'Tahoma, Verdana, sans-serif',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.boxShadow = 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff, inset 2px 2px 0 #000, inset -2px -2px 0 #dfdfdf'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.boxShadow = 'inset -1px -1px 0 #000, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'inset -1px -1px 0 #000, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf'
          }}
        >
          Open in Browser ↗
        </a>
      </div>

      {/* ── Scaled iframe viewport ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">

        {/* Loading overlay */}
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#c0c0c0]">
            <div className="text-[12px] font-bold" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
              Loading Portfolio Journey 3...
            </div>
            <div className="h-[16px] w-[200px] border border-[#808080]" style={{ boxShadow: 'inset 1px 1px 0 #000' }}>
              <div
                className="h-full bg-[#000080]"
                style={{ animation: 'v3load 2s ease-in-out infinite', width: '60%' }}
              />
            </div>
            <style>{`
              @keyframes v3load {
                0% { width: 5%; }
                50% { width: 85%; }
                100% { width: 95%; }
              }
            `}</style>
          </div>
        )}

        {/* The iframe is rendered at full desktop size and CSS-scaled down to
            fit the window. This way the website thinks it's on a 1440px wide
            screen and all components, breakpoints, and layouts render correctly
            without collapsing into mobile/tablet views. */}
        <iframe
          src={SITE_URL}
          title="Portfolio Journey 3"
          onLoad={() => setLoaded(true)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${VIRTUAL_W}px`,
            height: `${VIRTUAL_H}px`,
            border: 'none',
            transformOrigin: 'top left',
            /* Scale is calculated via CSS to fit the container. We use a
               conservative 0.6 which maps 1440→864 and 900→540. The slight
               horizontal overshoot is clipped by overflow:hidden. */
            transform: 'scale(var(--iframe-scale, 0.6))',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* A tiny script-free approach: use a resize observer via CSS custom
            properties isn't possible in pure React without JS, so we use a
            hidden measuring div + inline style calculation. Instead, we just
            set the scale dynamically with a ResizeObserver. For simplicity
            and reliability, we use a JS-in-CSS approach below. */}
        <ScaleSync virtualW={VIRTUAL_W} />
      </div>
    </div>
  )
}

/* Keeps --iframe-scale in sync with the actual container size so the iframe
   always fills the available space without overflow. */
function ScaleSync({ virtualW }) {
  return (
    <div
      ref={(el) => {
        if (!el) return
        const container = el.parentElement
        if (!container) return

        const update = () => {
          const w = container.clientWidth
          const scale = Math.min(w / virtualW, 1)
          container.style.setProperty('--iframe-scale', scale)
        }

        update()

        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(update)
          ro.observe(container)
          el._ro = ro
        }
      }}
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    />
  )
}
