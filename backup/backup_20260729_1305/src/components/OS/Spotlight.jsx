import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import { useOSTheme } from './theme'
import AppIcon from './AppIcon'
import audio from '../../audio/AudioEngine'

/* ==========================================================================
   Spotlight — ⌘K / ⌘Space search over apps and portfolio content.

   The single most Mac-feeling thing a desktop can do, and genuinely the
   fastest way around a portfolio: type "rail" and open RailCross, type
   "email" and copy the address. It also gives the OS a keyboard path, which
   until now it had none of — every app could only be reached by aiming at a
   Dock icon on a screen that is being rendered at an angle inside a 3D scene.
   ========================================================================== */

export default function Spotlight({ open, onClose, apps, projects, profile, onOpenApp }) {
  const T = useOSTheme()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef(null)

  /* Everything searchable, flattened once. Apps first so an empty query shows
     the launcher rather than an arbitrary project. */
  const items = useMemo(() => {
    const appItems = apps.map((a) => ({
      id: `app-${a.id}`,
      kind: 'Application',
      title: a.label,
      subtitle: a.kind,
      icon: a.icon,
      appId: a.id,
      from: a.from,
      via: a.via,
      to: a.to,
      tint: a.tint,
      run: () => onOpenApp(a.id),
    }))

    const projectItems = projects.map((p) => ({
      id: `proj-${p.id}`,
      kind: 'Project',
      title: p.title,
      subtitle: p.subtitle,
      accent: p.accent,
      keywords: p.tech.join(' '),
      run: () => onOpenApp('projects'),
    }))

    const actions = [
      {
        id: 'act-email',
        kind: 'Action',
        title: 'Copy email address',
        subtitle: profile.email,
        keywords: 'contact mail address',
        run: () => {
          navigator.clipboard?.writeText(profile.email)
          onOpenApp('contact')
        },
      },
      {
        id: 'act-github',
        kind: 'Action',
        title: 'Open GitHub profile',
        subtitle: profile.github,
        keywords: 'code repos source',
        run: () => window.open(profile.github, '_blank', 'noopener'),
      },
    ]

    return [...appItems, ...projectItems, ...actions]
  }, [apps, projects, profile, onOpenApp])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 8)
    return items
      .filter((it) =>
        `${it.title} ${it.subtitle ?? ''} ${it.keywords ?? ''} ${it.kind}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 8)
  }, [items, query])

  // Reset on each invocation — a search box that remembers the last query is
  // a search box you have to clear before you can use it.
  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      // Focus after the panel has actually mounted.
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [open])

  useEffect(() => setIndex(0), [query])

  if (!open) return null

  const runSelected = (item) => {
    if (!item) return
    audio.blip(true)
    item.run()
    onClose()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runSelected(results[index])
    }
  }

  const isLight = T.id === 'LIGHT'

  return (
    <div className="absolute inset-0 z-[70] flex items-start justify-center pt-[108px]">
      {/* Click-away. Spotlight is modal on a Mac. */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={`relative w-[560px] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl ${
          isLight ? 'border-black/10 bg-white/85' : 'border-white/15 bg-[#1c1c1e]/90'
        }`}
      >
        {/* Query row */}
        <div className={`flex items-center gap-3 border-b px-4 py-3 ${T.divider}`}>
          <Search size={18} className={T.textMuted} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Spotlight Search"
            className={`flex-1 bg-transparent text-[17px] outline-none placeholder:${
              isLight ? 'text-neutral-400' : 'text-zinc-600'
            } ${T.text}`}
          />
          <kbd
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${T.fill} ${T.textFaint}`}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className={`px-4 py-6 text-center text-[13px] ${T.textMuted}`}>
            No results for “{query}”
          </div>
        ) : (
          <ul className="max-h-[320px] overflow-y-auto p-1.5">
            {results.map((it, i) => {
              const Icon = it.icon
              const active = i === index
              return (
                <li key={it.id}>
                  <button
                    data-click-sound
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => runSelected(it)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                      active ? 'text-white' : T.text
                    }`}
                    style={active ? { background: T.accent } : undefined}
                  >
                    {Icon ? (
                      <AppIcon appId={it.appId} from={it.from} via={it.via} to={it.to} tint={it.tint} size={28}>
                        <Icon size={14} strokeWidth={2} />
                      </AppIcon>
                    ) : (
                      <span
                        className="h-7 w-7 shrink-0 rounded-lg"
                        style={{ background: it.accent ?? (isLight ? '#c7c7cc' : '#3a3a3c') }}
                      />
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] leading-tight">{it.title}</span>
                      {it.subtitle && (
                        <span
                          className={`block truncate text-[11.5px] leading-tight ${
                            active ? 'text-white/75' : T.textMuted
                          }`}
                        >
                          {it.subtitle}
                        </span>
                      )}
                    </span>

                    <span
                      className={`shrink-0 text-[10.5px] uppercase tracking-wider ${
                        active ? 'text-white/70' : T.textFaint
                      }`}
                    >
                      {it.kind}
                    </span>

                    {active && <CornerDownLeft size={13} className="shrink-0 text-white/80" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
