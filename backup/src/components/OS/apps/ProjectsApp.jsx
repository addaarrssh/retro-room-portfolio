import { useState } from 'react'
import { projects } from '../../../data/portfolio'
import { ExternalLink } from 'lucide-react'
import audio from '../../../audio/AudioEngine'
import { useOSTheme } from '../theme'

/* ==========================================================================
   Projects.app — sidebar + detail, the way a Mac app is laid out.

   The previous version was one long scroll of bordered cards in a monospace
   face. That reads as a web page pasted into a window frame. Real Mac apps
   with a list of things put the list in a translucent sidebar on the left and
   the selected item in the content pane on the right — Mail, Finder, Music,
   System Settings all do it, and it is what makes a window feel native rather
   than themed.
   ========================================================================== */

const GithubIcon = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export default function ProjectsApp() {
  const T = useOSTheme()
  const [selectedId, setSelectedId] = useState(projects[0].id)
  const project = projects.find((p) => p.id === selectedId) ?? projects[0]

  return (
    <div className={`flex h-full w-full text-[13px] ${T.text}`}>
      {/* ------------------------------------------------------- Sidebar */}
      <aside className={`flex w-[196px] shrink-0 flex-col border-r ${T.sidebar}`}>
        <div className={`px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider ${T.textFaint}`}>
          Projects
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {projects.map((p) => {
            const active = p.id === selectedId
            return (
              <button
                key={p.id}
                data-click-sound
                onClick={() => {
                  audio.click()
                  setSelectedId(p.id)
                }}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-left transition ${
                  active ? 'text-white' : `${T.text} ${T.fillHover}`
                }`}
                style={active ? { background: T.accent } : undefined}
              >
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ background: active ? '#ffffff' : p.accent }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] leading-tight">{p.title}</span>
                  <span
                    className={`block truncate text-[10.5px] leading-tight ${
                      active ? 'text-white/70' : T.textFaint
                    }`}
                  >
                    {p.subtitle}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className={`border-t px-3 py-2 text-[10.5px] ${T.divider} ${T.textFaint}`}>
          {projects.length} projects
        </div>
      </aside>

      {/* ------------------------------------------------------- Detail */}
      <section className="min-w-0 flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className={`sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-3 backdrop-blur-xl ${T.divider} ${T.windowBody}/85`}>
          <div className="min-w-0">
            <h1 className={`truncate text-[15px] font-semibold ${T.text}`}>{project.title}</h1>
            <p className={`truncate text-[11.5px] ${T.textMuted}`}>{project.subtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {project.year && (
              <span className={`rounded-md px-2 py-1 text-[11px] ${T.fill} ${T.textMuted}`}>
                {project.year}
              </span>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] transition ${T.fill} ${T.fillHover} ${T.text}`}
              >
                <GithubIcon size={12} />
                <span>Repo</span>
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium text-white transition hover:opacity-90"
                style={{ background: T.accent }}
              >
                <ExternalLink size={12} />
                <span>Demo</span>
              </a>
            )}
          </div>
        </div>

        <div className="space-y-5 px-5 py-4">
          {/* Metrics. Reported results, presented as figures rather than as
              body text, because that is what a technical reader scans for. */}
          {project.metrics?.length > 0 && (
            <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:grid-cols-4 ${T.fill}`}>
              {project.metrics.map((m, i) => (
                <div key={i} className={`px-3 py-2.5 text-center ${T.windowBody}`}>
                  <div
                    className="text-[15px] font-semibold tabular-nums"
                    style={{ color: project.accent }}
                  >
                    {m.value}
                  </div>
                  <div className={`mt-0.5 text-[10.5px] ${T.textFaint}`}>{m.label}</div>
                </div>
              ))}
            </div>
          )}

          <p className={`text-[13px] leading-[1.65] ${T.text} opacity-85`}>{project.description}</p>

          <div>
            <div className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${T.textFaint}`}>
              Built with
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className={`rounded-md px-2 py-1 text-[11px] ${T.fill} ${T.text}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
