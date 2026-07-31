import { Download, ExternalLink, FileText, CheckCircle2 } from 'lucide-react'
import { profile } from '../../../data/portfolio'

export default function ResumeApp() {
  return (
    <div className="h-full w-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-text relative">
      {/* Top Action Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Adarsh_Sahu_Resume.pdf</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                Official CV
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {profile.name} • {profile.role}
            </div>
          </div>
        </div>

        {/* Download & Open Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="/Adarsh_Sahu_Resume.pdf"
            download="Adarsh_Sahu_Resume.pdf"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
          >
            <Download size={14} />
            <span>Download Resume</span>
          </a>
          <a
            href="/Adarsh_Sahu_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium rounded-xl transition cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Open Tab</span>
          </a>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 w-full bg-zinc-900 overflow-hidden relative flex flex-col">
        {/* PDF Embedded View */}
        <iframe
          src="/Adarsh_Sahu_Resume.pdf#toolbar=1"
          title="Adarsh Sahu Resume PDF"
          className="w-full h-full border-0 bg-white"
        />

        {/* Fallback & Quick Download Banner at bottom */}
        <div className="bg-zinc-950/90 border-t border-zinc-800 p-3 px-5 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Official Resume of Adarsh Sahu (B.Tech @ NIT Jamshedpur)</span>
          </div>
          <a
            href="/Adarsh_Sahu_Resume.pdf"
            download="Adarsh_Sahu_Resume.pdf"
            className="font-mono text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
          >
            Click here if PDF does not load automatically
          </a>
        </div>
      </div>
    </div>
  )
}
