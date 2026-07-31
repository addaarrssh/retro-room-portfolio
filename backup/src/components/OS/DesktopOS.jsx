import { useState, useEffect } from 'react'
import { SCREEN_W, SCREEN_H, MENUBAR_H } from '../../hooks/useWindowManager'
import { profile, projects } from '../../data/portfolio'
import { OSThemeContext, osThemeFor } from './theme'
import Spotlight from './Spotlight'
import WindowContainer from './WindowContainer'
import ShowcaseApp from './apps/ShowcaseApp'
import AboutApp from './apps/AboutApp'
import ProjectsApp from './apps/ProjectsApp'
import ContactApp from './apps/ContactApp'
import MusicApp from './apps/MusicApp'
import ArcadeApp from './apps/ArcadeApp'
import PortfolioV3App from './apps/PortfolioV3App'
import {
  Code,
  Gamepad2,
  Globe,
  Mail,
  MonitorPlay,
  Music,
  Moon,
  Search,
  Sun,
  Trash2,
  User,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react'
import audio from '../../audio/AudioEngine'

// App registry mapping IDs to icons & components
const APPS = [
  {
    id: 'portfolio-v3',
    label: 'Portfolio V3',
    kind: 'Live site',
    title: 'Portfolio_V3.app',
    icon: Globe,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/50',
    width: 860,
    height: 600,
    component: PortfolioV3App,
  },
  {
    id: 'showcase',
    label: 'Showcase',
    kind: 'Overview',
    title: 'Adarsh Sahu - My Showcase',
    icon: MonitorPlay,
    gradient: 'from-blue-600 via-cyan-500 to-teal-400 shadow-cyan-500/50',
    width: 780,
    height: 540,
    component: ShowcaseApp,
  },
  {
    id: 'about',
    label: 'About Me',
    kind: 'Bio & skills',
    title: 'About_Me.app',
    icon: User,
    gradient: 'from-amber-500 via-rose-500 to-purple-600 shadow-rose-500/50',
    width: 650,
    height: 520,
    component: AboutApp,
  },
  {
    id: 'projects',
    label: 'Projects',
    kind: '6 case studies',
    title: 'Projects.app',
    icon: Code,
    gradient: 'from-cyan-500 via-blue-600 to-indigo-700 shadow-blue-500/50',
    width: 720,
    height: 540,
    component: ProjectsApp,
  },
  {
    id: 'contact',
    label: 'Contact',
    kind: 'Get in touch',
    title: 'Contact.app',
    icon: Mail,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/50',
    width: 580,
    height: 480,
    component: ContactApp,
  },
  {
    id: 'music',
    label: 'Music Player',
    kind: 'Web Audio',
    title: 'Music_Player.app',
    icon: Music,
    gradient: 'from-fuchsia-500 via-pink-600 to-rose-500 shadow-fuchsia-500/50',
    width: 500,
    height: 520,
    component: MusicApp,
  },
  {
    id: 'arcade',
    label: 'Snake',
    kind: 'Arcade',
    title: 'Snake_Arcade.app',
    icon: Gamepad2,
    gradient: 'from-yellow-400 via-amber-500 to-red-500 shadow-amber-500/50',
    width: 440,
    height: 480,
    component: ArcadeApp,
  },
]

export default function DesktopOS({
  powered,
  windowManager,
  muted,
  onToggleMute,
  appearance = 'LIGHT',
  onToggleAppearance,
}) {
  const T = osThemeFor(appearance)
  const isLight = appearance === 'LIGHT'
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const [time, setTime] = useState('')

  // Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      setTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const { windows, focusedId, open, close, focus, minimize, toggleMaximize, move, resize } =
    windowManager

  /* Cmd/Ctrl+K and Cmd+Space, the two things people actually press. Bound on
     the window because the desktop lives inside a 3D surface and never holds
     DOM focus itself. */
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === 'k' || e.key === 'K' || e.code === 'Space')) {
        e.preventDefault()
        setSpotlightOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleNavigate = (appId) => {
    const app = APPS.find((a) => a.id === appId)
    if (app) open(app)
  }

  if (!powered) return null

  const focusedWin = windows.find((w) => w.id === focusedId && !w.minimized)
  const focusedApp = focusedWin ? APPS.find((a) => a.id === focusedWin.appId) : null

  return (
    <OSThemeContext.Provider value={T}>
    <div
      className={`relative select-none overflow-hidden font-sans antialiased ${T.text}`}
      style={{ width: `${SCREEN_W}px`, height: `${SCREEN_H}px` }}
    >
      {/* ------------------------------------------------------- Wallpaper */}
      {/* A single deep gradient with two soft blooms. Nothing here competes
          with window content — a desktop picture is a backdrop, not a poster. */}
      <div
        className="absolute inset-0"
        style={{ background: T.desktop }}
      />
      <div
        className="pointer-events-none absolute -left-40 -top-32 h-[620px] w-[620px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.bloomA}, transparent 62%)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-56 right-[-10%] h-[640px] w-[640px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.bloomB}, transparent 62%)` }}
      />

      {/* Panel sheen. This is an LCD, not a CRT: one very faint diagonal
          highlight, no scanlines. Scanlines over a 1024px desktop that is then
          scaled down in 3D just turn text to mush. */}
      <div
        className={`pointer-events-none absolute inset-0 z-[60] bg-gradient-to-br via-transparent to-transparent ${
          isLight ? 'from-white/25' : 'from-white/[0.035]'
        }`}
      />

      {/* ------------------------------------------------------- Menu bar */}
      <div
        className={`absolute inset-x-0 top-0 z-50 flex items-center gap-4 border-b px-4 text-[12px] backdrop-blur-2xl ${T.menubar} ${T.menubarText}`}
        style={{ height: MENUBAR_H }}
      >
        <AppleMark />

        {/* The active app owns the menu bar, exactly as it does on a Mac. */}
        <span className="font-semibold">{focusedApp ? focusedApp.label : 'Finder'}</span>
        {['File', 'Edit', 'View', 'Window', 'Help'].map((m) => (
          <span key={m} className={T.menubarMuted}>
            {m}
          </span>
        ))}

        <div className={`ml-auto flex items-center gap-3.5 ${T.menubarMuted}`}>
          <button
            data-click-sound
            onClick={onToggleAppearance}
            title={isLight ? 'Switch to Dark Appearance' : 'Switch to Light Appearance'}
            className="transition hover:opacity-70"
          >
            {isLight ? <Moon size={13} /> : <Sun size={13} />}
          </button>
          <button
            data-click-sound
            onClick={onToggleMute}
            title={muted ? 'Unmute' : 'Mute'}
            className="transition hover:opacity-70"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <BatteryMark />
          <Wifi size={14} />
          <button
            data-click-sound
            onClick={() => setSpotlightOpen(true)}
            title="Spotlight Search  ⌘K"
            className="transition hover:opacity-70"
          >
            <Search size={13} />
          </button>
          <span className="tabular-nums">{time}</span>
        </div>
      </div>

      {/* ------------------------------------------------------- Windows */}
      {windows.map((win) => {
        const app = APPS.find((a) => a.id === win.appId)
        if (!app) return null
        const AppComponent = app.component

        return (
          <WindowContainer
            key={win.id}
            win={win}
            focused={focusedId === win.id}
            onFocus={() => focus(win.id)}
            onClose={() => close(win.id)}
            onMinimize={() => minimize(win.id)}
            onToggleMaximize={() => toggleMaximize(win.id)}
            onMove={move}
            onResize={resize}
          >
            <AppComponent onNavigate={handleNavigate} />
          </WindowContainer>
        )
      })}

      {/* ------------------------------------------------------- Dock */}
      <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-2.5">
        <div
          className={`flex items-end gap-1.5 rounded-2xl border px-2.5 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${T.dock}`}
        >
          {APPS.map((app) => {
            const Icon = app.icon
            const isOpen = windows.some((w) => w.appId === app.id)
            return (
              <button
                key={app.id}
                data-click-sound
                title={app.label}
                onClick={() => open(app)}
                className="group relative flex flex-col items-center"
              >
                <span
                  className={`flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-gradient-to-br ${app.gradient} text-white shadow-lg shadow-black/40 transition-transform duration-150 ease-out group-hover:-translate-y-2 group-hover:scale-[1.18] group-active:scale-100`}
                >
                  <Icon size={23} strokeWidth={1.9} />
                </span>

                {/* Tooltip, the way the Dock does it. */}
                <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900/95 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-10">
                  {app.label}
                </span>

                {/* Running indicator. */}
                <span
                  className={`mt-1 h-[3px] w-[3px] rounded-full transition-colors ${
                    isOpen ? (isLight ? 'bg-black/55' : 'bg-white/80') : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}

          <span className={`mx-1 h-11 w-px self-center ${isLight ? "bg-black/15" : "bg-white/15"}`} />

          <button
            data-click-sound
            title="Trash"
            onClick={() => audio.bonk()}
            className="group relative flex flex-col items-center"
          >
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-gradient-to-br from-zinc-500 to-zinc-700 text-white shadow-lg shadow-black/40 transition-transform duration-150 ease-out group-hover:-translate-y-2 group-hover:scale-[1.18]">
              <Trash2 size={22} strokeWidth={1.9} />
            </span>
            <span className="mt-1 h-[3px] w-[3px] rounded-full bg-transparent" />
          </button>
        </div>
      </div>

      <Spotlight
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        apps={APPS}
        projects={projects}
        profile={profile}
        onOpenApp={handleNavigate}
      />
    </div>
    </OSThemeContext.Provider>
  )
}

/* --------------------------------------------------------------------------
   Menu-bar glyphs. Drawn inline rather than pulled from an icon set so the
   silhouettes match the system they are imitating.
   -------------------------------------------------------------------------- */

function AppleMark() {
  return (
    <svg width="13" height="15" viewBox="0 0 14 16" fill="currentColor" className="opacity-90">
      <path d="M11.2 8.5c0-1.6 1.3-2.4 1.4-2.4-.8-1.1-2-1.3-2.4-1.3-1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6c-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.7.9 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2.1-1.6.7-.9.9-1.8.9-1.9 0 0-1.8-.7-1.9-2.8zM9.6 3.3c.5-.6.8-1.4.7-2.3-.7 0-1.5.5-2 1.1-.4.5-.8 1.4-.7 2.2.8.1 1.6-.4 2-1z" />
    </svg>
  )
}

function BatteryMark() {
  return (
    <span className="flex items-center gap-0.5">
      <span className="relative flex h-[10px] w-[20px] items-center rounded-[3px] border border-current px-[1.5px] opacity-70">
        <span className="h-[5px] w-[13px] rounded-[1px] bg-current" />
      </span>
      <span className="h-[4px] w-[1.5px] rounded-r-sm bg-current opacity-60" />
    </span>
  )
}
