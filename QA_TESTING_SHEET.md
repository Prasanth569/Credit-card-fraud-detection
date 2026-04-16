# 🛡️ QA Testing Sheet — Credit Card Fraud Detection

This document provides a comprehensive set of test cases to ensure the application is bug-free, performant, and reliable. All features across the Frontend, Backend, ML Service, and Worker are covered.

---

## 🚦 System Health & Infrastructure
*Verify that the foundational services are running and connected.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| SYS-001 | ML Service | Start ML service (`npm run ml`) | Console shows "Uvicorn running on http://0.0.0.0:8000" | High | [ ] |
| SYS-002 | Backend API | Start Backend (`npm run dev`) | Console shows "Fastify server running on port 5000" | High | [ ] |
| SYS-003 | Worker | Start Worker (`npm run worker`) | Logs show connection to Redis and "Worker listening" | High | [ ] |
| SYS-004 | Frontend | Start Frontend (`npm run dev`) | Browser opens http://localhost:5173 without errors | High | [ ] |
| SYS-005 | Redis/Docker | Ensure Redis container is running | Backend and Worker connect without "ECONNREFUSED" | High | [ ] |

---

## 🔐 Authentication & User Management
*Verify security and session handling.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| AUTH-001 | Registration | Create a new user with email/password | User is registered and redirected to Login/Dashboard | High | [ ] |
| AUTH-002 | Login | Authenticate with valid credentials | JWT token is stored; User enters the system | High | [ ] |
| AUTH-003 | Protected Routes | Access `/dashboard` without logging in | System redirects user to `/login` | High | [ ] |
| AUTH-004 | Logout | Click logout button | Session is cleared; User redirected to `/login` | Medium | [ ] |
| AUTH-005 | Persistence | Refresh page while logged in | User remains authenticated (Session persisted) | Medium | [ ] |

---

## 📊 Dashboard & Monitoring
*Verify real-time data flow and UI responsiveness.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| DASH-001 | Real-Time Stats | Observe "Total Transactions" card | Value matches the total count in the database | High | [ ] |
| DASH-002 | Fraud Alerts Card | Observe "Fraud Alerts" count | Updates immediately when a new fraud is detected | High | [ ] |
| DASH-003 | Latency Metric | Observe "System Latency" avg | Displays realistic ms (e.g., 50ms - 300ms) | Medium | [ ] |
| DASH-004 | Chart Rendering | Click "Volume Trend" | Chart displays data for the last 24 hours | Medium | [ ] |
| DASH-005 | Activity Feed | Observe "Recent Activity" table | New transactions appear at the top in real-time | High | [ ] |

---

## 💸 Transaction Management
*Verify data integrity and filtering logic.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| TXN-001 | Table View | Navigate to `/transactions` | Table renders with TXN ID, Amount, Time, and Decision | High | [ ] |
| TXN-002 | Search Box | Enter a specific `txnId` or `IP Address` | Table filters to show only matching records | Medium | [ ] |
| TXN-003 | Filter: ALLOW | Click "ALLOW" filter button | Only transactions with "ALLOW" decision are shown | High | [ ] |
| TXN-004 | Filter: BLOCK | Click "BLOCK" filter button | Only transactions with "BLOCK" decision are shown | High | [ ] |
| TXN-005 | Pagination | Click "Next" on the bottom of the table | Second set of 15 records loads correctly | Medium | [ ] |
| TXN-006 | Probability Bar | Observe the color of the prob bar | Green (Low), Yellow (Med), Red (High Risk) | Medium | [ ] |

---

## 📁 Batch Processing (CSV)
*Verify high-volume data handling.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| BATCH-001 | File Upload | Upload `sample_batch_upload.csv` | File is accepted and processing starts | High | [ ] |
| BATCH-002 | Progress Bar | Observe the progress indicator | Smooth movement from 0% to 100% | Medium | [ ] |
| BATCH-003 | DB Integrity | Refresh Dash after batch finish | "Total Transactions" increased by CSV row count | High | [ ] |
| BATCH-004 | Fraud Tagging | Verify alerts after batch upload | Alerts are generated for suspicious rows in CSV | High | [ ] |
| BATCH-005 | Performance | Upload 100+ records | System processes without timing out or crashing | Medium | [ ] |

---

## 🧠 ML Simulation & Prediction
*Verify the "Brain" of the application.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| SIM-001 | Manual Trigger | Trigger a "Simulation" transaction | A request is sent to Backend -> ML Service | High | [ ] |
| SIM-002 | Model Scoring | Check decision for high $ amount | Large amounts (>2000) show higher risk/FLAG | Medium | [ ] |
| SIM-003 | ML Latency | API response for `/predict` | Should be <500ms for real-time responsiveness | Medium | [ ] |
| SIM-004 | Fallback Logic | Stop ML service; run transaction | Backend uses internal heuristics (Fallback) | Medium | [ ] |

---

## 📈 Advanced Analytics & Logging
*Verify history and model performance tracking.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| ANALY-001 | Volume Distribution| View Analytics page | Hourly bar chart shows correct distribution | Low | [ ] |
| ANALY-002 | Model Performance | View "Model Accuracy" chart | Shows 6-week trend from `ModelLog` seeding | Medium | [ ] |
| ANALY-003 | Ensemble Weights | Observe "Adaptive Weights" | Dynamic weights for DWM+AHT are visible | Low | [ ] |

---

## ⚙️ Settings & UI
*Verify customization and accessibility.*

| ID | Feature | Condition / Action | Expected Result | Priority | Status |
|:---|:---|:---|:---|:---|:---|
| SET-001 | UI Themes | Change settings (if available) | UI responds to setting changes immediately | Low | [ ] |
| SET-002 | Mobile View | Resize browser to mobile width | Hamburger menu appears; table scrolls horizontally | Medium | [ ] |
| SET-003 | Error Alerts | Try login with wrong password | Red error toast/message appears | High | [ ] |

---

## 📝 Testing Instructions
1.  **Fresh Data**: Run `npm run seed` in the backend before starting a full test cycle.
2.  **Environment**: Test on `Chrome` or `Edge` for best compatibility.
3.  **Logs**: Keep backend terminal open to watch for 500 errors during API calls.
