// ==========================================
// RT-AIDIS 2.0 ENTERPRISE DECISION PLATFORM
// ==========================================

let isLoggedIn = false;
let currentSector = 'All';
let searchQuery = '';
let currentMainView = 'liveStreamView';
let lastAlertCount = 0;
let currentKey = '';
let currentVal = 0;
let soundEnabled = true;
let isSimPaused = false;
let currentAlertFilter = 'All';
let cachedMetricData = null;
let currentForecastModel = 'linear';
let rawAlertsCache = [];

// Synthesize audio chime via Web Audio API
function playAlertChime(isCritical = false) {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isCritical ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(isCritical ? 880 : 587.33, ctx.currentTime);
        if (isCritical) {
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        } else {
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        }

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
        console.warn("Audio chime context:", e);
    }
}

function toggleSoundAlerts() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
        btn.innerHTML = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        btn.style.opacity = soundEnabled ? "1" : "0.6";
    }
}

async function toggleSimPause() {
    isSimPaused = !isSimPaused;
    const btn = document.getElementById('simPlayPauseBtn');
    if (btn) {
        btn.innerHTML = isSimPaused ? "▶️ Resume" : "⏸️ Pause";
        btn.style.background = isSimPaused ? "#27ae60" : "rgba(255, 255, 255, 0.15)";
    }
    await fetch('/sim_control?paused=' + isSimPaused);
    showToast("Stream " + (isSimPaused ? "Paused" : "Resumed"), "Real-time data generator updated", "info");
}

async function setSimSpeed(speed, btn) {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    await fetch('/sim_control?speed=' + speed);
    showToast("Velocity Adjusted", `Streaming rate set to ${speed}x`, "info");
}

async function triggerAnomalyDemo() {
    try {
        const res = await fetch('/inject_anomaly', { method: 'POST' });
        const data = await res.json();
        showToast("🚨 Anomaly Injected", `Spike on ${data.metric} (Val: ${data.new_value}). Incident auto-logged.`, "critical");
        playAlertChime(true);
        loadAllData();
    } catch (e) {
        console.error("Anomaly injection error:", e);
    }
}

// Authentication
function attemptLogin() {
    const btn = document.querySelector('.login-btn');
    btn.innerHTML = "Authenticating Enterprise Session...";
    btn.disabled = true;

    setTimeout(() => {
        document.getElementById('loginPortal').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';
        showToast("Access Granted", "RT-AIDIS 2.0 Enterprise Session Activated", "info");
        isLoggedIn = true;
        updateHealthStatus();
        loadAllData();
    }, 1200);
}

// Navigation between enterprise views
function switchMainView(viewId, btn) {
    currentMainView = viewId;
    document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
    const target = document.getElementById(viewId);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Trigger immediate view-specific refresh
    if (viewId === 'lineageView') updateLineageView();
    if (viewId === 'ensembleMLView') updateEnsembleView();
    if (viewId === 'businessImpactView') updateBusinessImpactView();
    if (viewId === 'whatIfView') updateWhatIfSim();
    if (viewId === 'agenticView') runAgentConsultation();
    if (viewId === 'incidentsView') loadIncidents();
    if (viewId === 'governanceView') updateGovernanceView();
}

async function switchRBACRole(role) {
    await fetch(`/governance?role=${encodeURIComponent(role)}`, { method: 'POST' });
    showToast("RBAC Switched", `Active enterprise role set to: ${role}`, "info");
    if (currentMainView === 'governanceView') updateGovernanceView();
}

// ------------------------------------------
// DATA LINEAGE & DEPENDENCY TOPOLOGY
// ------------------------------------------
async function updateLineageView() {
    try {
        const res = await fetch('/lineage');
        const data = await res.json();

        // Update alert banner
        const alertEl = document.getElementById('lineageBlastAlert');
        const textEl = document.getElementById('lineageBlastText');
        if (textEl) textEl.innerText = data.blast_radius_summary;
        if (alertEl) {
            if (data.active_anomalies_propagating > 0) {
                alertEl.style.background = 'rgba(239, 68, 68, 0.15)';
                alertEl.style.borderColor = '#ef4444';
                alertEl.style.color = '#f87171';
            } else {
                alertEl.style.background = 'rgba(16, 185, 129, 0.15)';
                alertEl.style.borderColor = '#10b981';
                alertEl.style.color = '#34d399';
            }
        }

        // Partition nodes into the 4 tiers
        const sources = data.nodes.filter(n => n.layer === 'Data Source');
        const ingestion = data.nodes.filter(n => n.layer === 'Ingestion' || n.layer === 'Observability');
        const ai = data.nodes.filter(n => n.layer === 'AI Intelligence');
        const downstream = data.nodes.filter(n => n.layer === 'Downstream');

        const renderNodes = nodes => nodes.map(n => `
            <div class="lineage-node ${n.status}">
                <span>${n.icon}</span>
                <div>
                    <div>${n.label}</div>
                    <div style="font-size: 0.75em; opacity: 0.75;">Status: ${n.status}</div>
                </div>
            </div>
        `).join('');

        if (document.getElementById('tierSources')) document.getElementById('tierSources').innerHTML = renderNodes(sources);
        if (document.getElementById('tierIngestion')) document.getElementById('tierIngestion').innerHTML = renderNodes(ingestion);
        if (document.getElementById('tierAI')) document.getElementById('tierAI').innerHTML = renderNodes(ai);
        if (document.getElementById('tierDownstream')) document.getElementById('tierDownstream').innerHTML = renderNodes(downstream);
    } catch (e) {
        console.warn("Lineage update error:", e);
    }
}

// ------------------------------------------
// AI GOVERNANCE & AUDIT TRAIL
// ------------------------------------------
async function updateGovernanceView() {
    try {
        const res = await fetch('/governance');
        const data = await res.json();

        // Update active role dropdown if needed
        const selectEl = document.getElementById('rbacRoleSelect');
        if (selectEl && data.current_role) selectEl.value = data.current_role;

        // Render Model Registry Cards
        const modContainer = document.getElementById('modelRegistryContainer');
        if (modContainer) {
            modContainer.innerHTML = data.model_registry.map(m => `
                <div class="model-card">
                    <div class="model-card-header">
                        <b>${m.name}</b>
                        <span class="agent-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">${m.version}</span>
                    </div>
                    <div class="model-card-body">
                        <div>Framework: <b>${m.framework}</b></div>
                        <div>Inference Latency: <b>${m.latency_ms} ms</b></div>
                        <div>Drift Status: <b style="color: #10b981;">${m.drift_status}</b></div>
                        <div>Benchmark Acc: <b>${m.accuracy_benchmark}</b></div>
                        <div>Trained: <span style="opacity: 0.7;">${m.last_trained}</span></div>
                        <div>Status: <b style="color: #38bdf8;">${m.deployment}</b></div>
                    </div>
                </div>
            `).join('');
        }

        // Render Audit Table
        const tbody = document.getElementById('auditTableBody');
        if (tbody) {
            tbody.innerHTML = data.audit_logs.map(log => `
                <tr>
                    <td><b>${log.id}</b></td>
                    <td>${log.timestamp}</td>
                    <td><b>${log.actor}</b> <span style="font-size:0.8em; opacity:0.7;">(${log.role})</span></td>
                    <td><span class="sev-badge NORMAL" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc;">${log.action}</span></td>
                    <td>${log.target}</td>
                    <td>${log.details}</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.warn("Governance update error:", e);
    }
}

function showArchitecture() { document.getElementById('archModal').style.display = 'flex'; }
function closeArchModal() { document.getElementById('archModal').style.display = 'none'; }

// ------------------------------------------
// 1. DATAGUARD QUALITY & STREAM ENGINE
// ------------------------------------------
async function updateDataGuard() {
    try {
        const res = await fetch('/dataguard');
        const data = await res.json();

        const scoreEl = document.getElementById('dgScore');
        const statusEl = document.getElementById('dgStatus');
        const latEl = document.getElementById('dgLatency');
        const schemaEl = document.getElementById('dgSchema');
        const driftEl = document.getElementById('dgDrift');
        const outEl = document.getElementById('dgOutliers');

        if (scoreEl) scoreEl.innerText = `${data.quality_score}%`;
        if (statusEl) {
            statusEl.innerText = data.status;
            statusEl.style.color = data.status === 'HEALTHY' ? '#10b981' : data.status === 'DEGRADED' ? '#f59e0b' : '#ef4444';
        }
        if (latEl) latEl.innerText = `${data.freshness_latency_sec}s`;
        if (schemaEl) schemaEl.innerText = `${data.schema_validity}%`;
        if (driftEl) driftEl.innerText = `${data.drift_index}`;
        if (outEl) outEl.innerText = `${data.outlier_count}`;
    } catch (e) {
        console.warn("DataGuard check error:", e);
    }
}

async function updateIntegrityScore() {
    try {
        const res = await fetch('/integrity');
        const data = await res.json();

        const overallEl = document.getElementById('integrityOverallVal');
        const badgeEl = document.getElementById('integrityStatusBadge');
        const ringEl = document.getElementById('integrityRing');

        if (overallEl) overallEl.innerText = `${data.overall_score}%`;
        if (ringEl) {
            const angle = (data.overall_score / 100) * 360;
            ringEl.style.setProperty('--int-angle', `${angle}deg`);
        }

        if (badgeEl) {
            badgeEl.innerText = data.status;
            badgeEl.className = 'integrity-badge ' + (
                data.status === 'OPTIMAL' ? 'optimal' :
                data.status === 'STABLE' ? 'optimal' :
                data.status === 'ATTENTION REQUIRED' ? 'attention' : 'critical'
            );
        }

        const s = data.sectors;
        if (s) {
            if (document.getElementById('int-Mfg')) document.getElementById('int-Mfg').innerText = `${s.Manufacturing || 100}%`;
            if (document.getElementById('int-City')) document.getElementById('int-City').innerText = `${s['Smart City'] || 100}%`;
            if (document.getElementById('int-Biz')) document.getElementById('int-Biz').innerText = `${s.Business || 100}%`;
            if (document.getElementById('int-Health')) document.getElementById('int-Health').innerText = `${s.Healthcare || 100}%`;
        }
    } catch (e) {
        console.warn("Integrity check error:", e);
    }
}

// ------------------------------------------
// 2. ENSEMBLE ANOMALY & PREDICTIVE MAINTENANCE
// ------------------------------------------
async function updateEnsembleView() {
    const tbody = document.getElementById('ensembleTableBody');
    if (!tbody) return;
    try {
        const res = await fetch('/ensemble_anomaly');
        const data = await res.json();

        tbody.innerHTML = Object.keys(data).map(metric => {
            const item = data[metric];
            const currentVal = window.lastDataState ? window.lastDataState[metric] || '-' : '-';
            const icon = window.lastIcons ? window.lastIcons[metric] || '📊' : '📊';
            return `
                <tr>
                    <td><b>${icon} ${metric}</b></td>
                    <td><b>${currentVal}</b></td>
                    <td>${item.models.isolation_forest.toFixed(2)}</td>
                    <td>${item.models.z_score.toFixed(2)}</td>
                    <td>${item.models.volatility.toFixed(2)}</td>
                    <td><b style="color: ${item.ensemble_score > 0.5 ? '#ef4444' : '#10b981'}">${item.ensemble_score.toFixed(3)}</b></td>
                    <td><span class="sev-badge ${item.severity}">${item.severity}</span></td>
                    <td><b style="color: ${item.failure_probability_24h > 50 ? '#f59e0b' : '#34d399'}">${item.failure_probability_24h}%</b></td>
                    <td><button class="forecast-btn" onclick="showDetails('${metric}')">Inspect</button></td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="9" style="color:red; text-align:center;">Failed to load ensemble.</td></tr>';
    }
}

// ------------------------------------------
// 3. ROOT CAUSE & BUSINESS IMPACT HUB
// ------------------------------------------
async function updateBusinessImpactView() {
    try {
        const res = await fetch('/business_impact');
        const data = await res.json();

        document.getElementById('impactTotalLoss').innerText = data.total_at_risk_inr;
        document.getElementById('impactMaxDowntime').innerText = data.max_downtime_hrs;
        document.getElementById('impactActiveCount').innerText = data.active_risk_count;

        const container = document.getElementById('impactBreakdownList');
        if (!container) return;

        if (data.impact_breakdown.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 30px; opacity: 0.7; grid-column: 1 / -1;">✅ No active business risks detected. All streams operating within nominal bounds.</div>';
            return;
        }

        container.innerHTML = data.impact_breakdown.map(item => `
            <div class="impact-item-card">
                <div class="impact-item-header">
                    <b>${item.metric} (Val: ${item.current_val})</b>
                    <span class="sev-badge ${item.severity}">${item.severity}</span>
                </div>
                <div class="impact-item-body">
                    <div>Estimated Loss: <b style="color:#ef4444">${item.financial_loss_inr}</b></div>
                    <div>Est. Downtime: <b>${item.downtime_hrs}</b></div>
                    <div>SLA Breach Risk: <b style="color:#f59e0b">${item.sla_risk}</b></div>
                    <div>24h Failure Prob: <b>${item.failure_probability}</b></div>
                </div>
                <div class="impact-rca-box">
                    <b>🔬 Root Cause Hypothesis:</b><br>
                    <span>${item.root_cause}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.warn("Business impact error:", e);
    }
}

// ------------------------------------------
// 4. WHAT-IF SCENARIO SIMULATOR 2.0
// ------------------------------------------
async function updateWhatIfSim() {
    const prod = parseInt(document.getElementById('sliderProd').value);
    const staff = parseInt(document.getElementById('sliderStaff').value);
    const demand = parseInt(document.getElementById('sliderDemand').value);
    const sensor = parseInt(document.getElementById('sliderSensor').value);

    document.getElementById('valProdSlider').innerText = (prod >= 0 ? '+' : '') + prod + '%';
    document.getElementById('valStaffSlider').innerText = (staff >= 0 ? '+' : '') + staff + '%';
    document.getElementById('valDemandSlider').innerText = (demand >= 0 ? '+' : '') + demand + '%';
    document.getElementById('valSensorSlider').innerText = (sensor >= 0 ? '+' : '') + sensor + '%';

    try {
        const res = await fetch(`/simulate_scenario_2?prod=${prod}&staff=${staff}&demand=${demand}&sensor=${sensor}`);
        const data = await res.json();

        document.getElementById('simRev').innerText = data.projected_revenue.toLocaleString();
        document.getElementById('simDefects').innerText = `${data.projected_defects} / min`;
        document.getElementById('simUnitCost').innerText = `₹${data.projected_unit_cost}`;
        document.getElementById('simProb').innerText = data.predicted_anomaly_probability;

        const banner = document.getElementById('simRiskBanner');
        document.getElementById('simRiskLabel').innerText = data.risk_level;
        document.getElementById('simNetFinancial').innerText = `${data.net_financial_delta_inr} Projected Financial Variance`;

        if (data.risk_level.includes('SAFE')) {
            banner.style.background = 'rgba(16, 185, 129, 0.15)';
            banner.style.borderColor = '#10b981';
            banner.style.color = '#34d399';
        } else if (data.risk_level.includes('MODERATE')) {
            banner.style.background = 'rgba(245, 158, 11, 0.15)';
            banner.style.borderColor = '#f59e0b';
            banner.style.color = '#fbbf24';
        } else {
            banner.style.background = 'rgba(239, 68, 68, 0.15)';
            banner.style.borderColor = '#ef4444';
            banner.style.color = '#f87171';
        }

        document.getElementById('simAdvisoryText').innerText = data.recommendation;
    } catch (e) {
        console.warn("Scenario simulator error:", e);
    }
}

function resetWhatIfSliders() {
    document.getElementById('sliderProd').value = 0;
    document.getElementById('sliderStaff').value = 0;
    document.getElementById('sliderDemand').value = 0;
    document.getElementById('sliderSensor').value = 0;
    updateWhatIfSim();
}

// ------------------------------------------
// 5. AGENTIC AI & RAG SOP ASSISTANT
// ------------------------------------------
async function runAgentConsultation() {
    const metric = document.getElementById('agentMetricSelect').value || 'Defects Count';
    const container = document.getElementById('agentChatContainer');
    container.innerHTML = '<div style="text-align: center; padding: 20px;">🤖 Orchestrating 4-Agent Decision Chain...</div>';

    try {
        const res = await fetch('/agentic_consult?metric=' + encodeURIComponent(metric));
        const data = await res.json();

        container.innerHTML = data.agents.map(ag => `
            <div class="agent-card">
                <div class="agent-card-header">
                    <b>${ag.icon} ${ag.role}</b>
                    <span class="agent-badge">${ag.badge}</span>
                </div>
                <div style="font-size: 0.88em; line-height: 1.5; white-space: pre-line;">${ag.message}</div>
            </div>
        `).join('');

        // Also trigger RAG lookup for that metric
        searchSOPKnowledge(metric);
    } catch (e) {
        container.innerHTML = '<div style="color:red; padding: 20px;">Failed to consult AI agents.</div>';
    }
}

async function searchSOPKnowledge(forcedQuery = null) {
    const query = forcedQuery || document.getElementById('ragQueryInput').value || 'cooling';
    const container = document.getElementById('ragResultsContainer');
    container.innerHTML = '<div style="text-align: center; padding: 20px;">Searching enterprise SOP knowledge base...</div>';

    try {
        const res = await fetch('/rag_search?query=' + encodeURIComponent(query));
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            container.innerHTML = '<div style="opacity: 0.7; padding: 20px;">No exact SOP match found. Try querying "defects", "cooling", "beds", or "traffic".</div>';
            return;
        }

        container.innerHTML = data.results.map(sop => `
            <div class="sop-card">
                <div class="sop-title">${sop.id}: ${sop.title}</div>
                <div style="font-size: 0.8em; opacity: 0.8; margin-bottom: 8px;">Sector: <b>${sop.sector}</b></div>
                <ul class="sop-steps">
                    ${sop.steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div style="color:red; padding: 20px;">Failed to search SOP repository.</div>';
    }
}

// ------------------------------------------
// 6. INCIDENT MANAGEMENT & FEEDBACK LOOP
// ------------------------------------------
async function loadIncidents() {
    const container = document.getElementById('incidentListContainer');
    if (!container) return;

    try {
        const res = await fetch('/incidents');
        const incidents = await res.json();

        // Load stats
        const statsRes = await fetch('/feedback_stats');
        const stats = await statsRes.json();
        document.getElementById('fbAccuracy').innerText = stats.accuracy_rate;
        document.getElementById('fbApprovedCount').innerText = `${stats.approved_count} / ${stats.total_feedbacks}`;

        if (incidents.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.7;">No active or historic incidents.</div>';
            return;
        }

        container.innerHTML = incidents.map(inc => `
            <div class="incident-card">
                <div class="inc-header">
                    <div>
                        <b>${inc.id}: ${inc.title}</b>
                        <div style="font-size: 0.8em; opacity: 0.7; margin-top: 3px;">Created: ${inc.created_at} | Assigned: <b>${inc.assigned_to}</b></div>
                    </div>
                    <div class="inc-status-pills">
                        <button class="inc-status-btn ${inc.status === 'OPEN' ? 'active' : ''}" onclick="changeIncidentStatus('${inc.id}', 'OPEN')">OPEN</button>
                        <button class="inc-status-btn ${inc.status === 'INVESTIGATING' ? 'active' : ''}" onclick="changeIncidentStatus('${inc.id}', 'INVESTIGATING')">INVESTIGATING</button>
                        <button class="inc-status-btn ${inc.status === 'MITIGATED' ? 'active' : ''}" onclick="changeIncidentStatus('${inc.id}', 'MITIGATED')">MITIGATED</button>
                        <button class="inc-status-btn ${inc.status === 'RESOLVED' ? 'active' : ''}" onclick="changeIncidentStatus('${inc.id}', 'RESOLVED')">RESOLVED</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85em;">
                    <div>Financial Risk: <b style="color: #ef4444">${inc.impact_cost}</b></div>
                    <div>Downtime Impact: <b>${inc.downtime}</b></div>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; font-size: 0.85em;">
                    <b>🤖 AI Recommended Remediation:</b><br>
                    <span>${inc.recommended_action}</span>
                </div>

                <div class="inc-action-row">
                    <span style="font-size: 0.85em; font-weight: 600;">Human-in-the-Loop Validation:</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="fb-btn approve" onclick="submitFeedback('${inc.id}', 'APPROVED')">👍 Approve &amp; Resolve</button>
                        <button class="fb-btn adjust" onclick="submitFeedback('${inc.id}', 'ADJUSTED')">✏️ Adjust Action</button>
                        <button class="fb-btn reject" onclick="submitFeedback('${inc.id}', 'REJECTED')">👎 Reject Hypothesis</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div style="color:red; text-align:center;">Failed to load incidents.</div>';
    }
}

async function changeIncidentStatus(incId, newStatus) {
    await fetch(`/incidents?id=${incId}&status=${newStatus}`, { method: 'POST' });
    showToast("Status Updated", `Incident ${incId} marked as ${newStatus}`, "info");
    loadIncidents();
}

async function submitFeedback(incId, action) {
    const comment = prompt(`Enter feedback rationale for ${action}:`, action === 'APPROVED' ? "Remediation verified by operator" : "Adjusted per manual review");
    if (comment === null) return;

    await fetch(`/feedback?id=${incId}&action=${action}&comment=${encodeURIComponent(comment)}`, { method: 'POST' });
    showToast("Feedback Logged", `Human validation (${action}) saved to continuous learning model.`, "info");
    loadIncidents();
}

// ------------------------------------------
// MAIN REAL-TIME STREAMING & DATA DISPATCHER
// ------------------------------------------
async function loadAllData() {
    const res = await fetch('/data');
    const json = await res.json();

    window.lastDataState = json.data;
    window.lastIcons = json.icons;

    // Update Story
    document.getElementById('aiStorySimple').innerHTML = "🤖 <b>System Insight:</b> " + json.ai_story;

    // Cache alerts
    rawAlertsCache = json.alerts || [];

    // Trigger Toast and sound for new alerts
    if (rawAlertsCache.length > lastAlertCount) {
        const newAlert = rawAlertsCache[0];
        const isCrit = newAlert.msg.toLowerCase().includes('critical') || newAlert.msg.toLowerCase().includes('anomaly') || newAlert.msg.toLowerCase().includes('emergency');
        const type = isCrit ? 'critical' : 'info';
        showToast(newAlert.metric, newAlert.msg, type);
        playAlertChime(isCrit);
        lastAlertCount = rawAlertsCache.length;
    }

    renderAlerts();

    // Update Landing Overview Cards
    updateOverview("Business", json, "Revenue");
    updateOverview("Healthcare", json, "Patient Count");
    updateOverview("Manufacturing", json, "Prod Rate");
    updateOverview("Smart City", json, "Traffic Vol");

    // Update Detailed Grid
    const container = document.getElementById("cards");
    if (container) {
        const histRes = await fetch('/history');
        const history = await histRes.json();

        for (const key in json.data) {
            const sector = metricSectors[key] || "Other";
            const matchesSearch = key.toLowerCase().includes(searchQuery);
            const matchesSector = currentSector === 'All' || sector === currentSector;
            let card = document.getElementById('card-' + key);

            if (matchesSearch && matchesSector) {
                if (!card) {
                    card = createCard(key, json);
                    container.appendChild(card);
                }
                updateEnterpriseCard(card, key, json, history[key]);
            } else if (card) {
                card.remove();
            }
        }
    }

    updateDataGuard();
    updateIntegrityScore();

    // If active on specific tabs, refresh them too
    if (currentMainView === 'ensembleMLView') updateEnsembleView();
    if (currentMainView === 'businessImpactView') updateBusinessImpactView();
}

const metricSectors = {
    "Prod Rate": "Manufacturing", "Defects Count": "Manufacturing", "Raw Inv": "Manufacturing", "Finished Inv": "Manufacturing",
    "Workers On-Site": "Manufacturing", "Unit Cost": "Manufacturing", "Safety Alert": "Manufacturing",
    "Traffic Vol": "Smart City", "Congestion Lvl": "Smart City", "City Events": "Smart City", "Air Quality": "Smart City", "Power Usage": "Smart City",
    "Revenue": "Business", "Sales": "Business", "Orders": "Business", "Net Profit": "Business", "Customers": "Business",
    "Patient Count": "Healthcare", "Critical Cases": "Healthcare", "Beds Avail": "Healthcare", "Staff On-Duty": "Healthcare", "Treatments": "Healthcare"
};

function quickFilterSector(sec) {
    switchMainView('liveStreamView', document.querySelectorAll('.nav-tab')[0]);
    filterSector(sec);
}

function filterSector(sector) {
    currentSector = sector;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.includes(sector) || (sector === 'All' && btn.innerText.includes('All')));
    });
    loadAllData();
}

function filterAlerts(filterType, btn) {
    currentAlertFilter = filterType;
    document.querySelectorAll('.alert-filter-btn').forEach(b => {
        if (!b.classList.contains('clear-btn')) b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
    renderAlerts();
}

function renderAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    let filtered = rawAlertsCache;
    if (currentAlertFilter === 'Critical') {
        filtered = rawAlertsCache.filter(a => a.msg.toLowerCase().includes('critical') || a.msg.toLowerCase().includes('emergency') || a.msg.toLowerCase().includes('breach'));
    } else if (currentAlertFilter === 'Anomaly') {
        filtered = rawAlertsCache.filter(a => a.msg.toLowerCase().includes('anomaly') || a.msg.toLowerCase().includes('spike') || a.msg.toLowerCase().includes('surge'));
    }

    if (filtered.length === 0) {
        alertsList.innerHTML = '<li style="opacity: 0.6; padding: 10px;">No alerts matching current filter.</li>';
        return;
    }

    alertsList.innerHTML = filtered.map(a => {
        const isCrit = a.msg.toLowerCase().includes('critical') || a.msg.toLowerCase().includes('emergency');
        return `
            <li style="border-left: 4px solid ${isCrit ? '#ef4444' : '#6366f1'}; padding-left: 10px;">
                <span><b>${a.metric}</b>: ${a.msg}</span>
                <span style="opacity:0.6">${new Date(a.time).toLocaleTimeString()}</span>
            </li>
        `;
    }).join('');
}

async function clearAllAlerts() {
    await fetch('/clear_alerts');
    rawAlertsCache = [];
    lastAlertCount = 0;
    renderAlerts();
    showToast("Alerts Cleared", "Alert log has been reset", "info");
}

function updateOverview(sector, json, mainMetric) {
    const val = json.data[mainMetric];
    const comp = json.comparison[mainMetric] || 0;
    const arrowClass = comp >= 0 ? "up" : "down";
    const arrow = comp >= 0 ? "↑" : "↓";

    const el = document.getElementById(`val-${sector}`);
    if (el) el.innerHTML = `${val.toLocaleString()} <span class="${arrowClass}">${arrow} ${Math.abs(comp).toFixed(1)}%</span>`;

    let percent = Math.min(100, Math.max(10, (val / (val > 1000 ? 5000 : 200)) * 100));
    const bar = document.getElementById(`bar-${sector}`);
    if (bar) bar.style.width = percent + "%";
}

function createCard(key, json) {
    const div = document.createElement('div');
    div.id = 'card-' + key;
    div.className = "card";
    return div;
}

function updateEnterpriseCard(div, key, json, history) {
    const val = json.data[key];
    const comp = json.comparison[key] || 0;
    const arrowClass = comp >= 0 ? "up" : "down";
    const arrow = comp >= 0 ? "↗" : "↘";
    let percent = Math.min(100, Math.max(10, (val / (val > 1000 ? 5000 : 200)) * 100));

    div.onclick = () => showDetails(key);
    div.innerHTML = `
        <div class="title" style="display:flex; justify-content:space-between">
            <span>${json.icons[key]} ${key}</span>
            <span class="${arrowClass}">${arrow} ${Math.abs(comp).toFixed(1)}%</span>
        </div>
        <div style="margin: 15px 0">
            <h2 style="margin:0; font-size:2em">${val.toLocaleString()}</h2>
            <span style="padding:2px 10px; border-radius:10px; font-size:0.8em; background:${json.gradient[key]}">${json.status[key]}</span>
        </div>
        <div style="background:rgba(255,255,255,0.1); height:6px; border-radius:5px; overflow:hidden">
            <div style="width:${percent}%; height:100%; background:${json.gradient[key]}"></div>
        </div>
    `;
}

// Modals, Forecasts, and Detail View
function showDetails(key) {
    currentKey = key;
    document.getElementById('modalTitle').innerText = key + " Analysis";
    document.getElementById('detailModal').style.display = 'flex';
    fetchHistory(key);
}

function closeModal() { document.getElementById('detailModal').style.display = 'none'; }
function toggleTheme() { document.body.classList.toggle('dark-mode'); }
function downloadCSV() { window.location.href = "/download_csv"; }
function handleSearch() { searchQuery = document.getElementById('searchInput').value.toLowerCase(); loadAllData(); }

async function showCorrelationsModal() {
    const modal = document.getElementById('corrModal');
    modal.style.display = 'flex';
    const container = document.getElementById('corrMatrixContainer');
    try {
        const res = await fetch('/correlations');
        const data = await res.json();
        const metrics = data.metrics;
        const matrix = data.matrix;

        let html = '<table class="corr-table"><thead><tr><th>Metric</th>';
        metrics.forEach(m => html += `<th>${m}</th>`);
        html += '</tr></thead><tbody>';

        metrics.forEach(rowKey => {
            html += `<tr><th><b>${rowKey}</b></th>`;
            metrics.forEach(colKey => {
                const val = matrix[rowKey] ? matrix[rowKey][colKey] || 0 : 0;
                let bg = '#f8fafc';
                let color = '#333';
                if (val > 0.5) { bg = '#dcfce7'; color = '#15803d'; }
                else if (val > 0.2) { bg = '#f0fdf4'; color = '#166534'; }
                else if (val < -0.5) { bg = '#fee2e2'; color = '#b91c1c'; }
                else if (val < -0.2) { bg = '#fef2f2'; color = '#991b1b'; }

                html += `<td><span class="corr-val" style="background:${bg}; color:${color}">${val > 0 ? '+' : ''}${val.toFixed(2)}</span></td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div style="color:red; text-align:center; padding:20px;">Failed to load correlations.</div>';
    }
}

function closeCorrelationsModal() { document.getElementById('corrModal').style.display = 'none'; }

function switchForecastModel(modelType, btn) {
    currentForecastModel = modelType;
    document.querySelectorAll('.forecast-btn').forEach(b => {
        if (!b.classList.contains('export-btn')) b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
    if (cachedMetricData) renderChartWithModel(cachedMetricData);
}

function renderChartWithModel(data) {
    const ctx = document.getElementById('historyChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();

    const values = data.values;
    const len = values.length;
    const labels = Array.from({ length: len + 5 }, (_, i) => `T${i + 1}`);

    const datasets = [{
        label: 'Historical Trend',
        data: values,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 3
    }];

    if (currentForecastModel === 'linear') {
        datasets.push({
            label: 'AI Linear Forecast (+5 Ticks)',
            data: Array(len - 1).fill(null).concat([values[len - 1], data.prediction]),
            borderColor: '#ff4d4d',
            borderDash: [5, 5],
            pointRadius: 6,
            pointStyle: 'star'
        });
    } else if (currentForecastModel === 'ma') {
        const ma = [];
        for (let i = 0; i < len; i++) {
            if (i < 2) { ma.push(values[i]); }
            else { ma.push((values[i] + values[i-1] + values[i-2]) / 3); }
        }
        datasets.push({
            label: '3-Period Moving Average',
            data: ma,
            borderColor: '#10b981',
            borderDash: [3, 3],
            tension: 0.4,
            fill: false
        });
    } else if (currentForecastModel === 'band') {
        const std = Math.sqrt(data.rolling.variance) || 5;
        const upper = values.map(v => v + std * 1.96);
        const lower = values.map(v => Math.max(0, v - std * 1.96));

        datasets.push({
            label: '95% Upper Bound',
            data: upper,
            borderColor: 'rgba(245, 158, 11, 0.4)',
            borderDash: [2, 2],
            fill: '+1',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            pointRadius: 0
        }, {
            label: '95% Lower Bound',
            data: lower,
            borderColor: 'rgba(245, 158, 11, 0.4)',
            borderDash: [2, 2],
            fill: false,
            pointRadius: 0
        });
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

function exportCurrentMetricCSV() {
    if (!cachedMetricData || !currentKey) return;
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Timestamp_Index,Metric,Value\n"
        + cachedMetricData.values.map((v, i) => `${i + 1},${currentKey},${v}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentKey.replace(/\s+/g, '_')}_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function fetchHistory(key) {
    const res = await fetch('/history?metric=' + key);
    const data = await res.json();
    cachedMetricData = data;

    const extRes = await fetch('/details_ext?metric=' + key);
    const extData = await extRes.json();

    renderChartWithModel(data);

    const anomalyEl = document.getElementById('anomalyText');
    anomalyEl.innerHTML = `
        <div style="margin-bottom:10px">${data.anomaly} <span style="font-size:0.8em; color:#a5b4fc">(Confidence: ${data.confidence.toFixed(1)}%)</span></div>
        <div style="font-size:0.9em; background:rgba(0,0,0,0.05); padding:10px; border-radius:10px;">
            <b>Root Cause Investigation (XAI):</b><br>
            <span style="color:#555">${extData.root_cause || "Analyzing correlations..."}</span>
        </div>
        <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.85em;">
            <div class="rep-card" style="border:none; background:#f8fafc">Window Avg: <b>${data.rolling.avg.toFixed(1)}</b></div>
            <div class="rep-card" style="border:none; background:#f8fafc">Peak Value: <b>${data.rolling.peak.toFixed(1)}</b></div>
        </div>
    `;

    const slider = document.getElementById('simSlider');
    const val = data.values[data.values.length - 1];
    currentVal = val;
    slider.min = Math.floor(val * 0.1);
    slider.max = Math.ceil(val * 2);
    slider.value = val;
    document.getElementById('simResult').innerHTML = `Current Value: ${val.toLocaleString()} | <b>AI Forecast: Stable</b>`;
}

function runSimulation() {
    const slider = document.getElementById('simSlider');
    const result = document.getElementById('simResult');
    const newVal = parseInt(slider.value);

    const diff = ((newVal - currentVal) / currentVal) * 100;
    let prediction = "Stable Trend";
    if (diff > 25) prediction = "⚠️ High Impact Risk (System Stress)";
    else if (diff < -25) prediction = "📉 Efficiency Drop Predicted";
    else prediction = "✅ Within Operational Safe Zone";

    result.innerHTML = `Simulated Value: ${newVal.toLocaleString()} | <b>AI Forecast: ${prediction}</b>`;
}

function showToast(title, msg, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="font-size: 1.5em">${type === 'critical' ? '🚨' : '🔔'}</div>
        <div>
            <div style="font-weight: bold; font-size: 1.05em">${title}</div>
            <div style="font-size: 0.85em; opacity: 0.85; margin-top: 2px;">${msg}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

async function updateHealthStatus() {
    try {
        const res = await fetch('/health');
        const data = await res.json();
        const footer = document.getElementById('healthStatus');
        if (footer) {
            footer.innerHTML = `🟢 System Online | ${data.service} | Uptime: ${data.uptime.toFixed(1)}s`;
            footer.style.color = "#00ff88";
        }
    } catch (e) {
        const footer = document.getElementById('healthStatus');
        if (footer) footer.innerHTML = "🔴 System Offline";
    }
}

async function generateReport() {
    const res = await fetch('/data');
    const json = await res.json();
    const dgRes = await fetch('/dataguard');
    const dg = await dgRes.json();
    const impactRes = await fetch('/business_impact');
    const impact = await impactRes.json();

    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>RT-AIDIS 2.0 - Enterprise Performance & Decision Audit</title>
            <meta charset="UTF-8">
            <style>
                * { box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; 
                    padding: 30px 40px; 
                    color: #333; 
                    background: #fdfdfd;
                    margin: 0;
                }
                .report-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.12);
                }
                .nav-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: #ffffff;
                    padding: 8px 18px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .nav-btn:hover { background: rgba(255, 255, 255, 0.3); }
                .nav-btn.primary { background: #8b5cf6; border-color: #a78bfa; }
                .rep-header { border-bottom: 2px solid #8e44ad; padding-bottom: 20px; text-align: center; }
                .rep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
                .rep-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; background: #ffffff; }
                h1 { color: #1e1b4b; margin: 10px 0; }
                h2 { color: #4b0082; margin-top: 25px; font-size: 1.2rem; }
                @media print { .no-print, .report-nav { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="report-nav no-print">
                <button class="nav-btn" onclick="window.close()">⬅ Back to Platform</button>
                <div style="font-size: 14px; font-weight: 600;">🛡️ RT-AIDIS 2.0 Enterprise Audit</div>
                <button class="nav-btn primary" onclick="window.print()">🖨️ Print / Save PDF</button>
            </div>

            <div class="rep-header">
                <span style="float: right; opacity: 0.6; font-size: 0.9em;">${new Date().toLocaleString()}</span>
                <h1>RT-AIDIS 2.0 Enterprise Audit Report</h1>
                <p>DataGuard Hygiene: <b>${dg.quality_score}% (${dg.status})</b> | Financial Risk at Stake: <b>${impact.total_at_risk_inr}</b></p>
            </div>
            
            <h2>Global AI Decision Insight</h2>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px;">${json.ai_story}</div>

            <h2>Live Metric &amp; Stream Overview</h2>
            <div class="rep-grid">
                ${Object.keys(json.data).map(key => `
                    <div class="rep-card">
                        <b>${json.icons[key] || '📊'} ${key}</b>: <b>${json.data[key].toLocaleString()}</b>
                        <div style="color: ${json.comparison[key] >= 0 ? '#16a34a' : '#dc2626'}; font-size: 0.85em; margin-top: 4px;">
                            Trend: ${json.comparison[key].toFixed(1)}% | Status: ${json.status[key]}
                        </div>
                    </div>
                `).join('')}
            </div>

            <footer style="margin-top: 40px; text-align: center; font-size: 0.8em; opacity: 0.5;">
                Confidential Enterprise Report • RT-AIDIS 2.0 Autonomous Decision Platform
            </footer>
        </body>
        </html>
    `);
    win.document.close();
    win.print();
}

// Global Pollers
loadAllData();
setInterval(loadAllData, 2500);
setInterval(updateHealthStatus, 10000);
