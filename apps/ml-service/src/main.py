"""
FastAPI ML Service — Real-Time Credit Card Fraud Detection.

Endpoints:
- POST /predict         — single transaction prediction
- POST /batch-predict   — batch prediction for CSV uploads
- GET  /health          — health check
- GET  /metrics         — model performance metrics
- POST /learn           — online model update with labeled data
"""

import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import time
import logging
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    TransactionInput,
    PredictionResponse,
    BatchInput,
    BatchResponse,
    ModelMetrics,
    HealthResponse,
)
from .model import get_model, FEATURE_NAMES, MODEL_VERSION

# ─── Setup ───────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fraud Detection ML Service",
    description="DWM + AHT Adaptive Ensemble for Real-Time Fraud Detection",
    version=MODEL_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()


# ─── Helpers ─────────────────────────────────────────────────────────

def _input_to_features(txn: TransactionInput) -> dict:
    """Convert a TransactionInput schema to a feature dict for the model."""
    return {
        "Time": txn.time,
        "Amount": txn.amount,
        "V1": txn.v1,
        "V2": txn.v2,
        "V3": txn.v3,
        "V4": txn.v4,
        "V5": txn.v5,
        "V6": txn.v6,
        "V7": txn.v7,
        "V8": txn.v8,
        "V9": txn.v9,
        "V10": txn.v10,
        "V11": txn.v11,
        "V12": txn.v12,
        "V13": txn.v13,
        "V14": txn.v14,
        "V15": txn.v15,
        "V16": txn.v16,
        "V17": txn.v17,
        "V18": txn.v18,
        "V19": txn.v19,
        "V20": txn.v20,
        "V21": txn.v21,
        "V22": txn.v22,
        "V23": txn.v23,
        "V24": txn.v24,
        "V25": txn.v25,
        "V26": txn.v26,
        "V27": txn.v27,
        "V28": txn.v28,
    }


def _predict_single(txn: TransactionInput) -> PredictionResponse:
    """Run prediction for a single transaction."""
    model = get_model()
    features = _input_to_features(txn)

    start = time.perf_counter()
    probability, flags = model.predict(features)
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
        flags=flags,
        ensemble_weights=model.get_ensemble_weights(),
    )


# ─── Endpoints ───────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionResponse)
async def predict(txn: TransactionInput):
    """Predict fraud probability for a single transaction."""
    try:
        return _predict_single(txn)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/batch-predict", response_model=BatchResponse)
async def batch_predict(batch: BatchInput):
    """Predict fraud probability for a batch of transactions."""
    try:
        predictions: List[PredictionResponse] = []
        total_latency = 0.0

        for txn in batch.transactions:
            result = _predict_single(txn)
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
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.post("/learn")
async def learn(txn: TransactionInput, label: int):
    """Update the model with a labeled sample (online learning)."""
    try:
        model = get_model()
        features = _input_to_features(txn)
        model.learn(features, label)
        return {"status": "ok", "message": "Model updated successfully"}
    except Exception as e:
        logger.error(f"Learning error: {e}")
        raise HTTPException(status_code=500, detail=f"Model update failed: {str(e)}")


@app.get("/metrics", response_model=ModelMetrics)
async def metrics():
    """Return current model performance metrics."""
    model = get_model()
    return ModelMetrics(**model.get_metrics())


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    model = get_model()
    return HealthResponse(
        status="ok",
        model_loaded=True,
        model_version=MODEL_VERSION,
        uptime_seconds=round(time.time() - START_TIME, 1),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
