
import os
import re
import json
from google import genai

from story_scoring import calculate_recall_score

MODEL = "gemma-4-26b-a4b-it"


def evaluate_story(transcript, reference_facts):
    if not transcript.strip():
        raise ValueError("Transcript is empty")

    if not reference_facts:
        raise ValueError("Reference facts are required")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are evaluating a story recall activity.

Determine whether the participant remembered each
reference fact based ONLY on the transcript.

Accept accurate paraphrasing.
Do not assume or invent missing information.
Do not diagnose cognitive impairment.

Reference facts:
{json.dumps(reference_facts)}

Participant transcript:
{json.dumps(transcript)}

Return ONLY valid JSON in this format:
{{"recalled": [true, false, true]}}

The recalled array must contain exactly
{len(reference_facts)} boolean values,
one for each fact in its original order.
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    raw = (response.text or "").strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)

    data = json.loads(raw)
    judgments = data["recalled"]

    if (
        len(judgments) != len(reference_facts)
        or not all(type(x) is bool for x in judgments)
    ):
        raise ValueError("Invalid Gemma fact judgments")

    score = calculate_recall_score(judgments)

    return {
        "model": MODEL,
        "fact_judgments": judgments,
        "story_result": score,
        "disclaimer": "Non-clinical story recall activity"
    }


if __name__ == "__main__":
    facts = [
        "Aarav went to the market",
        "He carried a blue umbrella",
        "He bought three red apples",
        "He met Meera",
        "He gave Meera one apple"
    ]

    transcript = (
        "Aarav went to the market with a blue umbrella. "
        "He bought three red apples."
    )

    result = evaluate_story(transcript, facts)

    print(json.dumps(result, indent=2))
