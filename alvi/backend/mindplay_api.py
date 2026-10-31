
import math

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ml.mindplay_scoring import calculate_mindplay_score

router = APIRouter()


class MindplaySubmission(BaseModel):
    remember_answers: list[str]
    sequence_answers: list[int]
    find_answer: str

    remember_time_seconds: float
    sequence_time_seconds: float
    find_time_seconds: float


@router.post("/api/mindplay")
def score_mindplay(data: MindplaySubmission):

    # Correct answers are controlled by the backend.
    # These match the current ALVI MindPlay frontend.
    remember_key = ["umbrella", "apples"]
    sequence_key = [1, 2, 3, 4, 5]
    find_key = ["umbrella"]

    allowed_remember = {
        "umbrella", "apples", "bicycle", "books"
    }

    allowed_find = {
        "umbrella", "apples", "raincoat"
    }

    if not set(data.remember_answers).issubset(allowed_remember):
        raise HTTPException(
            status_code=422,
            detail="Invalid Remember selection"
        )

    if (
        len(data.sequence_answers) != 5
        or set(data.sequence_answers) != set(sequence_key)
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid Sequence submission"
        )

    if data.find_answer not in allowed_find:
        raise HTTPException(
            status_code=422,
            detail="Invalid Find selection"
        )

    for value in [
        data.remember_time_seconds,
        data.sequence_time_seconds,
        data.find_time_seconds
    ]:
        if not math.isfinite(value) or not 0 <= value <= 3600:
            raise HTTPException(
                status_code=422,
                detail="Invalid completion time"
            )

    try:
        remember = calculate_mindplay_score(
            "remember",
            remember_key,
            data.remember_answers,
            data.remember_time_seconds
        )

        sequence = calculate_mindplay_score(
            "sequence",
            sequence_key,
            data.sequence_answers,
            data.sequence_time_seconds
        )

        find = calculate_mindplay_score(
            "find",
            find_key,
            [data.find_answer],
            data.find_time_seconds
        )

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error)
        )

    return {
        "status": "success",
        "task_version": "mindplay_v1",
        "games": {
            "remember": remember,
            "sequence": sequence,
            "find": find
        },
        "clinical_use": False
    }
