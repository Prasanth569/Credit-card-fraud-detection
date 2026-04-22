# AHT + RNN Hybrid Fraud Detection System Diagrams

Here are the updated UML diagrams reflecting the new AHT (Adaptive Hoeffding Tree) + RNN (LSTM) hybrid architecture.

## 1. System Architecture Diagram

```mermaid
graph TD
    %% Nodes
    A[User / Payment Gateway]
    B[Frontend App<br/>React / Dashboard]
    C[CSV Upload Module]
    D[Backend API<br/>Node.js / Express]
    E[Data Preprocessing &<br/>Feature Engineering]
    F[ML Service<br/>FastAPI]
    
    subgraph "Hybrid Fraud Detection Model"
        F1[AHT Model<br/>Online Learning]
        F2[RNN Model<br/>LSTM Deep Learning]
        F3[Ensemble Aggregator]
    end
    
    G{Decision Engine<br/>Allow / Flag / Block}
    H[Database<br/>Transaction Logs & Metrics]
    I[Redis / Message Queue]
    J[Worker Service<br/>Batch Processing / Retraining]
    K[Monitoring & Drift Detection]

    %% Connections
    A -->|1. Real-time Transaction| B
    B -->|2. POST /predict| D
    B -->|Upload CSV| C
    C -->|Batch Data| D
    
    D -->|3. Extract Features| E
    E -->|4. Send Features| F
    
    F --> F1
    F --> F2
    F1 --> F3
    F2 --> F3
    F3 -->|5. Fraud Probability| D
    
    D -->|6. Evaluate| G
    G -->|Result| H
    G -->|Result| B
    
    D -->|7. Enqueue Task| I
    I -->|Process| J
    J -->|Async Batch/Learn| F
    J -->|Performance Data| K
    K -->|Trigger Retraining/Update| F
```

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Payment Gateway
    participant UI as Frontend App
    participant API as Backend API
    participant DB as Database
    participant ML as ML Service (FastAPI)
    participant Worker as Worker Service

    User->>UI: Initiate Transaction (Time, Amount, V1-V28)
    UI->>API: POST /api/predict
    API->>DB: Save Initial Transaction State
    API->>ML: POST /predict?model=hybrid
    
    activate ML
    ML->>ML: Extract Features
    par AHT Prediction
        ML->>ML: AHT Learner
    and RNN Prediction
        ML->>ML: RNN (LSTM) Predictor
    end
    ML->>ML: Aggregate Predictions (Hybrid)
    ML-->>API: Response (Probability, Decision, Latency)
    deactivate ML

    API->>API: Evaluate Risk (Allow/Flag/Block)
    API->>DB: Update Transaction Status & Result
    API-->>UI: Return Decision & Data
    UI-->>User: Display Transaction Result

    %% Asynchronous Feedback Loop
    opt Online Learning / Feedback Loop
        API->>Worker: Enqueue Transaction for Learning
        Worker->>ML: POST /learn (True Label)
        ML->>ML: Update AHT Learner Weights
        ML-->>Worker: Update Success
    end
```

## 3. Class Diagram

```mermaid
classDiagram
    class User {
        +String userId
        +String name
        +initiateTransaction()
        +uploadBatchCSV()
    }

    class Transaction {
        +String transactionId
        +Float amount
        +Float time
        +Float[] V1_V28
        +String status
        +getFeatures()
    }

    class BackendAPI {
        +processSingleTransaction(Transaction txn)
        +processBatchUpload(File csv)
        +getTransactionHistory()
    }

    class HybridFraudModel {
        +AHTModel aht
        +RNNModel rnn
        +predictFraud(FeatureVector v)
        +learn(FeatureVector v, int label)
        +getMetrics()
    }

    class AHTModel {
        +predict(FeatureVector v)
        +update(FeatureVector v, int label)
    }

    class RNNModel {
        +predict(FeatureVector v)
    }

    class PredictionResult {
        +Float probability
        +String decision
        +String modelUsed
        +Float latencyMs
    }

    class TransactionDatabase {
        +saveTransaction(Transaction txn)
        +updateResult(String id, PredictionResult res)
        +getLogs()
    }

    User "1" --> "0..*" Transaction : creates
    BackendAPI "1" --> "0..*" Transaction : processes
    BackendAPI "1" --> "1" HybridFraudModel : calls
    HybridFraudModel *-- "1" AHTModel : contains
    HybridFraudModel *-- "1" RNNModel : contains
    BackendAPI "1" --> "1" TransactionDatabase : stores
    HybridFraudModel "1" --> "1" PredictionResult : returns
```

## 4. Deployment Diagram

```mermaid
flowchart TD
    subgraph Client Device
        Browser[Web Browser / Dashboard]
    end

    subgraph "Application Server (Node.js)"
        UI[Frontend Server (Vite / React)]
        API[Backend Server (Express)]
        Worker[Worker Process (BullMQ)]
    end

    subgraph "ML Server (Python)"
        ML[FastAPI ML Service]
        AHT[(AHT Artifacts)]
        RNN[(RNN/LSTM Artifacts)]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL Database)]
        Redis[(Redis Cache / Queue)]
    end

    Browser <-->|HTTPS| UI
    Browser <-->|REST API| API
    
    API <-->|HTTP POST| ML
    API <-->|TCP/IP| PG
    API <-->|TCP/IP| Redis
    
    Worker <-->|TCP/IP| Redis
    Worker <-->|HTTP POST| ML
    
    ML --- AHT
    ML --- RNN
```

## 5. Use Case Diagram

```mermaid
%%{init: {'theme': 'default', 'usecase': {'fill': '#f9f9f9', 'stroke': '#333'}}}%%
usecaseDiagram
    actor "User / Payment Gateway" as U
    actor "System Admin / Analyst" as A
    actor "Automated Worker" as W

    rectangle "Fraud Detection System" {
        usecase "Initiate Single Transaction" as UC1
        usecase "Upload Batch CSV" as UC2
        usecase "Evaluate Transaction Risk" as UC3
        usecase "Predict Fraud (AHT + RNN)" as UC4
        usecase "View Analytics Dashboard" as UC5
        usecase "Monitor Model Metrics" as UC6
        usecase "Online Model Retraining" as UC7
        usecase "Review Flagged Transactions" as UC8
    }

    U --> UC1
    U --> UC2

    UC1 ..> UC3 : <<includes>>
    UC2 ..> UC3 : <<includes>>
    UC3 ..> UC4 : <<includes>>

    A --> UC5
    A --> UC6
    A --> UC8

    W --> UC7
    UC7 ..> UC4 : <<extends>>
```
