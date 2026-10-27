
from datetime import date
import json
import math


def compare_sessions(previous, current):
    """Compare two sessions from the same user."""

    if previous["user_id"] != current["user_id"]:
        raise ValueError("Sessions belong to different users")

    if previous["task_version"] != current["task_version"]:
        raise ValueError("Task versions do not match")

    if date.fromisoformat(previous["date"]) >= date.fromisoformat(current["date"]):
        raise ValueError("Current session must be later")

    old = previous["speech_features"]
    new = current["speech_features"]

    changes = {}

    for feature in old.keys() & new.keys():
        old_value = float(old[feature])
        new_value = float(new[feature])

        if not all(map(math.isfinite, [old_value, new_value])):
            raise ValueError("Invalid feature value")

        difference = new_value - old_value

        changes[feature] = {
            "previous": round(old_value, 4),
            "current": round(new_value, 4),
            "absolute_change": round(difference, 4),
            "percentage_change": (
                round(difference / abs(old_value) * 100, 2)
                if old_value != 0 else None
            )
        }

    return {
        "user_id": current["user_id"],
        "from_date": previous["date"],
        "to_date": current["date"],
        "speech_changes": changes,
        "interpretation": (
            "Measured speech characteristics changed "
            "between these sessions. These changes "
            "do not establish cognitive decline."
        )
    }


if __name__ == "__main__":
    # Fictional demonstration values, not real patient data
    may = {
        "user_id": "demo_001",
        "date": "2026-05-10",
        "task_version": "voice_v1",
        "speech_features": {
            "spectral_centroid": 1518.79,
            "rms_energy": 0.0421,
            "low_energy_ratio": 0.2333
        }
    }

    january = {
        "user_id": "demo_001",
        "date": "2027-01-10",
        "task_version": "voice_v1",
        "speech_features": {
            "spectral_centroid": 1490.50,
            "rms_energy": 0.0400,
            "low_energy_ratio": 0.2800
        }
    }

    result = compare_sessions(may, january)
    print(json.dumps(result, indent=2))
