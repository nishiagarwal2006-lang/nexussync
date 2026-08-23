<div align="center">

# 🏆 NexusSync AI
### Autonomous Multi-Agent Intelligence Engine for Industrial Commerce

[![GitHub Stars](https://img.shields.io/github/stars/nishiagarwal2006-lang/nexussync?style=for-the-badge&color=38BDF8)](https://github.com/nishiagarwal2006-lang/nexussync/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/nishiagarwal2006-lang/nexussync?style=for-the-badge&color=818CF8)](https://github.com/nishiagarwal2006-lang/nexussync/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-34D399?style=for-the-badge)](LICENSE)
[![Runtime](https://img.shields.io/badge/Node.js-v18%2B-FBBF24?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![LLM Engine](https://img.shields.io/badge/Groq%20API-Llama--3.3--70B-F87171?style=for-the-badge&logo=groq)](https://groq.com/)
[![Team](https://img.shields.io/badge/Team-Vikingss-8B5CF6?style=for-the-badge)](#-team-vikingss)

<p align="center">
  <b>Transform fragmented, unstructured industrial product data into verified, schema-compliant, commerce-ready intelligence with 100% traceable citations.</b>
</p>

[Explore Features](#-key-capabilities) • [Live Pipeline](#-multi-agent-architecture) • [Getting Started](#-quick-start) • [Schemas](#-supported-schemas--formats) • [Team](#-team-vikingss)

---

</div>

## 📌 Executive Summary

Industrial manufacturers and B2B suppliers manage millions of specifications trapped across heterogeneous sources: legacy PDFs, supplier datasheets, fragmented spreadsheets, and raw catalog dumps. 

Converting this unstructured chaos into accurate product records is traditionally slow, expensive, and error-prone. **NexusSync AI** solves this by deploying a coordinated swarm of autonomous AI agents that ingest, extract, validate, cross-reference, and structure product records in real time.

📁 Raw Documents (PDF/CSV/DOCX) ──► 🤖 Autonomous Agent Pipeline ──► 📊 Verified Commerce Schema + Knowledge Graph
---

## 🤖 Multi-Agent Architecture

NexusSync AI operates as a decoupled, asynchronous multi-agent system managed by a central orchestrator over WebSocket telemetry:

                      ┌────────────────────────┐
                      │   Multi-Format Ingest  │
                      │ (PDF, CSV, XLSX, JSON) │
                      └───────────┬────────────┘
                                  │
                                  ▼
                      ┌────────────────────────┐
                      │   Orchestrator Agent   │
                      │ (Event Bus & Telemetry)│
                      └───────────┬────────────┘
                                  │
     ┌────────────────────────────┼────────────────────────────┐
     ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐│ Extraction Agent │         │ Validation Agent │         │ Enrichment Agent ││ • Entity Parsing │         │ • Schema Testing │         │ • Unit Standard  ││ • Attribute Extr │ ──────► │ • Rule Matching  │ ──────► │ • Graph Building ││ • Citation Trace │         │ • Anomaly Flags  │         │ • Diff Alignment │└──────────────────┘         └──────────────────┘         └──────────────────┘│                            │                            │└────────────────────────────┼────────────────────────────┘▼┌────────────────────────┐│   Commerce Delivery    ││ • Force-Directed Graph ││ • PIM-Ready CSV / JSON │└────────────────────────┘
| Agent | Core Responsibility |
| :--- | :--- |
| **🎯 Orchestrator** | Manages job lifecycles, load balances tasks, and streams telemetry via WebSockets. |
| **📄 Extraction Agent** | Parses document hierarchies, tokenizes technical parameters, and attaches source snippets. |
| **✅ Validation Agent** | Validates records against standardized industrial schemas and computes quality metrics. |
| **✨ Enrichment Agent** | Normalizes engineering units (`mm`, `kN`, `RPM`, `°C`) and builds relational graph edges. |

---

## ✨ Key Capabilities

### 🔍 Interactive Extraction Workspace
- Granular attribute tables with real-time confidence metrics (0–100%).
- Live search, multi-criteria status filtering (`Approved`, `Needs Review`, `Rejected`), and batch actions.
- **Raw vs. AI Enriched Diff Viewer**: A side-by-side modal for auditing machine extractions against raw document citations.

### 📊 Dynamic Force-Directed Knowledge Graph
- Canvas-based physics engine mapping relational dependencies between parts, materials, specifications, and certifications.
- Real-time drag, pan, zoom, and node-focus inspection tools.

### 🛡️ Schema Enforcement & Anomaly Detection
- Built-in validation suites for industrial products, engineering specifications, and marketplace listings.
- Automated detection of missing critical attributes (`part_number`, `manufacturer`, `material`, `dimensions`).

### ⚡ Sub-Second Inference & Streaming
- Leverages **Groq-accelerated `llama-3.3-70b-versatile`** for rapid document tokenization.
- Live streaming activity feed keeping operators informed of every agent decision.

---

## 🛠️ Technology Stack

```text
Frontend           Backend & Services       AI & Data Pipeline
├─ Vanilla JS ES6+ ├─ Node.js (v18+)        ├─ Groq Cloud SDK (Llama 3.3 70B)
├─ HTML5 Canvas    ├─ Express.js            ├─ Industrial JSON Schemas
├─ Modern CSS3     ├─ Socket.IO WebSockets  ├─ Fast Tabular Normalizers
└─ Glassmorphism   └─ Multer Ingestion      └─ Traceable Citation Maps
📂 Repository LayoutPlaintextnexussync/
├── package.json               # Dependencies & build scripts
├── server.js                  # Express & Socket.IO server entrypoint
├── .env.example               # Template environment configuration
├── public/                    # Client-side web application
│   ├── index.html             # Single-page dashboard application
│   ├── styles/
│   │   ├── main.css           # Global typography, themes, & variables
│   │   ├── dashboard.css      # Grid layouts, cards, & modal styles
│   │   ├── landing.css        # Hero landing & feature sections
│   │   ├── graph.css          # Knowledge graph viewport styles
│   │   └── animations.css     # CSS keyframes & transitions
│   └── js/
│       ├── app.js             # Bootstrap & module coordinator
│       ├── dashboard.js       # Core dashboard controller & state manager
│       ├── extraction.js      # Extraction workspace & table renderers
│       ├── validation.js      # Schema validator & issue reporter
│       ├── knowledgeGraph.js  # HTML5 Canvas force-directed graph
│       ├── diffViewer.js      # Side-by-side comparison modal
│       ├── activityFeed.js    # Live agent streaming logger
│       ├── fileUpload.js      # Drag-and-drop ingestion handler
│       └── sampleData.js      # Preloaded demo datasets
└── data/
    └── schemas/
        ├── industrial-product.json
        ├── technical-spec.json
        └── commerce-ready.json
🚀 Quick StartPrerequisitesNode.js >= 18.0.0npm >= 9.0.0Groq API Key (Optional: app includes offline mock mode)1. Clone & InstallBashgit clone [https://github.com/nishiagarwal2006-lang/nexussync.git](https://github.com/nishiagarwal2006-lang/nexussync.git)
cd nexussync
npm install
2. Configure EnvironmentBashcp .env.example .env
Open .env and configure your settings:Code snippetPORT=3000
GROQ_API_KEY=your_groq_api_key_here
3. Launch the ServerBashnpm start
Open your browser and navigate to http://localhost:3000.📋 Supported Formats & Output StandardsInput Document FormatsOutput SchemasCompliance Standards.pdf (Datasheets & manuals)JSON (Full hierarchy + citations)ISO 9001:2015 Spec Mapping.csv, .xlsx, .xls (Catalogs)CSV (PIM & ERP Ready)ECLASS Standard Hierarchy.docx, .txt, .json, .xmlRelational Knowledge GraphIndustrial Commerce v1.0🗺️ Product Roadmap[x] Multi-Agent extraction, validation, and enrichment pipeline[x] Real-time Canvas knowledge graph visualization[x] Raw vs. Enriched modal diff viewer[x] Full export system (JSON & CSV)[ ] Direct export integrations for Shopify, Akeneo, and SAP PIM[ ] OCR engine for low-resolution scanned technical blueprints[ ] Multi-tenant workspace management with team RBAC⚔️ Team Vikingss"Forged in courage, driven by conquest, and united by innovation. We are Vikings — fearless explorers of technology and creativity. Our spirit thrives on challenge, our strength lies in teamwork, and our mission is to conquer every frontier of data."ContributorRoleContactNishi AgarwalTeam Leader & Architecturedaijinns@gmail.com • @nishiagarwal2006-langAbhinav KhedwalCore Contributor & Engineeringabhinavkhedwal4@gmail.com