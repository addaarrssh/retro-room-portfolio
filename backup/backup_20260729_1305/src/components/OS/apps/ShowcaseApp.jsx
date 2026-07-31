import { profile, projects, stats } from '../../../data/portfolio'
import {
  Code,
  User,
  Mail,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Brain,
  CheckCircle2,
  Globe,
  Download,
  FileText,
} from 'lucide-react'

export default function ShowcaseApp({ onNavigate }) {
  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 p-6 md:p-8 font-sans overflow-y-auto select-text relative">
      {/* Soft Light Ambient Backdrop */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-7">
        {/* ========================================== Hero Header */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-md">
                <img
                  src={profile.avatar || '/avatar.jpg'}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase">
                  Developer Portfolio
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-medium">NIT Jamshedpur</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {profile.name}
              </h1>
              <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                {profile.role}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            <a
              href="/Adarsh_Sahu_Resume.pdf"
              download="Adarsh_Sahu_Resume.pdf"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>Download Resume</span>
            </a>
            <button
              onClick={() => onNavigate?.('contact')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
            >
              <Mail size={14} />
              <span>Contact</span>
            </button>
            <button
              onClick={() => onNavigate?.('portfolio-v3')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Globe size={14} className="text-purple-600" />
              <span>Live Site</span>
            </button>
          </div>
        </div>

        {/* ========================================== Executive Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Applied ML & Data Engineering Focus</span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {profile.positioning}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
            {profile.summary}
          </p>
        </div>

        {/* ========================================== Dedicated Resume Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/90 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Adarsh_Sahu_Resume.pdf</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Official CV
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Download the complete resume for offline viewing or print.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <a
              href="/Adarsh_Sahu_Resume.pdf"
              download="Adarsh_Sahu_Resume.pdf"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </a>
            <button
              onClick={() => onNavigate?.('resume')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              <ExternalLink size={14} className="text-emerald-600" />
              <span>View PDF App</span>
            </button>
          </div>
        </div>

        {/* ========================================== Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition"
            >
              <span className="text-[10px] font-mono text-slate-500 font-bold tracking-wider uppercase">
                {s.label}
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* ========================================== Featured Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code size={18} className="text-indigo-600" />
              <span>Featured Case Studies & ML Models</span>
            </h2>
            <button
              onClick={() => onNavigate?.('projects')}
              className="text-xs font-mono text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>View All 6 Projects</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate?.('projects')}
                className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent Top Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: p.accent }}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <span style={{ color: p.accent }}>{p.glyph}</span>
                      <span>{p.title}</span>
                    </span>
                    {p.metrics?.[0] && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                        {p.metrics[0].label}: {p.metrics[0].value}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition">
                    {p.subtitle}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {p.summary}
                  </p>
                </div>

                {/* Tech Pills */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {p.tech.slice(0, 4).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                  {p.tech.length > 4 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 text-slate-500 font-semibold">
                      +{p.tech.length - 4}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================== Skills & Tools Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Brain size={16} className="text-purple-600" />
            <span>Technical Stack & Core Domain Competencies</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              'Python',
              'Machine Learning',
              'SQL',
              'Scikit-learn',
              'XGBoost',
              'FAISS / Vector Search',
              'RAG Architectures',
              'Time-Series Forecasting',
              'Linear Programming (PuLP)',
              'Streamlit',
              'React & Three.js',
              'FastAPI',
              'n8n Automation',
            ].map((skill, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 font-semibold hover:border-indigo-400 hover:text-indigo-700 transition"
              >
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ========================================== Navigation Hub Footer */}
        <div className="pt-4 pb-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 font-semibold">
            <button
              onClick={() => onNavigate?.('about')}
              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
            >
              <User size={14} className="text-amber-600" />
              <span>Full Bio & Education</span>
            </button>
            <button
              onClick={() => onNavigate?.('projects')}
              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
            >
              <Code size={14} className="text-indigo-600" />
              <span>All Projects</span>
            </button>
            <button
              onClick={() => onNavigate?.('contact')}
              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
            >
              <Mail size={14} className="text-emerald-600" />
              <span>Contact Info</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Adarsh Sahu • Portfolio OS
          </div>
        </div>
      </div>
    </div>
  )
}
