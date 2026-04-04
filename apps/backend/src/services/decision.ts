/**
 * Decision Engine
 *
 * Evaluates the ML model's fraud probability output and
 * determines the final transaction decision.
 *
 * Decisions:
 *   ALLOW  — probability <= 0.3  (low risk)
 *   FLAG   — 0.3 < probability <= 0.7 (medium risk → request verification)
 *   BLOCK  — probability > 0.7  (high risk → reject transaction)
 *
 * Thresholds are configurable and can be updated at runtime.
 */

export interface DecisionResult {
  decision: "ALLOW" | "FLAG" | "BLOCK";
  riskLevel: "low" | "medium" | "high" | "critical";
  riskLabel: string;
  flags: string[];
}

// Default thresholds (can be overridden via settings API)
let FLAG_THRESHOLD = 0.3;
let BLOCK_THRESHOLD = 0.7;

/**
 * Update decision thresholds. Called from Settings API.
 */
export function setThresholds(flagThreshold: number, blockThreshold: number) {
  if (flagThreshold >= blockThreshold) {
    throw new Error("Flag threshold must be less than block threshold");
  }
  if (flagThreshold < 0 || blockThreshold > 1) {
    throw new Error("Thresholds must be between 0 and 1");
  }
  FLAG_THRESHOLD = flagThreshold;
  BLOCK_THRESHOLD = blockThreshold;
}

/**
 * Get current thresholds.
 */
export function getThresholds() {
  return {
    flagThreshold: FLAG_THRESHOLD,
    blockThreshold: BLOCK_THRESHOLD,
  };
}

/**
 * Evaluate the fraud probability and return a decision.
 */
export function evaluateDecision(
  probability: number,
  modelFlags: string[] = [],
  amount?: number
): DecisionResult {
  const flags = [...modelFlags];

  // Determine risk level
  let riskLevel: DecisionResult["riskLevel"];
  let riskLabel: string;

  if (probability > 0.9) {
    riskLevel = "critical";
    riskLabel = "Critical";
  } else if (probability > BLOCK_THRESHOLD) {
    riskLevel = "high";
    riskLabel = "High";
  } else if (probability > FLAG_THRESHOLD) {
    riskLevel = "medium";
    riskLabel = "Medium";
  } else {
    riskLevel = "low";
    riskLabel = "Low";
  }

  // Determine decision
  let decision: DecisionResult["decision"];

  if (probability > BLOCK_THRESHOLD) {
    decision = "BLOCK";
    flags.push("auto_blocked_high_probability");
  } else if (probability > FLAG_THRESHOLD) {
    decision = "FLAG";
    flags.push("flagged_for_review");
  } else {
    decision = "ALLOW";
  }

  // Additional rule-based overrides
  if (amount !== undefined) {
    // Very high amounts get extra scrutiny
    if (amount > 5000 && probability > 0.2) {
      if (decision === "ALLOW") {
        decision = "FLAG";
        flags.push("high_amount_override");
      }
    }
    // Extremely high amounts with any suspicion → block
    if (amount > 10000 && probability > 0.5) {
      decision = "BLOCK";
      flags.push("extreme_amount_block");
    }
  }

  return { decision, riskLevel, riskLabel, flags };
}
