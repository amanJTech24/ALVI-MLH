
from pathlib import Path
import librosa
import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
DATASET = BASE / "dataset"
OUTPUT = BASE / "ml" / "features_v2.csv"

records = []

for category, label in [("dementia", 1), ("non-dementia", 0)]:
    folder = DATASET / category

    for file in folder.rglob("*.wav"):
        try:
            y, sr = librosa.load(
                str(file), sr=16000, mono=True
            )

            if len(y) < 2048:
                print("Too short:", file.name)
                continue

            features = {
                "filename": file.name,
                "label": label
            }

            # MFCCs
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

            # MFCC changes over time
            delta = librosa.feature.delta(mfcc)

            for i in range(20):
                features[f"delta_{i+1}_mean"] = float(
                    np.mean(delta[i])
                )

            # Spectral features
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

            # Energy and approximate silence
            rms = librosa.feature.rms(y=y)[0]

            features["rms_mean"] = float(np.mean(rms))
            features["rms_std"] = float(np.std(rms))

            threshold = 0.1 * np.max(rms)
            features["low_energy_ratio"] = float(
                np.mean(rms < threshold)
            )

            records.append(features)
            print("Processed:", file.name)

        except Exception as e:
            print("Error:", file.name, e)

df = pd.DataFrame(records)
df.to_csv(OUTPUT, index=False)

print("\nEnhanced feature extraction completed!")
print("Total processed:", len(df))
print("Feature table shape:", df.shape)
print("Saved to:", OUTPUT)
