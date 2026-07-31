import { useState } from 'react'
import { profile } from '../../../data/portfolio'
import { Mail, Copy, Check, Send, MapPin, Sparkles } from 'lucide-react'

const GithubIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export default function ContactApp() {
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText(profile.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitted(true)
    setTimeout(() => {
      setMessage('')
      setSubmitted(false)
    }, 4000)
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6 text-[13px] leading-relaxed opacity-90 select-text">
      <div className="mb-6">
        <h1 className="text-base font-bold text-current flex items-center gap-2">
          <Mail className="text-emerald-400" size={18} />
          <span>Get In Touch</span>
        </h1>
        <p className="text-xs opacity-60 mt-1">{profile.availability}</p>
      </div>

      {/* Quick Email Copy Box */}
      <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
        <div className="text-xs text-emerald-400 font-semibold uppercase mb-1">Direct Email</div>
        <div className="flex items-center justify-between gap-3 bg-current/[0.05] p-2.5 rounded border border-current/10">
          <span className="text-xs font-mono opacity-90 select-all">{profile.email}</span>
          <button
            onClick={copyEmail}
            className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500 transition"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'COPIED!' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profile.github && (
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded border border-current/10 bg-current/[0.05] p-3 hover:border-emerald-500/40 hover:bg-current/[0.06] transition"
          >
            <GithubIcon className="opacity-90" size={20} />
            <div>
              <div className="text-xs font-bold text-current">GitHub Profile</div>
              <div className="text-[11px] opacity-60">{profile.handle}</div>
            </div>
          </a>
        )}
        {profile.location && (
          <div className="flex items-center gap-3 rounded border border-current/10 bg-current/[0.05] p-3">
            <MapPin className="text-emerald-400" size={20} />
            <div>
              <div className="text-xs font-bold text-current">Location</div>
              <div className="text-[11px] opacity-60">{profile.location}</div>
            </div>
          </div>
        )}
      </div>

      {/* Retro Message Form */}
      <div className="rounded-lg border border-current/10 bg-current/[0.04] p-4">
        <div className="text-xs font-bold opacity-90 mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span>Send Quick Message</span>
        </div>

        {submitted ? (
          <div className="rounded bg-emerald-950/40 border border-emerald-500/40 p-3 text-center text-xs text-emerald-300">
            ✓ Message transmitted! Thank you for reaching out.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message or feedback here..."
                rows={4}
                className="w-full rounded border border-current/15 bg-current/[0.05] p-2.5 text-xs text-current placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full rounded bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
            >
              <Send size={14} />
              <span>SEND TRANSMISSION</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
