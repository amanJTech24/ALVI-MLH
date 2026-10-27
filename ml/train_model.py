
from pathlib import Path
import re
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import StratifiedGroupKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

BASE = Path(__file__).resolve().parent
df = pd.read_csv(BASE / "features.csv")

# Extract speaker identity from filenames
def get_speaker(filename):
    stem = Path(filename).stem
    return re.sub(r"(_\d+)+$", "", stem).strip().lower()

df["speaker"] = df["filename"].apply(get_speaker)

print("Total recordings:", len(df))
print("Unique speakers:", df["speaker"].nunique())

# Check for speakers with conflicting labels
conflicts = df.groupby("speaker")["label"].nunique()
if (conflicts > 1).any():
    raise ValueError(
        "Speakers with conflicting labels: "
        + str(conflicts[conflicts > 1].index.tolist())
    )

X = df.drop(columns=["filename", "label", "speaker"])
y = df["label"]
groups = df["speaker"]

if not np.isfinite(X.to_numpy(dtype=float)).all():
    raise ValueError("Features contain missing or infinite values")

# Five-fold speaker-aware cross-validation
cv = StratifiedGroupKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

accuracies = []

for fold, (train_idx, test_idx) in enumerate(
    cv.split(X, y, groups), start=1
):
    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(X.iloc[train_idx], y.iloc[train_idx])
    predictions = model.predict(X.iloc[test_idx])

    accuracy = accuracy_score(y.iloc[test_idx], predictions)
    accuracies.append(accuracy)

    print(f"\nFold {fold} accuracy: {accuracy:.2%}")
    print(classification_report(
        y.iloc[test_idx],
        predictions,
        labels=[0, 1],
        target_names=["Non-dementia", "Dementia"],
        zero_division=0
    ))
    print(confusion_matrix(
        y.iloc[test_idx],
        predictions,
        labels=[0, 1]
    ))

print("\nMean CV accuracy:", f"{np.mean(accuracies):.2%}")

# Fit a final experimental model on all available data.
final_model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)
final_model.fit(X, y)

models_dir = BASE / "models"
models_dir.mkdir(exist_ok=True)

joblib.dump(
    {"model": final_model, "features": X.columns.tolist()},
    models_dir / "alvi_model.joblib"
)

print("\nModel saved successfully!")
