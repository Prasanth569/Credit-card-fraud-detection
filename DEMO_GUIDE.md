# 🚀 Credit Card Fraud Detection — Demo Guide

This guide provides a step-by-step walkthrough to run the full stack and showcase the platform's features.

---

## 🏗️ System Architecture
The application consists of 4 core services working in sync:
1.  **ML Service (Python/FastAPI)**: Performs real-time fraud scoring using a DWM+AHT adaptive ensemble.
2.  **Backend API (Node.js/Fastify)**: Orchestrates requests, manages data, and handles security.
3.  **Worker (Node.js/BullMQ)**: Processes background tasks like model scoring and alert generation.
4.  **Frontend (React/Vite)**: The interactive dashboard for real-time monitoring and analytics.

**Infrastructure Dependencies:**
- **Redis**: Required for the task queue (Running via Docker).
- **MongoDB**: Primary database (Connected via Atlas).

---

## 🛠️ Step 1: Startup Sequence
Open 4 separate terminal windows and run the commands in this exact order:

### 1. ML Service (Port 8000)
```bash
# From the project root
npm run ml
```
*Wait for "Application startup complete" and "Uvicorn running on http://0.0.0.0:8000".*

### 2. Backend API (Port 5000)
```bash
cd apps/backend
npm run dev
```
*Wait for "Fastify server running on http://localhost:5000".*

### 3. Background Worker
```bash
cd apps/backend
npm run worker
```
*You will see logs as the worker connects to Redis and starts listening for jobs.*

### 4. Frontend (Port 5173)
```bash
cd apps/frontend
npm run dev
```
*Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 🎬 Step 2: Demo Script (Feature Walkthrough)

### 1. Dashboard & Real-Time Stats
- **Observe**: The **Total Transactions**, **Fraud Alerts**, and **System Latency** cards.
- **Context**: Mention that these metrics are aggregated live from the database (currently showing the 1000 seeded transactions).

### 2. Recent Activity Table
- Scroll down to the **Recent Activity** section.
- **Showcase**: The "Decision" column (`ALLOW`, `FLAG`, `BLOCK`) and the **Probability Score**. This is the output of the ML service.

### 3. Real-Time Simulation (The "WOW" Moment)
- Go to the **Simulation** or **Recent Activity** section (depending on your UI version).
- Trigger a "Manual Transaction" or a "Simulation".
- **Observe**: A new transaction appearing in the table in real-time.
- **Behind the Scenes**: Backend -> Redis Queue -> Worker -> ML Service -> Database -> Frontend (WebSocket/Polling).

### 4. Batch Processing (CSV Upload)
- Navigate to the **Batch Upload** tab.
- Upload a sample CSV file (standard Credit Card dataset format).
- **Observe**: The progress bar and the summary results showing how many were flagged as fraud in the batch.

### 5. Advanced Analytics
- Go to the **Analytics** page.
- **Showcase**:
  - **Volume Trend**: 24-hour transaction distribution.
  - **Model Performance**: Accuracy, Precision, and Recall trends over the last 6 weeks (from the `ModelLog` seeding).
  - **Ensemble Weights**: Show how the "Weight Adaptive" model adjusts over time.

---

## 💡 Troubleshooting
- **Redis Connection**: Ensure your Docker container is running (the green icon in Docker Desktop).
- **ML Service Error**: If the backend says "Prediction failed", check if the Python ML service is actually running on port 8000.
- **Ports**: Ensure 5000, 5173, and 8000 are not occupied by other apps.
