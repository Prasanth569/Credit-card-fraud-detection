"""
AHT + RNN (LSTM) Hybrid Ensemble Model for Credit Card Fraud Detection.

Implements:
- RNNModel          : Keras LSTM full model for direct probability prediction
- AHTonRNN          : AHT trained on LSTM-extracted 32-dim features
- HybridAHTRNN      : Ensemble average of AHT + RNN predictions

Fallback chain (most capable → least capable):
  1. HybridAHTRNN  (AHT + LSTM)   ← primary
  2. RNNModel only                 ← if AHT pkl missing
  3. DWMAHTEnsemble (old model)   ← if keras artifacts missing
  4. sklearn RandomForest          ← if river missing
  5. Heuristic                     ← last resort
"""

import os
import json
import pickle
import time
import logging
import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Literal

logger = logging.getLogger(__name__)

FEATURE_NAMES = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
MODEL_VERSION = "AHT-RNN-Hybrid-v2.1.0"
WINDOW_SIZE = 1
N_LSTM_FEATURES = 32  # Dense(32) layer output dimension

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

# ─── Library availability flags ───────────────────────────────────────────────
try:
    from river import tree
    RIVER_AVAILABLE = True
    logger.info("river library loaded ✓")
except ImportError:
    RIVER_AVAILABLE = False
    logger.warning("river not available — AHT sub-model will be disabled")

try:
    import tensorflow as tf
    from tensorflow import keras
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
    tf.get_logger().setLevel("ERROR")
    KERAS_AVAILABLE = True
    logger.info("TensorFlow / Keras loaded ✓")
except ImportError:
    KERAS_AVAILABLE = False
    logger.warning("TensorFlow not available — LSTM sub-model will be disabled")

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

# ─── Confusion matrix tracker ─────────────────────────────────────────────────
class CMTracker:
    """Tracks TP/FP/TN/FN online with a fixed decision threshold."""

    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold
        self.tp = self.fp = self.tn = self.fn = 0
        self.total = 0

    def update(self, prob: float, true_label: int):
        pred = 1 if prob >= self.threshold else 0
        self.total += 1
        if pred == 1 and true_label == 1:
            self.tp += 1
        elif pred == 1 and true_label == 0:
            self.fp += 1
        elif pred == 0 and true_label == 0:
            self.tn += 1
        else:
            self.fn += 1

    def metrics(self) -> Dict[str, float]:
        precision = self.tp / max(self.tp + self.fp, 1)
        recall = self.tp / max(self.tp + self.fn, 1)
        accuracy = (self.tp + self.tn) / max(self.total, 1)
        f1 = (2 * precision * recall) / max(precision + recall, 1e-9)
        return {
            "accuracy": round(accuracy, 6),
            "precision": round(precision, 6),
            "recall": round(recall, 6),
            "f1_score": round(f1, 6),
            "tp": self.tp,
            "fp": self.fp,
            "tn": self.tn,
            "fn": self.fn,
            "total_predictions": self.total,
        }


# ─── RNN Model wrapper ────────────────────────────────────────────────────────
class RNNModel:
    """Wrapper around the full Keras LSTM model."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_loaded = False
        self._load()

    def _load(self):
        if not KERAS_AVAILABLE:
            return
        full_path = os.path.join(ARTIFACTS_DIR, "lstm_full.keras")
        scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.pkl")
        try:
            self.model = keras.models.load_model(full_path)
            logger.info(f"LSTM full model loaded from {full_path} ✓")
            if JOBLIB_AVAILABLE and os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                logger.info("Amount scaler loaded ✓")
            self.is_loaded = True
        except Exception as e:
            logger.error(f"Failed to load LSTM full model: {e}")

    def _build_tensor(self, features: Dict[str, float]) -> np.ndarray:
        """Build [1, WINDOW_SIZE, n_features] tensor from a single transaction dict."""
        amount = features.get("Amount", 0.0)
        if self.scaler is not None:
            amount = float(self.scaler.transform([[amount]])[0][0])

        row = np.array(
            [features.get("Time", 0.0), amount]
            + [features.get(f"V{i}", 0.0) for i in range(1, 29)],
            dtype=np.float32,
        )
        # Repeat the single transaction across the window dimension
        seq = np.tile(row, (WINDOW_SIZE, 1))  # [WINDOW_SIZE, n_features]
        return seq[np.newaxis, :, :]          # [1, WINDOW_SIZE, n_features]

    def predict(self, features: Dict[str, float]) -> float:
        """Return fraud probability ∈ [0, 1]."""
        if not self.is_loaded or self.model is None:
            return -1.0  # sentinel, means unavailable
        try:
            tensor = self._build_tensor(features)
            prob = float(self.model.predict(tensor, verbose=0)[0][0])
            return np.clip(prob, 0.0, 1.0)
        except Exception as e:
            logger.error(f"RNN inference error: {e}")
            return -1.0


# ─── AHT-on-RNN wrapper ───────────────────────────────────────────────────────
class AHTonRNN:
    """AHT trained on LSTM 32-dim feature vectors."""

    def __init__(self):
        self.aht = None
        self.feature_extractor = None
        self.scaler = None
        self.is_loaded = False
        self._load()

    def _load(self):
        aht_path = os.path.join(ARTIFACTS_DIR, "aht_on_lstm.pkl")
        extractor_path = os.path.join(ARTIFACTS_DIR, "lstm_feature_extractor.keras")
        scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.pkl")

        if not RIVER_AVAILABLE:
            logger.warning("River not available — AHT sub-model disabled")
            return
        if not KERAS_AVAILABLE:
            logger.warning("Keras not available — AHT sub-model disabled")
            return

        try:
            with open(aht_path, "rb") as f:
                self.aht = pickle.load(f)
            logger.info("AHT model loaded ✓")
        except Exception as e:
            logger.error(f"Failed to load AHT model: {e}")
            return

        try:
            self.feature_extractor = keras.models.load_model(extractor_path)
            logger.info("LSTM feature extractor loaded ✓")
        except Exception as e:
            logger.error(f"Failed to load LSTM feature extractor: {e}")
            self.aht = None
            return

        if JOBLIB_AVAILABLE and os.path.exists(scaler_path):
            try:
                self.scaler = joblib.load(scaler_path)
            except Exception:
                pass

        self.is_loaded = True

    def _extract_features(self, features: Dict[str, float]) -> Optional[Dict[str, float]]:
        """Directly map raw features to f0-f29 format for AHT."""
        try:
            amount = features.get("Amount", 0.0)
            if self.scaler is not None:
                amount = float(self.scaler.transform([[amount]])[0][0])

            row = np.array(
                [features.get("Time", 0.0), amount]
                + [features.get(f"V{i}", 0.0) for i in range(1, 29)],
                dtype=np.float32,
            )
            return {f"f{j}": float(row[j]) for j in range(len(row))}
        except Exception as e:
            logger.error(f"AHT raw feature mapping error: {e}")
            return None

    def predict(self, features: Dict[str, float]) -> float:
        if not self.is_loaded or self.aht is None:
            return -1.0
        feat_dict = self._extract_features(features)
        if feat_dict is None:
            return -1.0
        try:
            proba = self.aht.predict_proba_one(feat_dict)
            if proba and len(proba) > 0:
                return float(proba.get(1, 0.0))
            return 0.0
        except Exception as e:
            logger.error(f"AHT predict error: {e}")
            return -1.0

    def learn(self, features: Dict[str, float], label: int):
        if not self.is_loaded or self.aht is None:
            return
        feat_dict = self._extract_features(features)
        if feat_dict:
            try:
                self.aht.learn_one(feat_dict, label)
            except Exception as e:
                logger.error(f"AHT learn error: {e}")


# ─── Hybrid AHT + RNN ─────────────────────────────────────────────────────────
class HybridAHTRNN:
    """
    Top-level model that combines RNN and AHT predictions.

    Prediction modes:
      - "hybrid" (default): average of AHT + RNN probabilities
      - "rnn"              : RNN-only
      - "aht"              : AHT-only (falls back to RNN if AHT unavailable)
    """

    def __init__(self):
        self.rnn = RNNModel()
        self.aht_rnn = AHTonRNN()
        self._load_training_metrics()
        self._init_live_trackers()

        # Fallback to legacy DWM+AHT if new models not available
        self._legacy = None
        if not self.rnn.is_loaded and not self.aht_rnn.is_loaded:
            logger.warning("New models unavailable — loading legacy DWM+AHT as fallback")
            self._legacy = _load_legacy()

        logger.info(
            f"HybridAHTRNN ready | RNN: {'✓' if self.rnn.is_loaded else '✗'} "
            f"| AHT: {'✓' if self.aht_rnn.is_loaded else '✗'}"
        )

    def _load_training_metrics(self):
        """Load static metrics from training run (used as baseline until live data accumulates)."""
        metrics_path = os.path.join(ARTIFACTS_DIR, "training_metrics.json")
        self._training_metrics: Dict[str, Any] = {}
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path) as f:
                    self._training_metrics = json.load(f)
                logger.info("Training metrics loaded ✓")
            except Exception as e:
                logger.warning(f"Could not load training metrics: {e}")

    def _init_live_trackers(self):
        """Online confusion-matrix trackers, updated as /learn is called."""
        self._cm_aht = CMTracker()
        self._cm_rnn = CMTracker()
        self._cm_hybrid = CMTracker()

    def _heuristic(self, features: Dict[str, float]) -> float:
        amount = features.get("Amount", 0)
        base = min(0.5, amount / 10000)
        v_sum = sum(abs(features.get(f"V{i}", 0)) for i in range(1, 29))
        noise = min(0.3, v_sum / 100)
        return min(0.99, base + noise)

    def predict(
        self, features: Dict[str, float], model: str = "hybrid"
    ) -> Tuple[float, List[str]]:
        """
        Returns (probability, flags).
        model ∈ {"aht", "rnn", "hybrid"}
        """
        flags: List[str] = []
        start = time.perf_counter()

        # Legacy fallback path
        if self._legacy is not None:
            prob, flags = self._legacy.predict(features)
            flags.append("legacy_dwm_aht_fallback")
            self._add_contextual_flags(features, flags)
            return float(np.clip(prob, 0.0, 1.0)), flags

        prob_rnn = self.rnn.predict(features)
        prob_aht = self.aht_rnn.predict(features)

        rnn_ok = prob_rnn >= 0.0
        aht_ok = prob_aht >= 0.0

        if model == "rnn":
            if rnn_ok:
                probability = prob_rnn
            elif aht_ok:
                probability = prob_aht
                flags.append("rnn_unavailable_using_aht")
            else:
                probability = self._heuristic(features)
                flags.append("model_heuristic_fallback")

        elif model == "aht":
            if aht_ok:
                probability = prob_aht
            elif rnn_ok:
                probability = prob_rnn
                flags.append("aht_unavailable_using_rnn")
            else:
                probability = self._heuristic(features)
                flags.append("model_heuristic_fallback")

        else:  # hybrid
            if rnn_ok and aht_ok:
                probability = (prob_aht * 0.8) + (prob_rnn * 0.2)
            elif rnn_ok:
                probability = prob_rnn
                flags.append("aht_unavailable_rnn_only")
            elif aht_ok:
                probability = prob_aht
                flags.append("rnn_unavailable_aht_only")
            else:
                probability = self._heuristic(features)
                flags.append("model_heuristic_fallback")

        probability = float(np.clip(probability, 0.0, 1.0))
        self._add_contextual_flags(features, flags)
        return probability, flags

    def _add_contextual_flags(self, features: Dict[str, float], flags: List[str]):
        amount = features.get("Amount", 0)
        if amount > 2000:
            flags.append("high_value_transaction")
        if amount > 5000:
            flags.append("very_high_value_critical")
        if features.get("V14", 0) < -5:
            flags.append("anomalous_v14_pattern")
        if features.get("V4", 0) > 4:
            flags.append("suspicious_v4_spike")

    def learn(self, features: Dict[str, float], label: int):
        """Incrementally update AHT with new labeled data."""
        self.aht_rnn.learn(features, label)

    def get_all_metrics(self) -> Dict[str, Any]:
        """
        Returns per-model metrics dict.
        Uses training metrics as base; live tracker updates override
        when enough samples have been seen (>= 10).
        """
        def _merge(model_key: str, live_tracker: CMTracker) -> Dict[str, Any]:
            base = self._training_metrics.get(model_key, {})
            live = live_tracker.metrics()
            # Use live metrics once we have > 10 live labeled predictions
            if live["total_predictions"] >= 10:
                cm = live
            else:
                # Use training metrics as the reliable baseline
                cm_list = base.get("confusion_matrix", [[0, 0], [0, 0]])
                tn = cm_list[0][0] if len(cm_list) > 0 and len(cm_list[0]) > 0 else 0
                fp = cm_list[0][1] if len(cm_list) > 0 and len(cm_list[0]) > 1 else 0
                fn = cm_list[1][0] if len(cm_list) > 1 and len(cm_list[1]) > 0 else 0
                tp = cm_list[1][1] if len(cm_list) > 1 and len(cm_list[1]) > 1 else 0
                cm = {
                    "accuracy": base.get("accuracy", 0.0),
                    "precision": base.get("precision", 0.0),
                    "recall": base.get("recall", 0.0),
                    "f1_score": base.get("f1_score", 0.0),
                    "tp": tp,
                    "fp": fp,
                    "tn": tn,
                    "fn": fn,
                    "total_predictions": live["total_predictions"],
                }
            return cm

        return {
            "aht": _merge("aht", self._cm_aht),
            "rnn": _merge("rnn", self._cm_rnn),
            "hybrid": _merge("hybrid", self._cm_hybrid),
        }


# ─── Legacy DWM+AHT loader ────────────────────────────────────────────────────
def _load_legacy():
    """Attempt to load the old DWM+AHT model from saved_model.pkl."""
    try:
        from . import _legacy_model as lm  # type: ignore
        return lm.get_model()
    except Exception:
        pass
    # Inline minimal fallback
    try:
        from river import ensemble, tree as rtree, preprocessing, metrics as rm
        from river.drift import ADWIN

        legacy_path = os.path.join(ARTIFACTS_DIR, "saved_model.pkl")
        if os.path.exists(legacy_path):
            with open(legacy_path, "rb") as f:
                models_dict = pickle.load(f)
            logger.info("Legacy DWM+AHT loaded from saved_model.pkl")

            class _LegacyWrapper:
                def __init__(self, d):
                    self.arf = d.get("arf")
                    self.dwm = d.get("dwm")

                def predict(self, features):
                    try:
                        p_arf = self.arf.predict_proba_one(features) if self.arf else {}
                        p_a = float(p_arf.get(1, 0.0))
                        p_dwm = self.dwm.predict_proba_one(features) if self.dwm else {}
                        p_d = float(p_dwm.get(1, 0.0))
                        return (p_a + p_d) / 2.0, []
                    except Exception:
                        return 0.1, ["legacy_inference_error"]

            return _LegacyWrapper(models_dict)
    except Exception as e:
        logger.error(f"Legacy model load failed: {e}")
    return None


# ─── Singleton ────────────────────────────────────────────────────────────────
_model_instance: Optional[HybridAHTRNN] = None


def get_model() -> HybridAHTRNN:
    global _model_instance
    if _model_instance is None:
        _model_instance = HybridAHTRNN()
    return _model_instance
