import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  profile,
  projects,
  education,
  timeline,
  aboutParagraphs,
  skillGroups,
  toolbelt,
  learningNow,
  competitionsAndLeadership,
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


export default function ShowcaseApp({ deepLink }) {
  const [section, setSection] = useState('home')
  const scrollRef = useRef(null)

  /* A room prop can point straight at a section. Deep-linking to a page that
     is already scrolled halfway down would be disorienting, so the column is
     reset to the top on every change — the same thing following a link did. */
  useEffect(() => {
    if (deepLink && NAV.some((n) => n.id === deepLink)) setSection(deepLink)
  }, [deepLink])

  /* Layout effect, not effect: the reset lands before the new page paints,
     so there is never a frame of the new page at the old page's scroll
     position. scrollTop on the column itself — never scrollIntoView, which
     would also scroll the 3D wrapper and knock the desktop off the glass.
     (Wheel scrolling for this column is handled by DesktopOS, for every
     scrollable box on the screen at once.) */
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [section])

  const go = (id) => setSection(id)

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#fdfdfb] text-black" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
      {/* ------------------------------------------------------- left rail */}
      <div className="w-[172px] shrink-0 overflow-y-auto px-4 py-4">
        <img
          src={profile.avatar || '/avatar.jpg'}
          alt={profile.name}
          className="mb-3 h-14 w-14 rounded-full object-cover border border-black/30 shadow-sm"
        />
        <div className="showcase-display text-[26px] leading-[0.95]">
          {profile.name.split(' ')[0]}
          <br />
          {profile.name.split(' ').slice(1).join(' ')}
        </div>
        <div className="showcase-display mt-2 text-[15px]">Showcase &rsquo;26</div>

        {/* The rail. The page you are on is drawn as plain bold black text
            with a pointer beside it — it stops being a link, because it no
            longer goes anywhere — while every other entry stays a link. The
            difference is legible at a glance even at the screen's reduced
            scale, which the old hollow bullet was not. */}
        <nav aria-label="Showcase" className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = section === item.id
            return (
              <div key={item.id}>
                <button
                  type="button"
                  data-click-sound
                  aria-current={active ? 'page' : undefined}
                  onClick={() => go(item.id)}
                  className="sc-nav flex w-full items-center gap-1 py-[5px] text-left text-[12.5px] tracking-[0.03em]"
                  style={{ fontFamily: 'inherit' }}
                >
                  <span aria-hidden className="w-3 shrink-0 text-[9px] leading-none" style={{ color: '#000080', visibility: active ? 'visible' : 'hidden' }}>
                    &#9658;
                  </span>
                  <span className="sc-nav-label">
                    {item.label}
                  </span>
                </button>

                {active && item.children && (
                  <div className="mb-1 flex flex-col gap-1 pl-4">
                    {item.children.map((c) => (
                      <span key={c.id} className="text-[11.5px] tracking-[0.03em]" style={{ color: '#000' }}>
                        &ndash; {c.label}
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
        {/* Keyed by page, so each change remounts into a short fade-and-rise
            instead of the text swapping in place. */}
        <div key={section} className="sc-page-in">
          {section === 'home' && <Home onGo={go} />}
          {section === 'about' && <About />}
          {section === 'experience' && <Experience />}
          {section === 'projects' && <Projects />}
          {section === 'contact' && <Contact />}
        </div>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FloppyGlyph />
          <div>
            <div className="showcase-display text-[15px]">Looking for my resume?</div>
            <div className="text-[12px] opacity-75">Tailored versions available for download:</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <a
            href="/Adarsh_Sahu_Resume_DataScience.pdf"
            download="Adarsh_Sahu_Resume_DataScience.pdf"
            className="sc-link font-bold text-emerald-800"
            title="Data Science, Machine Learning & Quantitative Modeling"
          >
            Data Science (Primary) &raquo;
          </a>
          <span className="opacity-40">•</span>
          <a
            href="/Adarsh_Sahu_Resume_Operations.pdf"
            download="Adarsh_Sahu_Resume_Operations.pdf"
            className="sc-link text-blue-800"
            title="Operations Research, PPC & SCM Optimization"
          >
            Operations Research &raquo;
          </a>
          <span className="opacity-40">•</span>
          <a
            href="/Adarsh_Sahu_Resume_FMCG.pdf"
            download="Adarsh_Sahu_Resume_FMCG.pdf"
            className="sc-link text-amber-900"
            title="FMCG Supply Chain, Fleet Logistics & Milk-Runs (TCPL)"
          >
            FMCG SCM &raquo;
          </a>
        </div>
      </div>
    </div>
  )
}

/* Which number speaks for each project on the front page. The first metric
   in the data is usually the model score; for some projects the figure a
   non-specialist understands immediately is a different one. */
const HEADLINE_METRIC = { 'collections-intelligence': 3 }

/* ==========================================================================
   Home — the page a recruiter actually reads.

   This used to be a photo, a name, a role line and four links, centred in an
   otherwise empty page. It looked calm, and it told a visitor nothing: to
   learn what this person does they had to guess which link to click, on a
   site they had already spent twenty seconds getting into. Most will not.

   So the front page now answers the three questions in the order they are
   asked — who is this, are they any good, how do I reach them — without a
   single click:

     1. Name, role, and what they are available for.
     2. One paragraph of positioning.
     3. Three numbers, each from a real project, each labelled with what it
        measures and where it came from.
     4. The three strongest projects in a sentence each.
     5. Résumé and contact links.

   It stays a late-nineties homepage: serif body, slab headings, rules instead
   of cards, and every link underlined.
   ========================================================================== */
function Home({ onGo }) {
  const featured = projects.slice(0, 3)

  return (
    <div className="pb-4">
      <div className="flex items-center gap-5">
        <img
          src={profile.avatar || '/avatar.jpg'}
          alt={profile.name}
          className="h-[88px] w-[88px] shrink-0 rounded-full border-2 border-black/30 object-cover"
        />
        <div className="min-w-0">
          <h1 className="showcase-display text-[42px] leading-none">{profile.name}</h1>
          <p className="showcase-display mt-1.5 text-[16px]">{profile.role}</p>
          <p className="mt-1 text-[12.5px] italic">
            {education.degree} &middot; {education.startYear}&ndash;{education.endYear}
            {profile.location ? ` · ${profile.location}` : ''}
          </p>
        </div>
      </div>

      {profile.availability && (
        <p className="mt-4 border-y border-black/25 py-2 text-[13px]">
          <span className="showcase-display text-[12.5px]">NOW: </span>
          {profile.availability}.
        </p>
      )}

      <p className="mt-4">{profile.positioning}</p>

      {/* ---------------------------------------------------- the numbers */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {featured.map((p) => {
          const m = p.metrics[HEADLINE_METRIC[p.id] ?? 0]
          return (
            <button
              key={p.id}
              type="button"
              data-click-sound
              onClick={() => onGo('projects')}
              className="sc-stat border-l-2 border-black pl-3 text-left"
              style={{ fontFamily: 'inherit' }}
            >
              <div className="showcase-display text-[27px] leading-none">{m.value}</div>
              <div className="mt-1 text-[12px] leading-snug">{m.label}</div>
              <div className="sc-link mt-0.5 text-[11.5px]">
                {p.title}
              </div>
            </button>
          )
        })}
      </div>

      <Rule />

      {/* -------------------------------------------------- selected work */}
      <h3 className="showcase-display text-[19px]">Selected work</h3>
      {featured.map((p) => (
        <p key={p.id} className="mt-2.5">
          <span className="showcase-display text-[13.5px]">{p.title}</span>
          <span className="text-[12px] italic"> &mdash; {p.subtitle}. </span>
          {p.summary}
        </p>
      ))}
      <p className="mt-3">
        <button
          type="button"
          data-click-sound
          onClick={() => onGo('projects')}
          className="sc-link text-[13px]"
        >
          See all {projects.length} projects, with how each was evaluated &raquo;
        </button>
      </p>

      <Rule />

      {/* ------------------------------------------------------- get in touch */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
        <a href="/Adarsh_Sahu_Resume_DataScience.pdf" download="Adarsh_Sahu_Resume_DataScience.pdf" className="sc-link showcase-display text-[14px]">
          Download Data Science R&eacute;sum&eacute; (PDF)
        </a>
        <a href={`mailto:${profile.email}`} className="sc-link">
          Email
        </a>
        {profile.linkedin && (
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="sc-link">
            LinkedIn
          </a>
        )}
        {profile.github && (
          <a href={profile.github} target="_blank" rel="noreferrer" className="sc-link">
            GitHub
          </a>
        )}
        <button
          type="button"
          data-click-sound
          onClick={() => onGo('about')}
          className="sc-link"
        >
          More about me
        </button>
      </div>
    </div>
  )
}

function About() {
  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <img
          src={profile.avatar || '/avatar.jpg'}
          alt={profile.name}
          className="h-16 w-16 rounded-full object-cover border-2 border-black/30 shadow-sm shrink-0"
        />
        <div>
          <h1 className="showcase-display text-[36px] leading-none">Welcome</h1>
          <h2 className="showcase-display mt-1 text-[16px]">I&rsquo;m {profile.name}</h2>
        </div>
      </div>

      <p className="mt-4">{profile.positioning}</p>
      <p className="mt-3">
        Thank you for taking the time to look through my portfolio. I hope you enjoy exploring it as
        much as I enjoyed building it. If you have any questions, you can reach me at{' '}
        <a href={`mailto:${profile.email}`} className="sc-link">
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
      {education.coursework && (
        <p className="mt-1.5 text-[12.5px]">
          <span className="showcase-display text-[12.5px]">Coursework: </span>
          {education.coursework}
        </p>
      )}
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
        <div key={`${t.year}-${t.title}`} className={i > 0 ? 'mt-8' : ''}>
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
      {education.coursework && (
        <p className="mt-1.5 text-[12.5px]">
          <span className="showcase-display text-[12.5px]">Coursework: </span>
          {education.coursework}
        </p>
      )}
      <p className="mt-2">{education.note}</p>

      {competitionsAndLeadership && (
        <>
          <Rule />
          <h3 className="showcase-display text-[19px]">Competitions & Leadership</h3>
          <div className="mt-2.5 space-y-2">
            {competitionsAndLeadership.competitions.map((c, idx) => (
              <p key={idx} className="text-[13px]">
                <span className="showcase-display text-[13px]">{c.title}</span> &mdash; {c.detail}
              </p>
            ))}
            {competitionsAndLeadership.leadership.map((l, idx) => (
              <p key={idx} className="text-[13px]">
                <span className="showcase-display text-[13px]">{l.role} ({l.org})</span> &mdash; {l.detail}
              </p>
            ))}
          </div>
        </>
      )}
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
                className="sc-link shrink-0 text-[12px]"
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
        <a href={`mailto:${profile.email}`} className="sc-link">
          {profile.email}
        </a>
      </p>
      {profile.phone && (
        <p className="mt-1.5">
          <span className="showcase-display text-[13px]">Phone: </span>
          <a href={`tel:${profile.phone.replace(/\s+/g, '')}`} className="sc-link">
            {profile.phone}
          </a>
        </p>
      )}
      {profile.linkedin && (
        <p className="mt-1.5">
          <span className="showcase-display text-[13px]">LinkedIn: </span>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="sc-link">
            {profile.linkedin.replace('https://', '')}
          </a>
        </p>
      )}
      {profile.github && (
        <p className="mt-1.5">
          <span className="showcase-display text-[13px]">GitHub: </span>
          <a href={profile.github} target="_blank" rel="noreferrer" className="sc-link">
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
