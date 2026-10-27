
from pathlib import Path
import re
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import StratifiedGroupKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# ==========================
# 1. LOAD DATASET
# ==========================

BASE = Path(__file__).resolve().parent

df = pd.read_csv(BASE / "features_v2.csv")

print("\n===== ALVI ML V2 TRAINING =====")
print("Total recordings:", len(df))

# ==========================
# 2. IDENTIFY SPEAKERS
# ==========================

def get_speaker(filename):
    stem = Path(filename).stem
    return re.sub(
        r"(?:_+\d+)+$", "", stem
    ).strip().lower()

df["speaker"] = df["filename"].apply(get_speaker)

print("Unique speakers:", df["speaker"].nunique())

# Check speaker label consistency
conflicts = df.groupby("speaker")["label"].nunique()

if (conflicts > 1).any():
    raise ValueError(
        "Conflicting speaker labels found: "
        + str(conflicts[conflicts > 1].index.tolist())
    )

# ==========================
# 3. PREPARE FEATURES
# ==========================

X = df.drop(columns=["filename", "label", "speaker"])
y = df["label"]
groups = df["speaker"]

print("Number of ML features:", X.shape[1])

if not np.isfinite(X.to_numpy(dtype=float)).all():
    raise ValueError("Invalid numerical features found")

# ==========================
# 4. SPEAKER-AWARE VALIDATION
# ==========================

cv = StratifiedGroupKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

accuracies = []
f1_scores = []

for fold, (train_idx, test_idx) in enumerate(
    cv.split(X, y, groups), start=1
):

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    f1 = f1_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    accuracies.append(accuracy)
    f1_scores.append(f1)

    print(f"\n========== FOLD {fold} ==========")
    print(f"Accuracy: {accuracy:.2%}")
    print(f"Macro F1 Score: {f1:.3f}")

    print("\nClassification Report:")
    print(classification_report(
        y_test,
        predictions,
        labels=[0, 1],
        target_names=["Non-Dementia", "Dementia"],
        zero_division=0
    ))

    print("Confusion Matrix:")
    print(confusion_matrix(
        y_test,
        predictions,
        labels=[0, 1]
    ))

# ==========================
# 5. FINAL EVALUATION
# ==========================

print("\n========== FINAL RESULTS ==========")

print("Mean Accuracy:",
      f"{np.mean(accuracies):.2%}")

print("Mean Macro F1:",
      f"{np.mean(f1_scores):.3f}")

print("Accuracy Standard Deviation:",
      f"{np.std(accuracies):.3f}")

# ==========================
# 6. TRAIN FINAL MODEL
# ==========================

final_model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)

final_model.fit(X, y)

# ==========================
# 7. SAVE MODEL
# ==========================

models_dir = BASE / "models"
models_dir.mkdir(exist_ok=True)

model_path = models_dir / "alvi_model_v2.joblib"

joblib.dump(
    {
        "model": final_model,
        "features": X.columns.tolist(),
        "version": "ALVI_V2",
        "classes": {
            0: "Non-Dementia",
            1: "Dementia"
        }
    },
    model_path
)

print("\nALVI V2 MODEL SAVED SUCCESSFULLY!")
print("Model location:", model_path)
