// RT-AIDIS 2.0 Landing Page Interactive Engine

document.addEventListener('DOMContentLoaded', () => {
    initParticleCanvas();
    initTelemetryPolling();
    initSandboxController();
    initAnimatedCounters();
});

// 1. Cybernetic Particle Canvas Background
function initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    const particles = [];
    const count = Math.min(Math.floor(width / 22), 65);
    
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.6 + 0.8,
            alpha: Math.random() * 0.5 + 0.2
        });
    }
    
    function render() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < count; i++) {
            const p1 = particles[i];
            p1.x += p1.vx;
            p1.y += p1.vy;
            
            if (p1.x < 0) p1.x = width;
            if (p1.x > width) p1.x = 0;
            if (p1.y < 0) p1.y = height;
            if (p1.y > height) p1.y = 0;
            
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${p1.alpha})`;
            ctx.fill();
            
            for (let j = i + 1; j < count; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(129, 140, 248, ${0.18 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(render);
    }
    render();
}

// 2. Real-time Live Telemetry Polling
function initTelemetryPolling() {
    async function updateTelemetry() {
        try {
            const [dataRes, integrityRes] = await Promise.all([
                fetch('/data').then(r => r.json()).catch(() => null),
                fetch('/integrity').then(r => r.json()).catch(() => null)
            ]);
            
            if (integrityRes) {
                const scoreEl = document.getElementById('preview-integrity-score');
                const badgeEl = document.getElementById('preview-status-badge');
                if (scoreEl && integrityRes.score !== undefined) {
                    scoreEl.textContent = `${integrityRes.score}%`;
                }
                if (badgeEl && integrityRes.status) {
                    badgeEl.textContent = integrityRes.status;
                }
            }
            
            if (dataRes && dataRes.data) {
                const feedRows = document.getElementById('preview-feed-rows');
                if (feedRows) {
                    const entries = Object.entries(dataRes.data).slice(0, 4);
                    feedRows.innerHTML = entries.map(([k, v]) => {
                        const st = (dataRes.status && dataRes.status[k]) || 'Optimal';
                        const isWarn = st.toLowerCase().includes('critical') || st.toLowerCase().includes('high') || st.toLowerCase().includes('alert');
                        return `
                            <div class="feed-row">
                                <span class="feed-metric">${k}</span>
                                <span>${v}</span>
                                <span class="${isWarn ? 'feed-status-alert' : 'feed-status-ok'}">${st}</span>
                            </div>
                        `;
                    }).join('');
                }
                
                // Update live ticker values
                const tickerTrack = document.getElementById('ticker-track');
                if (tickerTrack) {
                    const items = Object.entries(dataRes.data).map(([k, v]) => {
                        const st = (dataRes.status && dataRes.status[k]) || 'Normal';
                        return `
                            <div class="ticker-item">
                                <span class="tag">${k}</span>
                                <span class="val">${v}</span>
                                <span>[${st}]</span>
                            </div>
                        `;
                    }).join('');
                    tickerTrack.innerHTML = items + items; // Duplicate for smooth infinite loop
                }
            }
        } catch (e) {
            console.debug("Telemetry polling fallback", e);
        }
    }
    
    updateTelemetry();
    setInterval(updateTelemetry, 3000);
}

// 3. Interactive Sandbox Anomaly Simulator
let selectedSandboxMetric = 'Turbine Vibration';

function initSandboxController() {
    const pills = document.querySelectorAll('.btn-sandbox-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedSandboxMetric = pill.getAttribute('data-metric');
        });
    });
    
    const triggerBtn = document.getElementById('btn-sandbox-trigger');
    const resetBtn = document.getElementById('btn-sandbox-reset');
    
    if (triggerBtn) {
        triggerBtn.addEventListener('click', async () => {
            triggerBtn.innerHTML = '⚡ Injecting Anomaly...';
            triggerBtn.disabled = true;
            
            try {
                const res = await fetch(`/inject_anomaly?metric=${encodeURIComponent(selectedSandboxMetric)}`, { method: 'POST' });
                const data = await res.json();
                
                const outEl = document.getElementById('sandbox-consensus-out');
                const valEl = document.getElementById('sandbox-metric-val');
                const statEl = document.getElementById('sandbox-anomaly-state');
                
                if (outEl) {
                    outEl.innerHTML = `⚠️ <strong style="color: #f87171;">Anomaly Injected in ${selectedSandboxMetric}!</strong> Isolation Forest Consensus: Contamination detected (Z-Score > 3.2σ). Automated RCA agent dispatched mitigation SOP.`;
                }
                if (valEl) valEl.textContent = 'SPIKE DETECTED';
                if (statEl) {
                    statEl.textContent = 'CRITICAL BREACH';
                    statEl.className = 'status-pill';
                    statEl.style.color = '#f87171';
                    statEl.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                    statEl.style.backgroundColor = 'rgba(248, 113, 113, 0.15)';
                }
            } catch (err) {
                console.error("Sandbox error", err);
            } finally {
                setTimeout(() => {
                    triggerBtn.innerHTML = '⚡ Trigger Test Anomaly';
                    triggerBtn.disabled = false;
                }, 1000);
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            try {
                await fetch('/clear_alerts', { method: 'POST' });
                const outEl = document.getElementById('sandbox-consensus-out');
                const valEl = document.getElementById('sandbox-metric-val');
                const statEl = document.getElementById('sandbox-anomaly-state');
                
                if (outEl) {
                    outEl.innerHTML = `✅ <strong style="color: #34d399;">Nominal System State.</strong> 4-Agent consensus reports all streams within 3-Sigma Gaussian confidence boundaries.`;
                }
                if (valEl) valEl.textContent = 'Nominal';
                if (statEl) {
                    statEl.textContent = 'SYSTEM OPTIMAL';
                    statEl.className = 'status-pill';
                    statEl.style.color = '#34d399';
                    statEl.style.borderColor = 'rgba(52, 211, 153, 0.25)';
                    statEl.style.backgroundColor = 'rgba(52, 211, 153, 0.1)';
                }
            } catch (e) {
                console.error("Reset error", e);
            }
        });
    }
}

// 4. Metric Number Counter Animation
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.counter-val');
    let hasAnimated = false;
    
    function checkScroll() {
        if (hasAnimated) return;
        const rect = counters[0]?.getBoundingClientRect();
        if (rect && rect.top <= window.innerHeight * 0.95) {
            hasAnimated = true;
            counters.forEach(counter => {
                const target = parseFloat(counter.getAttribute('data-target'));
                const suffix = counter.getAttribute('data-suffix') || '';
                const prefix = counter.getAttribute('data-prefix') || '';
                let current = 0;
                const step = target / 40;
                
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    const formatted = Number.isInteger(target) ? Math.round(current) : current.toFixed(2);
                    counter.textContent = `${prefix}${formatted}${suffix}`;
                }, 25);
            });
        }
    }
    
    window.addEventListener('scroll', checkScroll);
    checkScroll();
}
