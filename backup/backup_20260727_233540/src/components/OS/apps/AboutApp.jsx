import { profile, education, stats, skillGroups, toolbelt, learningNow, principles, aboutParagraphs } from '../../../data/portfolio'
import { User, GraduationCap, Code2, Award, Lightbulb } from 'lucide-react'

export default function AboutApp() {
  return (
    <div className="h-full w-full overflow-y-auto p-6 text-[13px] leading-relaxed opacity-90 select-text">
      {/* Header Bio */}
      <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-lg border border-emerald-500/40">
            AS
          </div>
          <div>
            <h1 className="text-lg font-bold text-current">{profile.name}</h1>
            <p className="text-xs text-emerald-400 font-semibold">{profile.role}</p>
          </div>
        </div>
        <p className="text-xs opacity-90 mt-2">{profile.positioning}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="rounded border border-current/10 bg-current/[0.05] p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{s.value}</div>
            <div className="text-[10px] opacity-60 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bio Paragraphs */}
      <div className="space-y-3 mb-6 text-xs opacity-90 leading-relaxed">
        {aboutParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Education */}
      <div className="mb-6 rounded border border-current/10 bg-current/[0.04] p-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-2">
          <GraduationCap size={16} />
          <span>Education</span>
        </div>
        <div className="text-sm font-semibold text-current">{education.institution}</div>
        <div className="text-xs opacity-60">{education.degree} ({education.startYear} - {education.endYear})</div>
        <div className="mt-2 text-xs text-amber-400 font-medium">CGPA: {education.cgpa}</div>
        <p className="mt-2 text-[11px] opacity-60 italic">{education.note}</p>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-3">
          <Code2 size={16} />
          <span>Skills & Technical Comfort</span>
        </div>
        <div className="grid gap-4">
          {skillGroups.map((group) => (
            <div key={group.id} className="rounded border border-current/10 bg-current/[0.04] p-3">
              <div className="text-xs font-bold opacity-90 mb-2">{group.label}</div>
              <div className="space-y-2">
                {group.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="opacity-90">{skill.name}</span>
                      <span className="text-emerald-400 font-bold">{skill.level}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-current/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engineering Principles */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-3">
          <Lightbulb size={16} />
          <span>Engineering Principles</span>
        </div>
        <div className="grid gap-3">
          {principles.map((p, i) => (
            <div key={i} className="rounded border border-current/10 bg-current/[0.04] p-3">
              <div className="text-xs font-bold text-emerald-300 mb-1">{p.title}</div>
              <div className="text-[11px] opacity-60 leading-relaxed">{p.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
