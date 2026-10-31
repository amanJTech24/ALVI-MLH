// ─────────────────────────────────────────────────────────────────────────────
// ALVI Cognitive Engine — js/cognitive-engine.js
//
// A lightweight, browser-based, rule-based analysis engine.
// Operates entirely on real session data stored by session.js.
//
// WHAT IT MEASURES (factual, observable):
//   • Whether each activity was completed or skipped
//   • Voice recording duration in seconds
//   • Story Recall recording duration in seconds
//   • MindPlay Remember score (0–2 items correctly identified)
//   • MindPlay Sequence result (correct / incorrect user-defined order)
//   • MindPlay Find result (correct / incorrect card selection)
//   • MindPlay Find reaction time in milliseconds (time from challenge appearing
//     to card tap, measured by performance.now() in the browser)
//   • MindPlay overall challenges correct (0–3)
//
// WHAT IT DOES NOT MEASURE OR CLAIM:
//   • Speech quality, fluency, or pronunciation
//   • Cognitive health, cognitive decline, or cognitive risk
//   • Memory accuracy from voice/story recordings (no transcript available)
//   • Acoustic features (pitch, tempo, hesitation pauses)
//   • Semantic coherence of speech
//   • Any medical or clinical outcome
//
// analysisMethod: "rule-based prototype"
// This engine does not use machine learning, NLP, or any external API.
// ─────────────────────────────────────────────────────────────────────────────

window.ALVI = window.ALVI || {};

(function () {

  // ── Thresholds (purely for task-performance observation labels) ───────────
  // These thresholds describe task performance only, not cognitive health.
  const REACTION_FAST_MS  = 3000;   // under 3s → labelled "Fast"
  const REACTION_SLOW_MS  = 8000;   // over 8s  → labelled "Slow"
  const MIN_RECORDING_SEC = 5;      // below 5s → labelled "Very brief"

  // ── Helper: format ms as "X.Xs" ───────────────────────────────────────────
  function formatMs(ms) {
    if (ms == null || ms <= 0) return null;
    return (ms / 1000).toFixed(1) + 's';
  }

  // ── Helper: format seconds as "Xm Ys" or "Xs" ────────────────────────────
  function formatSec(s) {
    if (!s || s <= 0) return null;
    const rounded = Math.round(s);
    if (rounded < 60) return rounded + 's';
    return Math.floor(rounded / 60) + 'm ' + (rounded % 60) + 's';
  }

  // ── Helper: reaction time label ───────────────────────────────────────────
  function reactionLabel(ms) {
    if (ms == null) return 'Not measured';
    if (ms < REACTION_FAST_MS) return 'Fast response';
    if (ms < REACTION_SLOW_MS) return 'Moderate response';
    return 'Slow response';
  }

  // ── Helper: recording duration label ─────────────────────────────────────
  function durationLabel(sec) {
    if (!sec || sec <= 0)       return 'No recording';
    if (sec < MIN_RECORDING_SEC) return 'Very brief recording';
    return 'Recording captured';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // analyze(session)
  //
  // @param  {Object} session  — from ALVI.session.get()
  // @returns {Object}         — structured analysis result
  // ─────────────────────────────────────────────────────────────────────────
  function analyze(session) {

    if (!session || typeof session !== 'object') {
      return _emptyResult('No session object provided.');
    }

    const v  = session.voice    || {};
    const st = session.story    || {};
    const mp = session.mindplay || {};

    // ── Voice ───────────────────────────────────────────────────────────────
    const voiceCompleted = Boolean(v.completed);
    const voiceDurSec    = Number(v.durationSeconds) || 0;
    const voice = {
      completed:     voiceCompleted,
      durationSec:   voiceDurSec,
      durationLabel: formatSec(voiceDurSec) || '—',
      statusLabel:   voiceCompleted ? 'Recorded' : 'Not recorded',
      observation:   voiceCompleted
        ? durationLabel(voiceDurSec) + ' (' + (formatSec(voiceDurSec) || '—') + '). Content awaiting future analysis.'
        : 'Voice description was not recorded this session.'
    };

    // ── Story Recall ─────────────────────────────────────────────────────────
    const storyCompleted = Boolean(st.completed);
    const storyDurSec    = Number(st.durationSeconds) || 0;
    const story = {
      completed:     storyCompleted,
      durationSec:   storyDurSec,
      durationLabel: formatSec(storyDurSec) || '—',
      statusLabel:   storyCompleted ? 'Recorded' : 'Not recorded',
      observation:   storyCompleted
        ? durationLabel(storyDurSec) + ' (' + (formatSec(storyDurSec) || '—') + '). Recall content awaiting future analysis.'
        : 'Story recall was not recorded this session.'
    };

    // ── MindPlay ─────────────────────────────────────────────────────────────
    const mpCompleted   = Boolean(mp.completed);
    const ch1Score      = Number(mp.ch1_score)    || 0;
    const ch1Correct    = Boolean(mp.ch1_correct);
    const ch2Correct    = Boolean(mp.ch2_correct);
    const ch3Correct    = Boolean(mp.ch3_correct);
    const ch3ReactionMs = (mp.ch3_reactionMs != null && mp.ch3_reactionMs > 0)
      ? Number(mp.ch3_reactionMs)
      : null;

    const challengesCorrect = [ch1Correct, ch2Correct, ch3Correct].filter(Boolean).length;

    const mindplay = {
      completed:        mpCompleted,
      challengesCorrect,                        // 0–3
      ch1: {
        score:       ch1Score,                  // 0, 1, or 2
        correct:     ch1Correct,
        label:       ch1Score + ' / 2 items',
        observation: ch1Correct
          ? 'Both target objects correctly selected.'
          : (ch1Score === 1 ? 'One of two target objects selected.' : 'Neither target object selected.')
      },
      ch2: {
        correct:     ch2Correct,
        label:       ch2Correct ? 'Correct' : 'Incorrect',
        observation: ch2Correct
          ? 'Events placed in correct narrative order.'
          : 'Events not placed in correct order.'
      },
      ch3: {
        correct:     ch3Correct,
        reactionMs:  ch3ReactionMs,
        reactionFormatted: formatMs(ch3ReactionMs) || '—',
        reactionLabel:     ch3ReactionMs != null ? reactionLabel(ch3ReactionMs) : 'Not measured',
        label:       ch3Correct ? 'Correct' : 'Incorrect',
        observation: ch3Correct
          ? 'Correct object identified. Reaction time: ' + (formatMs(ch3ReactionMs) || 'not recorded') + ' (' + reactionLabel(ch3ReactionMs) + ').'
          : 'Incorrect object selected.' + (ch3ReactionMs != null ? ' Reaction time: ' + formatMs(ch3ReactionMs) + '.' : '')
      },
      observation: mpCompleted
        ? challengesCorrect + ' of 3 challenges completed correctly.'
        : 'MindPlay was not completed this session.'
    };

    // ── Session completeness ──────────────────────────────────────────────────
    const activitiesCompleted = [voiceCompleted, storyCompleted, mpCompleted].filter(Boolean).length;
    const allComplete = activitiesCompleted === 3;

    // ── Overall session summary (factual only) ────────────────────────────────
    const summaryLines = [];
    if (voiceCompleted)  summaryLines.push('Voice recorded (' + voice.durationLabel + ')');
    else                 summaryLines.push('Voice not recorded');
    if (storyCompleted)  summaryLines.push('Story Recall recorded (' + story.durationLabel + ')');
    else                 summaryLines.push('Story Recall not recorded');
    if (mpCompleted)     summaryLines.push('MindPlay: ' + challengesCorrect + '/3 challenges correct');
    else                 summaryLines.push('MindPlay not completed');

    return {
      analysisMethod:      'rule-based prototype',
      disclaimer:          'Prototype task-performance analysis — not a medical diagnosis.',
      sessionId:           session.sessionId || null,
      activitiesCompleted,
      allComplete,
      voice,
      story,
      mindplay,
      summaryLines,
      generatedAt:         new Date().toISOString()
    };
  }

  // ── Empty result for missing session ─────────────────────────────────────
  function _emptyResult(reason) {
    return {
      analysisMethod:      'rule-based prototype',
      disclaimer:          'Prototype task-performance analysis — not a medical diagnosis.',
      sessionId:           null,
      activitiesCompleted: 0,
      allComplete:         false,
      voice:    { completed: false, observation: reason },
      story:    { completed: false, observation: reason },
      mindplay: { completed: false, observation: reason, ch1: {}, ch2: {}, ch3: {} },
      summaryLines: [reason],
      generatedAt:  new Date().toISOString()
    };
  }

  // ── Expose ────────────────────────────────────────────────────────────────
  window.ALVI.cognitiveEngine = { analyze };

})();
