# RT-AIDIS: Real-Time AI Decision Integrity System 🛡️

RT-AIDIS is an enterprise-grade, AI-governed monitoring and decision integrity platform. It is designed to provide high-fidelity oversight across multiple industrial and civic sectors, combining real-time data ingestion with advanced machine learning for anomaly detection and predictive forecasting.

## 🚀 Key Features

### 1. Multi-Sector Intelligence
Real-time monitoring and analytics for:
- **🏭 Manufacturing**: Production rates, defect tracking, inventory, and safety alerts.
- **🏙️ Smart City**: Traffic volume, congestion spikes, air quality, and power usage.
- **💼 Business**: Revenue growth, sales velocity, net profit, and customer counts.
- **🏥 Healthcare**: Patient load, critical case tracking, and bed availability.

### 2. AI & Machine Learning Core
- **Statistical Anomaly Detection**: Uses Z-Score analysis to identify outliers in data streams with confidence scoring.
- **Predictive Forecasting**: Implements Scikit-Learn Linear Regression to predict future metric trends.
- **Explainable AI (XAI)**: A root-cause investigation module that correlates multiple metrics to explain *why* an alert was triggered.

### 3. Interactive Decision Tools
- **Scenario Simulator**: A "What-if" analysis tool allowing users to simulate metric changes and see predicted AI outcomes.
- **Professional Reporting**: One-click generation of PDF-ready performance reports and CSV data exports.
- **Architecture Visualizer**: Live view of the data flow from sensors to AI decisions.

### 4. Enterprise-Grade UI/UX
- **Secure Portal**: Glassmorphism-style login for restricted access.
- **Dynamic Dashboard**: Drag-and-drop metric cards (Sortable.js) and real-time Chart.js integrations.
- **System Health Monitor**: Live heartbeat check showing uptime and service status.
- **Adaptive Display**: Dual-mode UI (Landing vs. Enterprise Advanced) with Dark/Light theme support.

## 🛠️ Technical Stack
- **Backend**: Python, Flask
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+)
- **Data Science**: Scikit-Learn, NumPy
- **Visuals**: Chart.js, FontAwesome, Google Fonts (Outfit)

## 📥 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RT-AIDIS-FINAL
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

## 🔒 Security & Integrity
RT-AIDIS ensures data integrity by passing every sensor signal through a multi-layer verification engine. This prevents "data poisoning" or false alarms by cross-referencing anomalies with environmental correlations (e.g., verifying if a traffic spike correlates with a city event).


