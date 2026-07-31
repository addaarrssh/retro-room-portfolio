import IconArt, { hasIconArt } from './iconArt'

/* ==========================================================================
   AppIcon — a real macOS-style app icon, not a gradient square.

   A flat `bg-gradient-to-br` rounded square is the single clearest tell that
   an interface was themed rather than designed. Apple's icons read as
   physical objects, and four things do that work — none of them is the
   gradient:

   1. SQUIRCLE. Apple's corner radius is ~22.5% of the icon's width and uses a
      continuous curve, not a circular arc. At Dock size the difference is
      small but it is the difference between "app icon" and "rounded div".
   2. INNER TOP HIGHLIGHT. A 1px inset white line along the top edge, as if
      light is catching a bevelled lip. This is what makes the icon feel like
      it has thickness.
   3. INNER BOTTOM SHADE. The opposite, one pixel at the bottom, so the form
      closes.
   4. TINTED DROP SHADOW. The shadow carries the icon's own hue rather than
      being neutral black — the way a coloured object bounces light onto the
      surface beneath it.

   On top of that: a specular sheen sweeping the upper-left, and a very faint
   grain so large flat fills do not band on a big display.
   ========================================================================== */

/** Apple's continuous-corner ratio: 22.5% of the shorter side. */
const SQUIRCLE_RATIO = 0.225

export default function AppIcon({
  appId,
  from,
  via,
  to,
  tint = 'rgba(0,0,0,0.4)',
  size = 44,
  children,
}) {
  const radius = size * SQUIRCLE_RATIO
  /* Ask before rendering, not after: <IconArt> is a truthy element even when
     it resolves to null, so testing the element would silently swallow the
     lucide fallback for any app without bespoke art. */
  const art = hasIconArt(appId)

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        // Three stops rather than two — real icons have a mid-tone that is not
        // the linear blend of the ends, which is what stops them looking flat.
        background: `linear-gradient(160deg, ${from} 0%, ${via} 52%, ${to} 100%)`,
        boxShadow: [
          `inset 0 1px 0 rgba(255,255,255,0.42)`, // top lip catching light
          `inset 0 -1px 0 rgba(0,0,0,0.28)`, // bottom edge closing the form
          `inset 0 0 0 0.5px rgba(255,255,255,0.10)`, // hairline all round
          `0 ${size * 0.09}px ${size * 0.22}px -${size * 0.06}px ${tint}`, // tinted cast
          `0 1px 2px rgba(0,0,0,0.25)`, // contact shadow
        ].join(', '),
      }}
    >
      {/* Specular sheen — a soft ellipse in the upper-left, clipped by the
          squircle. This is the highlight you see on any glossy moulded
          object, and it is what sells the icon as a physical thing. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            'radial-gradient(120% 90% at 22% 8%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.12) 34%, rgba(255,255,255,0) 62%)',
        }}
      />

      {/* Grain. Large flat gradients band badly on a wide-gamut display; a
          fraction of a percent of noise removes it entirely. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          borderRadius: radius,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* The glyph itself, lifted off the surface with its own soft shadow so
          it reads as sitting on the icon rather than printed into it. */}
      <span
        className="relative z-10 flex items-center justify-center text-white"
        style={art ? undefined : { filter: `drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))` }}
      >
        {art ? <IconArt appId={appId} size={size * 0.82} /> : children}
      </span>
    </span>
  )
}
