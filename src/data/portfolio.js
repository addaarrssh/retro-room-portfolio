/* ==========================================================================
   portfolio.js — every word the CRT displays comes from this file.
   Content is carried over verbatim from portfolio-pro/assets/data.js so the
   two sites never drift apart. Edit here, never inside a component.

   >>> profile.email and profile.linkedin still need confirmation — see below.
   ========================================================================== */

export const profile = {
  name: 'Adarsh Sahu',
  handle: 'addaarrssh',
  avatar: '/avatar.jpg',
  role: 'Machine Learning & Data Science',
  positioning:
    'Production and Industrial Engineering undergraduate at NIT Jamshedpur applying machine learning and statistics to operations problems — forecasting, ranking and fraud detection — with an emphasis on designing an evaluation that can actually fail.',
  summary:
    'I work end to end: framing the problem, engineering the features, choosing an evaluation that can actually fail, and shipping the result as something a person can use. Currently interning at OA Helper building campus growth channels nationwide.',
  location: 'Jamshedpur, Jharkhand, India',

  // CONFIRM: portfolio-pro ships adarshprivate678@gmail.com while your account
  // email is sahuadarsh678@gmail.com. Whichever you set here is what Contact.app
  // shows and copies to the clipboard.
  email: 'adarshprivate678@gmail.com',

  github: 'https://github.com/addaarrssh',

  // CONFIRM: add your LinkedIn URL and the link appears in Contact.app.
  // Left null it is omitted rather than rendered as a dead link.
  linkedin: 'https://linkedin.com/in/addaarrssh',
  twitter: null,

  availability: 'Growth Intern at OA Helper — open to ML / Data Science roles',
}

export const disks = [
  { id: 'showcase', label: 'Showcase.app', appId: 'showcase', color: '#6f6d69' },
  { id: 'about', label: 'About.app', appId: 'about', color: '#6f6d69' },
  { id: 'projects', label: 'Projects.app', appId: 'projects', color: '#6f6d69' },
  { id: 'contact', label: 'Contact.app', appId: 'contact', color: '#6f6d69' },
  { id: 'music', label: 'Music.app', appId: 'music', color: '#6f6d69' },
  { id: 'arcade', label: 'Arcade.app', appId: 'arcade', color: '#6f6d69' },
  { id: 'resume', label: 'Resume.pdf', appId: 'resume', color: '#6f6d69' },
]

export const hardware = [
  { part: 'GPU', label: 'PyTorch · CUDA', detail: 'Deep Learning & Neural Network Training' },
  { part: 'RAM', label: 'pandas · NumPy', detail: 'Data Manipulation & Vectorised Operations' },
  { part: 'CPU', label: 'scikit-learn · XGBoost', detail: 'Classical Machine Learning & Gradient Boosting' },
  { part: 'SSD', label: '23 Public Repos', detail: 'Model Weight Storage & Pipeline Artifacts' },
  { part: 'PSU', label: 'Python · SQL', detail: 'Core Computational Power & Data Extraction' },
]

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
      { name: 'JavaScript / TypeScript', level: 72 },
      { name: 'PostgreSQL', level: 70 },
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
      { name: 'Learning to Rank', level: 78 },
      { name: 'Time-Series Forecasting', level: 74 },
      { name: 'Calibration & Abstention', level: 72 },
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
  'PostgreSQL',
  'FastAPI',
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
  'MLflow',
  'Experiment Tracking',
  'Experiment Design',
]

/* Timeline — study and project milestones only. No invented employment. */
export const timeline = [
  {
    year: '2026',
    title: 'Growth Intern — OA Helper',
    org: 'OA Helper (Remote)',
    body: 'Building the campus acquisition channel nationwide — student communities, coding clubs and campus representatives — working directly with the product team on user-acquisition strategy.',
  },
  {
    year: '2026',
    title: 'RailCross + PRAHARI + Competitions',
    org: 'Self-directed / hackathon',
    body: 'Shipped an abstaining crossing-delay classifier, a client-side fraud detection platform for the ET AI Hackathon, and competed in XAVENIR 2026 hallucination detection and MOVES 2026.',
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
  'I started in first year with Python and no idea what a loss function was. What held my attention was not the modelling itself but the gap between a number on a validation set and a system somebody can rely on — most of my work since has been about closing it. Now interning at OA Helper, I am also learning how growth and user-acquisition work from the product side.',
  'That shows up in small, deliberate choices. RailCross is evaluated on crossings held out entirely from training, and returns UNKNOWN rather than guessing when observations go stale. The search ranker is scored with NDCG and MRR because accuracy is meaningless on a ranked list. The churn model ships with the decision threshold exposed, because where that cutoff belongs depends on what a false negative costs the business.',
  'I am studying Production and Industrial Engineering at NIT Jamshedpur, which turns out to be a useful place to learn this from. The machine learning is self-directed alongside it, and the honest state of things is on the record: what I have built, and what I am still learning.',
]

/* --------------------------------------------------------------------------
   Projects. `metrics` are quoted from each project's own reported results.
   `accent` drives the thumbnail gradient in Projects.app.
   -------------------------------------------------------------------------- */
export const projects = [
  {
    id: 'study-buddy',
    title: 'AI Study Buddy',
    subtitle: 'Exam-focused RAG assistant',
    year: 2026,
    accent: '#a78bfa',
    glyph: '❑',
    summary:
      'Answers exam questions from your handwritten & typed notes using FAISS vector retrieval & Groq LLM API.',
    description:
      'Built an exam-focused RAG application that converts handwritten and typed PDF notes into a searchable knowledge base. Implemented document parsing, chunking, embedding generation, FAISS vector search, and retrieval-grounded response generation. Added previous-year-question analysis for targeted summaries and revision notes.',
    metrics: [
      { value: 'FAISS', label: 'Vector retrieval' },
      { value: 'Groq', label: 'LLM API' },
    ],
    tech: ['Python', 'Streamlit', 'Groq API', 'RAG', 'FAISS', 'sentence-transformers', 'PyMuPDF'],
    repo: 'https://github.com/addaarrssh/exam-studdybuddy',
    demo: null,
  },
  {
    id: 'prahari',
    title: 'PRAHARI',
    subtitle: 'Digital Fraud Intelligence Platform',
    year: 2026,
    accent: '#ef4444',
    glyph: '🛡',
    summary: 'Client-side scam detector with a weighted-signal rule engine covering 10+ fraud families and a character-trigram Naive Bayes classifier.',
    description: 'Built a client-side scam detection platform with two independent engines — a weighted-signal rule engine covering 10+ fraud families in English, Hindi and Hinglish, and a character-trigram Naive Bayes classifier. Scored by leave-one-out cross-validation over a 48-message corpus. ET AI Hackathon 2026.',
    metrics: [{ value: 'Naive Bayes', label: 'Classifier' }, { value: '10+', label: 'Fraud families' }],
    tech: ['JavaScript', 'Naive Bayes', 'Rule Engine', 'NLP'],
    repo: 'https://github.com/addaarrssh/prahari',
    demo: null,
  },
  {
    id: 'olist-sql',
    title: 'Olist E-Commerce Analytics',
    subtitle: 'SQL analytics on Brazilian marketplace',
    year: 2026,
    accent: '#8b5cf6',
    glyph: '🛒',
    summary: 'Modelled Brazil\'s Olist marketplace with multi-table joins, CTEs, views and window functions in PostgreSQL.',
    description: 'End-to-end PostgreSQL analysis of Brazil\'s Olist marketplace across customers, orders, products, sellers, and reviews. Found São Paulo the largest market by GMV and quantified the link between late delivery and review score.',
    metrics: [{ value: 'PostgreSQL', label: 'Database' }, { value: 'CTEs', label: 'Window Functions' }],
    tech: ['PostgreSQL', 'Supabase', 'SQL', 'Data Modelling'],
    repo: 'https://github.com/addaarrssh/olist-sql-commerce-analytics',
    demo: null,
  },
  {
    id: 'ipl-winner-prediction',
    title: 'IPL 2026 Winner Prediction',
    subtitle: 'Cricket forecasting & simulation system',
    year: 2026,
    accent: '#f59e0b',
    glyph: '🏏',
    summary:
      'XGBoost forecasting engine estimating match and season win probabilities from historical IPL data & trends.',
    description:
      'Developed a cricket forecasting system using XGBoost to estimate team win probabilities from historical IPL match data, current season trends, and simulation-based projections. Engineered match-level features including recent form, venue advantage, head-to-head record, and team balance. Deployed an interactive Streamlit dashboard.',
    metrics: [
      { value: 'XGBoost', label: 'Predictor' },
      { value: 'Live', label: 'Simulations' },
    ],
    tech: ['Python', 'pandas', 'scikit-learn', 'XGBoost', 'Streamlit', 'Web Scraping'],
    repo: 'https://github.com/addaarrssh/ipl-2026-prediction',
    demo: null,
  },
  {
    id: 'churn-prediction',
    title: 'Customer Churn Prediction',
    subtitle: 'IBM Telco classifier & pipeline',
    year: 2026,
    accent: '#60a5fa',
    glyph: '◐',
    summary:
      'End-to-end churn classifier on 7,032 records with reusable ColumnTransformers and 0.84 ROC-AUC.',
    description:
      'Built an end-to-end churn prediction system on the IBM Telco Customer Churn dataset, covering data cleaning, EDA, preprocessing, model training, and deployment on 7,032 customer records. Created reusable preprocessing workflows using Pipeline and ColumnTransformer with scaling and one-hot encoding. Achieved 80% accuracy and 0.84 ROC-AUC on Streamlit.',
    metrics: [
      { value: '0.84', label: 'ROC-AUC' },
      { value: '80%', label: 'Accuracy' },
    ],
    tech: ['Python', 'pandas', 'NumPy', 'scikit-learn', 'Streamlit', 'Seaborn', 'XGBoost'],
    repo: 'https://github.com/addaarrssh/customer-churn-prediction',
    demo: null,
  },
  {
    id: 'stock-anomaly-detector',
    title: 'Stock Anomaly Detector',
    subtitle: 'Market monitoring with Isolation Forest',
    year: 2026,
    accent: '#34d399',
    glyph: '📈',
    summary:
      'Detects unusual trading volume and price spikes in NSE-listed stocks using unsupervised Isolation Forests.',
    description:
      'Developed a market monitoring app using Isolation Forest to detect unusual price and volume behavior in NSE-listed stocks from multi-year OHLCV data. Engineered anomaly features such as daily return, intraday range, and volume ratio without requiring labeled event data. Visualized in an interactive Streamlit dashboard.',
    metrics: [
      { value: 'Isolation Forest', label: 'ML Model' },
      { value: 'NSE', label: 'OHLCV Data' },
    ],
    tech: ['Python', 'pandas', 'scikit-learn', 'yfinance', 'Streamlit', 'Matplotlib'],
    repo: 'https://github.com/addaarrssh/stock-anomaly-detector',
    demo: null,
  },
]
