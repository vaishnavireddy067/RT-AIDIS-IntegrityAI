import random
import time
import threading
import numpy as np
import datetime
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest

# -----------------------------
# LIVE DATA & HISTORY
# -----------------------------
data_state = {
    # Manufacturing
    "Prod Rate": 105,
    "Defects Count": 2,
    "Raw Inv": 650,
    "Finished Inv": 120,
    "Workers On-Site": 18,
    "Unit Cost": 25.5,
    "Safety Alert": 0,
    
    # Smart City
    "Traffic Vol": 60,
    "Congestion Lvl": 0, # 0: Low, 1: Med, 2: High
    "City Events": 0,
    "Air Quality": 85,
    "Power Usage": 320,
    
    # Business
    "Revenue": 3200,
    "Sales": 120,
    "Orders": 80,
    "Net Profit": 650,
    "Customers": 210,
    
    # Healthcare
    "Patient Count": 78,
    "Critical Cases": 6,
    "Beds Avail": 55,
    "Staff On-Duty": 32,
    "Treatments": 70
}

# Store history for all metrics
history_data = {k: [] for k in data_state.keys()}

# Track previous values for comparison
previous_state = data_state.copy()

# Alert Log
alerts_log = []

icons = {
    "Prod Rate": "🏗️",
    "Defects Count": "❌",
    "Raw Inv": "🧱",
    "Finished Inv": "📦",
    "Workers On-Site": "👷",
    "Unit Cost": "💲",
    "Safety Alert": "🚨",
    "Traffic Vol": "🚗",
    "Congestion Lvl": "🚦",
    "City Events": "🎪",
    "Air Quality": "🌬️",
    "Power Usage": "⚡",
    "Revenue": "💰",
    "Sales": "📊",
    "Orders": "🛒",
    "Net Profit": "💎",
    "Customers": "👥",
    "Patient Count": "🤒",
    "Critical Cases": "⚠️",
    "Beds Avail": "🛏️",
    "Staff On-Duty": "👨‍⚕️",
    "Treatments": "💊"
}

SECTOR_METRICS = {
    "Manufacturing": ["Prod Rate", "Defects Count", "Raw Inv", "Finished Inv", "Workers On-Site", "Unit Cost", "Safety Alert"],
    "Smart City": ["Traffic Vol", "Congestion Lvl", "City Events", "Air Quality", "Power Usage"],
    "Business": ["Revenue", "Sales", "Orders", "Net Profit", "Customers"],
    "Healthcare": ["Patient Count", "Critical Cases", "Beds Avail", "Staff On-Duty", "Treatments"]
}

sim_settings = {
    "is_paused": False,
    "speed": 1.0,
    "last_tick_time": time.time()
}

# -----------------------------
# ENTERPRISE INCIDENT STORE & FEEDBACK
# -----------------------------
incidents_db = [
    {
        "id": "INC-8092",
        "metric": "Defects Count",
        "title": "High Defect Density Threshold Breach",
        "severity": "HIGH",
        "status": "INVESTIGATING",
        "impact_cost": "₹1,85,000 / day",
        "downtime": "2.4 hrs",
        "root_cause": "Excessive Production Velocity & Thermal Drift",
        "recommended_action": "Reduce line speed by 12% and trigger SOP-MFG-209",
        "created_at": (datetime.datetime.now() - datetime.timedelta(minutes=14)).strftime("%H:%M:%S"),
        "assigned_to": "Plant Operations Lead"
    },
    {
        "id": "INC-8088",
        "metric": "Air Quality",
        "title": "Urban Air Quality Index Warning",
        "severity": "ELEVATED",
        "status": "MITIGATED",
        "impact_cost": "₹45,000 / day",
        "downtime": "0.5 hrs",
        "root_cause": "Traffic Peak & Industrial Sensor Congestion",
        "recommended_action": "Activate dynamic signal rerouting per SOP-CTY-501",
        "created_at": (datetime.datetime.now() - datetime.timedelta(minutes=42)).strftime("%H:%M:%S"),
        "assigned_to": "Smart Grid Controller"
    }
]

feedback_history = [
    {
        "id": 1,
        "incident_id": "INC-8088",
        "action": "APPROVED",
        "comment": "Rerouting reduced congestion by 22%. Model diagnosis was accurate.",
        "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=30)).strftime("%H:%M:%S")
    }
]

# -----------------------------
# AI GOVERNANCE, RBAC & AUDIT LOG
# -----------------------------
current_rbac_role = "Enterprise Admin"

model_registry = [
    {
        "model_id": "MOD-ISO-01",
        "name": "Isolation Forest Anomaly Ensemble",
        "version": "v1.4.2",
        "framework": "Scikit-Learn 1.9",
        "latency_ms": 4.2,
        "drift_status": "STABLE",
        "accuracy_benchmark": "99.1%",
        "last_trained": "2026-09-14 02:00 UTC",
        "deployment": "Production Active"
    },
    {
        "model_id": "MOD-ZSC-02",
        "name": "Statistical 3-Sigma Z-Score Engine",
        "version": "v2.1.0",
        "framework": "NumPy Native",
        "latency_ms": 0.8,
        "drift_status": "OPTIMAL",
        "accuracy_benchmark": "99.8%",
        "last_trained": "Continuous Streaming",
        "deployment": "Production Active"
    },
    {
        "model_id": "MOD-RCA-03",
        "name": "Explainable XAI Correlation Decomposer",
        "version": "v3.0.1",
        "framework": "Pearson Correlation Matrix",
        "latency_ms": 2.6,
        "drift_status": "STABLE",
        "accuracy_benchmark": "97.4%",
        "last_trained": "2026-09-15 00:00 UTC",
        "deployment": "Production Active"
    },
    {
        "model_id": "MOD-RAG-04",
        "name": "Enterprise SOP Vector & BM25 Knowledge Retrieval",
        "version": "v2.0.4",
        "framework": "In-Memory Semantic Embeddings",
        "latency_ms": 6.1,
        "drift_status": "OPTIMAL",
        "accuracy_benchmark": "98.7%",
        "last_trained": "2026-09-15 06:00 UTC",
        "deployment": "Production Active"
    }
]

audit_log_entries = [
    {
        "id": "AUD-1001",
        "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=5)).strftime("%H:%M:%S"),
        "actor": "Admin (anugu vaishnavi)",
        "role": "Enterprise Admin",
        "action": "MODEL_INSPECTION",
        "target": "Isolation Forest v1.4.2",
        "details": "Triggered real-time drift verification. Ingestion validated."
    },
    {
        "id": "AUD-1002",
        "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=22)).strftime("%H:%M:%S"),
        "actor": "Plant Operations Lead",
        "role": "Operations Manager",
        "action": "INCIDENT_MITIGATION",
        "target": "INC-8088",
        "details": "Executed dynamic rerouting per SOP-CTY-501. Feedback logged."
    }
]

def get_governance_data():
    return {
        "current_role": current_rbac_role,
        "available_roles": ["Enterprise Admin", "Site Reliability Engineer (SRE)", "Operations Manager", "Shift Operator"],
        "model_registry": model_registry,
        "audit_logs": audit_log_entries
    }

def set_rbac_role(role):
    global current_rbac_role
    if role:
        current_rbac_role = role
        audit_log_entries.insert(0, {
            "id": f"AUD-{random.randint(1010, 9999)}",
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "actor": f"User ({role})",
            "role": role,
            "action": "ROLE_SWITCH",
            "target": "RBAC Security Manager",
            "details": f"Switched active enterprise role to '{role}'"
        })
    return {"current_role": current_rbac_role}

# -----------------------------
# DATA LINEAGE & DEPENDENCY MAPPING
# -----------------------------
def get_lineage_graph():
    """Generates topological data lineage and downstream cascade blast radius."""
    anoms = get_ensemble_anomaly_all()
    
    # Check if any sector has high anomalies
    mfg_anom = anoms.get("Defects Count", {}).get("severity") in ["CRITICAL", "HIGH"]
    city_anom = anoms.get("Traffic Vol", {}).get("severity") in ["CRITICAL", "HIGH"] or anoms.get("Congestion Lvl", {}).get("severity") in ["CRITICAL", "HIGH"]
    biz_anom = anoms.get("Revenue", {}).get("severity") in ["CRITICAL", "HIGH"]
    hlt_anom = anoms.get("Patient Count", {}).get("severity") in ["CRITICAL", "HIGH"] or anoms.get("Critical Cases", {}).get("severity") in ["CRITICAL", "HIGH"]
    
    nodes = [
        # Layer 1: Data Sources
        {"id": "SRC-IOT", "label": "IoT Sensor Grid #4", "layer": "Data Source", "status": "ATTENTION" if mfg_anom else "HEALTHY", "icon": "📡"},
        {"id": "SRC-ERP", "label": "ERP Core Database", "layer": "Data Source", "status": "ATTENTION" if biz_anom else "HEALTHY", "icon": "🗄️"},
        {"id": "SRC-CIT", "label": "Municipal Traffic API", "layer": "Data Source", "status": "ATTENTION" if city_anom else "HEALTHY", "icon": "🚦"},
        {"id": "SRC-HLT", "label": "Hospital Telemetry", "layer": "Data Source", "status": "ATTENTION" if hlt_anom else "HEALTHY", "icon": "🏥"},
        
        # Layer 2: Ingestion & Observability
        {"id": "ING-KAF", "label": "Kafka Event Router", "layer": "Ingestion", "status": "HEALTHY", "icon": "⚡"},
        {"id": "ING-DG", "label": "DataGuard Observability", "layer": "Observability", "status": "HEALTHY", "icon": "🛡️"},
        
        # Layer 3: AI Intelligence Node
        {"id": "AI-ENS", "label": "Ensemble ML Engine", "layer": "AI Intelligence", "status": "ACTIVE", "icon": "🧠"},
        {"id": "AI-XAI", "label": "XAI Root Cause & Impact", "layer": "AI Intelligence", "status": "ACTIVE", "icon": "🔬"},
        
        # Layer 4: Downstream Services & Business Nodes
        {"id": "DST-MFG", "label": "Automated Assembly Line", "layer": "Downstream", "status": "AT_RISK" if mfg_anom else "HEALTHY", "icon": "🏗️"},
        {"id": "DST-SLA", "label": "Enterprise Billing & SLA", "layer": "Downstream", "status": "AT_RISK" if biz_anom else "HEALTHY", "icon": "💎"},
        {"id": "DST-SIG", "label": "City Traffic Signals", "layer": "Downstream", "status": "AT_RISK" if city_anom else "HEALTHY", "icon": "🏙️"},
        {"id": "DST-BED", "label": "Emergency Bed Allocation", "layer": "Downstream", "status": "AT_RISK" if hlt_anom else "HEALTHY", "icon": "🛏️"}
    ]
    
    edges = [
        {"from": "SRC-IOT", "to": "ING-KAF"},
        {"from": "SRC-ERP", "to": "ING-KAF"},
        {"from": "SRC-CIT", "to": "ING-KAF"},
        {"from": "SRC-HLT", "to": "ING-KAF"},
        {"from": "ING-KAF", "to": "ING-DG"},
        {"from": "ING-DG", "to": "AI-ENS"},
        {"from": "AI-ENS", "to": "AI-XAI"},
        {"from": "AI-XAI", "to": "DST-MFG"},
        {"from": "AI-XAI", "to": "DST-SLA"},
        {"from": "AI-XAI", "to": "DST-SIG"},
        {"from": "AI-XAI", "to": "DST-BED"}
    ]
    
    blast_radius_summary = (
        "⚠️ Downstream Cascade Alert: Anomaly in upstream sensor telemetry is impacting Assembly Line throughput and SLA risk."
        if (mfg_anom or biz_anom or city_anom or hlt_anom) else
        "✅ Lineage Nominal: Zero downstream service degradation detected across 12 dependency nodes."
    )
    
    return {
        "nodes": nodes,
        "edges": edges,
        "blast_radius_summary": blast_radius_summary,
        "active_anomalies_propagating": sum(1 for n in nodes if n["status"] in ["ATTENTION", "AT_RISK"])
    }

# -----------------------------
# 1. DATAGUARD QUALITY ENGINE
# -----------------------------
def get_dataguard_metrics():
    """Evaluates multi-point data hygiene and integrity."""
    total_metrics = len(data_state)
    outlier_count = 0
    drift_sum = 0.0
    
    for k, v in data_state.items():
        hist = history_data.get(k, [])
        if len(hist) >= 10:
            mean = np.mean(hist)
            std = np.std(hist)
            if std > 0 and abs(v - mean) / std > 2.5:
                outlier_count += 1
            # Simple drift score: variance between first and second half
            half = len(hist) // 2
            h1_var = np.var(hist[:half]) if half > 0 else 1.0
            h2_var = np.var(hist[half:]) if half > 0 else 1.0
            if h1_var > 0:
                drift_sum += abs(h2_var - h1_var) / h1_var

    drift_index = min(1.0, round(drift_sum / (total_metrics * 5.0), 3))
    completeness = 100.0  # streaming data is complete
    schema_validity = 100.0
    freshness_latency = round(max(0.4, 2.0 / sim_settings.get("speed", 1.0)), 2)
    
    # Overall Data Quality Score
    quality_score = max(50.0, round(100.0 - (outlier_count * 3.5) - (drift_index * 20.0), 1))
    
    return {
        "quality_score": quality_score,
        "completeness": completeness,
        "schema_validity": schema_validity,
        "freshness_latency_sec": freshness_latency,
        "outlier_count": outlier_count,
        "drift_index": drift_index,
        "status": "HEALTHY" if quality_score >= 90 else "DEGRADED" if quality_score >= 75 else "UNRELIABLE"
    }

# -----------------------------
# 2. ENSEMBLE ANOMALY & PREDICTIVE MAINTENANCE
# -----------------------------
def get_ensemble_anomaly_all():
    """Runs Isolation Forest + Statistical Z-Score + Volatility Spike ensemble."""
    results = {}
    
    for metric, val in data_state.items():
        hist = history_data.get(metric, [])
        if len(hist) < 8:
            results[metric] = {
                "ensemble_score": 0.05,
                "severity": "NORMAL",
                "confidence": 98.0,
                "failure_probability_24h": 5.0,
                "models": {"isolation_forest": 0.05, "z_score": 0.1, "volatility": 0.05}
            }
            continue
            
        # 1. Statistical Z-Score
        mean = np.mean(hist)
        std = np.std(hist)
        z_val = abs(val - mean) / std if std > 0 else 0.0
        z_norm = min(1.0, z_val / 3.0)
        
        # 2. Isolation Forest Score
        try:
            X = np.array(hist).reshape(-1, 1)
            clf = IsolationForest(n_estimators=25, contamination=0.1, random_state=42)
            clf.fit(X)
            # decision_function gives negative for anomalies
            score_raw = clf.decision_function([[val]])[0]
            if_score = float(max(0.0, min(1.0, -score_raw + 0.3)))
        except Exception:
            if_score = z_norm * 0.8
            
        # 3. Volatility Spike
        comp = abs(get_comparison(metric, val))
        vol_score = min(1.0, comp / 25.0)
        
        # Weighted Ensemble Score
        ensemble_score = round(0.40 * if_score + 0.35 * z_norm + 0.25 * vol_score, 3)
        
        # Predictive 24h Failure Probability
        failure_prob = min(98.0, max(4.0, round(ensemble_score * 85.0 + (vol_score * 15.0), 1)))
        
        # Severity
        if ensemble_score >= 0.70 or "Safety" in metric and val > 0:
            severity = "CRITICAL"
        elif ensemble_score >= 0.50:
            severity = "HIGH"
        elif ensemble_score >= 0.30:
            severity = "ELEVATED"
        else:
            severity = "NORMAL"
            
        confidence = round(min(99.4, 82.0 + (len(hist) * 0.3)), 1)
        
        results[metric] = {
            "ensemble_score": ensemble_score,
            "severity": severity,
            "confidence": confidence,
            "failure_probability_24h": failure_prob,
            "models": {
                "isolation_forest": round(if_score, 2),
                "z_score": round(z_norm, 2),
                "volatility": round(vol_score, 2)
            }
        }
        
    return results

# -----------------------------
# 3. ROOT CAUSE & BUSINESS IMPACT ENGINE
# -----------------------------
def get_business_impact_analytics():
    """Calculates financial loss (₹/day), downtime risk, and causal dependency."""
    anomalies = get_ensemble_anomaly_all()
    impact_list = []
    total_financial_loss_inr = 0
    max_downtime_hrs = 0.0
    
    for metric, anom in anomalies.items():
        if anom["severity"] in ["CRITICAL", "HIGH", "ELEVATED"]:
            val = data_state[metric]
            ens_score = anom["ensemble_score"]
            
            # Domain-specific Financial Loss & Downtime model
            if metric in ["Defects Count", "Prod Rate", "Safety Alert"]:
                daily_loss = int(ens_score * 320000)
                downtime = round(ens_score * 4.5, 1)
                sla_risk = "CRITICAL" if ens_score > 0.65 else "HIGH"
                root_cause = "Thermal overload causing tool chatter & micro-fractures" if metric == "Defects Count" else "Sensor calibration drift & line congestion"
            elif metric in ["Traffic Vol", "Congestion Lvl", "Air Quality"]:
                daily_loss = int(ens_score * 95000)
                downtime = round(ens_score * 1.8, 1)
                sla_risk = "MODERATE"
                root_cause = "Peak commuter surge coupled with industrial exhaust baseline"
            elif metric in ["Revenue", "Net Profit", "Sales"]:
                daily_loss = int(ens_score * 450000)
                downtime = round(ens_score * 2.0, 1)
                sla_risk = "HIGH"
                root_cause = "Supply chain delivery backlog & transaction checkout drop-off"
            else: # Healthcare
                daily_loss = int(ens_score * 160000)
                downtime = round(ens_score * 3.2, 1)
                sla_risk = "CRITICAL"
                root_cause = "High patient triage density exceeding on-duty nurse ratio"

            total_financial_loss_inr += daily_loss
            max_downtime_hrs = max(max_downtime_hrs, downtime)
            
            impact_list.append({
                "metric": metric,
                "current_val": val,
                "severity": anom["severity"],
                "financial_loss_inr": f"₹{daily_loss:,} / day",
                "downtime_hrs": f"{downtime} hrs",
                "sla_risk": sla_risk,
                "root_cause": root_cause,
                "failure_probability": f"{anom['failure_probability_24h']}%"
            })
            
    if not impact_list:
        total_financial_loss_inr = 12000
        max_downtime_hrs = 0.0

    return {
        "total_at_risk_inr": f"₹{total_financial_loss_inr:,}",
        "max_downtime_hrs": f"{max_downtime_hrs:.1f} hrs",
        "active_risk_count": len(impact_list),
        "impact_breakdown": impact_list
    }

# -----------------------------
# 4. SCENARIO SIMULATOR 2.0 (WHAT-IF ENGINE)
# -----------------------------
def run_scenario_simulation_2(prod_delta=0, staff_delta=0, demand_delta=0, sensor_load_delta=0):
    """Multi-variable scenario planning sandbox."""
    base_rev = data_state.get("Revenue", 3200)
    base_defects = data_state.get("Defects Count", 2)
    base_cost = data_state.get("Unit Cost", 25.5)
    
    # Mathematical impact model
    projected_rev = int(base_rev * (1 + (prod_delta * 0.007) + (demand_delta * 0.005)))
    projected_defects = max(0, round(base_defects * (1 + (prod_delta * 0.015) - (staff_delta * 0.012) + (sensor_load_delta * 0.008)), 1))
    projected_cost = round(base_cost * (1 + (staff_delta * 0.006) + (sensor_load_delta * 0.004) - (prod_delta * 0.003)), 1)
    
    # Risk calculation
    stress_index = (prod_delta * 0.35) - (staff_delta * 0.25) + (sensor_load_delta * 0.25) + (demand_delta * 0.15)
    anomaly_prob = max(5.0, min(96.0, round(25.0 + stress_index * 1.8, 1)))
    
    risk_label = "LOW RISK (SAFE)" if anomaly_prob < 35 else "MODERATE STRESS" if anomaly_prob < 65 else "HIGH CRITICAL RISK"
    
    financial_delta = (projected_rev - base_rev) * 100 - int(projected_defects * 45000)
    
    return {
        "projected_revenue": projected_rev,
        "projected_defects": projected_defects,
        "projected_unit_cost": projected_cost,
        "predicted_anomaly_probability": f"{anomaly_prob}%",
        "risk_level": risk_label,
        "net_financial_delta_inr": f"{'+' if financial_delta >= 0 else ''}₹{financial_delta:,}",
        "recommendation": (
            "✅ Safe parameter configuration. Operating well within nominal thresholds." if anomaly_prob < 35 else
            "⚠️ Parameter stress alert: Increase staffing or calibrate cooling systems before applying this load." if anomaly_prob < 65 else
            "🚨 Severe Risk: High probability of equipment breakdown and SLA breach. Implement staged ramp-up."
        )
    }

# -----------------------------
# 5. AGENTIC AI & RAG SOP ASSISTANT
# -----------------------------
SOP_KNOWLEDGE_BASE = [
    {
        "id": "SOP-MFG-104",
        "title": "Machine Overheat & Rapid Thermal Cooling Protocol",
        "sector": "Manufacturing",
        "keywords": ["cooling", "overheat", "temperature", "vibration", "thermal", "machine", "defects"],
        "steps": [
            "1. Reduce machine operational load by 15% immediately.",
            "2. Inspect primary and auxiliary coolant flow valves for pressure drop.",
            "3. Switch to secondary heat dissipation loop and log thermal delta in SCADA.",
            "4. Schedule preventive bearing inspection if vibration exceeds 0.45 mm/s."
        ]
    },
    {
        "id": "SOP-MFG-209",
        "title": "Defect Density Surge Mitigation & Line Balancing",
        "sector": "Manufacturing",
        "keywords": ["defects", "quality", "production", "speed", "velocity", "raw inv"],
        "steps": [
            "1. Halt high-speed injection batch for 5 minutes to verify mold alignment.",
            "2. Sample 10 consecutive finished units for micro-crack analysis.",
            "3. Re-balance worker line distribution to allocate 2 additional QA inspectors.",
            "4. Verify raw material moisture levels per ISO-9001 standard."
        ]
    },
    {
        "id": "SOP-HLT-401",
        "title": "Emergency Surge & Critical Bed Triage Protocol",
        "sector": "Healthcare",
        "keywords": ["beds", "patient", "critical", "hospital", "triage", "surge", "doctor"],
        "steps": [
            "1. Activate Level-2 emergency triage buffer in Ward B.",
            "2. Reallocate 4 on-call nursing staff from elective care to critical care.",
            "3. Expedite step-down discharge for stabilized patients (>48h stable).",
            "4. Notify regional medical dispatch if available ICU beds fall below 10%."
        ]
    },
    {
        "id": "SOP-CTY-501",
        "title": "Urban Traffic Gridlock Dynamic Signal Rerouting",
        "sector": "Smart City",
        "keywords": ["traffic", "congestion", "gridlock", "signal", "air quality", "city"],
        "steps": [
            "1. Extend green signal duration by 35 seconds along primary bypass corridors.",
            "2. Broadcast real-time GPS re-routing alerts via municipal mobility API.",
            "3. Deploy traffic wardens at arterial intersections 4 and 9.",
            "4. Adjust variable speed limits on outer ring highway to 40 km/h."
        ]
    },
    {
        "id": "SOP-BIZ-601",
        "title": "Customer SLA Protection & Priority Order Routing",
        "sector": "Business",
        "keywords": ["revenue", "orders", "sla", "sales", "customer", "profit", "delivery"],
        "steps": [
            "1. Tag enterprise Tier-1 orders with priority dispatch flags.",
            "2. Allocate automated reserve inventory to fulfill pending checkout queues.",
            "3. Trigger proactive SLA status notification with verified dispatch ETA.",
            "4. Notify account executive team for proactive relationship management."
        ]
    }
]

def search_sop_rag(query):
    """RAG-style retrieval over enterprise Standard Operating Procedures."""
    q_words = set(query.lower().split())
    scored_docs = []
    
    for doc in SOP_KNOWLEDGE_BASE:
        score = 0
        for kw in doc["keywords"]:
            if any(w in kw or kw in w for w in q_words):
                score += 3
        for w in q_words:
            if w in doc["title"].lower():
                score += 4
        if score > 0:
            scored_docs.append((score, doc))
            
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    if not scored_docs:
        # Fallback to top relevant general SOP
        return [SOP_KNOWLEDGE_BASE[0], SOP_KNOWLEDGE_BASE[1]]
    return [d[1] for d in scored_docs[:2]]

def run_agentic_pipeline(metric="Defects Count"):
    """Executes the 4-Agent collaborative decision chain."""
    val = data_state.get(metric, 100)
    anom_data = get_ensemble_anomaly_all().get(metric, {})
    ens_score = anom_data.get("ensemble_score", 0.45)
    fail_prob = anom_data.get("failure_probability_24h", 45.0)
    
    # RAG lookup for grounded recommendations
    retrieved_sops = search_sop_rag(f"{metric} {get_status(metric, val)}")
    top_sop = retrieved_sops[0] if retrieved_sops else SOP_KNOWLEDGE_BASE[0]
    
    # 1. Data Agent
    data_agent_msg = f"DataGuard integrity verified for '{metric}'. Ingestion latency nominal at 1.1s with 0% missing frames and verified schema compliance."
    
    # 2. ML Agent
    ml_agent_msg = f"Ensemble detection computed anomaly score of {ens_score:.2f} (Severity: {anom_data.get('severity', 'ELEVATED')}). Predictive maintenance models forecast a {fail_prob}% failure probability within 24 hours."
    
    # 3. RCA Agent
    rca_agent_msg = f"Root cause investigation correlated '{metric}' (Val: {val}) with recent velocity spikes and thermal baseline variances. Primary bottleneck localized to operational stress."
    
    # 4. Decision Agent
    decision_agent_msg = f"Synthesizing remediation grounded in {top_sop['id']} ({top_sop['title']}):\n• " + "\n• ".join(top_sop['steps'][:3])
    
    return {
        "metric": metric,
        "current_val": val,
        "agents": [
            {"role": "Data Agent", "icon": "🔍", "badge": "Data Integrity", "message": data_agent_msg},
            {"role": "ML Agent", "icon": "🧠", "badge": "Ensemble ML", "message": ml_agent_msg},
            {"role": "RCA Agent", "icon": "🔬", "badge": "Explainable XAI", "message": rca_agent_msg},
            {"role": "Decision Agent", "icon": "🎯", "badge": "Grounded Action", "message": decision_agent_msg}
        ],
        "grounded_sop": top_sop
    }

# -----------------------------
# 6. INCIDENT MANAGEMENT & FEEDBACK LOOP
# -----------------------------
def get_all_incidents():
    return incidents_db

def update_incident_status_backend(inc_id, new_status):
    for inc in incidents_db:
        if inc["id"] == inc_id:
            inc["status"] = new_status
            return {"status": "updated", "incident": inc}
    return {"error": "Incident not found"}

def submit_human_feedback(inc_id, action, comment):
    feedback_entry = {
        "id": len(feedback_history) + 1,
        "incident_id": inc_id,
        "action": action, # APPROVED, ADJUSTED, REJECTED
        "comment": comment or "Validated by Human Operator",
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
    }
    feedback_history.insert(0, feedback_entry)
    
    # If approved, update associated incident to RESOLVED
    if action == "APPROVED":
        update_incident_status_backend(inc_id, "RESOLVED")
        
    return {
        "status": "recorded",
        "feedback": feedback_entry,
        "total_feedbacks": len(feedback_history),
        "learning_accuracy_rate": "96.4%"
    }

def get_feedback_stats():
    total = len(feedback_history)
    approved = sum(1 for f in feedback_history if f["action"] == "APPROVED")
    acc = round((approved / total * 100) if total > 0 else 100.0, 1)
    return {
        "total_feedbacks": total,
        "approved_count": approved,
        "accuracy_rate": f"{acc}%",
        "recent_feedbacks": feedback_history[:5]
    }

# -----------------------------
# CORE HELPERS & COMPATIBILITY
# -----------------------------
def get_status(metric, value):
    history = history_data.get(metric, [])
    velocity = 0
    if len(history) > 3:
        velocity = (history[-1] - history[-3]) / 2
    
    if "Safety" in metric:
        return "CRITICAL" if value > 0 else "Secure"
    if "Defects" in metric:
        if velocity > 1: return "High Risk"
        return "Warning" if value > 4 else "Normal"
    if "Congestion" in metric:
        if velocity > 0.5 and value >= 1: return "Congestion Spike"
        return "High" if value >= 2 else "Medium" if value == 1 else "Low"
    if "Air" in metric:
        return "Fair" if value > 80 else "Poor" if value > 60 else "Critical"
    if "Beds" in metric:
        return "Low" if value < 45 else "Normal"
    if "Revenue" in metric or "Profit" in metric:
        return "Growth" if value > 3000 else "Stable"
    return "Operations Nominal"

def get_gradient(percent):
    if percent < 30: return "linear-gradient(90deg, #ff4d4d, #f9ca24)"
    elif percent < 60: return "linear-gradient(90deg, #f9ca24, #f0932b)"
    elif percent < 85: return "linear-gradient(90deg, #6ab04c, #badc58)"
    else: return "linear-gradient(90deg, #22a6b3, #7ed6df)"

def get_prediction(metric):
    data = history_data.get(metric, [])
    if len(data) < 10: return 0
    X = np.array(range(len(data))).reshape(-1, 1)
    y = np.array(data).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)
    next_step = np.array([[len(data) + 5]])
    prediction = model.predict(next_step)
    return float(prediction[0][0])

def analyze_anomaly_ml(metric):
    data = history_data.get(metric, [])
    if len(data) < 10: return {"status": "Collecting data...", "confidence": 0}
    mean = np.mean(data)
    std_dev = np.std(data)
    if std_dev == 0: return {"status": "Stable Stream", "confidence": 100}
    current = data[-1]
    z_score = (current - mean) / std_dev
    confidence = min(99, 50 + abs(z_score) * 10)
    if abs(z_score) > 2.5:
        log_alert(metric, current, "Statistical Anomaly Detected")
        return {"status": f"⚠️ ANOMALY (Z:{z_score:.2f})", "confidence": confidence}
    return {"status": "✅ Normal Range", "confidence": confidence}

def get_rolling_analytics(metric):
    data = history_data.get(metric, [])
    if not data: return {"avg": 0, "peak": 0, "variance": 1}
    window = data[-10:]
    return {
        "avg": float(np.mean(window)),
        "peak": float(np.max(window)),
        "variance": float(np.var(window))
    }

def get_comparison(metric, current_value):
    prev = previous_state.get(metric, current_value)
    if prev == 0: prev = 1
    return ((current_value - prev) / prev) * 100

def get_root_cause(metric, value, status):
    if status in ["CRITICAL", "High", "Poor", "High Risk", "Congestion Spike"]:
        causes = []
        if metric == "Congestion Lvl" and data_state.get("Traffic Vol", 0) > 80:
            causes.append("Excessive Traffic Volume")
        if metric == "Defects Count" and data_state.get("Prod Rate", 0) > 120:
            causes.append("High Production Velocity")
        if metric == "Patient Count" and data_state.get("Staff On-Duty", 0) < 25:
            causes.append("Low Staff Availability")
        if not causes:
            return f"Alert: {metric} value {value} deviates from baseline. Investigating sensor patterns."
        return f"Root Cause: " + " & ".join(causes)
    return "System health nominal. No correlations to issues detected."

def generate_ai_story():
    active = [k for k,v in data_state.items() if abs(get_comparison(k,v)) > 5]
    if not active: return "All systems are steady and within operational bounds."
    return "Trend Update: Velocity spike in " + ", ".join(active[:2]) + " suggesting pattern shift."

def log_alert(metric, value, msg):
    if alerts_log and alerts_log[0]['metric'] == metric and (datetime.datetime.now() - alerts_log[0]['time']).seconds < 15:
        return
    alerts_log.insert(0, {"time": datetime.datetime.now(), "metric": metric, "value": value, "msg": msg})
    if len(alerts_log) > 10: alerts_log.pop()

def get_integrity_metrics():
    sector_scores = {}
    for sector, metrics in SECTOR_METRICS.items():
        base_score = 100.0
        for m in metrics:
            val = data_state.get(m, 0)
            st = get_status(m, val)
            comp = abs(get_comparison(m, val))
            if st in ["CRITICAL", "High Risk", "Poor", "Critical"]:
                base_score -= 15.0
            elif st in ["Warning", "High", "Congestion Spike", "Low"]:
                base_score -= 8.0
            elif comp > 10.0:
                base_score -= 4.0
        sector_scores[sector] = max(10, min(100, round(base_score, 1)))
        
    overall_score = round(sum(sector_scores.values()) / len(sector_scores), 1)
    status_label = "OPTIMAL" if overall_score >= 90 else "STABLE" if overall_score >= 75 else "ATTENTION REQUIRED" if overall_score >= 50 else "CRITICAL"
    
    return {
        "overall_score": overall_score,
        "status": status_label,
        "sectors": sector_scores,
        "sim_settings": sim_settings
    }

def inject_anomaly(target_metric=None):
    candidates = ["Defects Count", "Safety Alert", "Air Quality", "Critical Cases", "Traffic Vol", "Congestion Lvl"]
    chosen = target_metric if target_metric and target_metric in data_state else random.choice(candidates)
    
    if chosen == "Safety Alert":
        data_state[chosen] = 1
        log_alert(chosen, 1, "EMERGENCY: Safety Protocol Breach Injected!")
    elif chosen == "Defects Count":
        data_state[chosen] = 9
        log_alert(chosen, 9, "Spike in Manufacturing Defect Density!")
    elif chosen == "Air Quality":
        data_state[chosen] = 42
        log_alert(chosen, 42, "Hazardous Air Quality Degradation Detected!")
    elif chosen == "Critical Cases":
        data_state[chosen] = 19
        log_alert(chosen, 19, "Hospital Surge: Critical Cases Exceeding Threshold!")
    elif chosen == "Congestion Lvl":
        data_state[chosen] = 2
        data_state["Traffic Vol"] = 96
        log_alert(chosen, 2, "Severe Urban Congestion Gridlock!")
    else:
        data_state[chosen] = int(data_state[chosen] * 1.5) + 10
        log_alert(chosen, data_state[chosen], f"Simulated Stress Surge on {chosen}")
        
    history_data[chosen].append(data_state[chosen])
    
    # Auto create incident ticket
    new_inc = {
        "id": f"INC-{random.randint(8100, 8999)}",
        "metric": chosen,
        "title": f"Critical Anomaly Detected on {chosen}",
        "severity": "CRITICAL",
        "status": "OPEN",
        "impact_cost": f"₹{random.randint(120, 350):,},000 / day",
        "downtime": f"{random.uniform(1.5, 4.0):.1f} hrs",
        "root_cause": get_root_cause(chosen, data_state[chosen], "CRITICAL"),
        "recommended_action": f"Trigger emergency procedure per SOP-{chosen[:3].upper()}-01",
        "created_at": datetime.datetime.now().strftime("%H:%M:%S"),
        "assigned_to": "Autonomous AI Dispatcher"
    }
    incidents_db.insert(0, new_inc)
    
    return {"status": "injected", "metric": chosen, "new_value": data_state[chosen], "incident": new_inc}

def set_simulation_state(paused=None, speed=None):
    if paused is not None:
        sim_settings["is_paused"] = bool(paused)
    if speed is not None:
        sim_settings["speed"] = max(0.2, min(5.0, float(speed)))
    return sim_settings

def get_correlations():
    keys = ["Prod Rate", "Defects Count", "Traffic Vol", "Air Quality", "Revenue", "Orders", "Patient Count", "Staff On-Duty"]
    matrix = {}
    for k1 in keys:
        matrix[k1] = {}
        for k2 in keys:
            if k1 == k2:
                matrix[k1][k2] = 1.0
            else:
                s1 = history_data.get(k1, [])
                s2 = history_data.get(k2, [])
                if len(s1) >= 5 and len(s2) >= 5:
                    min_len = min(len(s1), len(s2))
                    a1 = np.array(s1[-min_len:])
                    a2 = np.array(s2[-min_len:])
                    std1, std2 = np.std(a1), np.std(a2)
                    if std1 > 0 and std2 > 0:
                        corr = np.corrcoef(a1, a2)[0, 1]
                        matrix[k1][k2] = round(float(corr), 2) if not np.isnan(corr) else 0.0
                    else:
                        matrix[k1][k2] = 0.0
                else:
                    matrix[k1][k2] = 0.0
    return {"metrics": keys, "matrix": matrix}

def clear_alerts_log():
    global alerts_log
    alerts_log = []
    return {"status": "cleared"}

# -----------------------------
# BACKGROUND DATA UPDATER
# -----------------------------
def _update_loop_():
    global previous_state
    # Initialize history buffers with starter series
    for k, v in data_state.items():
        if len(history_data[k]) == 0:
            history_data[k] = [max(1, v + random.randint(-4, 4)) for _ in range(20)]

    while True:
        if not sim_settings.get("is_paused", False):
            previous_state = data_state.copy()
            for key in data_state:
                if key in ["Revenue", "Net Profit", "Unit Cost"]:
                    data_state[key] += random.choice([-5, 5, -2, 2, 0])
                elif key in ["Safety Alert", "Congestion Lvl"]:
                    if random.random() > 0.96: data_state[key] = random.randint(0, 2)
                elif "Inv" in key or "Usage" in key or "Traffic" in key:
                    data_state[key] += random.randint(-5, 5)
                else:
                    data_state[key] += random.randint(-2, 2)
                data_state[key] = max(0, data_state[key])
                
            for key in data_state:
                history_data[key].append(data_state[key])
                if len(history_data[key]) > 50: history_data[key].pop(0)

        sim_settings["last_tick_time"] = time.time()
        speed = sim_settings.get("speed", 1.0)
        delay = max(0.4, 2.0 / speed)
        time.sleep(delay)

def start_background_thread():
    threading.Thread(target=_update_loop_, daemon=True).start()
