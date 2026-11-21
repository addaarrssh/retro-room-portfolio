/* ==========================================================================
   portfolio.js — Single source of truth for all content in Retro Room OS.
   Directly derived from the latest Adarsh Sahu Data Science, Operations Research,
   and FMCG Supply Chain Resumes (NIT Jamshedpur).
   ========================================================================== */

export const profile = {
  name: 'Adarsh Sahu',
  handle: 'addaarrssh',
  avatar: '/avatar.jpg',
  role: 'Data Science | Applied Machine Learning | Operations Research',
  positioning:
    'Student at NIT JSR combining applied machine learning, probabilistic risk modeling, statistical analytics, and operations research (OR) — translating statistical algorithms and constrained network optimization into measurable business ROI.',
  summary:
    'Student at NIT JSR specializing in applied machine learning, dual-propensity classification, selective prediction, and operations research. Combining data science with quantitative optimization to optimize credit recovery, transit delays, multi-echelon supply networks, and fleet routing.',
  location: 'Jamshedpur, Jharkhand, India',
  phone: '92040 88891',
  email: 'adarshprivate678@gmail.com',
  github: 'https://github.com/addaarrssh',
  linkedin: 'https://linkedin.com/in/addaarrssh',
  twitter: null,
  availability: 'Open to Data Science, Machine Learning & Quantitative Operations roles',
}

export const disks = [
  { id: 'showcase', label: 'Showcase.app', appId: 'showcase', color: '#6f6d69' },
  { id: 'about', label: 'About.app', appId: 'about', color: '#6f6d69' },
  { id: 'projects', label: 'Projects.app', appId: 'projects', color: '#6f6d69' },
  { id: 'resume', label: 'Resume.pdf', appId: 'resume', color: '#6f6d69' },
  { id: 'contact', label: 'Contact.app', appId: 'contact', color: '#6f6d69' },
  { id: 'music', label: 'Music.app', appId: 'music', color: '#6f6d69' },
  { id: 'arcade', label: 'Arcade.app', appId: 'arcade', color: '#6f6d69' },
]

export const hardware = [
  { part: 'CORE', label: 'Python · SQL · C++', detail: 'Computational Engines & Scalable Workflows' },
  { part: 'ML', label: 'scikit-learn · XGBoost', detail: 'Dual-Propensity Classifiers & Gradient Boosting' },
  { part: 'OPT', label: 'anyLogistix · OR-Tools', detail: 'MILP, CVRPTW & Multi-Echelon Network Solvers' },
  { part: 'DATA', label: 'pandas · NumPy · SciPy', detail: 'Vectorised Analytics, Lag Features & SHAP' },
  { part: 'DB', label: 'PostgreSQL · CTEs', detail: 'Relational Modeling, Window Functions & Logistics EDA' },
]

export const education = {
  institution: 'National Institute of Technology Jamshedpur',
  shortName: 'NIT JSR',
  degree: 'Student at NIT JSR',
  startYear: 2024,
  endYear: 2028,
  cgpa: '7.45',
  location: 'Jamshedpur, Jharkhand',
  coursework:
    'Operations Research, Probability & Engineering Statistics, Supply Chain Management, Optimization Theory, Statistical Quality Control (SQC), Facility Layout, Database Systems (DBMS)',
  note: 'Rigorous quantitative foundation: Operations Research, Probability & Statistics, Supply Chain, and Optimization feed directly into machine learning loss functions, constrained optimization, and network modeling.',
}

export const stats = [
  { label: 'PUBLIC REPOS', value: '23+' },
  { label: 'INTERN', value: 'NxtWave' },
  { label: 'GRADUATES', value: '2028' },
  { label: 'BASED IN', value: 'JH, IN' },
]

/* --------------------------------------------------------------------------
   Skill groups — aligned directly with Data Science, OR, and FMCG resumes
   -------------------------------------------------------------------------- */
export const skillGroups = [
  {
    id: 'machine-learning',
    label: 'MACHINE LEARNING & MODELING',
    learning: false,
    skills: [
      { name: 'Supervised & Unsupervised Learning', level: 92 },
      { name: 'Gradient Boosted Trees (XGBoost, LightGBM)', level: 90 },
      { name: 'Dual-Propensity Classification', level: 92 },
      { name: 'Learning-to-Rank (NDCG, MRR)', level: 86 },
      { name: 'Time-Series Forecasting (Prophet, ARIMA)', level: 84 },
      { name: 'TreeSHAP & Model Interpretability', level: 88 },
      { name: 'Data Leakage Auditing & Control', level: 94 },
      { name: 'Selective Prediction & Abstention Bands', level: 85 },
      { name: 'Credit Risk Scoring (ROC-AUC, Gini, KS)', level: 90 },
    ],
  },
  {
    id: 'operations-research',
    label: 'OPERATIONS RESEARCH & SUPPLY CHAIN',
    learning: false,
    skills: [
      { name: 'Mixed-Integer Linear Programming (MILP)', level: 90 },
      { name: 'Network Design & Facility Location (anyLogistix)', level: 88 },
      { name: 'Vehicle Routing & Milk-Run Optimization (OR-Tools)', level: 88 },
      { name: 'Inventory Replenishment & Safety Stock Pooling', level: 86 },
      { name: 'Capacity Planning & Bottleneck Scheduling', level: 84 },
      { name: 'Cost-to-Serve & Freight Spend Benchmarking', level: 86 },
      { name: 'Commercial Fleet Dispatch & Logistics Operations', level: 88 },
    ],
  },
  {
    id: 'languages-tools',
    label: 'LANGUAGES & ANALYTICS TOOLS',
    learning: false,
    skills: [
      { name: 'Python (NumPy, pandas, SciPy)', level: 95 },
      { name: 'SQL & PostgreSQL (CTEs, Window Functions)', level: 90 },
      { name: 'C++', level: 78 },
      { name: 'Git & Bash / Linux', level: 86 },
      { name: 'FastAPI & REST Serving', level: 80 },
      { name: 'FAISS Vector Search & RAG', level: 82 },
      { name: 'Advanced Excel (Solver, What-If)', level: 88 },
      { name: 'Tableau & EDA', level: 82 },
    ],
  },
]

export const toolbelt = [
  'Python',
  'PostgreSQL',
  'XGBoost',
  'LightGBM',
  'TreeSHAP',
  'pandas',
  'NumPy',
  'SciPy',
  'scikit-learn',
  'anyLogistix',
  'Google OR-Tools',
  'IBM CPLEX',
  'FastAPI',
  'FAISS',
  'Git',
  'Streamlit',
]

export const learningNow = [
  'PyTorch',
  'Deep Reinforcement Learning for Logistics',
  'Docker & Containerized Model Serving',
  'MLflow Model Lifecycle Management',
  'Stochastic Optimization',
  'Causal Inference & Uplift Modeling',
]

/* Timeline — work experience and milestones directly from resumes */
export const timeline = [
  {
    year: 'Jul 2026 – Present',
    title: 'Data Analytics & Growth Intern — NxtWave',
    org: 'NxtWave (Remote — nxtwave.tech)',
    body: 'Spearheaded analytics and user acquisition modeling across 50+ campus engineering clusters, tracking onboarding funnels and retention dynamics to guide product growth.',
  },
  {
    year: 'Jun 2024 – Present',
    title: 'Operations Assistant — Commercial Fleet Operations',
    org: 'Family Business (Commercial Roadways & Freight Fleet)',
    body: 'Hands-on commercial fleet operations for 15+ commercial vehicles across Eastern freight corridors. Assisted in freight rate negotiations, per-ton/per-km costing structures, and dispatch scheduling.',
  },
  {
    year: '2026',
    title: 'Collections Intelligence — Dual-Propensity Credit Recovery',
    org: 'Applied Credit Risk & Quantitative Modeling',
    body: 'Engineered a dual-propensity classification framework for 20,000 delinquent borrowers decoupling Willingness to Pay from Ability to Pay. Eliminated 9 leakage variables and simulated a 30% contact-capacity constrained call center, delivering an INR 36.97 Crore net cash recovery uplift.',
  },
  {
    year: '2026',
    title: 'Multi-Echelon SCM Network & Freight Cost Optimizer',
    org: 'Operations Research & SCM Analytics',
    body: 'Formulated a 3-tier Capacitated Facility Location MILP in anyLogistix/CPLEX across manufacturing plants, candidate mother hubs, and 30 regional distributor clusters in Eastern India. Achieved 98.2% OTIF and 13.8% TLC savings. Modeled CVRPTW milk-runs in OR-Tools cutting transit distance by 61.9% and saving INR 12.5 Lakhs/month.',
  },
  {
    year: '2026',
    title: 'RailCross + PRAHARI + Search Ranking',
    org: 'Spatial ML, Fraud Detection & LTR',
    body: 'Shipped RailCross with unseen crossing-level holdouts (ROC-AUC 0.888) and calibrated UNKNOWN abstention bands. Built PRAHARI dual-engine scam detector for the ET AI Hackathon 2026 and trained pairwise XGBoost ranker on MSLR-WEB10K (NDCG@10 0.5581, MRR 0.8516).',
  },
  {
    year: '2024 – 2028',
    title: 'Student at NIT JSR',
    org: 'NIT Jamshedpur',
    body: 'Operations Research, Probability & Statistics, Supply Chain Management, Optimization Theory, Facility Layout, and Engineering Economics. CGPA: 7.45.',
  },
]

export const competitionsAndLeadership = {
  competitions: [
    { title: 'ET AI Hackathon 2026', detail: 'Built PRAHARI digital fraud intelligence platform combining Naive Bayes with rule engine; top standout project.' },
    { title: 'Search Ranking Benchmark', detail: 'Pairwise XGBoost ranker on MSLR-WEB10K achieving NDCG@10 0.5581 and MRR 0.8516.' },
    { title: 'XAVENIR 2026', detail: 'National finalist in hallucination detection in AI summaries without pretrained embeddings.' },
    { title: 'MOVES 2026', detail: 'Operations & business simulation competition finalist.' },
  ],
  leadership: [
    { role: 'Core Team Member', org: 'Phocus NIT Jamshedpur', detail: 'Led photography, event media coverage, and technical equipment staging for annual college fests.' },
    { role: 'Volunteer', org: 'National Service Scheme (NSS)', detail: 'Community outreach, student development & social initiatives.' },
  ],
}

export const principles = [
  {
    title: 'Evaluation before accuracy',
    body: 'The first question on any project is what a fair test looks like and how the model could fail it. Spatial holdouts, time-ordered splits, and business loss metrics come before tuning.',
  },
  {
    title: "A model should be able to say 'I don't know'",
    body: 'Abstention bands, stale-input handling, and calibrated uncertainty. A prediction offered with false confidence is worse than none at all.',
  },
  {
    title: 'Measurable business return',
    body: 'Translate statistical metrics (ROC-AUC, KS, Gini) and OR formulas (MILP, CVRPTW) into tangible economics — cash recovery uplift, freight savings, and constrained capacity decisions.',
  },
  {
    title: 'Claim only what the data supports',
    body: 'Zero data leakage. Audit variables, state synthetic benchmarks clearly, and claim only results that survive rigorous out-of-sample testing.',
  },
]

export const aboutParagraphs = [
  'Student at NIT JSR specializing in applied machine learning, probabilistic risk modeling, statistical analytics, and operations research (OR) — translating statistical algorithms and constrained network optimization into measurable business ROI.',
  'I work end-to-end: framing mathematical formulations, engineering robust features, auditing for data leakage, designing evaluations that can actually fail, and translating model outputs into clear operational decisions.',
  'That discipline spans both Data Science and Operations Research: Collections Intelligence decouples Willingness from Ability to Pay across 20,000 delinquent borrowers, delivering an INR 36.97 Crore cash recovery uplift under 30% call capacity constraints. In supply chain, I formulated 3-tier Capacitated Facility Location MILP in anyLogistix/CPLEX delivering 98.2% OTIF and 13.8% TLC savings, and secondary milk-run CVRPTW saving INR 12.5L/month.',
]

/* --------------------------------------------------------------------------
   Projects — matching Data Science, Operations Research & FMCG resumes
   -------------------------------------------------------------------------- */
export const projects = [
  {
    id: 'collections-intelligence',
    title: 'Collections Intelligence',
    subtitle: 'Dual-Propensity Credit Recovery Optimizer',
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
    tech: ['Python', 'XGBoost', 'TreeSHAP', 'SciPy', 'scikit-learn', 'pandas', 'Risk Modeling'],
    repo: 'https://github.com/addaarrssh/collections-intelligence',
    demo: 'https://addaarrssh.vercel.app/',
  },
  {
    id: 'fmcg-network-optimizer',
    title: 'Multi-Echelon SCM Network Optimizer',
    subtitle: 'Capacitated Facility Location & Freight Cost Optimizer',
    year: 2026,
    accent: '#f59e0b',
    glyph: '🏭',
    summary:
      'Formulated 3-tier Capacitated Facility Location MILP across manufacturing plants, mother hubs, and 30 distributor clusters in Eastern India, achieving 98.2% OTIF and 13.8% TLC savings.',
    description:
      'Formulated a 3-tier Capacitated Facility Location Mixed-Integer Linear Program (MILP) in anyLogistix and IBM CPLEX across manufacturing plants, candidate mother hubs, and 30 regional distributor clusters in Eastern India. Optimized cost-to-serve trade-offs balancing fixed warehouse operating overhead against tiered linehaul (16-ton FTL) and secondary distributor delivery (3-ton LTL) freight rates. Applied the Square Root Law of Inventory to quantify safety stock pooling across consolidated hubs, shrinking Days of Inventory on Hand (DOH) while achieving 98.2% OTIF and 13.8% Total Logistics Cost (TLC) savings.',
    metrics: [
      { value: '98.2%', label: 'OTIF Delivery' },
      { value: '13.8%', label: 'TLC Savings' },
      { value: '3-Tier', label: 'MILP Model' },
      { value: '30 Clusters', label: 'Network Scope' },
    ],
    tech: ['anyLogistix', 'IBM CPLEX', 'MILP', 'GIS', 'Supply Chain Analytics', 'Python'],
    repo: 'https://github.com/addaarrssh/fmcg-network-optimizer',
    demo: null,
  },
  {
    id: 'fmcg-milkrun-route-optimizer',
    title: 'FMCG Secondary Transportation Optimizer',
    subtitle: 'CVRPTW Secondary Freight & Milk-Run Route Optimizer',
    year: 2026,
    accent: '#06b6d4',
    glyph: '🚚',
    summary:
      'Modeled CVRPTW for secondary dispatch to 30 distributor touchpoints, cutting fleet transit distance by 61.9% and saving INR 12.5 Lakhs/month in freight spend.',
    description:
      'Modeled a Capacitated Vehicle Routing Problem with Time Windows (CVRPTW) for secondary dispatch from regional hubs to 30 distributor touchpoints across urban delivery corridors. Clustered delivery beats and scheduled cyclic multi-stop milk runs, consolidating 30 ad-hoc trips into 7 dedicated routes and boosting truck volumetric cube fill rate from 42% to 82.9%. Synchronized warehouse dock departure windows with distributor unloading SLAs, cutting secondary fleet transit distance by 61.9% and saving INR 12.5 Lakhs/month in freight spend.',
    metrics: [
      { value: '61.9%', label: 'Transit Cut' },
      { value: '82.9%', label: 'Cube Fill Rate' },
      { value: '₹12.5L/mo', label: 'Freight Saved' },
      { value: '7 Routes', label: 'Consolidated' },
    ],
    tech: ['Google OR-Tools', 'anyLogistix', 'Python', 'GIS', 'Logistics Optimization'],
    repo: 'https://github.com/addaarrssh/fmcg-milkrun-route-optimizer',
    demo: null,
  },
  {
    id: 'railcross',
    title: 'RailCross',
    subtitle: 'Transit Logistics & Uncertainty-Calibrated Predictor',
    year: 2026,
    accent: '#3b82f6',
    glyph: '🚦',
    summary:
      'Spatial-temporal classification engine predicting railway level-crossing states and delay queues with a calibrated UNKNOWN abstention band reaching ~90% accuracy.',
    description:
      'Developed a spatial-temporal classification engine predicting railway level-crossing states and delay queues from traffic flow telemetry and stoppage duration signals, visualized on an interactive Next.js map interface. Enforced generalization by withholding 3 out of 14 crossings entirely as a spatial holdout, outperforming rule baselines with ROC-AUC 0.888 and F1 0.593 (vs. 0.16 baseline). Implemented an uncertainty-based selective abstention band that lifts prediction precision on accepted cases to ~90%, intentionally declining to predict when sensor signals are stale or ambiguous.',
    metrics: [
      { value: '0.888', label: 'ROC-AUC' },
      { value: '~90%', label: 'Precision on Accepted' },
      { value: '0.593', label: 'F1 Score' },
      { value: '<100ms', label: 'Inference SLA' },
    ],
    tech: ['Python', 'scikit-learn', 'TypeScript', 'Next.js', 'Cloudflare Workers', 'Spatial ML'],
    repo: 'https://github.com/addaarrssh/railcross-ai',
    demo: 'https://railcross-ai.adarshprivate678.workers.dev',
  },
  {
    id: 'm5-forecasting',
    title: 'Hierarchical Demand Forecasting',
    subtitle: 'M5 Retail Demand & Inventory Optimization',
    year: 2026,
    accent: '#eab308',
    glyph: '📊',
    summary:
      'Modeled item-level daily retail demand across multi-tier hierarchies using Prophet vs XGBoost with sequential lag and rolling features to minimize stockouts.',
    description:
      'Modeled item-level daily product demand across multi-tier retail hierarchies using multi-year sales, calendar promotions, and price elasticity to minimize stockouts and inventory holding costs. Engineered a sequential feature pipeline with lag variables (shift(1)), rolling-window statistics (7d/28d moving averages), and event flags for seasonal promotional surges. Benchmarked statistical time-series (Prophet) against gradient-boosted trees (XGBoost), evaluating multi-horizon performance via MAE/RMSE to optimize replenishment and distribution scheduling.',
    metrics: [
      { value: 'XGBoost', label: 'GBDT Model' },
      { value: 'Prophet', label: 'Time-Series' },
      { value: 'Multi-Tier', label: 'Hierarchy' },
      { value: 'MAE/RMSE', label: 'Loss Metrics' },
    ],
    tech: ['Python', 'pandas', 'Prophet', 'XGBoost', 'Time-Series Forecasting', 'Inventory Optimization'],
    repo: 'https://github.com/addaarrssh/m5-walmart-sales-forecasting',
    demo: null,
  },
  {
    id: 'search-ranking',
    title: 'Search Ranking Benchmark',
    subtitle: 'Pairwise XGBoost Ranker on MSLR-WEB10K',
    year: 2026,
    accent: '#8b5cf6',
    glyph: '🔍',
    summary:
      'Trained pairwise XGBoost ranker on MSLR-WEB10K benchmark with 136 features, achieving NDCG@10 0.5581 and MRR 0.8516.',
    description:
      'Trained a pairwise XGBoost ranking model on the MSLR-WEB10K benchmark comprising 136 features and graded human relevance judgements, incorporating BM25, TF-IDF, freshness, and query-document popularity signals. Evaluated with NDCG@10 (0.5581) and Mean Reciprocal Rank (MRR 0.8516), directly addressing ranking quality over naive classification accuracy.',
    metrics: [
      { value: '0.5581', label: 'NDCG@10' },
      { value: '0.8516', label: 'MRR' },
      { value: '136', label: 'Features' },
      { value: 'MSLR', label: 'Benchmark' },
    ],
    tech: ['Python', 'XGBoost', 'Learning to Rank', 'BM25', 'TF-IDF', 'Information Retrieval'],
    repo: 'https://github.com/addaarrssh/search-ranking-model',
    demo: null,
  },
  {
    id: 'olist-sql',
    title: 'Logistics & Supply Chain Operations Analytics',
    subtitle: 'PostgreSQL Advanced Analytics on 100k+ Orders',
    year: 2026,
    accent: '#14b8a6',
    glyph: '🛒',
    summary:
      'Analyzed 100k+ multi-partner order records using advanced SQL CTEs and window functions to model order-to-delivery lead times and seller SLA compliance.',
    description:
      'Analyzed 100k+ multi-partner order records to uncover supply chain bottlenecks, delivery lead-time variations, and logistics cost drivers across diverse regional fulfillment centers. Constructed complex analytical queries using window functions and CTEs to model order-to-delivery lead times, freight-to-GMV ratios, and seller SLA compliance. Segmented delivery delays and carrier transit times to pinpoint root-causes for regional distribution hub allocation.',
    metrics: [
      { value: '100k+', label: 'Orders Analyzed' },
      { value: 'CTEs', label: 'Window Functions' },
      { value: 'PostgreSQL', label: 'Relational DB' },
      { value: 'SLA Audit', label: 'Logistics Analytics' },
    ],
    tech: ['PostgreSQL', 'SQL', 'Window Functions', 'CTEs', 'Supply Chain Analytics'],
    repo: 'https://github.com/addaarrssh/olist-sql-commerce-analytics',
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
      'Client-side scam detection engine combining character-trigram Naive Bayes with a weighted rule engine; selected among top standout projects at ET AI Hackathon 2026.',
    description:
      'Engineered PRAHARI for the ET AI Hackathon 2026: a client-side digital fraud detection engine combining character-trigram Naive Bayes with a weighted-signal rule engine covering 10+ fraud families in English, Hindi, and Hinglish. Evaluated using leave-one-out cross-validation (LOOCV) over authentic bank communication benchmarks with zero client data leakage.',
    metrics: [
      { value: '10+', label: 'Fraud Families' },
      { value: 'Dual Engine', label: 'Bayes + Rules' },
      { value: 'LOOCV', label: 'Validation' },
      { value: 'Top Project', label: 'ET AI Hackathon' },
    ],
    tech: ['JavaScript', 'Naive Bayes', 'NLP', 'ET AI Hackathon 2026'],
    repo: 'https://github.com/addaarrssh/prahari',
    demo: 'https://addaarrssh.github.io/prahari/',
  },
]
