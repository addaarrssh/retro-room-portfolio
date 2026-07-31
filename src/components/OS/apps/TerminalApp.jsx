import { useState, useRef, useEffect } from 'react'
import { profile } from '../../../data/portfolio'

const COMMANDS = {
  help: 'Available commands: help, about, projects, contact, clear, matrix, cat, sudo',
  about: `${profile.name} — ${profile.role}\n${profile.positioning}`,
  projects: 'Projects:\n1. demand-forecasting-pipeline\n2. credit-risk-scoring-engine\n3. e-commerce-recommender-system\n4. realtime-anomaly-detection-logistics\n5. ad-click-ctr-prediction-pipeline\n6. customer-churn-early-warning',
  contact: `Email: ${profile.email}\nGitHub: ${profile.github}`,
  'sudo rm -rf /': 'Permission denied: nice try! 😉',
}

export default function TerminalApp() {
  const [history, setHistory] = useState([
    { type: 'output', text: 'AdarshOS v4.2.0 (x86_64-apple-darwin23)' },
    { type: 'output', text: 'Type "help" for a list of commands.\n' },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleCommand = (e) => {
    if (e.key !== 'Enter') return
    const cmd = input.trim().toLowerCase()
    setInput('')

    const newHistory = [...history, { type: 'input', text: `$ ${input}` }]

    if (cmd === 'clear') {
      setHistory([])
      return
    }

    if (cmd === 'matrix') {
      newHistory.push({ type: 'output', text: 'Wake up, Neo...\nThe Matrix has you.\nFollow the white rabbit. 🐇' })
    } else if (COMMANDS[cmd]) {
      newHistory.push({ type: 'output', text: COMMANDS[cmd] })
    } else if (cmd.startsWith('cat')) {
      newHistory.push({ type: 'output', text: `cat: ${cmd.slice(4)}: Permission denied or binary file.` })
    } else if (cmd !== '') {
      newHistory.push({ type: 'output', text: `zsh: command not found: ${cmd}. Type "help" for available commands.` })
    }

    setHistory(newHistory)
  }

  return (
    <div className="h-full w-full bg-[#0d1117] text-[#3fb950] font-mono text-xs p-4 overflow-y-auto flex flex-col">
      {history.map((h, i) => (
        <div key={i} className={`whitespace-pre-wrap ${h.type === 'input' ? 'text-white font-bold' : 'text-[#3fb950]'}`}>
          {h.text}
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[#58a6ff]">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          className="flex-1 bg-transparent text-white outline-none font-mono text-xs"
          autoFocus
        />
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
