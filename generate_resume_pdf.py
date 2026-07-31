import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def build_pdf(filename):
    # Set up document with 0.5 inch margins
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    name_style = ParagraphStyle(
        'Name',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0F172A')
    )

    contact_style = ParagraphStyle(
        'Contact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#334155')
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=8,
        spaceAfter=3,
        textTransform='uppercase'
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.2,
        leading=12.5,
        textColor=colors.HexColor('#1E293B'),
        alignment=TA_JUSTIFY
    )

    project_title_style = ParagraphStyle(
        'ProjectTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#0F172A')
    )

    project_tech_style = ParagraphStyle(
        'ProjectTech',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569')
    )

    project_date_style = ParagraphStyle(
        'ProjectDate',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0F172A')
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2
    )

    skill_label_style = ParagraphStyle(
        'SkillLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#0F172A')
    )

    skill_text_style = ParagraphStyle(
        'SkillText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Header
    story.append(Paragraph("Adarsh Sahu", name_style))
    story.append(Spacer(1, 3))
    
    contact_text = (
        "Jamshedpur, Jharkhand &nbsp;|&nbsp; 92040-88891 &nbsp;|&nbsp; "
        '<a href="mailto:adarshprivate678@gmail.com" color="#0284C7"><u>adarshprivate678@gmail.com</u></a> &nbsp;|&nbsp; '
        '<a href="https://github.com/addaarrssh" color="#0284C7"><u>github.com/addaarrssh</u></a>'
    )
    story.append(Paragraph(contact_text, contact_style))
    story.append(Spacer(1, 6))

    # Section Helper
    def add_section(title):
        story.append(Paragraph(title, section_heading))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#0F172A'), spaceBefore=1, spaceAfter=5))

    # 1. Summary
    add_section("SUMMARY")
    summary_p = (
        "Undergraduate student at NIT Jamshedpur with hands-on experience in machine learning, analytics, anomaly detection, "
        "forecasting, and RAG-based AI applications. Built end-to-end projects using Python, SQL, pandas, scikit-learn, Streamlit, "
        "FAISS, and LLM APIs, with a focus on practical, data-driven applications and interactive deployment."
    )
    story.append(Paragraph(summary_p, body_style))
    story.append(Spacer(1, 4))

    # 2. Education
    add_section("EDUCATION")
    edu_left = Paragraph("<b>National Institute of Technology Jamshedpur</b><br/><font color='#475569'>B.Tech in Production and Industrial Engineering &nbsp;|&nbsp; <b>CGPA: 7.45/10</b></font>", body_style)
    edu_right = Paragraph("<b>Jamshedpur, Jharkhand</b><br/><b>2024 &ndash; 2028</b>", project_date_style)
    
    t_edu = Table([[edu_left, edu_right]], colWidths=[380, 160])
    t_edu.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_edu)
    story.append(Spacer(1, 4))

    # 3. Projects
    add_section("PROJECTS")

    projects_data = [
        {
            "title": "AI Study Buddy",
            "tech": "Python, Streamlit, Groq API, RAG, FAISS, sentence-transformers, PyMuPDF",
            "date": "2026",
            "bullets": [
                "Built an exam-focused RAG application that converts handwritten and typed PDF notes into a searchable knowledge base for question answering and structured revision support.",
                "Implemented an end-to-end pipeline with document parsing, chunking, embedding generation, FAISS vector search, and retrieval-grounded response generation over uploaded study material.",
                "Added previous-year-question analysis to identify recurring topics and generate targeted summaries, important questions, and last-minute revision content for faster exam preparation."
            ]
        },
        {
            "title": "IPL 2026 Winner Prediction",
            "tech": "Python, pandas, scikit-learn, XGBoost, Streamlit, Web Scraping",
            "date": "2026",
            "bullets": [
                "Developed a cricket forecasting system using XGBoost to estimate team win probabilities from historical IPL match data, current season trends, and simulation-based projections.",
                "Engineered match-level features including recent form, venue advantage, head-to-head record, and team balance from historical and live-updated cricket datasets.",
                "Built a Streamlit dashboard to display predictions, team comparisons, points-table context, and season-outcome insights in an interactive format."
            ]
        },
        {
            "title": "Customer Churn Prediction",
            "tech": "Python, pandas, NumPy, scikit-learn, Streamlit, Seaborn",
            "date": "2026",
            "bullets": [
                "Built an end-to-end churn prediction system on the IBM Telco Customer Churn dataset, covering data cleaning, EDA, preprocessing, model training, and deployment on 7,032 customer records.",
                "Created reusable preprocessing workflows using <code>Pipeline</code> and <code>ColumnTransformer</code> with scaling, one-hot encoding, and feature preparation for robust training.",
                "Compared Logistic Regression and XGBoost, selected the stronger model based on accuracy and ROC-AUC, and deployed a Streamlit app achieving about 80% accuracy and 0.84 ROC-AUC."
            ]
        },
        {
            "title": "Stock Anomaly Detector",
            "tech": "Python, pandas, scikit-learn, yfinance, Streamlit, Matplotlib",
            "date": "2026",
            "bullets": [
                "Developed a market monitoring app using Isolation Forest to detect unusual price and volume behavior in NSE-listed stocks from multi-year OHLCV data.",
                "Engineered anomaly features such as daily return, intraday range, and volume ratio to identify abnormal market activity without labeled event data.",
                "Built an interactive Streamlit dashboard to visualize anomalous trading periods and support event-based investigation of unusual stock movements."
            ]
        }
    ]

    for p in projects_data:
        p_left = Paragraph(f"<b>{p['title']}</b> &nbsp;|&nbsp; <i><font color='#475569'>{p['tech']}</font></i>", project_title_style)
        p_right = Paragraph(f"<b>{p['date']}</b>", project_date_style)
        
        t_proj = Table([[p_left, p_right]], colWidths=[450, 90])
        t_proj.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(t_proj)
        story.append(Spacer(1, 2))

        for b in p['bullets']:
            story.append(Paragraph(f"&bull; {b}", bullet_style))
        story.append(Spacer(1, 3))

    # 4. Technical Skills
    add_section("TECHNICAL SKILLS")

    skills_list = [
        ("Languages", "Python, SQL, JavaScript, HTML/CSS"),
        ("Data Analytics", "EDA, data cleaning, feature engineering, data visualization, statistical analysis, forecasting"),
        ("Machine Learning", "regression, classification, anomaly detection, model evaluation, preprocessing pipelines, time-series forecasting, simulation-based prediction"),
        ("Libraries / Tools", "pandas, NumPy, Matplotlib, Seaborn, scikit-learn, XGBoost, Streamlit, Jupyter Notebook, Git, GitHub, VS Code"),
        ("AI / LLM Concepts", "RAG, embeddings, vector databases, FAISS, prompt engineering, LLM application development"),
        ("Currently Learning &ndash; ML Foundations", "probability and statistics, linear algebra, calculus, hypothesis testing, bias&ndash;variance tradeoff, regularization, cross-validation, hyperparameter tuning, imbalanced-data handling"),
        ("Currently Learning &ndash; Deep Learning", "neural networks, backpropagation, activation and loss functions, TensorFlow, PyTorch, transformers, attention"),
        ("Currently Learning &ndash; ML Engineering", "modular and testable Python, FastAPI, Flask, Docker, AWS deployment, model monitoring, experiment tracking")
    ]

    for label, items in skills_list:
        p_skill = Paragraph(f"<b>{label}:</b> {items}", skill_text_style)
        story.append(p_skill)
        story.append(Spacer(1, 2))

    doc.build(story)
    print(f"PDF built successfully at: {filename}")

if __name__ == "__main__":
    out_public = "/Users/adarshsahu/Documents/claude/retro-room-portfolio/public/Adarsh_Sahu_Resume.pdf"
    out_desktop = "/Users/adarshsahu/Desktop/Adarsh_Sahu_Resume.pdf"
    build_pdf(out_public)
    build_pdf(out_desktop)
