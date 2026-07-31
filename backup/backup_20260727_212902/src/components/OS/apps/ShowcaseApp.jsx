import { profile } from '../../../data/portfolio'

export default function ShowcaseApp({ onNavigate }) {
  return (
    <div className="h-full w-full bg-white text-black p-8 font-serif flex flex-col justify-between items-center text-center select-text overflow-y-auto">
      <div className="my-auto space-y-6">
        {/* Main Serif Header */}
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 font-serif border-b-2 border-zinc-900 pb-2 inline-block">
          {profile.name}
        </h1>

        {/* Subtitle */}
        <p className="text-lg font-medium text-zinc-700 tracking-wide font-sans uppercase">
          {profile.role}
        </p>

        {/* Positioning Summary */}
        <p className="max-w-md mx-auto text-sm text-zinc-600 font-sans leading-relaxed">
          {profile.positioning}
        </p>

        {/* Navigation Links */}
        <div className="pt-4 flex flex-wrap justify-center gap-6 text-sm font-sans font-bold uppercase tracking-wider text-purple-900">
          <button
            onClick={() => onNavigate?.('about')}
            className="underline hover:text-purple-600 transition"
          >
            ABOUT
          </button>
          <button
            onClick={() => onNavigate?.('projects')}
            className="underline hover:text-purple-600 transition"
          >
            PROJECTS
          </button>
          <button
            onClick={() => onNavigate?.('contact')}
            className="underline hover:text-purple-600 transition"
          >
            CONTACT
          </button>
          <button
            onClick={() => onNavigate?.('music')}
            className="underline hover:text-purple-600 transition"
          >
            MUSIC
          </button>
          <button
            onClick={() => onNavigate?.('arcade')}
            className="underline hover:text-purple-600 transition"
          >
            GAME
          </button>
        </div>
      </div>

      {/* Footer Tagline */}
      <div className="text-[11px] text-zinc-400 font-sans pt-4 border-t border-zinc-200 w-full">
        Copyright © 2026 {profile.name} • Built with Three.js & React
      </div>
    </div>
  )
}
