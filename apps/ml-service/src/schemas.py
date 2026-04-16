"""Pydantic schemas for ML service request/response validation."""

from pydantic import BaseModel, Field
from typing import List, Optional


class TransactionInput(BaseModel):
    """Single transaction input for fraud prediction."""
    amount: float = Field(..., description="Transaction amount in INR")
    time: float = Field(..., description="Seconds elapsed since first transaction in dataset")
    v1: float = 0.0
    v2: float = 0.0
    v3: float = 0.0
    v4: float = 0.0
    v5: float = 0.0
    v6: float = 0.0
    v7: float = 0.0
    v8: float = 0.0
    v9: float = 0.0
    v10: float = 0.0
    v11: float = 0.0
    v12: float = 0.0
    v13: float = 0.0
    v14: float = 0.0
    v15: float = 0.0
    v16: float = 0.0
    v17: float = 0.0
    v18: float = 0.0
    v19: float = 0.0
    v20: float = 0.0
    v21: float = 0.0
    v22: float = 0.0
    v23: float = 0.0
    v24: float = 0.0
    v25: float = 0.0
    v26: float = 0.0
    v27: float = 0.0
    v28: float = 0.0


class PredictionResponse(BaseModel):
    """Prediction response from the model."""
    probability: float = Field(..., description="Fraud probability (0-1)")
    decision: str = Field(..., description="Decision: ALLOW, FLAG, or BLOCK")
    latency_ms: float = Field(..., description="Inference latency in milliseconds")
    model_version: str = Field(..., description="Active model version identifier")
    flags: List[str] = Field(default_factory=list, description="Warning flags from the model")
    ensemble_weights: Optional[List[float]] = Field(None, description="Current DWM learner weights")


class BatchInput(BaseModel):
    """Batch of transactions for prediction."""
    transactions: List[TransactionInput]


class BatchResponse(BaseModel):
    """Batch prediction response."""
    predictions: List[PredictionResponse]
    total_processed: int
    fraud_count: int
    legit_count: int
    avg_latency_ms: float


class ModelMetrics(BaseModel):
    """Model performance metrics."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    total_predictions: int
    concept_drift_detected: bool
    num_active_learners: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_version: str
    uptime_seconds: float
