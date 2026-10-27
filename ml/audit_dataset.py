
from pathlib import Path
import pandas as pd
import re

BASE = Path(__file__).resolve().parent

features = pd.read_csv(BASE / "features.csv")
report = pd.read_csv(BASE / "dataset_report.csv")

# Identify speakers from filenames
def get_speaker(filename):
    stem = Path(filename).stem
    return re.sub(r"(_\d+)+$", "", stem).strip().lower()

features["speaker"] = features["filename"].apply(get_speaker)

# Number of recordings per speaker
speaker_counts = features.groupby("speaker").size()

print("\n=== SPEAKER ANALYSIS ===")
print("Total recordings:", len(features))
print("Unique speakers:", features["speaker"].nunique())
print("Speakers with multiple recordings:",
      (speaker_counts > 1).sum())

print("\nTop 10 speakers by recording count:")
print(speaker_counts.sort_values(ascending=False).head(10))

# Speaker counts in each category
print("\n=== CLASS DISTRIBUTION ===")
print(features.groupby("label")["speaker"].nunique())

# Check conflicting labels
conflicts = features.groupby("speaker")["label"].nunique()

print("\nSpeakers appearing in both classes:",
      (conflicts > 1).sum())

# Duration statistics by category
print("\n=== AUDIO DURATION BY CATEGORY ===")
print(report.groupby("category")["duration"].describe().round(2))

# Sample rate differences
print("\n=== SAMPLE RATES BY CATEGORY ===")
print(pd.crosstab(
    report["category"],
    report["sample_rate"]
))

# Save the speaker list for later verification
features[["filename", "label", "speaker"]].to_csv(
    BASE / "speaker_audit.csv",
    index=False
)

print("\nAudit completed!")
