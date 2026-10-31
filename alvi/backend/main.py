
# from pathlib import Path

# from dotenv import load_dotenv
# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware

# from alvi.backend.gemma_service import analyze_transcript

# BASE_DIR = Path(__file__).resolve().parent
# load_dotenv(BASE_DIR / ".env")

# app = FastAPI(title="ALVI Speech Analysis API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#         "http://localhost:3000",
#     ],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.get("/")
# def home():
#     return {
#         "project": "ALVI",
#         "message": "Backend is running",
#     }


# @app.get("/health")
# def health():
#     return {"status": "ok"}


# @app.post("/analyze")
# async def analyze(
#     audio: UploadFile = File(...),
#     transcript: str = Form(""),
# ):
#     if not audio.filename:
#         raise HTTPException(400, "Audio filename is required")

#     allowed = (".wav", ".webm", ".mp3", ".m4a", ".ogg")
#     if not audio.filename.lower().endswith(allowed):
#         raise HTTPException(400, "Unsupported audio format")

#     audio_bytes = await audio.read()

#     if not audio_bytes:
#         raise HTTPException(400, "Audio file is empty")

#     if len(audio_bytes) > 15 * 1024 * 1024:
#         raise HTTPException(413, "Audio exceeds 15 MB")

#     result = {
#         "project": "ALVI",
#         "filename": audio.filename,
#         "audio_received": True,
#         "ml_status": "not_connected",
#         "gemma_analysis": None,
#         "disclaimer": (
#             "Experimental prototype only. "
#             "Not a medical diagnosis or validated screening result."
#         ),
#     }

#     if not transcript.strip():
#         result["status"] = "transcript_required"
#         result["message"] = (
#             "Audio received. Provide a transcript to run "
#             "the language-analysis step."
#         )
#         return result

#     try:
#         result["gemma_analysis"] = analyze_transcript(transcript)
#         result["status"] = "success"
#     except Exception as exc:
#         print(f"Language analysis failed: {exc}")
#         raise HTTPException(
#             502,
#             "Language analysis failed. Check API key, "
#             "model availability, and API access.",
#         )

#     return result
from alvi.backend.mindplay_api import router as mindplay_router
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from ml.gemma_story import evaluate_story
import subprocess
import tempfile

from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
from ml.ml_bridge import analyze_audio_for_backend

from pathlib import Path
import subprocess
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from alvi.backend.gemma_service import analyze_transcript

from ml.ml_bridge import analyze_audio_for_backend
from ml.gemma_story import evaluate_story
from ml.progress_engine import compare_sessions


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="ALVI AI Backend")
app.include_router(mindplay_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"project": "ALVI", "message": "Backend running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ====================================
# VOICE ML + GEMMA LANGUAGE ANALYSIS
# ====================================


@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    transcript: str = Form("")
):
    suffix = Path(audio.filename or "").suffix.lower()

    if suffix not in {".wav", ".webm", ".mp3", ".m4a", ".ogg"}:
        raise HTTPException(400, "Unsupported audio format")

    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(400, "Audio is empty")

    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(413, "Audio exceeds 15 MB")

    with tempfile.TemporaryDirectory() as folder:
        source = Path(folder) / f"input{suffix}"
        wav_file = Path(folder) / "converted.wav"

        source.write_bytes(audio_bytes)

        try:
            await run_in_threadpool(
                subprocess.run,
                [
                    "ffmpeg", "-nostdin", "-y",
                    "-loglevel", "error",
                    "-i", str(source),
                    "-ac", "1",
                    "-ar", "16000",
                    "-c:a", "pcm_s16le",
                    str(wav_file)
                ],
                check=True,
                capture_output=True,
                timeout=45
            )

            ml_result = await run_in_threadpool(
                analyze_audio_for_backend,
                str(wav_file)
            )

        except FileNotFoundError:
            raise HTTPException(
                500, "FFmpeg is not installed"
            )
        except subprocess.CalledProcessError:
            raise HTTPException(
                400, "Unable to decode audio"
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(
                408, "Audio conversion timed out"
            )
        except ValueError as exc:
            raise HTTPException(422, str(exc))
        except Exception as exc:
            print("Voice ML error:", repr(exc))
            raise HTTPException(
                500, "Voice ML processing failed"
            )

    result = {
        "status": "success",
        "ml_status": "connected",
        "ml": ml_result,
        "gemma_analysis": None,
        "clinical_use": False
    }

    # Optional language analysis requires a transcript.
    if transcript.strip():
        try:
            result["gemma_analysis"] = (
                await run_in_threadpool(
                    analyze_transcript, transcript
                )
            )
        except Exception as exc:
            print("Gemma error:", repr(exc))
            result["gemma_status"] = "unavailable"

    return result

# ====================================
# GEMMA STORY RECALL
# ====================================

class StoryRequest(BaseModel):
    transcript: str


# DEMO ONLY: replace with facts from the exact UI story.
STORY_FACTS = [
    "Aarav went to the market",
    "He carried a blue umbrella",
    "He bought three red apples",
    "He met Meera",
    "He gave Meera one apple"
]


@app.post("/api/story")
async def story_recall(request: StoryRequest):
    if not request.transcript.strip():
        raise HTTPException(400, "Transcript required")

    try:
        return await run_in_threadpool(
            evaluate_story,
            request.transcript,
            STORY_FACTS
        )
    except Exception as exc:
        print("Story error:", type(exc).__name__, str(exc))
        raise HTTPException(502, "Story evaluation failed")


# ====================================
# COGNITIVE JOURNEY COMPARISON
# ====================================

class ProgressRequest(BaseModel):
    previous: dict
    current: dict


def normalize_session(session):
    # Accept the assessment_engine format,
    # as well as the original progress_engine format.
    features = session.get("speech_features")

    if features is None:
        features = session.get("voice_analysis")

    if features is None:
        features = session.get("voice", {}).get("speech_features")

    if features is None:
        raise ValueError("Speech features missing")

    return {
        "user_id": session["user_id"],
        "date": session["date"],
        "task_version": session.get(
            "task_version", "voice_v1"
        ),
        "speech_features": features
    }


@app.post("/api/progress")
def progress(request: ProgressRequest):
    try:
        previous = normalize_session(request.previous)
        current = normalize_session(request.current)

        return compare_sessions(previous, current)

    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(422, str(exc))
app.mount(
    "/alvi",
    StaticFiles(
        directory=str(BASE_DIR.parent),
        html=True
    ),
    name="frontend"
)


# ======================================
# GEMMA 4 STORY RECALL API
# ======================================

class StoryRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=5000)


# Facts from the Aarav story in story.js
STORY_FACTS = [
    "Aarav left home on a rainy morning with a blue umbrella",
    "Aarav walked to the local market",
    "Aarav bought three red apples",
    "Aarav met his friend Meera on his way back",
    "Aarav gave Meera one apple before returning home"
]


@app.post("/api/story")
async def story_recall(request: StoryRequest):
    if not request.transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Story transcript is required"
        )

    try:
        result = await run_in_threadpool(
            evaluate_story,
            request.transcript,
            STORY_FACTS
        )

        return {
            "status": "success",
            "story_analysis": result
        }

    except Exception as exc:
        print("Gemma Story error:", type(exc).__name__, str(exc))

        raise HTTPException(
            status_code=502,
            detail="Gemma Story Recall evaluation failed"
        )
