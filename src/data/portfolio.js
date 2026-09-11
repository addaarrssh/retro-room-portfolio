/* ==========================================================================
   portfolio.js — Single source of truth for all content in Retro Room OS.
   Directly derived from the latest Adarsh Sahu Resume (NIT Jamshedpur).
   ========================================================================== */

export const profile = {
  name: 'Adarsh Sahu',
  handle: 'addaarrssh',
  avatar: '/avatar.jpg',
  role: 'Data Science | Analytics | Applied Machine Learning',
  positioning:
    'Production and Industrial Engineering undergraduate at NIT Jamshedpur applying machine learning, statistics, and operations research to high-impact operational problems — credit risk, transit forecasting, search ranking, and fraud detection — with an emphasis on rigorous evaluation and measurable business return.',
  summary:
    'Production and Industrial Engineering undergraduate at NIT Jamshedpur applying machine learning, statistics, and operations research to high-impact operational problems — credit risk, transit forecasting, search ranking, and fraud detection. Currently interning at OA Helper building campus acquisition channels nationwide.',
  location: 'Jamshedpur, Jharkhand, India',
  phone: '92040 88891',
  email: 'adarshprivate678@gmail.com',
  github: 'https://github.com/addaarrssh',
  linkedin: 'https://linkedin.com/in/addaarrssh',
  twitter: null,
  availability: 'Growth Intern at OA Helper — open to ML & Data Science roles',
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
  { part: 'CPU', label: 'scikit-learn · XGBoost', detail: 'Dual-Propensity Classifiers & Gradient Boosting' },
  { part: 'SSD', label: '23+ Public Repos', detail: 'Model Artifacts, SHAP Explanations & Pipelines' },
  { part: 'PSU', label: 'Python · SQL', detail: 'Core Computational Engine & Production Workflows' },
]

export const education = {
  institution: 'National Institute of Technology Jamshedpur',
  shortName: 'NIT Jamshedpur',
  degree: 'B.Tech, Production and Industrial Engineering',
  startYear: 2024,
  endYear: 2028,
  cgpa: '7.45 / 10',
  location: 'Jamshedpur, Jharkhand',
  coursework: 'Operations Research, Engineering Statistics, Production Management, Engineering Economics',
  note: 'Rigorous quantitative foundation: Operations Research, Engineering Statistics, Production Management, and Engineering Economics feed directly into optimization, loss functions, and credit risk modeling.',
}

export const stats = [
  { label: 'PUBLIC REPOS', value: '23+' },
  { label: 'ROLE', value: 'OA Helper' },
  { label: 'GRADUATES', value: '2028' },
  { label: 'BASED IN', value: 'JH, IN' },
]

/* --------------------------------------------------------------------------
   Skill groups — aligned directly with the updated resume sections
   -------------------------------------------------------------------------- */
export const skillGroups = [
  {
    id: 'languages-tools',
    label: 'LANGUAGES & TOOLS',
    learning: false,
    skills: [
      { name: 'Python', level: 94 },
      { name: 'SQL', level: 86 },
      { name: 'JavaScript / TypeScript', level: 78 },
      { name: 'pandas / NumPy', level: 92 },
      { name: 'scikit-learn', level: 90 },
      { name: 'XGBoost', level: 88 },
      { name: 'PostgreSQL', level: 80 },
      { name: 'FastAPI', level: 75 },
      { name: 'Git', level: 85 },
    ],
  },
  {
    id: 'machine-learning',
    label: 'MACHINE LEARNING & STATISTICS',
    learning: false,
    skills: [
      { name: 'Classification & Dual-Propensity', level: 90 },
      { name: 'Credit Risk Scoring (Gini, KS)', level: 88 },
      { name: 'Learning to Rank (NDCG, MRR)', level: 86 },
      { name: 'Calibration & Abstention Bands', level: 84 },
      { name: 'Data Leakage Audit & Control', level: 92 },
      { name: 'Time-Series Forecasting', level: 78 },
      { name: 'Anomaly Detection', level: 76 },
      { name: 'Hypothesis Testing & Experiment Design', level: 82 },
    ],
  },
  {
    id: 'ai-systems',
    label: 'AI SYSTEMS',
    learning: false,
    skills: [
      { name: 'TreeSHAP Interpretability', level: 88 },
      { name: 'RAG Architectures', level: 84 },
      { name: 'Vector Databases & FAISS', level: 82 },
      { name: 'Embeddings & Chunking', level: 80 },
      { name: 'Prompt Engineering', level: 85 },
    ],
  },
]

export const toolbelt = [
  'Python',
  'SQL',
  'JavaScript',
  'TypeScript',
  'pandas',
  'NumPy',
  'scikit-learn',
  'XGBoost',
  'PostgreSQL',
  'FastAPI',
  'TreeSHAP',
  'SciPy',
  'FAISS',
  'Git',
  'Streamlit',
]

export const learningNow = [
  'PyTorch',
  'Docker',
  'MLflow',
  'Neural Networks & Transformers',
  'Advanced Operations Research',
  'Model Monitoring & Drift Detection',
]

/* Timeline — work experience and milestones directly from resume */
export const timeline = [
  {
    year: 'Jul 2026 – Present',
    title: 'Growth Intern — OA Helper',
    org: 'OA Helper (Remote — Ranchi, Jharkhand)',
    body: 'Building the campus acquisition channel nationwide across student communities, coding clubs and campus representatives to drive platform adoption across engineering colleges. Translating campus feedback into targeting and positioning decisions, working directly with the product team on user-acquisition strategy.',
  },
  {
    year: '2026',
    title: 'Collections Intelligence & Credit Optimization',
    org: 'Applied Credit Risk & Banking Analytics',
    body: 'Engineered a dual-propensity classification framework for 20,000 delinquent borrowers decoupling Willingness to Pay from Ability to Pay. Eliminated 9 leakage variables and simulated a 30% contact-capacity constrained call center, delivering an INR 36.97 Crore net cash recovery uplift.',
  },
  {
    year: '2026',
    title: 'RailCross + PRAHARI + Hackathons',
    org: 'Transit Forecasting & Fraud Detection',
    body: 'Shipped RailCross with unseen crossing-level holdouts (ROC-AUC 0.888) and a calibrated UNKNOWN abstention band. Built PRAHARI dual-engine scam detector for the ET AI Hackathon 2026 scored via leave-one-out cross-validation.',
  },
  {
    year: '2025 – 2026',
    title: 'Search Ranking, RAG & SQL Analytics',
    org: 'Information Retrieval & Systems',
    body: 'Built an XGBoost ranker on MSLR-WEB10K benchmark (NDCG@10 0.5581, MRR 0.8516), FAISS-backed RAG exam assistant, and relational PostgreSQL analytics for Brazil’s Olist marketplace.',
  },
  {
    year: '2024 – 2028',
    title: 'B.Tech, Production & Industrial Engineering',
    org: 'NIT Jamshedpur',
    body: 'Operations Research, Engineering Statistics, Production Management, and Engineering Economics coursework. Optimization and statistical theory feed directly into quantitative machine learning workflows.',
  },
]

export const competitionsAndLeadership = {
  competitions: [
    { title: 'ET AI Hackathon 2026', detail: 'Built PRAHARI digital fraud intelligence platform with dual detection engines.' },
    { title: 'XAVENIR 2026', detail: 'Hallucination detection in AI summaries without pretrained embeddings.' },
    { title: 'MOVES 2026', detail: 'Operations & business simulation competition.' },
  ],
  leadership: [
    { role: 'Core Team Member', org: 'Phocus NIT Jamshedpur', detail: 'Official photography & creative design club.' },
    { role: 'Volunteer', org: 'National Service Scheme (NSS)', detail: 'Community outreach, student development & social initiatives.' },
  ],
}

export const principles = [
  {
    title: 'Evaluation before accuracy',
    body: 'The first question on any project is what a fair test looks like and how the model could fail it. Group holdouts, time-ordered splits, and business loss metrics come before tuning.',
  },
  {
    title: "A model should be able to say 'I don't know'",
    body: 'Abstention bands, stale-input handling, and calibrated uncertainty. A prediction offered with false confidence is worse than none at all.',
  },
  {
    title: 'Measurable business return',
    body: 'Translate statistical metrics (ROC-AUC, KS, NDCG) into tangible economics — recovery uplift, cash flow impact, and constrained capacity decisions.',
  },
  {
    title: 'Claim only what the data supports',
    body: 'Zero data leakage. Audit variables, state synthetic benchmarks clearly, and claim only results that survive rigorous out-of-sample testing.',
  },
]

export const aboutParagraphs = [
  'Production and Industrial Engineering undergraduate at NIT Jamshedpur applying machine learning, statistics, and operations research to high-impact operational problems — credit risk, transit forecasting, search ranking, and fraud detection — with an emphasis on rigorous evaluation and measurable business return.',
  'I work end to end: framing the problem, engineering features, auditing for data leakage, choosing evaluations that can actually fail, and translating model outputs into clear business decisions. Currently interning at OA Helper, I build campus acquisition channels nationwide while working directly with the product team on user-acquisition strategy.',
  'That discipline shows up across all my work: Collections Intelligence decouples Willingness from Ability to Pay across 20,000 delinquent borrowers, delivering an INR 36.97 Crore cash recovery uplift under 30% call capacity constraints. RailCross evaluates on unseen holdout crossings with an UNKNOWN abstention band reaching ~90% accuracy on decided cases. The search ranker is evaluated on NDCG and MRR, and PRAHARI operates with dual client-side engines for zero privacy leakage.',
]

/* --------------------------------------------------------------------------
   Projects — matching the updated resume
   -------------------------------------------------------------------------- */
export const projects = [
  {
    id: 'collections-intelligence',
    title: 'Collections Intelligence',
    subtitle: 'Credit Recovery Optimizer',
    year: 2026,
    accent: '#10b981',
    glyph: '💎',
    summary:
      'Dual-propensity classification framework for 20,000 delinquent borrowers, delivering INR 36.97 Crore net cash recovery uplift under a 30% call capacity constraint.',
    description:
      'Engineered a dual-propensity classification framework for 20,000 delinquent borrowers, decoupling behavioral Willingness to Pay from financial Ability to Pay to optimize call-center targeting and reduce recovery budget waste. Audited and eliminated 9 data-leakage variables; benchmarked models using global banking risk standards: ROC-AUC 0.7226, Gini Coefficient 0.4451, and Kolmogorov-Smirnov (KS) Statistic 34.15%. Applied TreeSHAP to interpret feature mechanics: proved Willingness is governed by promise-to-pay adherence and contact responsiveness, while Ability is governed by salary credit frequency and debt-to-income. Simulated a 30% contact-capacity constrained call center via a 2×2 decision matrix, delivering an INR 36.97 Crore net cash recovery uplift over the 34% random baseline.',
    metrics: [
      { value: '0.7226', label: 'ROC-AUC' },
      { value: '0.4451', label: 'Gini Coeff' },
      { value: '34.15%', label: 'KS Statistic' },
      { value: '₹36.97 Cr', label: 'Recovery Uplift' },
    ],
    tech: ['Python', 'XGBoost', 'TreeSHAP', 'SciPy', 'scikit-learn', 'pandas'],
    repo: null,
    demo: null,
  },
  {
    id: 'railcross',
    title: 'RailCross',
    subtitle: 'Railway Crossing Delay Assistant',
    year: 2026,
    accent: '#3b82f6',
    glyph: '🚦',
    summary:
      'Predicts railway level-crossing state from traffic signals with a calibrated UNKNOWN abstention band lifting accuracy on decided cases to ~90%.',
    description:
      'Predicts railway level-crossing state from traffic and stopped-time signals, on an interactive map. Evaluated on a crossing-level holdout — 3 of 14 crossings withheld entirely from training — so figures describe unseen locations: ROC-AUC 0.888, F1 0.593 against 0.16 for a rule baseline. A calibrated UNKNOWN abstention band lifts accuracy on decided cases to ~90%, declining rather than guessing on stale inputs. Synthetic benchmarks only.',
    metrics: [
      { value: '0.888', label: 'ROC-AUC' },
      { value: '~90%', label: 'Decided Accuracy' },
      { value: '0.593', label: 'F1 Score' },
      { value: 'Holdout', label: 'Crossing-Level' },
    ],
    tech: ['Python', 'scikit-learn', 'TypeScript', 'Next.js', 'React'],
    repo: 'https://github.com/addaarrssh/railcross-ai',
    demo: null,
  },
  {
    id: 'prahari',
    title: 'PRAHARI',
    subtitle: 'Digital Fraud Intelligence Platform',
    year: 2026,
    accent: '#ef4444',
    glyph: '🛡',
    summary:
      'Client-side scam detector with two independent engines: weighted-signal rule engine (10+ fraud families) and character-trigram Naive Bayes classifier.',
    description:
      'Client-side scam detector with two independent engines — a weighted-signal rule engine covering 10+ fraud families in English, Hindi and Hinglish, and a character-trigram Naive Bayes classifier. Scored by leave-one-out cross-validation over a 48-message corpus whose 24 negatives are real bank OTP and KYC texts, with a threshold slider exposing the precision/recall trade-off. ET AI Hackathon 2026.',
    metrics: [
      { value: '10+', label: 'Fraud Families' },
      { value: 'Dual', label: 'Detection Engines' },
      { value: 'LOOCV', label: 'Cross-Validation' },
      { value: 'Client', label: 'Zero Privacy Leakage' },
    ],
    tech: ['JavaScript', 'Naive Bayes', 'Rule Engine', 'NLP', 'ET AI Hackathon'],
    repo: 'https://github.com/addaarrssh/prahari',
    demo: null,
  },
  {
    id: 'search-ranking',
    title: 'Search Ranking Model',
    subtitle: 'Learning to Rank on MSLR-WEB10K',
    year: 2026,
    accent: '#8b5cf6',
    glyph: '🔍',
    summary:
      'XGBoost ranker trained on MSLR-WEB10K (136 features) with BM25, TF-IDF, freshness & popularity signals, evaluated via NDCG@10 & MRR.',
    description:
      'XGBoost ranker trained on the MSLR-WEB10K benchmark (136 features, graded human relevance judgements), with BM25, TF-IDF, freshness and popularity features. Evaluated with NDCG@10 and MRR rather than accuracy, since position and graded relevance — not correctness — define a ranked list: NDCG@10 0.5581, MRR 0.8516.',
    metrics: [
      { value: '0.5581', label: 'NDCG@10' },
      { value: '0.8516', label: 'MRR' },
      { value: '136', label: 'Features' },
      { value: 'MSLR', label: 'Benchmark' },
    ],
    tech: ['Python', 'XGBoost Ranker', 'BM25', 'TF-IDF', 'Information Retrieval'],
    repo: 'https://github.com/addaarrssh/search-ranking-model',
    demo: null,
  },
  {
    id: 'study-buddy',
    title: 'AI Study Buddy',
    subtitle: 'Exam-focused RAG assistant',
    year: 2026,
    accent: '#a78bfa',
    glyph: '❑',
    summary:
      'Answers exam questions from handwritten & typed notes using FAISS vector retrieval & Groq LLM API.',
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
    id: 'olist-sql',
    title: 'Olist E-Commerce Analytics',
    subtitle: 'SQL analytics on Brazilian marketplace',
    year: 2026,
    accent: '#06b6d4',
    glyph: '🛒',
    summary:
      "Modelled Brazil's Olist marketplace with multi-table joins, CTEs, views and window functions in PostgreSQL.",
    description:
      "End-to-end PostgreSQL analysis of Brazil's Olist marketplace across customers, orders, products, sellers, and reviews. Found São Paulo the largest market by GMV and quantified the link between late delivery and review score.",
    metrics: [
      { value: 'PostgreSQL', label: 'Database' },
      { value: 'CTEs', label: 'Window Functions' },
    ],
    tech: ['PostgreSQL', 'Supabase', 'SQL', 'Data Modelling'],
    repo: 'https://github.com/addaarrssh/olist-sql-commerce-analytics',
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
    id: 'm5-forecasting',
    title: 'M5 Walmart Sales Forecasting',
    subtitle: 'Daily demand forecasting on time-ordered splits',
    year: 2026,
    accent: '#f59e0b',
    glyph: '📊',
    summary:
      'Kaggle M5 Forecasting predicting daily Walmart sales with lag, rolling-window, and calendar features, comparing Prophet vs XGBoost.',
    description:
      'Kaggle M5 Forecasting project predicting daily Walmart sales from demand history, calendar events, and prices. Engineers lag/rolling-window/calendar/price features, compares Prophet, XGBoost, and a sequence-style baseline on time-ordered splits, and explicitly guards against time-series leakage.',
    metrics: [
      { value: 'Prophet', label: 'Time-Series' },
      { value: 'XGBoost', label: 'Predictor' },
    ],
    tech: ['Python', 'pandas', 'Prophet', 'XGBoost', 'Time-Series Forecasting'],
    repo: 'https://github.com/addaarrssh/m5-walmart-sales-forecasting',
    demo: null,
  },
]
