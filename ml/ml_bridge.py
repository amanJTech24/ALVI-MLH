
from pathlib import Path
import sys
import numpy as np
import librosa

from ml.predict import analyze_voice


def analyze_audio_for_backend(audio_path):
    audio_path = Path(audio_path)

    if not audio_path.is_file():
        raise FileNotFoundError(f"Audio not found: {audio_path}")

    # Run existing trained ML model
    result = analyze_voice(str(audio_path))

    # Load audio for additional measurements
    y, sr = librosa.load(
        str(audio_path),
        sr=16000,
        mono=True
    )

    duration = len(y) / sr

    if duration < 2:
        raise ValueError("Recording must be at least 2 seconds")

    rms = librosa.feature.rms(y=y)[0]

    # Low energy ratio is NOT a clinical pause measurement
    low_energy_ratio = float(
        np.mean(rms < 0.1 * np.max(rms))
    ) if np.max(rms) > 0 else 1.0

    return {
        "status": "success",
        "duration_seconds": round(duration, 2),
        "speech_features": {
            **result["speech_features"],
            "low_energy_ratio": round(low_energy_ratio, 4)
        },
        "model_version": "ALVI_V2",
        "model_validation_accuracy": 0.5406,
        "diagnosis": None,
        "disclaimer": (
            "Experimental speech analysis only. "
            "Not a medical diagnosis or risk assessment."
        )
    }


if __name__ == "__main__":
    import json

    if len(sys.argv) != 2:
        print("Usage: python ml_bridge.py audio.wav")
        sys.exit(1)

    output = analyze_audio_for_backend(sys.argv[1])
    print(json.dumps(output, indent=2))
