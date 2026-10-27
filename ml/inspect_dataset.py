
from pathlib import Path
import soundfile as sf
import pandas as pd

dataset_path = Path(__file__).resolve().parent.parent / "dataset"

records = []

for category in ["dementia", "non-dementia"]:
    folder = dataset_path / category

    for audio_file in folder.rglob("*.wav"):
        try:
            info = sf.info(str(audio_file))

            records.append({
                "filename": audio_file.name,
                "category": category,
                "duration": round(info.duration, 2),
                "sample_rate": info.samplerate,
                "channels": info.channels,
                "status": "OK"
            })

        except Exception as e:
            records.append({
                "filename": audio_file.name,
                "category": category,
                "duration": None,
                "sample_rate": None,
                "channels": None,
                "status": str(e)
            })

df = pd.DataFrame(records)

print("\nTOTAL FILES:", len(df))

print("\nCATEGORY COUNTS:")
print(df["category"].value_counts())

print("\nSAMPLE RATES:")
print(df["sample_rate"].value_counts())

print("\nAUDIO DURATIONS:")
print(df["duration"].describe())

print("\nFILE STATUS:")
print(df["status"].value_counts())

df.to_csv(
    Path(__file__).resolve().parent / "dataset_report.csv",
    index=False
)
