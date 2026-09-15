# 🛡️ RT-AIDIS 2.0: Enterprise AI Integration & Decision Intelligence Platform

> **An enterprise platform that integrates data from business systems and real-time operational sources, monitors data quality and lineage, detects anomalies with multi-model ensembles, performs root-cause and financial-impact analysis, and orchestrates autonomous AI agents to recommend and automate decisions.**

---

## 🏛️ Enterprise Operational Lifecycle

```
INTEGRATE ──► OBSERVE ──► DETECT ──► INVESTIGATE ──► PREDICT ──► IMPACT ──► DECIDE ──► ACT
    │             │          │            │             │          │         │        │
  APIs/IoT    DataGuard   Ensemble ML    XAI RCA      24h Failure  Loss (₹)  Agents    Human
  Sensors      Lineage   (IsoForest)  Correlation    Horizon      & SLA     & RAG    Feedback
```

---

## 🚀 Core Platform Architecture

### 1. 📡 Enterprise Integration & Data Ingestion
- Ingests streaming operational telemetry across **Manufacturing**, **Smart City**, **Business ERP**, and **Healthcare**.
- Variable-speed simulation engine with real-time controls (1x, 2x, 5x speed, pause/resume, and anomaly injection testing).

### 2. 🛡️ DataGuard (Data Observability & Lineage Hub)
- **5-Pillar Observability**: Continuously tracks **Freshness**, **Schema Validity**, **Completeness**, **Distribution Drift**, and **Outlier Spikes**.
- **Interactive Data Lineage & Dependency Topology**: Visual DAG tracing data from Origin Sources $\rightarrow$ Ingestion Gateway $\rightarrow$ AI Inference Hub $\rightarrow$ Downstream Business Services.
- **Cascade Blast Radius Analysis**: Automatically quantifies how upstream sensor deviations propagate to downstream assembly lines and SLA penalties.

### 3. 🧠 Ensemble Anomaly & Predictive Maintenance Engine
- **Multi-Model Consensus**:
  - `Isolation Forest` (Scikit-Learn Contamination Model)
  - `Statistical 3-Sigma Z-Score Engine` (99.7% Gaussian Confidence)
  - `Rate-of-Change Volatility Detector`
- **Predictive Maintenance**: Computes equipment failure probability over a **24-hour horizon**.

### 4. 💰 Root Cause (XAI) & Business Impact Quantifier
- Translates raw mathematical anomalies into concrete enterprise metrics:
  - **Financial Loss at Risk (₹ / day)**
  - **Estimated Downtime Duration (Hours)**
  - **Customer SLA Vulnerability Level**
- **Explainable AI (XAI)**: Decomposes causal dependencies across correlated system variables.

### 5. 🧪 What-If Scenario Simulator 2.0
- Interactive multi-variable operational sandbox:
  - 🏗️ **Production Velocity** ($\pm 50\%$)
  - 👷 **Staff Allocation** ($\pm 50\%$)
  - 🛒 **Market Demand** ($\pm 50\%$)
  - ⚡ **Thermal & Sensor Load** ($\pm 50\%$)
- Instant projection of Revenue, Defect Density, Unit Cost, Anomaly Probability, and Net Financial Gain/Loss.

### 6. 🤖 Agentic AI & Grounded RAG SOP Assistant
- **4-Agent Collaborative Decision Pipeline**:
  - 🔍 **Data Agent**: Verifies ingestion hygiene and schema compliance.
  - 🧠 **ML Agent**: Evaluates ensemble anomaly score and failure probability.
  - 🔬 **RCA Agent**: Diagnoses root triggers and causal chains.
  - 🎯 **Decision Agent**: Synthesizes a concrete 3-step action plan.
- **RAG Knowledge Base**: Natural query retrieval over enterprise Standard Operating Procedures (*Cooling Failure Protocols*, *Defect Density Playbooks*, *Hospital Bed Triage*, *Traffic Gridlock Mitigation*, *SLA Recovery*).

### 7. 📋 Incident Management & Human Feedback Loop
- Complete ticket lifecycle: **`OPEN` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `MITIGATED` $\rightarrow$ `RESOLVED`**.
- **Human-in-the-Loop (HITL)**: Operators validate AI recommendations with **Approve**, **Adjust**, or **Reject** actions to tune continuous learning accuracy.

### 8. 🛡️ AI Governance, Model Registry & RBAC Audit Trail
- **Production Model Registry**: Tracks versioning, inference latency, drift status, and benchmark accuracy across all deployed models.
- **Role-Based Access Control (RBAC)**: Switch between **Enterprise Admin**, **Site Reliability Engineer (SRE)**, **Operations Manager**, and **Shift Operator**.
- **Immutable Decision Audit Trail**: Cryptographically structured log of who inspected, approved, or acted on AI decisions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Core** | Python, Flask, REST APIs, Streaming Sockets |
| **Data Science & ML** | Scikit-Learn (`IsolationForest`, `LinearRegression`), NumPy |
| **Observability & XAI** | DataGuard 5-Pillar Engine, Pearson Correlation Matrix, Z-Score Filter |
| **GenAI & Agents** | Simulated 4-Agent Orchestrator, In-Memory RAG Vector / BM25 Knowledge Base |
| **Frontend Platform** | Vanilla JavaScript (ES6+), CSS3 Glassmorphism, Chart.js, Sortable.js, Web Audio API |

---

## 📥 Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RT-AIDIS-FINAL
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch RT-AIDIS 2.0**:
   ```bash
   python app.py
   ```

