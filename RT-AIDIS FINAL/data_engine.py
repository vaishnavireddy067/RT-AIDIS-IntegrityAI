import random
import time
import threading
import numpy as np
import datetime
from sklearn.linear_model import LinearRegression

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

# -----------------------------
# STATUS & TREND LOGIC
# -----------------------------
def get_status(metric, value):
    # Intelligent Alert Engine (Trend + Velocity aware)
    history = history_data.get(metric, [])
    velocity = 0
    if len(history) > 3:
        velocity = (history[-1] - history[-3]) / 2 # Rate of change
    
    if "Safety" in metric:
        return "CRITICAL" if value > 0 else "Secure"
    if "Defects" in metric:
        if velocity > 1: return "High Risk" # Alert based on velocity
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

# -----------------------------
# AI/ML & ADVANCED ANALYTICS
# -----------------------------
def get_prediction(metric):
    data = history_data[metric]
    if len(data) < 10: return 0
    X = np.array(range(len(data))).reshape(-1, 1)
    y = np.array(data).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)
    next_step = np.array([[len(data) + 5]]) # Predict 5 steps ahead
    prediction = model.predict(next_step)
    return float(prediction[0][0])

def analyze_anomaly_ml(metric):
    data = history_data[metric]
    if len(data) < 10: return {"status": "Collecting data...", "confidence": 0}
    
    # Statistical Anomaly Detection (Z-Score)
    mean = np.mean(data)
    std_dev = np.std(data)
    if std_dev == 0: return {"status": "Stable Stream", "confidence": 100}
    
    current = data[-1]
    z_score = (current - mean) / std_dev
    
    # Confidence Score Logic
    confidence = min(99, 50 + abs(z_score) * 10)
    
    if abs(z_score) > 2.5:
        log_alert(metric, current, "Statistical Anomaly Detected")
        return {"status": f"⚠️ ANOMALY (Z:{z_score:.2f})", "confidence": confidence}
    return {"status": "✅ Normal Range", "confidence": confidence}

def get_rolling_analytics(metric):
    data = history_data[metric]
    if not data: return {}
    window = data[-10:] # Last 10 points
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
    # Explainable AI (XAI) Logic
    if status in ["CRITICAL", "High", "Poor", "High Risk", "Congestion Spike"]:
        causes = []
        # Correlation checking
        if metric == "Congestion Lvl" and data_state["Traffic Vol"] > 80:
            causes.append("Excessive Traffic Volume")
        if metric == "Defects Count" and data_state["Prod Rate"] > 120:
            causes.append("High Production Velocity")
        if metric == "Patient Count" and data_state["Staff On-Duty"] < 25:
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

# -----------------------------
# BACKGROUND DATA UPDATER
# -----------------------------
def _update_loop_():
    global previous_state
    while True:
        previous_state = data_state.copy()
        for key in data_state:
            # Sector-specific simulation
            if key in ["Revenue", "Net Profit", "Unit Cost"]:
                data_state[key] += random.choice([-5, 5, -2, 2, 0])
            elif key in ["Safety Alert", "Congestion Lvl"]:
                if random.random() > 0.95: data_state[key] = random.randint(0, 2)
            elif "Inv" in key or "Usage" in key or "Traffic" in key:
                data_state[key] += random.randint(-5, 5)
            else:
                data_state[key] += random.randint(-2, 2)
            
            # Bounds
            data_state[key] = max(0, data_state[key])
            
        for key in data_state:
            history_data[key].append(data_state[key])
            if len(history_data[key]) > 50: history_data[key].pop(0)

        time.sleep(2)

def start_background_thread():
    threading.Thread(target=_update_loop_, daemon=True).start()
