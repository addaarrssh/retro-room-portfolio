import { useState, useEffect } from 'react'
import { SCREEN_W, SCREEN_H, TASKBAR_H } from '../../hooks/useWindowManager'
import WindowContainer from './WindowContainer'
import ShowcaseApp from './apps/ShowcaseApp'
import AboutApp from './apps/AboutApp'
import ProjectsApp from './apps/ProjectsApp'
import ContactApp from './apps/ContactApp'
import MusicApp from './apps/MusicApp'
import ArcadeApp from './apps/ArcadeApp'
import PortfolioV3App from './apps/PortfolioV3App'
import { User, Code, Mail, Music, Gamepad2, Volume2, VolumeX, Monitor, MonitorPlay, Folder, FileText, Globe } from 'lucide-react'

// App registry mapping IDs to icons & components
const APPS = [
  {
    id: 'portfolio-v3',
    title: 'Portfolio_V3.app',
    icon: Globe,
    gradient: 'from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/50',
    width: 860,
    height: 600,
    component: PortfolioV3App,
  },
  {
    id: 'showcase',
    title: 'Adarsh Sahu - My Showcase',
    icon: MonitorPlay,
    gradient: 'from-blue-600 via-cyan-500 to-teal-400 shadow-cyan-500/50',
    width: 780,
    height: 540,
    component: ShowcaseApp,
  },
  {
    id: 'about',
    title: 'About_Me.app',
    icon: User,
    gradient: 'from-amber-500 via-rose-500 to-purple-600 shadow-rose-500/50',
    width: 650,
    height: 520,
    component: AboutApp,
  },
  {
    id: 'projects',
    title: 'Projects.app',
    icon: Code,
    gradient: 'from-cyan-500 via-blue-600 to-indigo-700 shadow-blue-500/50',
    width: 720,
    height: 540,
    component: ProjectsApp,
  },
  {
    id: 'contact',
    title: 'Contact.app',
    icon: Mail,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/50',
    width: 580,
    height: 480,
    component: ContactApp,
  },
  {
    id: 'music',
    title: 'Music_Player.app',
    icon: Music,
    gradient: 'from-fuchsia-500 via-pink-600 to-rose-500 shadow-fuchsia-500/50',
    width: 500,
    height: 520,
    component: MusicApp,
  },
  {
    id: 'arcade',
    title: 'Snake_Arcade.app',
    icon: Gamepad2,
    gradient: 'from-yellow-400 via-amber-500 to-red-500 shadow-amber-500/50',
    width: 440,
    height: 480,
    component: ArcadeApp,
  },
]

export default function DesktopOS({
  active,
  powered,
  hasBooted,
  powerCycle,
  windowManager,
  muted,
  onToggleMute,
}) {
  const [time, setTime] = useState('')
  const [startOpen, setStartOpen] = useState(false)

  // Clean desktop boot state — windows open only when clicked by user

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

  const handleNavigate = (appId) => {
    const app = APPS.find((a) => a.id === appId)
    if (app) open(app)
  }

  if (!powered) return null

  return (
    <div
      className="relative select-none overflow-hidden font-sans text-white bg-slate-950"
      style={{
        width: `${SCREEN_W}px`,
        height: `${SCREEN_H}px`,
        background: 'linear-gradient(180deg, #090514 0%, #130c2a 40%, #2a0845 70%, #4a0d3a 100%)',
        borderRadius: '16px',
      }}
    >
      {/* Synthwave Horizon Sun & Grid Background overlay */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_bottom,#ff0055_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,240,255,0.15)_100%)] pointer-events-none" />

      {/* Subtle CRT Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* ---------------------------------------------------- Desktop Icons Column */}
      <div className="p-5 flex flex-col gap-3.5 w-max relative z-10">
        {APPS.map((app) => {
          const Icon = app.icon
          return (
            <button
              key={app.id}
              onClick={() => {
                open(app)
                setStartOpen(false)
              }}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400/50 backdrop-blur-md text-left cursor-pointer transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 active:scale-95"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${app.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon size={20} />
              </div>
              <span className="text-xs font-semibold tracking-wide text-zinc-100 group-hover:text-cyan-300 drop-shadow-md">
                {app.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* ---------------------------------------------------- Open Windows */}
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

      {/* ---------------------------------------------------- Start Menu */}
      {startOpen && (
        <div className="absolute bottom-[30px] left-1 z-50 w-56 bg-[#c0c0c0] p-1 border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black shadow-2xl">
          <div className="mb-2 bg-[#000080] p-2 text-white font-bold text-xs flex items-center gap-2">
            <MonitorPlay size={16} />
            <span>Adarsh OS 95</span>
          </div>

          <div className="space-y-1">
            {APPS.map((app) => {
              const Icon = app.icon
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    open(app)
                    setStartOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-2 py-1.5 text-xs text-black font-semibold hover:bg-[#000080] hover:text-white transition text-left"
                >
                  <Icon size={16} />
                  <span>{app.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- Bottom Win95 Taskbar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-[#c0c0c0] px-1 border-t-2 border-t-white"
        style={{ height: TASKBAR_H }}
      >
        {/* Start Button */}
        <button
          onClick={() => setStartOpen(!startOpen)}
          className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold text-black border-t border-l border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white ${
            startOpen ? 'bg-[#dfdfdf] border-t-black border-l-black' : 'bg-[#c0c0c0]'
          }`}
        >
          <div className="flex h-3.5 w-3.5 items-center justify-center bg-[#000080] text-white font-serif text-[10px] font-extrabold rounded-[1px]">
            田
          </div>
          <span>Start</span>
        </button>

        {/* Taskbar Active Window Tabs */}
        <div className="flex flex-1 items-center gap-1 px-2 overflow-x-auto">
          {windows.map((win) => {
            const Icon = win.icon
            const isFocused = focusedId === win.id && !win.minimized
            return (
              <button
                key={win.id}
                onClick={() => focus(win.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold truncate max-w-[140px] border-t border-l border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black ${
                  isFocused
                    ? 'bg-[#dfdfdf] border-t-black border-l-black border-b-white border-r-white text-black'
                    : 'bg-[#c0c0c0] text-zinc-800'
                }`}
              >
                {Icon && <Icon size={12} />}
                <span className="truncate">{win.title}</span>
              </button>
            )
          })}
        </div>

        {/* System Tray (Clock & Mute) */}
        <div className="flex items-center gap-2 border-t border-l border-t-zinc-600 border-l-zinc-600 border-b border-r border-b-white border-r-white px-2 py-0.5 bg-[#c0c0c0]">
          <button
            onClick={onToggleMute}
            className="text-black hover:text-blue-900 transition"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <span className="text-xs font-sans text-black">{time}</span>
        </div>
      </div>
    </div>
  )
}
