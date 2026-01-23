// State
let isLoggedIn = false;
let currentSector = 'All';
let searchQuery = '';
let isAdvanced = false;
let lastAlertCount = 0;
let currentKey = '';
let currentVal = 0;

function attemptLogin() {
    const btn = document.querySelector('.login-btn');
    btn.innerHTML = "Authenticating...";
    btn.disabled = true;

    setTimeout(() => {
        document.getElementById('loginPortal').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';
        showToast("Access Granted", "Welcome to RT-AIDIS Control Panel", "info");
        isLoggedIn = true;
        updateHealthStatus();
    }, 1500);
}

function showArchitecture() {
    document.getElementById('archModal').style.display = 'flex';
}

function closeArchModal() {
    document.getElementById('archModal').style.display = 'none';
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
        document.getElementById('healthStatus').innerHTML = "🔴 System Offline";
    }
}

function runSimulation() {
    const slider = document.getElementById('simSlider');
    const result = document.getElementById('simResult');
    const newVal = parseInt(slider.value);

    // Simple AI math: if value > 20% of current, predict "Risk"
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
            <div style="font-weight: bold; font-size: 1.1em">${title}</div>
            <div style="font-size: 0.9em; opacity: 0.8">${msg}</div>
        </div>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    }, 4500);
}

// Navigation
function showAdvanced() {
    isAdvanced = true;
    document.getElementById('overviewPage').style.display = 'none';
    document.getElementById('advancedPage').style.display = 'block';
    loadData();
}

function showLanding() {
    isAdvanced = false;
    document.getElementById('overviewPage').style.display = 'block';
    document.getElementById('advancedPage').style.display = 'none';
    loadData();
}

function showSector(sector) {
    showAdvanced();
    filterSector(sector);
}

// Drag & Drop
function initSortable() {
    const el = document.getElementById('cards');
    if (el) {
        Sortable.create(el, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            group: 'shared'
        });
    }
}
initSortable();

// Tab Filtering
function filterSector(sector) {
    currentSector = sector;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.includes(sector) || (sector === 'All' && btn.innerText.includes('All')));
    });
    loadData();
}

const metricSectors = {
    "Prod Rate": "Manufacturing", "Defects Count": "Manufacturing", "Raw Inv": "Manufacturing", "Finished Inv": "Manufacturing",
    "Workers On-Site": "Manufacturing", "Unit Cost": "Manufacturing", "Safety Alert": "Manufacturing",
    "Traffic Vol": "Smart City", "Congestion Lvl": "Smart City", "City Events": "Smart City", "Air Quality": "Smart City", "Power Usage": "Smart City",
    "Revenue": "Business", "Sales": "Business", "Orders": "Business", "Net Profit": "Business", "Customers": "Business",
    "Patient Count": "Healthcare", "Critical Cases": "Healthcare", "Beds Avail": "Healthcare", "Staff On-Duty": "Healthcare", "Treatments": "Healthcare"
};

async function loadData() {
    const res = await fetch('/data');
    const json = await res.json();

    // Update Story on both views
    document.getElementById('aiStorySimple').innerHTML = "🤖 <b>System Insight:</b> " + json.ai_story;
    document.getElementById('aiStoryAdvanced').innerHTML = "🤖 <b>Advanced Logic:</b> Deep analysis in progress... " + json.ai_story;

    // Update Alerts
    const alertsList = document.getElementById('alertsList');
    if (alertsList && json.alerts) {
        // Trigger Toast for new alerts
        if (json.alerts.length > lastAlertCount) {
            const newAlert = json.alerts[0]; // Assuming alerts are sorted by time (latest first)
            const type = newAlert.msg.toLowerCase().includes('critical') || newAlert.msg.toLowerCase().includes('anomaly') ? 'critical' : 'info';
            showToast(newAlert.metric, newAlert.msg, type);
            lastAlertCount = json.alerts.length;
        }

        alertsList.innerHTML = json.alerts.map(a => `
            <li>
                <span><b>${a.metric}</b>: ${a.msg}</span>
                <span style="opacity:0.6">${new Date(a.time).toLocaleTimeString()}</span>
            </li>
        `).join('');
    }

    if (!isAdvanced) {
        // UPDATE LANDING PAGE (Simple 4-card View)
        updateOverview("Business", json, "Revenue");
        updateOverview("Healthcare", json, "Patient Count");
        updateOverview("Manufacturing", json, "Prod Rate");
        updateOverview("Smart City", json, "Traffic Vol");
    } else {
        // UPDATE ADVANCED PAGE (Enterprise Detailed View)
        const container = document.getElementById("cards");
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
}

function updateOverview(sector, json, mainMetric) {
    const val = json.data[mainMetric];
    const comp = json.comparison[mainMetric] || 0;
    const arrowClass = comp >= 0 ? "up" : "down";
    const arrow = comp >= 0 ? "↑" : "↓";

    document.getElementById(`val-${sector}`).innerHTML = `${val.toLocaleString()} <span class="${arrowClass}">${arrow} ${Math.abs(comp).toFixed(1)}%</span>`;

    // Scale bar
    let percent = Math.min(100, Math.max(10, (val / (val > 1000 ? 5000 : 200)) * 100));
    document.getElementById(`bar-${sector}`).style.width = percent + "%";
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

// Modals, Health Checks, etc.
function showDetails(key) {
    currentKey = key;
    document.getElementById('modalTitle').innerText = key + " Analysis";
    document.getElementById('detailModal').style.display = 'flex';
    fetchHistory(key);
}

function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function downloadCSV() { window.location.href = "/download_csv"; }

function shareDashboard() { alert("Link copied to clipboard!"); }


async function generateReport() {
    const res = await fetch('/data');
    const json = await res.json();
    const histRes = await fetch('/history');
    const history = await histRes.json();

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>RT-AIDIS - System Status Report</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                .rep-header { border-bottom: 2px solid #8e44ad; padding-bottom: 20px; text-align: center; }
                .rep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
                .rep-card { border: 1px solid #ddd; padding: 15px; border-radius: 10px; }
                h2 { color: #4b0082; }
                .timestamp { float: right; opacity: 0.6; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="rep-header">
                <span class="timestamp">${new Date().toLocaleString()}</span>
                <h1>RT-AIDIS System Performance Report</h1>
                <p>Generated by Intelligent Data Integration Engine v2.0</p>
            </div>
            
            <h2>Global AI Insight</h2>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 10px;">${json.ai_story}</div>

            <h2>Live Metric Overview</h2>
            <div class="rep-grid">
                ${Object.keys(json.data).map(key => `
                    <div class="rep-card">
                        <b>${json.icons[key]} ${key}</b>: ${json.data[key].toLocaleString()}
                        <div style="color: ${json.comparison[key] >= 0 ? 'green' : 'red'}; font-size: 0.8em;">
                            Trend: ${json.comparison[key].toFixed(1)}% | Status: ${json.status[key]}
                        </div>
                    </div>
                `).join('')}
            </div>

            <h2>System Alerts (Last 10)</h2>
            <ul>${json.alerts.map(a => `<li><b>${a.metric}</b>: ${a.msg} (${new Date(a.time).toLocaleTimeString()})</li>`).join('')}</ul>

            <footer style="margin-top: 50px; text-align: center; font-size: 0.8em; opacity: 0.5;">
                Confidential Report - Generated for Internal Audit Only
            </footer>
        </body>
        </html>
    `);
    win.document.close();
    win.print();
}

async function fetchHistory(key) {
    const res = await fetch('/history?metric=' + key);
    const data = await res.json();

    // Fetch Root Cause (XAI)
    const extRes = await fetch('/details_ext?metric=' + key);
    const extData = await extRes.json();

    const ctx = document.getElementById('historyChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 25 }, (_, i) => i), // Show 25 points including forecast
            datasets: [{
                label: 'Trend',
                data: data.values,
                borderColor: '#4f46e5',
                tension: 0.4,
                fill: false
            }, {
                label: 'AI Forecast (Next Step)',
                data: Array(data.values.length - 1).fill(null).concat([data.values[data.values.length - 1], data.prediction]),
                borderColor: '#ff4d4d',
                borderDash: [5, 5],
                pointRadius: 6,
                pointStyle: 'star'
            }]
        }
    });

    // Update UI Meta Info
    const anomalyEl = document.getElementById('anomalyText');
    const predEl = document.getElementById('predictionText');

    anomalyEl.innerHTML = `
        <div style="margin-bottom:10px">${data.anomaly} <span style="font-size:0.8em; color:#a5b4fc">(Confidence: ${data.confidence.toFixed(1)}%)</span></div>
        <div style="font-size:0.9em; background:rgba(0,0,0,0.05); padding:10px; border-radius:10px;">
            <b>Root Cause Investigation:</b><br>
            <span style="color:#555">${extData.root_cause || "Analyzing correlations..."}</span>
        </div>
        <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.85em;">
            <div class="rep-card" style="border:none; background:#f8fafc">Window Avg: <b>${data.rolling.avg.toFixed(1)}</b></div>
            <div class="rep-card" style="border:none; background:#f8fafc">Peak Value: <b>${data.rolling.peak.toFixed(1)}</b></div>
        </div>
    `;

    if (predEl) predEl.style.display = 'none'; // Merged into chart/anomaly

    // Init Simulation Slider
    const slider = document.getElementById('simSlider');
    const val = data.values[data.values.length - 1];
    currentVal = val;
    slider.min = Math.floor(val * 0.1);
    slider.max = Math.ceil(val * 2);
    slider.value = val;
    document.getElementById('simResult').innerHTML = `Current Value: ${val.toLocaleString()} | <b>AI Forecast: Stable</b>`;
}

loadData();
setInterval(loadData, 3000);
setInterval(updateHealthStatus, 10000);
