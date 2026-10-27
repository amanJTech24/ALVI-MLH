
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from alvi.backend.gemma_service import analyze_transcript

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="ALVI Speech Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "project": "ALVI",
        "message": "Backend is running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    transcript: str = Form(""),
):
    if not audio.filename:
        raise HTTPException(400, "Audio filename is required")

    allowed = (".wav", ".webm", ".mp3", ".m4a", ".ogg")
    if not audio.filename.lower().endswith(allowed):
        raise HTTPException(400, "Unsupported audio format")

    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(400, "Audio file is empty")

    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(413, "Audio exceeds 15 MB")

    result = {
        "project": "ALVI",
        "filename": audio.filename,
        "audio_received": True,
        "ml_status": "not_connected",
        "gemma_analysis": None,
        "disclaimer": (
            "Experimental prototype only. "
            "Not a medical diagnosis or validated screening result."
        ),
    }

    if not transcript.strip():
        result["status"] = "transcript_required"
        result["message"] = (
            "Audio received. Provide a transcript to run "
            "the language-analysis step."
        )
        return result

    try:
        result["gemma_analysis"] = analyze_transcript(transcript)
        result["status"] = "success"
    except Exception as exc:
        print(f"Language analysis failed: {exc}")
        raise HTTPException(
            502,
            "Language analysis failed. Check API key, "
            "model availability, and API access.",
        )

    return result
