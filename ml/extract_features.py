
from pathlib import Path
import librosa
import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
DATASET = BASE / "dataset"
OUTPUT = Path(__file__).resolve().parent / "features.csv"

records = []

for category, label in [("dementia", 1), ("non-dementia", 0)]:
    folder = DATASET / category

    for file in folder.rglob("*.wav"):
        try:
            # Standardize sample rate to 16000 Hz
            y, sr = librosa.load(str(file), sr=16000, mono=True)

            if len(y) == 0:
                print("Skipping empty file:", file.name)
                continue

            # Extract MFCC features
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

            features = {
                "filename": file.name,
                "label": label
            }

            for i in range(13):
                features[f"mfcc_{i+1}_mean"] = float(
                    np.mean(mfcc[i])
                )
                features[f"mfcc_{i+1}_std"] = float(
                    np.std(mfcc[i])
                )

            # Spectral centroid
            centroid = librosa.feature.spectral_centroid(
                y=y, sr=sr
            )
            features["spectral_centroid"] = float(
                np.mean(centroid)
            )

            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(y)
            features["zcr"] = float(np.mean(zcr))

            # RMS energy
            rms = librosa.feature.rms(y=y)
            features["rms"] = float(np.mean(rms))

            records.append(features)
            print("Processed:", file.name)

        except Exception as e:
            print("Error:", file.name, e)

df = pd.DataFrame(records)
df.to_csv(OUTPUT, index=False)

print("\nFeature extraction completed!")
print("Total processed:", len(df))
print("Feature table shape:", df.shape)
print("Saved to:", OUTPUT)
