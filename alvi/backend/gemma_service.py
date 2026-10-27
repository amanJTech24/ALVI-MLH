
import os
from google import genai

MODEL_NAME = "gemma-4-26b-a4b-it"


def analyze_transcript(transcript: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are an experimental speech-analysis assistant.

Analyze this transcript for observable communication
features, such as repetition, vocabulary, and sentence structure.

Transcript:
{transcript}

Do not diagnose Alzheimer's disease.
Explain uncertainty and limitations.
Keep the response concise and understandable.
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    if not response.text:
        raise RuntimeError("The model returned an empty response")

    return response.text
