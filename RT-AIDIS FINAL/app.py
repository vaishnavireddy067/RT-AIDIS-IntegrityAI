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

# -----------------------------
# AUTO FREE PORT
# -----------------------------
def free_port():
    s = socket.socket()
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    return port


if __name__ == "__main__":
    port = free_port()
    # Timer to open browser after short delay
    threading.Timer(1.5, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    app.run(port=port, debug=False)
