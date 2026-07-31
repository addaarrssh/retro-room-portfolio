import { useState } from 'react'
import { ArrowUpRight, Check, Copy, Mail, MapPin, Monitor } from 'lucide-react'
import {
  aboutParagraphs,
  education,
  learningNow,
  principles,
  profile,
  projects,
  skillGroups,
  stats,
  timeline,
  toolbelt,
} from '../../data/portfolio'

/* ==========================================================================
   FlatSite — the portfolio without the room.

   Served to phones, to anything without WebGL, and to anyone who has asked
   their OS for reduced motion. It is not a warning screen and not a cut-down
   teaser: it is the same content from data/portfolio.js, laid out to be read.

   That matters more than it sounds. A portfolio gets opened on a phone
   constantly, and the 3D build was rendering a black screen there — every one
   of those visitors saw nothing at all. A site that cannot be read on the
   device it is opened on is not a portfolio, whatever it looks like on a
   desktop.

   Design is deliberately plain and typographic. It is not trying to imitate
   the room; it is trying to get out of the way of the work.
   ========================================================================== */

const GithubIcon = ({ size = 16 }) => (
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

export default function FlatSite({ reason }) {
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard?.writeText(profile.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-[#fbfbfd] font-sans text-neutral-900">
      <div className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-14 sm:px-8">
        {/* ------------------------------------------------------- header */}
        <header>
          <div className="flex items-center gap-5 mb-4">
            <img
              src={profile.avatar || '/avatar.jpg'}
              alt={profile.name}
              className="h-20 w-20 rounded-2xl object-cover border border-black/10 shadow-lg ring-4 ring-black/5"
            />
            <div>
              <h1 className="text-[clamp(2rem,8vw,2.75rem)] font-semibold leading-[1.05] tracking-tight">
                {profile.name}
              </h1>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                {profile.role}
              </p>
            </div>
          </div>
          <p className="mt-6 text-[15px] leading-[1.65] text-neutral-700">{profile.positioning}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={copyEmail}
              className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-[13px] font-medium text-white transition active:scale-[0.98]"
            >
              {copied ? <Check size={14} /> : <Mail size={14} />}
              <span>{copied ? 'Copied' : 'Copy email'}</span>
            </button>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-black/12 px-4 py-2.5 text-[13px] font-medium transition active:scale-[0.98]"
            >
              <GithubIcon size={14} />
              <span>GitHub</span>
            </a>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-[12.5px] text-neutral-500">
            <MapPin size={13} />
            <span>{profile.location}</span>
          </div>
        </header>

        {/* -------------------------------------------------------- stats */}
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/[0.07] sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#fbfbfd] px-4 py-3.5">
              <div className="text-[19px] font-semibold tabular-nums">{s.value}</div>
              <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wider text-neutral-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ----------------------------------------------------- projects */}
        <Section title="Selected work" note={`${projects.length} projects`}>
          <div className="space-y-3">
            {projects.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: p.accent }}
                      />
                      <h3 className="truncate text-[15px] font-semibold">{p.title}</h3>
                      {p.year && (
                        <span className="shrink-0 rounded bg-black/[0.06] px-1.5 py-0.5 text-[10px] text-neutral-500">
                          {p.year}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-neutral-500">{p.subtitle}</p>
                  </div>

                  {p.repo && (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${p.title} on GitHub`}
                      className="shrink-0 rounded-lg border border-black/10 p-2 text-neutral-600"
                    >
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>

                {p.metrics?.length > 0 && (
                  <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {p.metrics.map((m, i) => (
                      <div key={i} className="rounded-lg bg-black/[0.035] px-2.5 py-2">
                        <div
                          className="text-[13.5px] font-semibold tabular-nums"
                          style={{ color: p.accent }}
                        >
                          {m.value}
                        </div>
                        <div className="text-[9.5px] leading-tight text-neutral-500">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-3.5 text-[13.5px] leading-[1.6] text-neutral-700">
                  {p.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-black/[0.05] px-2 py-1 text-[10.5px] text-neutral-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------- about */}
        <Section title="About">
          <div className="space-y-3.5">
            {aboutParagraphs.map((para, i) => (
              <p key={i} className="text-[14px] leading-[1.7] text-neutral-700">
                {para}
              </p>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-black/[0.08] bg-white p-5">
            <div className="text-[14px] font-semibold">{education.institution}</div>
            <div className="mt-0.5 text-[13px] text-neutral-600">{education.degree}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-neutral-500">
              <span>
                {education.startYear}–{education.endYear}
              </span>
              <span>CGPA {education.cgpa}</span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-600">{education.note}</p>
          </div>
        </Section>

        {/* ---------------------------------------------------- principles */}
        <Section title="How I work">
          <div className="grid gap-3 sm:grid-cols-2">
            {principles.map((pr) => (
              <div key={pr.title} className="rounded-2xl border border-black/[0.08] bg-white p-4">
                <div className="text-[13.5px] font-semibold">{pr.title}</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-neutral-600">{pr.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------- skills */}
        <Section title="Skills">
          <div className="space-y-5">
            {skillGroups.map((g) => (
              <div key={g.id}>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {g.label}
                </div>
                <div className="space-y-1.5">
                  {g.skills.map((sk) => (
                    <div key={sk.name} className="flex items-center gap-3">
                      <span className="w-[150px] shrink-0 text-[12.5px] text-neutral-700">
                        {sk.name}
                      </span>
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
                        <span
                          className="block h-full rounded-full bg-neutral-800"
                          style={{ width: `${sk.level}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11.5px] italic text-neutral-500">
            Levels are a self-assessed comfort rating, not a benchmark.
          </p>

          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Toolbelt
            </div>
            <div className="flex flex-wrap gap-1.5">
              {toolbelt.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-black/[0.05] px-2 py-1 text-[11px] text-neutral-600"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Currently learning
            </div>
            <div className="flex flex-wrap gap-1.5">
              {learningNow.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-dashed border-black/15 px-2 py-1 text-[11px] text-neutral-500"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------ timeline */}
        <Section title="Timeline">
          <div className="space-y-4 border-l border-black/10 pl-5">
            {timeline.map((t) => (
              <div key={t.year} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-neutral-800" />
                <div className="font-mono text-[11px] text-neutral-500">{t.year}</div>
                <div className="mt-0.5 text-[13.5px] font-semibold">{t.title}</div>
                <div className="text-[12px] text-neutral-500">{t.org}</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-neutral-600">{t.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------------- footer */}
        <footer className="mt-14 border-t border-black/10 pt-6">
          <p className="text-[13px] text-neutral-600">{profile.availability}</p>

          {/* Honest about what they are not seeing, and why. */}
          {reason !== 'no-webgl' && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-black/[0.035] p-3.5">
              <Monitor size={15} className="mt-0.5 shrink-0 text-neutral-500" />
              <p className="text-[12px] leading-relaxed text-neutral-600">
                There is a 3D version of this portfolio — a workspace you can look around, with a
                desktop you can actually use. It needs a larger screen and a mouse, so open this
                page on a laptop to see it.
              </p>
            </div>
          )}

          <p className="mt-5 font-mono text-[10.5px] text-neutral-400">
            © {new Date().getFullYear()} {profile.name}
          </p>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, note, children }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-baseline justify-between border-b border-black/10 pb-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em]">{title}</h2>
        {note && <span className="font-mono text-[10.5px] text-neutral-400">{note}</span>}
      </div>
      {children}
    </section>
  )
}
