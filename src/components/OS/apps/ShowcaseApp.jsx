import { useEffect, useRef, useState } from 'react'
import {
  profile,
  projects,
  education,
  timeline,
  aboutParagraphs,
  skillGroups,
  toolbelt,
  learningNow,
} from '../../../data/portfolio'

/* ==========================================================================
   ShowcaseApp — the personal homepage inside the browser window.

   This replaces a modern card layout: rounded white panels, gradient buttons,
   coloured pills, an avatar with a pulsing status dot. All of it good work,
   and all of it wrong for this window, because a 1995 browser did not contain
   2024 web design — and the clash was the loudest thing on the screen.

   What a personal site actually looked like, and what is rebuilt here:

   1. A TABLE-STYLE TWO-COLUMN LAYOUT. A narrow left rail carrying the name and
      the whole navigation, a wide right column carrying one long document.
      Not tabs, not cards, not a grid — one page, scrolled.
   2. TYPOGRAPHY IS THE ONLY DECORATION. A heavy slab serif for the display
      type against a plain serif body, and nothing else: no shadows, no fills,
      no accent colour on anything that is not a link.
   3. LINKS ARE BLUE-VIOLET AND UNDERLINED. Always. The single most dated
      signal available, and the one that does the most work.
   4. RULES, NOT BORDERS. Sections are separated by a horizontal line across
      the column, the way a printed document separates them. Nothing is boxed.
   5. JUSTIFIED BODY TEXT. Genuinely period-correct, and it is what makes the
      column read as a document rather than as a web layout.

   The navigation is internal state rather than routes: this is one window in a
   virtual OS, so there is no URL to own, and the sidebar's job is to swap the
   right column, exactly as the original's did.
   ========================================================================== */

const NAV = [
  { id: 'home', label: 'HOME' },
  { id: 'about', label: 'ABOUT' },
  { id: 'experience', label: 'EXPERIENCE' },
  { id: 'projects', label: 'PROJECTS', children: [{ id: 'software', label: 'SOFTWARE' }] },
  { id: 'contact', label: 'CONTACT' },
]

const LINK = '#4b0082'

export default function ShowcaseApp({ deepLink }) {
  const [section, setSection] = useState('home')
  const scrollRef = useRef(null)

  /* A room prop can point straight at a section. Deep-linking to a page that
     is already scrolled halfway down would be disorienting, so the column is
     reset to the top on every change — the same thing following a link did. */
  useEffect(() => {
    if (deepLink && NAV.some((n) => n.id === deepLink)) setSection(deepLink)
  }, [deepLink])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [section])

  const go = (id) => setSection(id)

  /* Direct 2-finger trackpad & wheel scroll listener bound directly to the document container */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let touchY = 0

    const handleWheel = (e) => {
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 32
      if (e.deltaMode === 2) dy *= 600

      el.scrollTop += dy
      e.stopPropagation()
    }

    const handleTouchStart = (e) => {
      if (e.touches.length >= 1) {
        touchY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length >= 1) {
        const dy = touchY - e.touches[0].clientY
        touchY = e.touches[0].clientY
        el.scrollTop += dy * 1.5
        e.stopPropagation()
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#fdfdfb] text-black" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
      {/* ------------------------------------------------------- left rail */}
      <div className="w-[172px] shrink-0 overflow-y-auto px-4 py-4">
        <div className="showcase-display text-[26px] leading-[0.95]">
          {profile.name.split(' ')[0]}
          <br />
          {profile.name.split(' ').slice(1).join(' ')}
        </div>
        <div className="showcase-display mt-2 text-[15px]">Showcase &rsquo;26</div>

        <nav className="mt-6 flex flex-col gap-3.5">
          {NAV.map((item) => {
            const active = section === item.id
            return (
              <div key={item.id}>
                <button
                  type="button"
                  data-click-sound
                  onClick={() => go(item.id)}
                  className="flex items-center gap-1.5 text-left text-[12.5px] tracking-[0.03em] underline"
                  style={{ color: LINK, fontFamily: 'inherit' }}
                >
                  {/* The active marker is a hollow bullet OUTSIDE the text, so
                      the labels stay on one baseline grid whether selected or
                      not — a background highlight would break the rail. */}
                  <span className="w-2 text-[9px] no-underline" style={{ opacity: active ? 1 : 0 }}>
                    ○
                  </span>
                  <span>{item.label}</span>
                </button>

                {active && item.children && (
                  <div className="mt-2 flex flex-col gap-2 pl-6">
                    {item.children.map((c) => (
                      <span key={c.id} className="text-[11.5px] tracking-[0.03em] underline" style={{ color: LINK }}>
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* ------------------------------------------------------ right column */}
      <div ref={scrollRef} className="showcase-doc min-w-0 flex-1 select-text overflow-y-auto px-7 py-5">
        {section === 'home' && <Home onGo={go} />}
        {section === 'about' && <About />}
        {section === 'experience' && <Experience />}
        {section === 'projects' && <Projects />}
        {section === 'contact' && <Contact />}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   The resume strip. Appears at the top of every content page except home,
   exactly as the original repeated it — a persistent, unmissable single
   call to action, set apart by rules above and below rather than by a box.
   -------------------------------------------------------------------------- */
function ResumeStrip() {
  return (
    <div className="my-5 border-y border-black/25 py-2.5">
      <div className="flex items-center gap-3">
        <FloppyGlyph />
        <div>
          <div className="showcase-display text-[15px]">Looking for my resume?</div>
          <a
            href="/Adarsh_Sahu_Resume.pdf"
            download
            className="text-[13px] underline"
            style={{ color: LINK }}
          >
            Click here to download it!
          </a>
        </div>
      </div>
    </div>
  )
}

function Home({ onGo }) {
  return (
    <div className="flex h-full flex-col items-center justify-center pb-10 text-center">
      <h1 className="showcase-display text-[46px] leading-none">{profile.name}</h1>
      <p className="showcase-display mt-2 text-[19px]">{profile.role}</p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
        {NAV.filter((n) => n.id !== 'home').map((n) => (
          <button
            key={n.id}
            type="button"
            data-click-sound
            onClick={() => onGo(n.id)}
            className="text-[13px] tracking-[0.06em] underline"
            style={{ color: LINK, fontFamily: 'inherit' }}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function About() {
  return (
    <>
      <h1 className="showcase-display text-[40px] leading-none">Welcome</h1>
      <h2 className="showcase-display mt-1 text-[17px]">I&rsquo;m {profile.name}</h2>

      <p className="mt-4">{profile.positioning}</p>
      <p className="mt-3">
        Thank you for taking the time to look through my portfolio. I hope you enjoy exploring it as
        much as I enjoyed building it. If you have any questions, you can reach me at{' '}
        <a href={`mailto:${profile.email}`} className="underline" style={{ color: LINK }}>
          {profile.email}
        </a>
        .
      </p>

      <ResumeStrip />

      <h3 className="showcase-display text-[19px]">About Me</h3>
      {aboutParagraphs.map((p, i) => (
        <p key={i} className="mt-3">
          {p}
        </p>
      ))}

      <Rule />

      <h3 className="showcase-display text-[19px]">Education</h3>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <span className="showcase-display text-[15px]">{education.institution}</span>
        <span className="shrink-0 text-[12px]">
          {education.startYear} &ndash; {education.endYear}
        </span>
      </div>
      <p className="mt-1 text-[13px] italic">
        {education.degree} &middot; CGPA {education.cgpa}
      </p>
      <p className="mt-2">{education.note}</p>

      <Rule />

      <h3 className="showcase-display text-[19px]">Skills</h3>
      {skillGroups.map((g) => (
        <p key={g.id} className="mt-2.5">
          <span className="showcase-display text-[13px]">{g.label}: </span>
          {g.skills.map((s) => s.name).join(', ')}
        </p>
      ))}
      <p className="mt-2.5">
        <span className="showcase-display text-[13px]">TOOLS: </span>
        {toolbelt.join(', ')}
      </p>
      <p className="mt-2.5">
        <span className="showcase-display text-[13px]">CURRENTLY LEARNING: </span>
        {learningNow.join(', ')}
      </p>
    </>
  )
}

function Experience() {
  return (
    <>
      <ResumeStrip />
      {timeline.map((t, i) => (
        <div key={t.year} className={i > 0 ? 'mt-8' : ''}>
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="showcase-display text-[30px] leading-none">{t.title}</h1>
            <span className="shrink-0 text-[12px]">{t.year}</span>
          </div>
          <h2 className="showcase-display mt-1 text-[15px]">{t.org}</h2>
          <p className="mt-2.5">{t.body}</p>
        </div>
      ))}

      <Rule />

      <h3 className="showcase-display text-[19px]">{education.shortName}</h3>
      <p className="mt-1 text-[13px] italic">
        {education.degree} &middot; {education.startYear}&ndash;{education.endYear} &middot; CGPA{' '}
        {education.cgpa}
      </p>
      <p className="mt-2">{education.note}</p>
    </>
  )
}

function Projects() {
  return (
    <>
      <h1 className="showcase-display text-[40px] leading-none">Projects</h1>
      <h2 className="showcase-display mt-1 text-[15px]">Software</h2>
      <p className="mt-3">
        Below are the projects I am most willing to be judged on. Each one ends in something a
        person can actually run, and each one is evaluated in a way that could have failed.
      </p>

      <ResumeStrip />

      {projects.map((p, i) => (
        <div key={p.id} className={i > 0 ? 'mt-7' : ''}>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="showcase-display text-[24px] leading-none">{p.title}</h3>
            {p.repo && (
              <a
                href={p.repo}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[12px] underline"
                style={{ color: LINK }}
              >
                source
              </a>
            )}
          </div>
          <h4 className="showcase-display mt-1 text-[14px]">
            {p.subtitle} &middot; {p.year}
          </h4>
          <p className="mt-2">{p.description}</p>

          <ul className="mt-2 list-disc pl-5">
            {p.metrics.map((m, idx) => (
              <li key={idx}>
                <span className="showcase-display text-[13px]">{m.value}</span> &mdash; {m.label}
              </li>
            ))}
            <li>Built with {p.tech.join(', ')}.</li>
          </ul>
        </div>
      ))}
    </>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)

  return (
    <>
      <h1 className="showcase-display text-[40px] leading-none">Contact</h1>
      <p className="mt-3">
        {profile.availability}. If you have a question, a role, or just want to talk about any of
        this, the fastest route is email &mdash; but the form below reaches the same inbox.
      </p>
      <p className="mt-3">
        <span className="showcase-display text-[13px]">Email: </span>
        <a href={`mailto:${profile.email}`} className="underline" style={{ color: LINK }}>
          {profile.email}
        </a>
      </p>
      {profile.github && (
        <p className="mt-1.5">
          <span className="showcase-display text-[13px]">GitHub: </span>
          <a href={profile.github} target="_blank" rel="noreferrer" className="underline" style={{ color: LINK }}>
            {profile.github.replace('https://', '')}
          </a>
        </p>
      )}
      <p className="mt-1.5">
        <span className="showcase-display text-[13px]">Based in: </span>
        {profile.location}
      </p>

      <Rule />

      {/* A period form: labels ABOVE their fields, a red asterisk marking the
          required ones, and inputs drawn as sunken wells rather than as
          rounded boxes with a focus ring. */}
      <form
        className="mt-1"
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
        }}
      >
        {[
          { id: 'name', label: 'Your name', required: true },
          { id: 'email', label: 'Email', required: true, type: 'email' },
          { id: 'company', label: 'Company (optional)', required: false },
        ].map((f) => (
          <label key={f.id} className="mb-3 block">
            <span className="showcase-display block text-[13px]">
              {f.required && <span style={{ color: '#c00' }}>* </span>}
              {f.label}
            </span>
            <input
              type={f.type ?? 'text'}
              required={f.required}
              placeholder={f.label}
              className="mt-1 w-full max-w-[420px] bg-white px-1.5 py-1 text-[13px] outline-none"
              style={{
                fontFamily: 'inherit',
                boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #000000',
              }}
            />
          </label>
        ))}

        <label className="mb-3 block">
          <span className="showcase-display block text-[13px]">
            <span style={{ color: '#c00' }}>* </span>Message
          </span>
          <textarea
            required
            rows={4}
            placeholder="Message"
            className="mt-1 w-full max-w-[420px] resize-none bg-white px-1.5 py-1 text-[13px] outline-none"
            style={{
              fontFamily: 'inherit',
              boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #000000',
            }}
          />
        </label>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            data-click-sound
            className="px-3 py-1 text-[12px]"
            style={{
              fontFamily: 'Tahoma, Verdana, sans-serif',
              background: '#c0c0c0',
              boxShadow:
                'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
            }}
          >
            Send Message
          </button>
          <span className="text-[11px] italic">
            {sent ? 'Thanks — I will reply to you directly.' : '* required'}
          </span>
        </div>
      </form>
    </>
  )
}

function Rule() {
  return <hr className="my-5 border-0 border-t border-black/25" />
}

/** A 3.5" diskette, drawn as pixels — the era's universal "save / download". */
function FloppyGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" shapeRendering="crispEdges" className="shrink-0">
      <rect x="2" y="2" width="20" height="20" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="7" y="2" width="10" height="8" fill="#fff" stroke="#000" strokeWidth="1" />
      <rect x="13" y="3" width="3" height="6" fill="#404040" />
      <rect x="6" y="14" width="12" height="8" fill="#fff" stroke="#000" strokeWidth="1" />
      <rect x="8" y="16" width="8" height="1" fill="#808080" />
      <rect x="8" y="18" width="8" height="1" fill="#808080" />
    </svg>
  )
}
