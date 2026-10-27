# ALVI -- Alzheimer's Listening Voice Intelligence

**ALVI (Alzheimer's Listening Voice Intelligence)** is a web-based
hackathon prototype exploring how voice patterns and short guided
cognitive activities could help people notice possible early signs of
cognitive change. The goal is to make an initial awareness check more
accessible through everyday devices, while encouraging people with
concerns to seek professional advice.

> **Important:** ALVI is a preliminary screening and awareness
> prototype, not a diagnostic system. It cannot diagnose or rule out
> Alzheimer's disease or dementia and should not replace assessment by a
> qualified healthcare professional.

## The Problem We're Solving

Alzheimer's and other forms of cognitive decline can involve changes in
memory, speech, and thinking. Early changes may be subtle and can be
mistaken for normal ageing. Traditional screening and assessment can
take time, cost money, and be difficult to access for some people.
Without an easy way to notice or track changes, people may delay seeking
professional help.

ALVI explores a simple first step: a user completes a short guided
check-in and provides voice input through a regular microphone. The
system analyses selected speech patterns and presents a cognitive
snapshot intended to support awareness, not provide a medical
conclusion.

## Our Solution

ALVI combines a guided cognitive check-in, voice/audio processing,
machine-learning analysis, and a user-facing results view.

The intended user journey is:

1.  **Access ALVI:** Open the web application on a phone or computer.
2.  **Complete the check-in:** Follow a guided three-part activity,
    including scenario description, story recall, and mind-play
    challenges.
3.  **Provide voice input:** Record speech using a regular microphone.
    The project flow also includes a voice-input/transcription stage.
4.  **Process the audio:** Represent the audio for analysis and extract
    selected speech features.
5.  **Analyse patterns:** Pass the extracted features as a feature
    vector to an ML classifier/analysis pipeline.
6.  **View the snapshot:** Show a personalized cognitive snapshot and an
    awareness-oriented result, such as a caution or early-awareness
    indication.
7.  **Track changes:** The concept includes personal-baseline tracking
    so results from different sessions can be compared over time, where
    this is implemented and data is available.

## Key Features

-   **Guided 3-part cognitive check-in:** Provides a structured
    interaction instead of an open-ended recording alone.
-   **Voice input and transcription:** Uses speech captured through a
    regular microphone as part of the assessment flow.
-   **Speech-pattern analysis:** Explores selected voice/audio features
    that may be useful for analysing speech patterns.
-   **ML-based analysis:** Uses extracted features as input to a
    machine-learning analysis pipeline.
-   **Personalized cognitive snapshot:** Presents results in a
    user-friendly format.
-   **Personal baseline concept:** Aims to help users notice changes
    across sessions over time.
-   **Accessible web experience:** Designed for everyday devices and
    browser access without specialized recording equipment.

## How the Technology Works

The high-level workflow shown in our presentation is:

``` text
Guided cognitive check-in
          ↓
Voice input / transcription
          ↓
Raw audio processing
          ↓
Spectrogram and feature extraction
          ↓
Feature vector
          ↓
ML / AI analysis
          ↓
Cognitive snapshot and awareness result
```

### Audio processing and features

Our presentation identifies raw audio, a spectrogram, and feature-vector
creation as stages in the pipeline. It also mentions these example audio
features:

-   **MFCCs (Mel-Frequency Cepstral Coefficients):** Represent aspects
    of the audio's short-term frequency characteristics and are commonly
    used in speech/audio analysis.
-   **Pitch:** Relates to the perceived fundamental frequency of the
    voice.
-   **Jitter:** Measures small variations in vocal-period timing when it
    can be estimated reliably.
-   **Spectrogram:** Shows how audio energy across frequencies changes
    over time.

The exact features used by the running implementation, along with the
extraction libraries and settings, should match the project code.

### Machine learning and Gemma AI

The project uses a machine-learning pipeline to analyse extracted
speech/audio features. In the workflow described in the presentation,
the features are arranged into a **feature vector** and passed to an
**ML classifier**, which contributes to the resulting screening-oriented
output.

**Gemma AI** is also part of the project's AI component. ALVI uses Google's Gemma AI to analyze speech transcripts and generate meaningful, easy-to-understand language insights. It fits into the workflow after the transcript reaches the backend, where the backend sends the text to Gemma for analysis and returns the results to the frontend for display.

Gemma acts as the natural-language AI layer of ALVI, helping make transcript analysis more understandable for users while complementing the project's machine-learning component as the system evolves.



## Technology Stack

  -----------------------------------------------------------------------
  Technology                          Role in the project
  ----------------------------------- -----------------------------------
  **React**                           Builds the web interface.

  **JavaScript**                      Handles frontend behaviour and user
                                      interactions.

  **Python**                          Supports backend and AI/ML
                                      processing.

  **Flask**                           Provides the Python web-backend
                                      framework.

  **Audio processing**                Processes voice recordings and
                                      extracts selected speech/audio
                                      features.

  **Machine learning**                Analyses the extracted feature
                                      vector using a classifier/ML
                                      pipeline.

  **Gemma AI**                        Included as an AI component
  -----------------------------------------------------------------------

## Prototype

Try the ALVI web prototype here:

https://willowy-figolla-e00485.netlify.app



### Requirements

-   Git
-   Node.js and npm for the frontend
-   Python 3 and pip for the backend
-   Any additional packages required for audio processing and ML
-   Access to the Gemma runtime/API, if required by the implementation

### Setup outline

1.  Clone the repository:

    ``` bash
    git clone <YOUR_GITHUB_REPOSITORY_URL>
    cd <YOUR_REPOSITORY_FOLDER>
    ```

2.  Create and activate a Python virtual environment from the
    backend/project directory:

    ``` bash
    python -m venv .venv
    ```

    Windows PowerShell:

    ``` powershell
    .venv\Scripts\Activate.ps1
    ```

    macOS/Linux:

    ``` bash
    source .venv/bin/activate
    ```

3.  Install backend dependencies if `requirements.txt` is provided:

    ``` bash
    pip install -r requirements.txt
    ```

4.  From the frontend directory, install packages and start the
    development server:

    ``` bash
    npm install
    npm run dev
    ```

5.  Configure any required environment variables for the backend, model
    paths, or Gemma integration. Keep API keys and `.env` files private.

These are example setup steps, not verified commands for the current
repository. The actual entry points and package scripts should be
checked before publishing final run instructions.

## Datasets and References

The project uses the following resources:

-   **DementiaBank -- Speech & Dementia Dataset:**
    https://talkbank.org/dementia/access/
-   **ADReSS Speech Research Challenge:**
    https://www.interspeech2020.org/Program/Special_Sessions_and_Challenge/
-   **World Health Organization -- Dementia Fact Sheet:**
    https://www.who.int/news-room/fact-sheets/detail/dementia


## Team

The project is submitted by the team **Aevora**
Team members are:

-   Aman Jain: 25BAI70103
-   Gunpreet Kaur: 25BAI70973
-   Riya Kansal: 25BAI70470


## Future Improvements

-   Document the exact Gemma model, its task, and its setup.
-   Specify the ML algorithm, training process, dataset, and evaluation
    metrics.
-   Test performance across different accents, languages, microphones,
    and recording conditions.
-   Improve consent-based and secure personal-baseline tracking.
-   Add tests for audio processing, backend endpoints, and model
    inference.
-   Evaluate the system on suitable data before making health-related
    performance claims.

## Privacy and Medical Disclaimer

Voice recordings and cognitive-related information can be sensitive. A
responsible deployment should explain what is collected and why, obtain
consent, protect any stored data, limit retention, and provide a way to
delete personal information. Any use of external AI services should be
clearly disclosed.

ALVI is intended to support preliminary awareness only. Speech patterns
can be affected by many factors, including accent, language, age,
recording quality, and non-cognitive health conditions. Its output must
not be used on its own to diagnose or rule out a condition. Anyone
concerned about memory, speech, or thinking changes should consult a
qualified healthcare professional.

------------------------------------------------------------------------

**Built as a hackathon project exploring more accessible, voice-based
cognitive awareness.**
