import { useState } from 'react'
import { Download, ExternalLink, FileText, CheckCircle2 } from 'lucide-react'
import { profile } from '../../../data/portfolio'

const RESUMES = [
  {
    id: 'datascience',
    label: 'Data Science & Applied ML',
    badge: 'Primary',
    filename: 'Adarsh_Sahu_Resume_DataScience.pdf',
    url: '/Adarsh_Sahu_Resume_DataScience.pdf',
    description: 'Applied ML, Dual-Propensity Risk, Selective Prediction, TreeSHAP, PostgreSQL',
  },
  {
    id: 'operations',
    label: 'Operations Research & Analytics',
    badge: 'Operations',
    filename: 'Adarsh_Sahu_Resume_Operations.pdf',
    url: '/Adarsh_Sahu_Resume_Operations.pdf',
    description: 'Operations Research, Mathematical Modeling, MILP Optimization, Inventory Pooling, Bottleneck Elimination',
  },
  {
    id: 'fmcg',
    label: 'FMCG Supply Chain (TCPL)',
    badge: 'FMCG / SCM',
    filename: 'Adarsh_Sahu_Resume_FMCG.pdf',
    url: '/Adarsh_Sahu_Resume_FMCG.pdf',
    description: 'Multi-Echelon SCM, Secondary Milk-Run Routing, Fleet Dispatch & Freight Cost Optimization',
  },
]

export default function ResumeApp() {
  const [activeResume, setActiveResume] = useState(RESUMES[0])

  return (
    <div className="h-full w-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-text relative">
      {/* Top Action Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex flex-col gap-2 z-10 shrink-0 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{activeResume.filename}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {activeResume.badge}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {profile.name} • {activeResume.description}
              </div>
            </div>
          </div>

          {/* Download & Open Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={activeResume.url}
              download={activeResume.filename}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <Download size={13} />
              <span>Download PDF</span>
            </a>
            <a
              href={activeResume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>New Tab</span>
            </a>
          </div>
        </div>

        {/* Resume Category Selector Tabs */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/80 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-1">Version:</span>
          {RESUMES.map((res) => {
            const isActive = activeResume.id === res.id
            return (
              <button
                key={res.id}
                onClick={() => setActiveResume(res)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
                    : 'bg-zinc-950/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>{res.label}</span>
                {res.id === 'datascience' && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Primary</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 w-full bg-zinc-900 overflow-hidden relative flex flex-col">
        {/* PDF Embedded View */}
        <iframe
          key={activeResume.url}
          src={`${activeResume.url}#toolbar=1`}
          title={`Adarsh Sahu - ${activeResume.label}`}
          className="w-full h-full border-0 bg-white"
        />

        {/* Fallback & Quick Download Banner at bottom */}
        <div className="bg-zinc-950/95 border-t border-zinc-800 p-2.5 px-4 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-[11px]">Official Resume • NIT Jamshedpur • {activeResume.label}</span>
          </div>
          <a
            href={activeResume.url}
            download={activeResume.filename}
            className="font-mono text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
          >
            Direct download ({activeResume.filename})
          </a>
        </div>
      </div>
    </div>
  )
}
