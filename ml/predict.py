
from pathlib import Path
import sys
import joblib
import librosa
import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "models" / "alvi_model_v2.joblib"

# Load the saved ML model
bundle = joblib.load(MODEL_PATH)
model = bundle["model"]
feature_names = bundle["features"]


def analyze_voice(audio_path):
    # Load audio with the same settings used for training
    y, sr = librosa.load(
        str(audio_path),
        sr=16000,
        mono=True
    )

    if len(y) < 2048:
        raise ValueError("Audio recording is too short")

    features = {}

    # 1. MFCC features
    mfcc = librosa.feature.mfcc(
        y=y, sr=sr, n_mfcc=20
    )

    for i in range(20):
        features[f"mfcc_{i+1}_mean"] = float(
            np.mean(mfcc[i])
        )
        features[f"mfcc_{i+1}_std"] = float(
            np.std(mfcc[i])
        )

    # 2. Delta MFCC features
    delta = librosa.feature.delta(mfcc)

    for i in range(20):
        features[f"delta_{i+1}_mean"] = float(
            np.mean(delta[i])
        )

    # 3. Spectral features
    spectral = {
        "centroid": librosa.feature.spectral_centroid(
            y=y, sr=sr
        ),
        "bandwidth": librosa.feature.spectral_bandwidth(
            y=y, sr=sr
        ),
        "rolloff": librosa.feature.spectral_rolloff(
            y=y, sr=sr
        ),
        "zcr": librosa.feature.zero_crossing_rate(y)
    }

    for name, values in spectral.items():
        features[name + "_mean"] = float(
            np.mean(values)
        )
        features[name + "_std"] = float(
            np.std(values)
        )

    # 4. RMS energy
    rms = librosa.feature.rms(y=y)[0]

    features["rms_mean"] = float(np.mean(rms))
    features["rms_std"] = float(np.std(rms))

    # 5. Approximate low-energy ratio
    threshold = 0.1 * np.max(rms)

    features["low_energy_ratio"] = float(
        np.mean(rms < threshold)
    )

    # Arrange features in training order
    X = pd.DataFrame([features])
    X = X[feature_names]

    if not np.isfinite(X.to_numpy()).all():
        raise ValueError("Invalid audio features")

    # Experimental model output
    prediction = int(model.predict(X)[0])

    # Return results
    return {
        "experimental_class": (
            "Dementia" if prediction == 1
            else "Non-Dementia"
        ),
        "speech_features": {
            "spectral_centroid": round(
                features["centroid_mean"], 2
            ),
            "rms_energy": round(
                features["rms_mean"], 4
            ),
            "low_energy_ratio": round(
                features["low_energy_ratio"], 4
            )
        },
        "model_accuracy_cv": 0.5406,
        "clinical_use": False,
        "disclaimer": (
            "Experimental research model. "
            "Not suitable for medical diagnosis or risk screening."
        )
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py path_to_audio.wav")
        sys.exit(1)

    result = analyze_voice(sys.argv[1])
    print("\nALVI ML RESULT:")
    print(result)
