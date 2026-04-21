"""
FastAPI ML Service — AHT + RNN Hybrid for Real-Time Credit Card Fraud Detection.

Endpoints:
- POST /predict              — single transaction prediction (?model=aht|rnn|hybrid)
- POST /batch-predict        — batch prediction for CSV uploads
- GET  /health               — health check
- GET  /metrics              — ALL three models' metrics (aht, rnn, hybrid)
- GET  /metrics/{model}      — single model metrics
- POST /learn                — online model update with labeled data
"""

import os

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

import time
import logging
from typing import List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    TransactionInput,
    PredictionResponse,
    BatchInput,
    BatchResponse,
    ModelMetrics,
    AllModelMetrics,
    PerModelMetrics,
    HealthResponse,
    ModelType,
)
from .model import get_model, FEATURE_NAMES, MODEL_VERSION

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fraud Detection ML Service",
    description="AHT + RNN (LSTM) Hybrid Adaptive Ensemble for Real-Time Fraud Detection",
    version=MODEL_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _input_to_features(txn: TransactionInput) -> dict:
    return {
        "Time": txn.time,
        "Amount": txn.amount,
        "V1": txn.v1,   "V2": txn.v2,   "V3": txn.v3,
        "V4": txn.v4,   "V5": txn.v5,   "V6": txn.v6,
        "V7": txn.v7,   "V8": txn.v8,   "V9": txn.v9,
        "V10": txn.v10, "V11": txn.v11, "V12": txn.v12,
        "V13": txn.v13, "V14": txn.v14, "V15": txn.v15,
        "V16": txn.v16, "V17": txn.v17, "V18": txn.v18,
        "V19": txn.v19, "V20": txn.v20, "V21": txn.v21,
        "V22": txn.v22, "V23": txn.v23, "V24": txn.v24,
        "V25": txn.v25, "V26": txn.v26, "V27": txn.v27,
        "V28": txn.v28,
    }


def _predict_single(txn: TransactionInput, model_type: str = "hybrid") -> PredictionResponse:
    model = get_model()
    features = _input_to_features(txn)

    start = time.perf_counter()
    probability, flags = model.predict(features, model=model_type)
    latency_ms = round((time.perf_counter() - start) * 1000, 2)

    decision = "ALLOW"
    prob = round(probability, 4)
    if prob >= 0.7:
        decision = "BLOCK"
    elif prob >= 0.3:
        decision = "FLAG"

    return PredictionResponse(
        probability=prob,
        decision=decision,
        latency_ms=latency_ms,
        model_version=MODEL_VERSION,
        model_used=model_type,
        flags=flags,
        ensemble_weights=None,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionResponse)
async def predict(
    txn: TransactionInput,
    model: ModelType = Query(default="hybrid", description="Sub-model to use: aht, rnn, or hybrid"),
):
    """Predict fraud probability for a single transaction."""
    try:
        return _predict_single(txn, model_type=model)
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/batch-predict", response_model=BatchResponse)
async def batch_predict(batch: BatchInput):
    """Predict fraud probability for a batch of transactions (always uses hybrid)."""
    try:
        predictions: List[PredictionResponse] = []
        total_latency = 0.0

        for txn in batch.transactions:
            result = _predict_single(txn, model_type="hybrid")
            predictions.append(result)
            total_latency += result.latency_ms

        fraud_count = sum(1 for p in predictions if p.decision == "BLOCK")

        return BatchResponse(
            predictions=predictions,
            total_processed=len(predictions),
            fraud_count=fraud_count,
            legit_count=len(predictions) - fraud_count,
            avg_latency_ms=round(total_latency / max(1, len(predictions)), 2),
        )
    except Exception as e:
        logger.error(f"Batch prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.post("/learn")
async def learn(txn: TransactionInput, label: int = Query(..., ge=0, le=1)):
    """Update the AHT sub-model with a new labeled sample (online learning)."""
    try:
        model = get_model()
        features = _input_to_features(txn)
        model.learn(features, label)
        return {"status": "ok", "message": "Model updated successfully"}
    except Exception as e:
        logger.error(f"Learning error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Model update failed: {str(e)}")


@app.get("/metrics", response_model=AllModelMetrics)
async def all_metrics():
    """Return current performance metrics for ALL three models (aht, rnn, hybrid)."""
    model = get_model()
    raw = model.get_all_metrics()

    def _to_schema(d: dict) -> PerModelMetrics:
        return PerModelMetrics(
            accuracy=d.get("accuracy", 0.0),
            precision=d.get("precision", 0.0),
            recall=d.get("recall", 0.0),
            f1_score=d.get("f1_score", 0.0),
            tp=d.get("tp", 0),
            fp=d.get("fp", 0),
            tn=d.get("tn", 0),
            fn=d.get("fn", 0),
            total_predictions=d.get("total_predictions", 0),
        )

    return AllModelMetrics(
        aht=_to_schema(raw.get("aht", {})),
        rnn=_to_schema(raw.get("rnn", {})),
        hybrid=_to_schema(raw.get("hybrid", {})),
    )


@app.get("/metrics/{model_name}", response_model=PerModelMetrics)
async def single_model_metrics(model_name: ModelType):
    """Return metrics for a specific model."""
    model = get_model()
    raw = model.get_all_metrics()
    data = raw.get(model_name, {})
    return PerModelMetrics(
        accuracy=data.get("accuracy", 0.0),
        precision=data.get("precision", 0.0),
        recall=data.get("recall", 0.0),
        f1_score=data.get("f1_score", 0.0),
        tp=data.get("tp", 0),
        fp=data.get("fp", 0),
        tn=data.get("tn", 0),
        fn=data.get("fn", 0),
        total_predictions=data.get("total_predictions", 0),
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    model = get_model()
    return HealthResponse(
        status="ok",
        model_loaded=True,
        model_version=MODEL_VERSION,
        uptime_seconds=round(time.time() - START_TIME, 1),
        rnn_loaded=model.rnn.is_loaded,
        aht_loaded=model.aht_rnn.is_loaded,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
