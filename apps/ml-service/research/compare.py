import pandas as pd
import matplotlib.pyplot as plt

# Load results from CSV files
single = pd.read_csv("single_ht_results.csv")
ensemble = pd.read_csv("ensemble_aht_results.csv")
dwm = pd.read_csv("dwm_results.csv")
hybrid = pd.read_csv("hybrid_results.csv")

# Extract metrics
models = ["Single HT", "Ensemble AHT", "DWM", "Hybrid"]

accuracy = [
    single["Accuracy"][0],
    ensemble["Accuracy"][0],
    dwm["Accuracy"][0],
    hybrid["Accuracy"][0]
]

precision = [
    single["Precision"][0],
    ensemble["Precision"][0],
    dwm["Precision"][0],
    hybrid["Precision"][0]
]

recall = [
    single["Recall"][0],
    ensemble["Recall"][0],
    dwm["Recall"][0],
    hybrid["Recall"][0]
]

f1 = [
    single["F1 Score"][0],
    ensemble["F1 Score"][0],
    dwm["F1 Score"][0],
    hybrid["F1 Score"][0]
]

# Create graphs
plt.figure(figsize=(12,8))

# Accuracy
plt.subplot(2,2,1)
plt.bar(models, accuracy)
plt.title("Accuracy Comparison")
plt.ylim(0.95,1.0)

# Precision
plt.subplot(2,2,2)
plt.bar(models, precision)
plt.title("Precision Comparison")
plt.ylim(0.95,1.0)

# Recall
plt.subplot(2,2,3)
plt.bar(models, recall)
plt.title("Recall Comparison")
plt.ylim(0.95,1.0)

# F1 Score
plt.subplot(2,2,4)
plt.bar(models, f1)
plt.title("F1 Score Comparison")
plt.ylim(0.95,1.0)

plt.tight_layout()
plt.savefig("model_comparison.png", dpi=300)

plt.show()