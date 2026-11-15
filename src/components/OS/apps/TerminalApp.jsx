import { useEffect, useRef, useState } from 'react'
import { profile, projects, skillGroups } from '../../../data/portfolio'

/* ==========================================================================
   TerminalApp — the MS-DOS Prompt.

   Three things were wrong with the previous version.

   1. IT BROKE THE WHOLE SCREEN. It called scrollIntoView() after every line
      and auto-focused its input on mount. Both make the browser scroll every
      scrollable ancestor to reveal the element — including the hidden wrapper
      the desktop is projected through, which shoved the entire desktop off
      the monitor. Opening this window blacked the screen out. The log now
      scrolls its own container, and focus is taken with preventScroll.

   2. IT WAS THE WRONG MACHINE. The window is titled "MS-DOS Prompt" on a
      Windows 95 desktop, and it printed a darwin kernel string, a `$` prompt
      and zsh errors in GitHub-dark green. It is now white-on-black with a
      C:\> prompt and DOS's own error text.

   3. IT LISTED PROJECTS THAT DO NOT EXIST. The `projects` command printed six
      hard-coded repo names that appear nowhere else in the portfolio. A
      recruiter comparing that list with the Projects page would reasonably
      conclude one of them was invented. Everything here is now read from the
      same data file the rest of the site uses.
   ========================================================================== */

const PROMPT = 'C:\\ADARSH>'

const HELP = [
  'ABOUT      Who this is, in two lines.',
  'PROJECTS   List the projects on this machine.',
  'SKILLS     Tools and methods, by group.',
  'CONTACT    Email, GitHub and LinkedIn.',
  'DIR        Directory listing.',
  'CLS        Clear the screen.',
  'VER        Version.',
  'HELP       This list.',
].join('\n')

function run(raw) {
  const cmd = raw.trim().toLowerCase()
  if (cmd === '') return ''

  if (cmd === 'help' || cmd === '?') return HELP
  if (cmd === 'ver') return '\nAdarsh 95 [Version 4.00.950]\n'
  if (cmd === 'about' || cmd === 'whoami') return `${profile.name}\n${profile.role}\n\n${profile.positioning}`
  if (cmd === 'projects') {
    return projects
      .map((p, i) => `${String(i + 1).padStart(2, ' ')}. ${p.title}`)
      .concat('', 'Open "My Showcase" on the desktop for the write-ups.')
      .join('\n')
  }
  if (cmd === 'skills') {
    return skillGroups
      .map((g) => {
        const items = (g.items ?? g.skills ?? []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
        return `${(g.title ?? g.label ?? g.id).toUpperCase()}\n  ${items.join(', ')}`
      })
      .join('\n\n')
  }
  if (cmd === 'contact') {
    return [`Email     ${profile.email}`, `GitHub    ${profile.github}`, `LinkedIn  ${profile.linkedin}`].join('\n')
  }
  if (cmd === 'dir' || cmd === 'ls') {
    const rows = projects.map((p) => `${p.id.toUpperCase().slice(0, 24).padEnd(26, ' ')}<DIR>`)
    return [' Volume in drive C is ADARSH', ' Directory of C:\\ADARSH', '', ...rows, 'RESUME   PDF', `        ${rows.length} dir(s)`].join('\n')
  }
  if (cmd.startsWith('sudo') || cmd.startsWith('rm ') || cmd.startsWith('format') || cmd.startsWith('del ')) {
    return 'Access denied.'
  }
  return 'Bad command or file name'
}

export default function TerminalApp() {
  const [history, setHistory] = useState([
    { type: 'output', text: 'Adarsh(R) 95\n   (C)Copyright Adarsh Sahu 2026.\n\nType HELP for a list of commands.\n' },
  ])
  const [input, setInput] = useState('')
  const logRef = useRef(null)
  const inputRef = useRef(null)

  /* Scroll the log's OWN box. scrollIntoView would also scroll every ancestor
     that can scroll, which is what knocked the desktop off the monitor. */
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [history])

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const handleCommand = (e) => {
    if (e.key !== 'Enter') return
    const raw = input
    setInput('')

    if (raw.trim().toLowerCase() === 'cls' || raw.trim().toLowerCase() === 'clear') {
      setHistory([])
      return
    }

    const out = run(raw)
    setHistory((h) => [
      ...h,
      { type: 'input', text: `${PROMPT}${raw}` },
      ...(out ? [{ type: 'output', text: out }] : []),
    ])
  }

  return (
    <div
      ref={logRef}
      onPointerDown={() => inputRef.current?.focus({ preventScroll: true })}
      className="h-full w-full overflow-y-auto bg-black p-3 text-[13px] leading-[1.35] text-[#c0c0c0]"
      style={{ fontFamily: "'Fira Code', 'Courier New', monospace" }}
    >
      {history.map((h, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {h.text}
        </div>
      ))}
      <div className="flex items-center">
        <span className="shrink-0 whitespace-pre">{PROMPT}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          spellCheck={false}
          autoComplete="off"
          aria-label="Command"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          className="min-w-0 flex-1 bg-transparent text-[#c0c0c0] outline-none"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', caretColor: '#c0c0c0' }}
        />
      </div>
    </div>
  )
}
