from flask import Flask, render_template, jsonify, send_file, request
import webbrowser
import socket
import io
import csv
import threading
import time
import data_engine

app = Flask(__name__)

# Start the background data simulation
data_engine.start_background_thread()

# -----------------------------
# ROUTES
# -----------------------------
@app.route("/")
def landing_page():
    return render_template("landing.html")

@app.route("/dashboard")
def dashboard():
    return render_template("index.html")

@app.route("/data")
def data_api():
    status = {}
    gradient = {}
    comparison = {}
    
    current_data = data_engine.data_state
    
    for k, v in current_data.items():
        st = data_engine.get_status(k, v)
        status[k] = st
        
        current_max = max(current_data.values())
        if current_max == 0: current_max = 1
        gradient[k] = data_engine.get_gradient((v / current_max) * 100)
        
        comparison[k] = data_engine.get_comparison(k, v)

    return jsonify({
        "data": current_data,
        "status": status,
        "gradient": gradient,
        "icons": data_engine.icons,
        "comparison": comparison,
        "ai_story": data_engine.generate_ai_story(),
        "alerts": data_engine.alerts_log
    })

@app.route("/details_ext")
def details_ext_api():
    """Extended details for the modal."""
    metric = request.args.get('metric')
    if not metric: return jsonify({})
    
    val = data_engine.data_state.get(metric, 0)
    st = data_engine.get_status(metric, val)
    return jsonify({
        "root_cause": data_engine.get_root_cause(metric, val, st)
    })

@app.route("/health")
def health_api():
    """System health check endpoint."""
    return jsonify({
        "status": "Online",
        "uptime": time.process_time(), 
        "service": "RT-AIDIS Core"
    })

@app.route("/history")
def history_api():
    metric = request.args.get('metric')
    if metric and metric in data_engine.history_data:
        prediction = data_engine.get_prediction(metric)
        anomaly_res = data_engine.analyze_anomaly_ml(metric)
        rolling = data_engine.get_rolling_analytics(metric)
        return jsonify({
            "metric": metric, 
            "values": data_engine.history_data[metric],
            "prediction": prediction,
            "anomaly": anomaly_res["status"],
            "confidence": anomaly_res["confidence"],
            "rolling": rolling
        })
    return jsonify(data_engine.history_data)

@app.route("/download_csv")
def download_csv():
    # Create a CSV in memory
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(["Metric", "Current Value", "Status", "History (Last 20)"])
    
    for k, v in data_engine.data_state.items():
        cw.writerow([k, v, data_engine.get_status(k, v), data_engine.history_data[k]])
        
    output = io.BytesIO()
    output.write(si.getvalue().encode('utf-8'))
    output.seek(0)
    
    return send_file(output, mimetype="text/csv", as_attachment=True, download_name="aidis_report.csv")

@app.route("/integrity")
def integrity_api():
    """Returns real-time AI Decision Integrity Index & Sector breakdown."""
    return jsonify(data_engine.get_integrity_metrics())

@app.route("/inject_anomaly", methods=["POST", "GET"])
def inject_anomaly_api():
    """Injects a simulated anomaly to test AI detection and alert response."""
    metric = request.args.get("metric")
    res = data_engine.inject_anomaly(metric)
    return jsonify(res)

@app.route("/sim_control", methods=["POST", "GET"])
def sim_control_api():
    """Controls simulation pause/play state and speed multiplier."""
    paused = request.args.get("paused")
    speed = request.args.get("speed")
    
    paused_val = None
    if paused is not None:
        paused_val = paused.lower() in ["true", "1", "yes"]
        
    speed_val = float(speed) if speed is not None else None
    
    res = data_engine.set_simulation_state(paused=paused_val, speed=speed_val)
    return jsonify(res)

@app.route("/correlations")
def correlations_api():
    """Returns cross-sector Pearson correlation matrix."""
    return jsonify(data_engine.get_correlations())

@app.route("/clear_alerts", methods=["POST", "GET"])
def clear_alerts_api():
    """Clears all current alerts from log."""
    return jsonify(data_engine.clear_alerts_log())

# -----------------------------
# 6-LAYER ENTERPRISE API ENDPOINTS
# -----------------------------
@app.route("/dataguard")
def dataguard_api():
    """Layer 1: Returns Data Quality & Hygiene Metrics."""
    return jsonify(data_engine.get_dataguard_metrics())

@app.route("/ensemble_anomaly")
def ensemble_anomaly_api():
    """Layer 2: Returns Isolation Forest + Z-Score Ensemble & 24h Failure Probability."""
    return jsonify(data_engine.get_ensemble_anomaly_all())

@app.route("/business_impact")
def business_impact_api():
    """Layer 3: Returns Financial Loss (₹/day), Downtime Risk, and SLA Impact."""
    return jsonify(data_engine.get_business_impact_analytics())

@app.route("/simulate_scenario_2", methods=["POST", "GET"])
def simulate_scenario_2_api():
    """Layer 4: Multi-Variable What-If Scenario Simulator."""
    prod = float(request.args.get("prod", 0))
    staff = float(request.args.get("staff", 0))
    demand = float(request.args.get("demand", 0))
    sensor = float(request.args.get("sensor", 0))
    
    # If JSON payload provided
    if request.is_json:
        payload = request.get_json()
        prod = float(payload.get("prod", prod))
        staff = float(payload.get("staff", staff))
        demand = float(payload.get("demand", demand))
        sensor = float(payload.get("sensor", sensor))
        
    return jsonify(data_engine.run_scenario_simulation_2(prod, staff, demand, sensor))

@app.route("/agentic_consult", methods=["POST", "GET"])
def agentic_consult_api():
    """Layer 5: Executes 4-Agent Decision Chain."""
    metric = request.args.get("metric", "Defects Count")
    if request.is_json:
        payload = request.get_json()
        metric = payload.get("metric", metric)
    return jsonify(data_engine.run_agentic_pipeline(metric))

@app.route("/rag_search", methods=["POST", "GET"])
def rag_search_api():
    """Layer 5: RAG Semantic/Keyword Search over Enterprise SOP Manuals."""
    query = request.args.get("query", "defects")
    if request.is_json:
        payload = request.get_json()
        query = payload.get("query", query)
    return jsonify({"query": query, "results": data_engine.search_sop_rag(query)})

@app.route("/incidents", methods=["GET", "POST"])
def incidents_api():
    """Layer 6: Manages Enterprise Incident Tickets & Statuses."""
    if request.method == "POST":
        inc_id = request.args.get("id")
        status = request.args.get("status")
        if request.is_json:
            payload = request.get_json()
            inc_id = payload.get("id", inc_id)
            status = payload.get("status", status)
        return jsonify(data_engine.update_incident_status_backend(inc_id, status))
    return jsonify(data_engine.get_all_incidents())

@app.route("/feedback", methods=["POST", "GET"])
def feedback_api():
    """Layer 6: Records Human-in-the-Loop Feedback for Continuous Learning."""
    inc_id = request.args.get("id", "INC-8092")
    action = request.args.get("action", "APPROVED") # APPROVED, ADJUSTED, REJECTED
    comment = request.args.get("comment", "")
    
    if request.is_json:
        payload = request.get_json()
        inc_id = payload.get("id", inc_id)
        action = payload.get("action", action)
        comment = payload.get("comment", comment)
        
    return jsonify(data_engine.submit_human_feedback(inc_id, action, comment))

@app.route("/feedback_stats")
def feedback_stats_api():
    """Layer 6: Returns Model Accuracy and Human Feedback Stats."""
    return jsonify(data_engine.get_feedback_stats())

@app.route("/lineage")
def lineage_api():
    """Returns Enterprise Data Lineage graph & downstream cascade blast radius."""
    return jsonify(data_engine.get_lineage_graph())

@app.route("/governance", methods=["GET", "POST"])
def governance_api():
    """Returns AI Governance Model Registry, active RBAC role, and audit trail."""
    if request.method == "POST":
        role = request.args.get("role")
        if request.is_json:
            payload = request.get_json()
            role = payload.get("role", role)
        return jsonify(data_engine.set_rbac_role(role))
    return jsonify(data_engine.get_governance_data())

# -----------------------------
# AUTO FREE PORT
# -----------------------------
def free_port(preferred_port=5000):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(('127.0.0.1', preferred_port))
        s.close()
        return preferred_port
    except Exception:
        s = socket.socket()
        s.bind(('', 0))
        port = s.getsockname()[1]
        s.close()
        return port

# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    port = free_port()
    print("\n=======================================================")
    print(f"[*] RT-AIDIS 2.0 Live Server Started!")
    print(f"[*] Landing Page:       http://127.0.0.1:{port}/")
    print(f"[*] Enterprise Console: http://127.0.0.1:{port}/dashboard")
    print("=======================================================\n")
    # Timer to open browser after short delay
    threading.Timer(1.5, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    app.run(host="0.0.0.0", port=port, debug=False)
