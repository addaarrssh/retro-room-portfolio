/* ==========================================================================
   portfolio.js — every word the CRT displays comes from this file.
   Content is carried over verbatim from portfolio-pro/assets/data.js so the
   two sites never drift apart. Edit here, never inside a component.

   >>> profile.email and profile.linkedin still need confirmation — see below.
   ========================================================================== */

export const profile = {
  name: 'Adarsh Sahu',
  handle: 'addaarrssh',
  role: 'Machine Learning & Data Science',
  positioning:
    'B.Tech student at NIT Jamshedpur building applied machine learning systems — forecasting, ranking, retrieval and anomaly detection — with an emphasis on honest evaluation.',
  summary:
    'I work end to end: framing the problem, engineering the features, choosing an evaluation that can actually fail, and shipping the result as something a person can use. I care more about a model that admits uncertainty than one with a flattering accuracy number.',
  location: 'Jamshedpur, Jharkhand, India',

  // CONFIRM: portfolio-pro ships adarshprivate678@gmail.com while your account
  // email is sahuadarsh678@gmail.com. Whichever you set here is what Contact.app
  // shows and copies to the clipboard.
  email: 'adarshprivate678@gmail.com',

  github: 'https://github.com/addaarrssh',

  // CONFIRM: add your LinkedIn URL and the link appears in Contact.app.
  // Left null it is omitted rather than rendered as a dead link.
  linkedin: null,
  twitter: null,

  availability: 'Open to ML / Data Science internships — 2026',
}

export const education = {
  institution: 'National Institute of Technology, Jamshedpur',
  shortName: 'NIT Jamshedpur',
  degree: 'B.Tech, Production and Industrial Engineering',
  startYear: 2024,
  endYear: 2028,
  cgpa: '7.45 / 10',
  note: 'Machine learning is self-directed alongside the degree — coursework in statistics, optimisation and operations research feeds directly into the modelling work.',
}

export const stats = [
  { label: 'PUBLIC REPOS', value: '23' },
  { label: 'CGPA', value: '7.45' },
  { label: 'GRADUATES', value: '2028' },
  { label: 'BASED IN', value: 'JH, IN' },
]

/* --------------------------------------------------------------------------
   Skill bars. `level` is a self-assessed comfort rating, not a benchmark —
   the About window labels it as such so nothing here reads as a hard metric.
   Groups flagged `learning` render in their own clearly-marked block.
   -------------------------------------------------------------------------- */
export const skillGroups = [
  {
    id: 'languages',
    label: 'LANGUAGES',
    learning: false,
    skills: [
      { name: 'Python', level: 90 },
      { name: 'SQL', level: 78 },
      { name: 'JavaScript', level: 72 },
      { name: 'HTML / CSS', level: 70 },
    ],
  },
  {
    id: 'machine-learning',
    label: 'MACHINE LEARNING',
    learning: false,
    skills: [
      { name: 'Classification', level: 88 },
      { name: 'Regression', level: 85 },
      { name: 'Model Evaluation', level: 86 },
      { name: 'Time-Series Forecasting', level: 74 },
      { name: 'Anomaly Detection', level: 70 },
    ],
  },
  {
    id: 'data-analytics',
    label: 'DATA & ANALYTICS',
    learning: false,
    skills: [
      { name: 'Feature Engineering', level: 84 },
      { name: 'Exploratory Analysis', level: 86 },
      { name: 'Data Visualisation', level: 78 },
      { name: 'Statistical Analysis', level: 75 },
    ],
  },
  {
    id: 'ai-llm',
    label: 'AI & LLM SYSTEMS',
    learning: false,
    skills: [
      { name: 'RAG', level: 80 },
      { name: 'Embeddings / FAISS', level: 76 },
      { name: 'Prompt Engineering', level: 78 },
    ],
  },
]

export const toolbelt = [
  'pandas',
  'NumPy',
  'scikit-learn',
  'XGBoost',
  'Matplotlib',
  'Seaborn',
  'Streamlit',
  'Jupyter',
  'Git',
  'VS Code',
]

export const learningNow = [
  'Neural Networks & Backpropagation',
  'PyTorch',
  'Transformers & Attention',
  'FastAPI',
  'Docker',
  'Model Monitoring',
  'Experiment Tracking',
]

/* Timeline — study and project milestones only. No invented employment. */
export const timeline = [
  {
    year: '2026',
    title: 'RailCross + EnergyShield AI',
    org: 'Self-directed / hackathon',
    body: 'Shipped an abstaining crossing-delay classifier and an LP-based energy supply-shock optimizer, both with working interfaces.',
  },
  {
    year: '2025',
    title: 'Ranking, retrieval and churn',
    org: 'Self-directed',
    body: 'Learning-to-rank on MSLR-WEB10K, a FAISS-backed exam RAG assistant, and a churn model deployed with a tunable decision threshold.',
  },
  {
    year: '2024',
    title: 'B.Tech, Production & Industrial Engineering',
    org: 'NIT Jamshedpur',
    body: 'Started the degree and started Python in the same year. Optimisation and operations research turned out to be the same tools, pointed at physical systems.',
  },
]

export const principles = [
  {
    title: 'Evaluation before accuracy',
    body: 'The first question on any project is what a fair test looks like and how the model could fail it. Held-out groups, time-ordered splits and the right metric come before tuning.',
  },
  {
    title: "A model should be able to say 'I don't know'",
    body: 'Abstention bands, stale-input handling and calibrated uncertainty. A prediction offered with false confidence is worse than none at all.',
  },
  {
    title: 'Ship it as something usable',
    body: 'Most of these projects end in an interface, because a model that only exists in a notebook has not been tested against a real person.',
  },
  {
    title: 'Claim only what the data supports',
    body: 'Where benchmarks are synthetic, the site says so. No inflated numbers and no projects I could not walk through line by line.',
  },
]

export const aboutParagraphs = [
  'I started in first year with Python and no idea what a loss function was. What held my attention was not the modelling itself but the gap between a number on a validation set and a system somebody can rely on — most of my work since has been about closing it.',
  'That shows up in small, deliberate choices. RailCross is evaluated on crossings held out entirely from training, and returns UNKNOWN rather than guessing when observations go stale. The search ranker is scored with NDCG and MRR because accuracy is meaningless on a ranked list. The churn model ships with the decision threshold exposed, because where that cutoff belongs depends on what a false negative costs the business.',
  'I am studying Production and Industrial Engineering at NIT Jamshedpur, which turns out to be a useful place to learn this from. The machine learning is self-directed alongside it, and the honest state of things is on the record: what I have built, and what I am still learning.',
]

/* --------------------------------------------------------------------------
   Projects. `metrics` are quoted from each project's own reported results.
   `accent` drives the thumbnail gradient in Projects.app.
   -------------------------------------------------------------------------- */
export const projects = [
  {
    id: 'railcross',
    title: 'RailCross',
    subtitle: 'Railway crossing delay assistant',
    year: 2026,
    accent: '#22d3ee',
    glyph: '▚',
    summary:
      'Predicts level-crossing state as OPEN, CLOSED or an explicit UNKNOWN, so the model can decline to answer instead of guessing.',
    description:
      'Predicts likely railway-level-crossing delays from traffic and stopped-time signals, shown on an interactive map. A Histogram Gradient Boosting classifier sits behind an abstention band, fed by a synthetic crossing-event simulator with congestion hard negatives. Evaluated on crossings held out entirely from training, so the headline numbers describe unseen locations rather than memorised ones. The public demo runs on synthetic data and makes no live gate-status claim.',
    metrics: [
      { value: '0.888', label: 'ROC-AUC' },
      { value: '0.593', label: 'F1, unseen' },
      { value: '2.2%', label: 'Missed closures' },
      { value: '90s', label: 'Median detect' },
    ],
    tech: ['Python', 'scikit-learn', 'TypeScript', 'React', 'Mapping APIs', 'SQLite / D1'],
    repo: 'https://github.com/addaarrssh/railcross-ai',
    demo: null,
  },
  {
    id: 'energyshield-ai',
    title: 'EnergyShield AI',
    subtitle: 'Energy supply-chain resilience optimizer',
    year: null,
    accent: '#f59e0b',
    glyph: '◈',
    summary:
      'Models a Strait of Hormuz crude shock against Indian refineries and solves for the cheapest recovery plan.',
    description:
      'Hackathon MVP modelling a Strait of Hormuz crude-oil shock affecting Indian refineries. Linear programming optimises alternative crude sourcing and strategic reserve releases, projects downstream fuel-price and inflation effects, and presents a geospatial supply-twin map with a ranked action plan and an evidence ledger behind every recommendation.',
    metrics: [
      { value: 'LP', label: 'PuLP / CBC' },
      { value: 'Geo', label: 'Supply twin' },
    ],
    tech: ['TypeScript', 'React', 'Vite', 'FastAPI', 'Python', 'PuLP / CBC', 'Pydantic'],
    repo: 'https://github.com/addaarrssh/energyshield-ai',
    demo: null,
  },
  {
    id: 'study-buddy',
    title: 'AI Study Buddy',
    subtitle: 'Exam-focused RAG assistant',
    year: null,
    accent: '#a78bfa',
    glyph: '❑',
    summary:
      'Answers exam questions from your own notes, including handwritten ones, with retrieval you can inspect.',
    description:
      'A retrieval-augmented study assistant. PDFs and handwritten notes are parsed, embedded with sentence-transformers and indexed in FAISS; a Groq-hosted model answers strictly from retrieved passages so every answer traces back to the source material.',
    metrics: [
      { value: 'FAISS', label: 'Vector retrieval' },
      { value: 'Vision', label: 'Handwriting OCR' },
    ],
    tech: ['Python', 'Streamlit', 'Groq API', 'RAG', 'FAISS', 'sentence-transformers', 'PyMuPDF'],
    repo: 'https://github.com/addaarrssh/exam-studdybuddy',
    demo: null,
  },
  {
    id: 'search-ranking',
    title: 'Search Ranking Model',
    subtitle: 'Learning to rank on MSLR-WEB10K',
    year: null,
    accent: '#34d399',
    glyph: '≡',
    summary:
      'Gradient-boosted ranker benchmarked against BM25, scored with NDCG and MRR rather than accuracy.',
    description:
      'A learning-to-rank pipeline over the MSLR-WEB10K benchmark. XGBoost ranks candidate documents against a BM25 baseline, evaluated with NDCG@10 and MRR because accuracy carries no meaning on a ranked list. Synthetic-set numbers are reported separately from the real benchmark so the two are never confused.',
    metrics: [
      { value: '0.9898', label: 'NDCG@10 synth' },
      { value: '0.8699', label: 'BM25 baseline' },
      { value: '0.5581', label: 'NDCG@10 MSLR' },
      { value: '0.8516', label: 'MRR, MSLR' },
    ],
    tech: ['Python', 'XGBoost', 'BM25', 'TF-IDF', 'Information Retrieval'],
    repo: 'https://github.com/addaarrssh/search-ranking-model',
    demo: null,
  },
  {
    id: 'cartpulse',
    title: 'CartPulse',
    subtitle: 'AI revenue recovery workflow',
    year: null,
    accent: '#fb7185',
    glyph: '⤳',
    summary:
      'An n8n workflow that recovers abandoned carts, with a gatekeeper agent that can refuse to send.',
    description:
      'An abandoned-cart recovery workflow built in n8n. A gatekeeper step decides whether contacting a customer is appropriate at all before any message is generated, and A/B attribution is wired in from the start so recovered revenue can actually be traced to the intervention.',
    metrics: [
      { value: 'Safety-first', label: 'Gatekeeper agent' },
      { value: 'A/B', label: 'Attribution built in' },
    ],
    tech: ['n8n', 'JavaScript', 'Workflow Automation', 'Decision Logic'],
    repo: 'https://github.com/addaarrssh/cartpulse-n8n',
    demo: null,
  },
  {
    id: 'churn',
    title: 'Customer Churn Prediction',
    subtitle: 'IBM Telco, deployed with a tunable threshold',
    year: null,
    accent: '#60a5fa',
    glyph: '◐',
    summary:
      'Churn classifier shipped as an app where the decision threshold is the user’s to set, not the model’s.',
    description:
      'A churn model on the IBM Telco dataset, deployed as a Streamlit app. The decision threshold is exposed in the interface rather than frozen at 0.5, because where that cutoff belongs depends on what a false negative costs the business — not on what makes the metric look best.',
    metrics: [
      { value: '0.84', label: 'ROC-AUC' },
      { value: '0.80', label: 'Accuracy' },
      { value: '7,032', label: 'Records' },
    ],
    tech: ['Python', 'pandas', 'scikit-learn', 'XGBoost', 'Streamlit'],
    repo: 'https://github.com/addaarrssh/customer-churn-prediction',
    demo: null,
  },
]

/* Music_Player.app tracks. Nothing is streamed or bundled — each track is a
   short procedural loop synthesised live in the browser by audio/MusicEngine.js,
   so there is no third-party audio in this repository. */
export const tracks = [
  {
    id: 'night-shift',
    title: 'Night Shift',
    artist: 'Procedural',
    bpm: 74,
    root: 45, // A2
    progression: [
      [0, 3, 7, 10],
      [-4, 0, 3, 7],
      [-7, -3, 0, 5],
      [-5, -2, 3, 7],
    ],
    lead: [12, 15, 19, 15, 22, 19, 15, 12],
    swing: 0.14,
  },
  {
    id: 'crt-hum',
    title: 'CRT Hum',
    artist: 'Procedural',
    bpm: 66,
    root: 43, // G2
    progression: [
      [0, 7, 12, 16],
      [0, 5, 12, 15],
      [-2, 5, 10, 14],
      [-4, 3, 8, 12],
    ],
    lead: [12, 19, 24, 19, 17, 12, 15, 17],
    swing: 0.1,
  },
  {
    id: 'floppy-dreams',
    title: 'Floppy Dreams',
    artist: 'Procedural',
    bpm: 82,
    root: 48, // C3
    progression: [
      [0, 4, 7, 11],
      [-3, 2, 5, 9],
      [-5, 0, 4, 7],
      [-1, 2, 7, 11],
    ],
    lead: [16, 19, 23, 19, 16, 12, 16, 19],
    swing: 0.18,
  },
  {
    id: 'after-hours-lab',
    title: 'After Hours Lab',
    artist: 'Procedural',
    bpm: 70,
    root: 41, // F2
    progression: [
      [0, 3, 7, 14],
      [5, 8, 12, 17],
      [-2, 3, 7, 12],
      [3, 7, 10, 15],
    ],
    lead: [15, 12, 19, 22, 19, 15, 12, 10],
    swing: 0.12,
  },
]
