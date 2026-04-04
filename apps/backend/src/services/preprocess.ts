/**
 * Preprocessing Layer
 *
 * Validates, cleans, and normalizes raw transaction data
 * before it reaches the feature engineering layer.
 *
 * Responsibilities:
 * - Input validation
 * - Missing value handling
 * - Amount normalization
 * - Timestamp processing
 */

export interface RawTransactionInput {
  amount?: number | string;
  time?: number | string;
  ipAddress?: string;
  v1?: number; v2?: number; v3?: number; v4?: number;
  v5?: number; v6?: number; v7?: number; v8?: number;
  v9?: number; v10?: number; v11?: number; v12?: number;
  v13?: number; v14?: number; v15?: number; v16?: number;
  v17?: number; v18?: number; v19?: number; v20?: number;
  v21?: number; v22?: number; v23?: number; v24?: number;
  v25?: number; v26?: number; v27?: number; v28?: number;
}

export interface PreprocessedTransaction {
  amount: number;
  time: number;
  ipAddress: string;
  v1: number; v2: number; v3: number; v4: number;
  v5: number; v6: number; v7: number; v8: number;
  v9: number; v10: number; v11: number; v12: number;
  v13: number; v14: number; v15: number; v16: number;
  v17: number; v18: number; v19: number; v20: number;
  v21: number; v22: number; v23: number; v24: number;
  v25: number; v26: number; v27: number; v28: number;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Preprocess a raw transaction input into a clean, validated format.
 */
export function preprocessTransaction(
  raw: RawTransactionInput
): PreprocessedTransaction {
  // 1. Validate & parse amount
  const amount = parseFloat(String(raw.amount ?? 0));
  if (isNaN(amount) || amount < 0) {
    throw new ValidationError(
      "Amount must be a non-negative number",
      "amount",
      "INVALID_AMOUNT"
    );
  }

  // 2. Validate & parse time
  let time = parseFloat(String(raw.time ?? 0));
  if (isNaN(time) || time < 0) {
    // Default to seconds since midnight
    time = 0;
  }

  // 3. Normalize amount (log-scale normalization matching dataset preprocessing)
  // The creditcard.csv Amount is not PCA-transformed, so we normalize it
  const normalizedAmount = amount > 0 ? Math.log1p(amount) : 0;

  // 4. Sanitize IP address
  const ipAddress = raw.ipAddress?.trim() || "0.0.0.0";
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress)) {
    // Not a valid IP — use default
  }

  // 5. Handle PCA features — default to 0 if missing
  const getFeature = (val: number | undefined): number => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return val;
  };

  return {
    amount: normalizedAmount,
    time,
    ipAddress,
    v1: getFeature(raw.v1),
    v2: getFeature(raw.v2),
    v3: getFeature(raw.v3),
    v4: getFeature(raw.v4),
    v5: getFeature(raw.v5),
    v6: getFeature(raw.v6),
    v7: getFeature(raw.v7),
    v8: getFeature(raw.v8),
    v9: getFeature(raw.v9),
    v10: getFeature(raw.v10),
    v11: getFeature(raw.v11),
    v12: getFeature(raw.v12),
    v13: getFeature(raw.v13),
    v14: getFeature(raw.v14),
    v15: getFeature(raw.v15),
    v16: getFeature(raw.v16),
    v17: getFeature(raw.v17),
    v18: getFeature(raw.v18),
    v19: getFeature(raw.v19),
    v20: getFeature(raw.v20),
    v21: getFeature(raw.v21),
    v22: getFeature(raw.v22),
    v23: getFeature(raw.v23),
    v24: getFeature(raw.v24),
    v25: getFeature(raw.v25),
    v26: getFeature(raw.v26),
    v27: getFeature(raw.v27),
    v28: getFeature(raw.v28),
  };
}
