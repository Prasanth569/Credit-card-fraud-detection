/**
 * Feature Engineering Layer
 *
 * Transforms preprocessed transaction data into the structured
 * feature vector expected by the ML model.
 *
 * If real PCA-transformed features (V1-V28) are not provided,
 * this module generates simulated features to enable the system
 * to demonstrate end-to-end functionality.
 */

import { PreprocessedTransaction } from "./preprocess";

export interface FeatureVector {
  [key: string]: number;
  amount: number;
  time: number;
  v1: number; v2: number; v3: number; v4: number;
  v5: number; v6: number; v7: number; v8: number;
  v9: number; v10: number; v11: number; v12: number;
  v13: number; v14: number; v15: number; v16: number;
  v17: number; v18: number; v19: number; v20: number;
  v21: number; v22: number; v23: number; v24: number;
  v25: number; v26: number; v27: number; v28: number;
}

/**
 * Simple seeded random number generator for deterministic simulation.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Check if all V-features are zero (meaning no real features were provided).
 */
function hasRealFeatures(txn: PreprocessedTransaction): boolean {
  for (let i = 1; i <= 28; i++) {
    const key = `v${i}` as keyof PreprocessedTransaction;
    if (txn[key] !== 0) return true;
  }
  return false;
}

/**
 * Generate simulated PCA features when real ones aren't available.
 *
 * Uses amount and time as seeds to produce deterministic,
 * realistic-looking feature distributions.
 */
function generateSimulatedFeatures(
  amount: number,
  time: number
): Partial<FeatureVector> {
  // Seed based on amount + time for deterministic results
  const rng = seededRandom(Math.floor(amount * 1000 + time));

  // Generate features with distributions loosely matching the real dataset
  const features: Partial<FeatureVector> = {};

  // Features that correlate with fraud in the real dataset
  const fraudCorrelatedIndices = [4, 11, 14, 17]; // V4, V11, V14, V17
  const normalIndices = [
    1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16, 18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28,
  ];

  for (const i of normalIndices) {
    const key = `v${i}` as keyof FeatureVector;
    // Normal distribution approximation (Box-Muller)
    const u1 = rng();
    const u2 = rng();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    (features as any)[key] = normal;
  }

  for (const i of fraudCorrelatedIndices) {
    const key = `v${i}` as keyof FeatureVector;
    const u1 = rng();
    const u2 = rng();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    // Amplify for high-amount transactions (simulate fraud signal)
    const amplification = amount > 5 ? 1.5 : 1.0; // amount is log-scaled
    (features as any)[key] = normal * amplification;
  }

  return features;
}

/**
 * Transform a preprocessed transaction into a complete feature vector
 * ready for the ML model.
 */
export function extractFeatures(
  txn: PreprocessedTransaction
): FeatureVector {
  // If real V-features exist, pass them through directly
  if (hasRealFeatures(txn)) {
    return {
      amount: txn.amount,
      time: txn.time,
      v1: txn.v1, v2: txn.v2, v3: txn.v3, v4: txn.v4,
      v5: txn.v5, v6: txn.v6, v7: txn.v7, v8: txn.v8,
      v9: txn.v9, v10: txn.v10, v11: txn.v11, v12: txn.v12,
      v13: txn.v13, v14: txn.v14, v15: txn.v15, v16: txn.v16,
      v17: txn.v17, v18: txn.v18, v19: txn.v19, v20: txn.v20,
      v21: txn.v21, v22: txn.v22, v23: txn.v23, v24: txn.v24,
      v25: txn.v25, v26: txn.v26, v27: txn.v27, v28: txn.v28,
    };
  }

  // Generate simulated features for demo mode
  const simulated = generateSimulatedFeatures(txn.amount, txn.time);
  return {
    amount: txn.amount,
    time: txn.time,
    v1: (simulated as any).v1 ?? 0,
    v2: (simulated as any).v2 ?? 0,
    v3: (simulated as any).v3 ?? 0,
    v4: (simulated as any).v4 ?? 0,
    v5: (simulated as any).v5 ?? 0,
    v6: (simulated as any).v6 ?? 0,
    v7: (simulated as any).v7 ?? 0,
    v8: (simulated as any).v8 ?? 0,
    v9: (simulated as any).v9 ?? 0,
    v10: (simulated as any).v10 ?? 0,
    v11: (simulated as any).v11 ?? 0,
    v12: (simulated as any).v12 ?? 0,
    v13: (simulated as any).v13 ?? 0,
    v14: (simulated as any).v14 ?? 0,
    v15: (simulated as any).v15 ?? 0,
    v16: (simulated as any).v16 ?? 0,
    v17: (simulated as any).v17 ?? 0,
    v18: (simulated as any).v18 ?? 0,
    v19: (simulated as any).v19 ?? 0,
    v20: (simulated as any).v20 ?? 0,
    v21: (simulated as any).v21 ?? 0,
    v22: (simulated as any).v22 ?? 0,
    v23: (simulated as any).v23 ?? 0,
    v24: (simulated as any).v24 ?? 0,
    v25: (simulated as any).v25 ?? 0,
    v26: (simulated as any).v26 ?? 0,
    v27: (simulated as any).v27 ?? 0,
    v28: (simulated as any).v28 ?? 0,
  };
}
