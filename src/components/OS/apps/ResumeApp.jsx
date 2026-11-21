import { useState } from 'react'
import { Download, ExternalLink, FileText, CheckCircle2, Eye, FileCode2, ZoomIn, ZoomOut } from 'lucide-react'
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
    description: 'Operations Research, Mathematical Modeling, MILP Optimization, Inventory Pooling',
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
  const [viewMode, setViewMode] = useState('reader') // 'reader' | 'pdf'
  const [textSize, setTextSize] = useState('normal') // 'normal' | 'large'

  return (
    <div className="h-full w-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-text relative">
      {/* Top Action Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex flex-col gap-2 z-10 shrink-0 shadow-md">
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

          {/* Mode Switcher & Download Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Reader vs Raw PDF */}
            <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  viewMode === 'reader'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Crystal-Clear Native Reader View (Optimized for Screen Reading)"
              >
                <Eye size={13} />
                <span>Clear Reader</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pdf')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  viewMode === 'pdf'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Embedded PDF Document"
              >
                <FileCode2 size={13} />
                <span>PDF View</span>
              </button>
            </div>

            {/* Text Zoom for Reader View */}
            {viewMode === 'reader' && (
              <button
                type="button"
                onClick={() => setTextSize((s) => (s === 'normal' ? 'large' : 'normal'))}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-mono rounded-lg transition cursor-pointer"
                title="Toggle Text Size"
              >
                {textSize === 'normal' ? 'Text A+' : 'Text A-'}
              </button>
            )}

            {/* Download & Open Buttons */}
            <a
              href={activeResume.url}
              download={activeResume.filename}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
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

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-zinc-900 overflow-hidden relative flex flex-col">
        {viewMode === 'reader' ? (
          /* CRYSTAL-CLEAR NATIVE READER VIEW: 100% Sharp & Effortless to Read */
          <div className="flex-1 w-full overflow-y-auto px-3 sm:px-6 py-6 bg-zinc-950/90 flex justify-center">
            <div
              className={`w-full max-w-3xl bg-white text-zinc-900 shadow-2xl rounded-sm p-6 sm:p-10 border border-zinc-300 my-auto ${
                textSize === 'large' ? 'text-[15px] leading-relaxed' : 'text-[13.5px] leading-normal'
              }`}
            >
              {/* Header */}
              <div className="text-center border-b border-zinc-300 pb-4 mb-5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-serif">
                  Adarsh Sahu
                </h1>
                <div className="text-xs sm:text-sm font-semibold text-emerald-800 mt-1">
                  Data Science | Applied Machine Learning | Quantitative Modeling
                </div>
                <div className="text-[11.5px] text-zinc-600 mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                  <span>Jamshedpur, India</span>
                  <span>•</span>
                  <a href="mailto:adarshprivate678@gmail.com" className="text-blue-700 hover:underline">
                    adarshprivate678@gmail.com
                  </a>
                  <span>•</span>
                  <span>+91 92040 88891</span>
                  <span>•</span>
                  <a href="https://addaarrssh.me" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                    portfolio
                  </a>
                  <span>•</span>
                  <a href="https://linkedin.com/in/addaarrssh" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                    LinkedIn
                  </a>
                  <span>•</span>
                  <a href="https://github.com/addaarrssh" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                    GitHub
                  </a>
                </div>
              </div>

              {/* Summary */}
              <section className="mb-4">
                <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-400 pb-0.5 mb-1.5">
                  Summary
                </h2>
                <p className="text-zinc-800 text-justify">
                  Undergraduate at NIT Jamshedpur specializing in applied machine learning, probabilistic modeling,
                  and statistical analytics. Proven track record developing dual-propensity classification systems,
                  selective prediction models with calibrated abstention, and credit risk pipelines with strict
                  data-leakage auditing and TreeSHAP explainability. Experienced in formulating constrained
                  optimization frameworks, translating complex statistical outputs into measurable business ROI.
                </p>
              </section>

              {/* Technical Skills */}
              <section className="mb-4">
                <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-400 pb-0.5 mb-1.5">
                  Technical Skills
                </h2>
                <div className="space-y-1 text-zinc-800">
                  <div>
                    <strong className="text-zinc-950">Languages & Core Stack:</strong> Python (NumPy, pandas, SciPy), SQL (PostgreSQL), C++, Git, Bash/Linux
                  </div>
                  <div>
                    <strong className="text-zinc-950">Machine Learning & Modeling:</strong> Supervised/Unsupervised Learning, Gradient Boosted Trees (XGBoost, LightGBM), Classification, Learning-to-Rank (LTR), Time-Series (Prophet, ARIMA), TreeSHAP, Feature Selection, Imbalanced Learning (SMOTE)
                  </div>
                  <div>
                    <strong className="text-zinc-950">Statistical Methods & Evaluation:</strong> A/B Testing, Hypothesis Testing, ROC-AUC, Gini Coefficient, KS Statistic, Precision-Recall, Calibration Curves (Brier Score), Spatial & Temporal Holdout Cross-Validation, Data Leakage Auditing
                  </div>
                  <div>
                    <strong className="text-zinc-950">AI Systems & Engineering:</strong> FastAPI, FAISS (Vector Search), Embeddings, RAG Architectures, Docker, Streamlit, REST API Serving
                  </div>
                  <div>
                    <strong className="text-zinc-950">Analytics & BI Tools:</strong> PostgreSQL (Advanced CTEs, Window Functions), Advanced Excel (Solver, What-If), Tableau, EDA
                  </div>
                </div>
              </section>

              {/* Work Experience */}
              <section className="mb-4">
                <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-400 pb-0.5 mb-1.5">
                  Work Experience
                </h2>
                <div>
                  <div className="flex justify-between items-baseline font-bold text-zinc-950">
                    <span>Data Analytics & Growth Intern</span>
                    <span className="text-xs font-semibold text-zinc-600">Jul 2026 – Present</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-zinc-700 italic mb-1">
                    <span className="font-semibold text-zinc-800">NxtWave</span>
                    <span>Remote</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 text-zinc-800 space-y-0.5">
                    <li>
                      Spearheaded analytics and user acquisition modeling across 50+ campus engineering clusters, tracking onboarding funnels and retention dynamics to guide product growth.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Featured Machine Learning Projects */}
              <section className="mb-4">
                <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-400 pb-0.5 mb-1.5">
                  Featured Machine Learning Projects
                </h2>

                {/* Project 1 */}
                <div className="mb-3">
                  <div className="flex justify-between items-baseline font-bold text-zinc-950">
                    <a
                      href="https://github.com/addaarrssh/collections-intelligence"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-800 hover:underline"
                    >
                      Collections Intelligence — Dual-Propensity Credit Recovery Optimizer
                    </a>
                    <span className="text-xs font-semibold text-zinc-600">Aug 2026</span>
                  </div>
                  <div className="text-xs text-zinc-600 italic mb-1">
                    Python, XGBoost, TreeSHAP, SciPy • Risk Modeling & Optimization
                  </div>
                  <ul className="list-disc list-outside ml-4 text-zinc-800 space-y-0.5">
                    <li>
                      Engineered a dual-propensity classification framework across 20,000 delinquent accounts, decoupling behavioral <strong>Willingness to Pay</strong> from financial <strong>Ability to Pay</strong> to optimize call-center targeting and eliminate recovery budget waste.
                    </li>
                    <li>
                      Audited and eliminated 9 look-ahead data-leakage variables; benchmarked models using global banking risk standards: <strong>ROC-AUC 0.7226</strong>, <strong>Gini Coefficient 0.4451</strong>, and <strong>KS Statistic 34.15%</strong>.
                    </li>
                    <li>
                      Interpreted feature mechanics via <strong>TreeSHAP</strong>: proved Willingness is governed by promise-to-pay adherence and contact responsiveness, while Ability is driven by salary credit frequency and debt-to-income ratio.
                    </li>
                    <li>
                      Formulated a 2×2 decision matrix under a 30% call-center headcount constraint, yielding an estimated <strong>INR 36.97 Crore net cash recovery uplift</strong> over the 34% random allocation baseline.
                    </li>
                  </ul>
                </div>

                {/* Project 2 */}
                <div>
                  <div className="flex justify-between items-baseline font-bold text-zinc-950">
                    <a
                      href="https://github.com/addaarrssh"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-800 hover:underline"
                    >
                      RailCross — Transit Logistics & Uncertainty-Calibrated Predictor
                    </a>
                    <span className="text-xs font-semibold text-zinc-600">Jul 2026</span>
                  </div>
                  <div className="text-xs text-zinc-600 italic mb-1">
                    Python, scikit-learn, TypeScript, Next.js • Spatial ML & Selective Classification
                  </div>
                  <ul className="list-disc list-outside ml-4 text-zinc-800 space-y-0.5">
                    <li>
                      Developed a spatial-temporal classification engine predicting railway level-crossing states and delay queues from traffic flow telemetry and stoppage duration signals, visualized on an interactive Next.js map interface.
                    </li>
                    <li>
                      Enforced generalization by withholding 3 out of 14 crossings entirely as a spatial holdout, outperforming rule baselines with <strong>ROC-AUC 0.888</strong> and <strong>F1 0.593</strong> (vs. 0.16 rule baseline).
                    </li>
                    <li>
                      Implemented an uncertainty-based selective abstention band that lifts prediction precision on accepted cases to ~90%, intentionally declining to predict when sensor signals are stale or ambiguous.
                    </li>
                    <li>
                      Deployed model inference via a serverless microservice on Cloudflare Workers, achieving sub-100ms response times for real-time state classification queries.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Education */}
              <section className="mb-4">
                <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-400 pb-0.5 mb-1.5">
                  Education
                </h2>
                <div>
                  <div className="flex justify-between items-baseline font-bold text-zinc-950">
                    <span>National Institute of Technology Jamshedpur</span>
                    <span className="text-xs font-semibold text-zinc-600">2024 – 2028</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-zinc-700 italic mb-1">
                    <span>Bachelor of Technology (B.Tech) • <strong>CGPA: 7.45</strong></span>
                    <span>Jamshedpur, India</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 text-zinc-800 space-y-0.5">
                    <li>Senior Secondary (Class XII): 88.4% | Secondary (Class X): 90.4% (CBSE Board)</li>
                    <li>Relevant Coursework: Probability & Engineering Statistics, Operations Research, Data Structures & Algorithms (DSA), Optimization Theory, Database Systems (DBMS).</li>
                  </ul>
                </div>
              </section>

              {/* Achievements & Leadership */}
              <section>
                <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-400 pb-0.5 mb-1.5">
                  Achievements & Leadership
                </h2>
                <ul className="list-disc list-outside ml-4 text-zinc-800 space-y-1">
                  <li>
                    <strong>ET AI Hackathon 2026:</strong> Engineered PRAHARI, a client-side fraud detection engine combining character-trigram Naive Bayes with a rule engine; selected among top standout AI projects.
                  </li>
                  <li>
                    <strong>Search Ranking Benchmark:</strong> Trained pairwise XGBoost ranker on MSLR-WEB10K benchmark with 136 features (GitHub), achieving <strong>NDCG@10 0.5581</strong> and <strong>MRR 0.8516</strong>.
                  </li>
                  <li>
                    <strong>National Competitions:</strong> Finalist participant at XAVENIR 2026 (hallucination detection) and MOVES 2026.
                  </li>
                  <li>
                    <strong>Core Team Member, Phocus (NIT Jamshedpur):</strong> Led photography, event media coverage, and technical equipment staging for annual college fests.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        ) : (
          /* EMBEDDED PDF DOCUMENT VIEW */
          <div className="flex-1 w-full bg-zinc-900 overflow-hidden relative flex flex-col">
            <iframe
              key={activeResume.url}
              src={`${activeResume.url}#view=FitH&toolbar=0`}
              title={`Adarsh Sahu - ${activeResume.label}`}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        )}

        {/* Fallback & Quick Download Banner at bottom */}
        <div className="bg-zinc-950 border-t border-zinc-800 py-2 px-4 flex flex-wrap items-center justify-between text-xs text-zinc-400 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-[11px]">Official Resume • NIT Jamshedpur • {activeResume.label}</span>
          </div>
          <div className="flex items-center gap-3">
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
    </div>
  )
}
