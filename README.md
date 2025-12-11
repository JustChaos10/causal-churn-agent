# Niti AI - Causal Retention Analytics Agent

<div align="center">

![Niti AI](https://img.shields.io/badge/Niti-AI-10a37f?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMmExMCAxMCAwIDEgMCAxMCAxMEgxMlYyeiIvPjxwYXRoIGQ9Ik0xMiAxMmw4LjUtNSIvPjxwYXRoIGQ9Ik0xMiAxMmwtMy41IDguNSIvPjwvc3ZnPg==)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-ff6b6b?style=flat-square)](https://langchain.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**An AI-powered retention analytics agent that uses causal reasoning to identify churn drivers and recommend actionable interventions.**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [API](#api)

</div>

---

## ✨ Features

- 🧠 **5-Node LangGraph Agent**: Hypothesis generation → Confounder analysis → Causal testing → Lever estimation → Explanation generation
- 📊 **Generative UI**: Dynamic stat cards, bar charts, tables, and pie charts rendered based on query context
- 🔍 **Causal Reasoning**: Goes beyond correlation to identify true causal drivers of churn
- 💬 **Natural Language Interface**: Ask questions in plain English about your retention data
- 📈 **RFM Analytics**: Recency, Frequency, Monetary score analysis for customer segmentation
- 🎯 **Actionable Levers**: Impact scoring with ROI-based prioritization (effect size, p-value, sample size)
- 📝 **LLM-Powered Explanations**: Rich causal chain explanations with key insights and recommendations
- ⚡ **Streaming Responses**: Real-time typewriter text effect with skeleton loading
- 🌙 **Modern UI**: Enterprise-grade dark theme with ChatGPT-inspired aesthetics

## 🎬 Demo

### Channel Analysis
Ask: *"What is our churn rate by acquisition channel?"*

The agent analyzes your data and returns:
- Stat cards showing churn rates (Referral: 65.6%, Google Ads: 50%)
- Bar chart visualization
- Insights and recommendations

### Complex Queries
- *"Which channel and region combination has the worst retention?"* → Referral + India: 80%
- *"Compare UK vs US churn for Referral customers"* → UK: 75%, US: 66.7%
- *"What are the RFM scores for churned vs retained?"* → Detailed breakdown table

## 🚀 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key

### Backend Setup

```bash
cd nitiai

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Set environment variable
# Create .env file with:
# GOOGLE_API_KEY=your_gemini_api_key_here

# Run server
$env:PYTHONPATH = "src"  # Windows PowerShell
uvicorn retention_reasoning.api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd re

# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 in your browser.

## 📖 Usage

### Example Queries

| Query Type | Example |
|------------|---------|
| Overall metrics | "What is our overall churn rate?" |
| Channel analysis | "Which channel has the lowest churn?" |
| Regional breakdown | "Show me customer distribution by region" |
| Comparisons | "Compare Google Ads vs Referral churn" |
| Cross-tabulation | "Which channel+region combo has worst retention?" |
| RFM analysis | "What are RFM scores for churned vs retained?" |
| Recommendations | "What are the top factors driving churn?" |

### Sample Data

The agent works with `data/retention_customers.csv` containing:
- 600 customers across 6 regions (UK, US, CA, IN, AU, EU_Other)
- 4 acquisition channels (Google Ads, Meta Ads, Referral, Organic)
- 3 brands
- RFM scores (1-5 scale)
- Churn flag (0/1)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React + TypeScript + Vite                                  │
│  ├── Generative UI Components                               │
│  │   ├── StatCard (with trend indicators)                   │
│  │   ├── BarChart (interactive hover)                       │
│  │   ├── Table (case-insensitive key lookup)                │
│  │   └── PieChart                                           │
│  ├── Skeleton Loading                                       │
│  ├── Typewriter Text Effect                                 │
│  └── Data Source Badge                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  /api/chat/stream (SSE)                                     │
│  ├── Data Context Injection                                 │
│  └── C1-style Response Enhancement                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LangGraph 5-Node Agent                     │
│  ┌───────────────┐    ┌──────────────────┐                  │
│  │  Hypothesis   │───▶│   Confounder     │                  │
│  │  Generator    │    │   Analyzer       │                  │
│  └───────────────┘    └──────────────────┘                  │
│          │                     │                            │
│          ▼                     ▼                            │
│  ┌───────────────┐    ┌──────────────────┐                  │
│  │   Causal      │◀───│     Lever        │                  │
│  │   Tester      │    │   Estimator      │                  │
│  └───────────────┘    └──────────────────┘                  │
│          │                                                  │
│          ▼                                                  │
│  ┌───────────────────────────────────────┐                  │
│  │        Explanation Generator          │                  │
│  └───────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
.
├── nitiai/                    # Backend
│   ├── src/
│   │   └── retention_reasoning/
│   │       ├── api.py         # FastAPI app
│   │       ├── chat_router.py # Chat endpoints
│   │       ├── data_query.py  # CSV data loader
│   │       └── nodes/         # LangGraph nodes
│   │           ├── hypothesis_generator.py
│   │           ├── confounder_analyzer.py
│   │           ├── causal_tester.py
│   │           ├── lever_estimator.py
│   │           └── explanation_generator.py
│   └── data/
│       └── retention_customers.csv
├── re/                        # Frontend
│   ├── examples/demo/
│   │   └── src/
│   │       ├── App.tsx        # Main UI
│   │       └── App.css        # Styles
│   └── packages/
│       ├── core/              # Agent client
│       └── react-ui/          # UI components
└── README.md
```

## 🔌 API Reference

### POST /api/chat/stream

Stream a chat response with Server-Sent Events.

**Request:**
```json
{
  "query": "What is our churn rate by channel?"
}
```

**Response (SSE):**
```
data: {"text": "Here's the breakdown..."}
data: {"components": [{"type": "stat", "props": {...}}]}
data: {"done": true}
```

### Component Types

| Type | Props |
|------|-------|
| `stat` | `label`, `value`, `icon`, `change`, `changeType` |
| `bar_chart` | `title`, `data` |
| `table` | `title`, `columns`, `data` |
| `pie_chart` | `title`, `data` |
| `text` | `content` |
| `suggestions` | `items` |

## 🧪 Testing

To test the application:

1. **Start both servers** (backend on 8000, frontend on 3000)
2. **Basic queries**: Ask "What is our overall churn rate?" → Should show 54.5%
3. **Causal analysis**: Ask "Why are customers churning?" → Triggers LangGraph agent

### Verified Queries

| Query | Expected Result |
|-------|----------------|
| Overall churn rate | 54.5% |
| Total customers | 600 |
| Churned customers | 327 |
| Highest churn channel | Referral (65.6%) |
| Lowest churn channel | Google Ads (50.0%) |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [LangGraph](https://langchain.com) for agent orchestration
- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/) LLM
- UI inspired by [ChatGPT](https://chat.openai.com) and [Claude](https://claude.ai)

---

<div align="center">
Made with ❤️ for better customer retention
</div>
