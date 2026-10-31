
// ALVI MindPlay — Frontend + FastAPI + Python scoring integration

document.addEventListener('DOMContentLoaded', () => {

  // Preserve the existing ALVI session.
  const mindplayCh1 = document.getElementById('mindplay-ch1');
  const mindplayCh2 = document.getElementById('mindplay-ch2');
  const mindplayCh3 = document.getElementById('mindplay-ch3');
  const mindplaySummary = document.getElementById('mindplay-summary');

  const ch1NextBtn = document.getElementById('ch1-next-btn');
  const ch2BackBtn = document.getElementById('ch2-back-btn');
  const ch2NextBtn = document.getElementById('ch2-next-btn');
  const ch3BackBtn = document.getElementById('ch3-back-btn');
  const completeMindplayBtn = document.getElementById('complete-mindplay-btn');
  const analyzeCheckinBtn = document.getElementById('analyze-checkin-btn');

  // Activity state and timings
  const selectedCh1Items = new Set();

  let findSelection = null;
  let findMs = null;

  let rememberStartedAt = performance.now();
  let rememberDuration = 0;

  let sequenceStartedAt = null;
  let sequenceDuration = 0;

  let isSubmittingMindplay = false;

  // ── Challenge 1: Remember ─────────────────────────────

  const selectCards = document.querySelectorAll('.mindplay-select-card');

  selectCards.forEach(card => {
    card.addEventListener('click', () => {
      const itemKey = card.getAttribute('data-item');

      if (!itemKey) return;

      if (selectedCh1Items.has(itemKey)) {
        selectedCh1Items.delete(itemKey);
        card.classList.remove('selected');
      } else {
        selectedCh1Items.add(itemKey);
        card.classList.add('selected');
      }
    });
  });

  if (ch1NextBtn) {
    ch1NextBtn.addEventListener('click', () => {

      rememberDuration +=
        (performance.now() - rememberStartedAt) / 1000;

      sequenceStartedAt = performance.now();

      if (mindplayCh1) mindplayCh1.classList.add('hidden');
      if (mindplayCh2) mindplayCh2.classList.remove('hidden');

      renderSequenceItems();
    });
  }

  // ── Challenge 2: Sequence ────────────────────────────

  const sequenceEvents = [
    { id: 1, text: 'Aarav left home', correctOrder: 1 },
    { id: 2, text: 'Aarav went to the market', correctOrder: 2 },
    { id: 3, text: 'Aarav bought apples', correctOrder: 3 },
    { id: 4, text: 'Aarav met Meera', correctOrder: 4 },
    { id: 5, text: 'Aarav returned home', correctOrder: 5 }
  ];

  const currentSequence = [
    sequenceEvents[0],
    sequenceEvents[2],
    sequenceEvents[1],
    sequenceEvents[4],
    sequenceEvents[3]
  ];

  function renderSequenceItems() {

    const container =
      document.getElementById('sequence-items-container');

    if (!container) return;

    container.innerHTML = '';

    currentSequence.forEach((item, index) => {

      const el = document.createElement('div');

      el.className =
        'seq-item p-4 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-between shadow-sm';

      el.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="w-7 h-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            ${index + 1}
          </span>
          <span class="text-sm font-semibold text-slate-800">
            ${item.text}
          </span>
        </div>

        <div class="flex items-center space-x-1">
          <button
            class="btn-move-up p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 ${index === 0 ? 'opacity-40 cursor-not-allowed' : ''}"
            ${index === 0 ? 'disabled' : ''}>
            ▲
          </button>

          <button
            class="btn-move-down p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 ${index === currentSequence.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}"
            ${index === currentSequence.length - 1 ? 'disabled' : ''}>
            ▼
          </button>
        </div>
      `;

      const upBtn = el.querySelector('.btn-move-up');

      if (upBtn && index > 0) {
        upBtn.addEventListener('click', () => {

          [currentSequence[index - 1], currentSequence[index]] =
            [currentSequence[index], currentSequence[index - 1]];

          renderSequenceItems();
        });
      }

      const downBtn = el.querySelector('.btn-move-down');

      if (downBtn && index < currentSequence.length - 1) {
        downBtn.addEventListener('click', () => {

          [currentSequence[index], currentSequence[index + 1]] =
            [currentSequence[index + 1], currentSequence[index]];

          renderSequenceItems();
        });
      }

      container.appendChild(el);
    });
  }

  if (ch2BackBtn) {
    ch2BackBtn.addEventListener('click', () => {

      if (sequenceStartedAt !== null) {
        sequenceDuration +=
          (performance.now() - sequenceStartedAt) / 1000;

        sequenceStartedAt = null;
      }

      rememberStartedAt = performance.now();

      if (mindplayCh2) mindplayCh2.classList.add('hidden');
      if (mindplayCh1) mindplayCh1.classList.remove('hidden');
    });
  }

  if (ch2NextBtn) {
    ch2NextBtn.addEventListener('click', () => {

      if (sequenceStartedAt !== null) {
        sequenceDuration +=
          (performance.now() - sequenceStartedAt) / 1000;

        sequenceStartedAt = null;
      }

      if (mindplayCh2) mindplayCh2.classList.add('hidden');
      if (mindplayCh3) mindplayCh3.classList.remove('hidden');

      startFindTimer();
    });
  }

  // ── Challenge 3: Find ────────────────────────────────

  let findTimerInterval = null;
  let findStartTime = null;

  function startFindTimer() {

    clearInterval(findTimerInterval);

    findStartTime = performance.now();
    findSelection = null;
    findMs = null;

    document.querySelectorAll('.find-card').forEach(card => {
      card.classList.remove(
        'selected-correct',
        'selected-incorrect'
      );
    });

    const findTimerDisplay =
      document.getElementById('find-timer');

    if (findTimerDisplay) {
      findTimerDisplay.textContent = '00:0.0s';
    }

    findTimerInterval = setInterval(() => {

      const seconds =
        (performance.now() - findStartTime) / 1000;

      if (findTimerDisplay) {
        findTimerDisplay.textContent =
          `00:${seconds.toFixed(1)}s`;
      }

    }, 100);
  }

  const findCards = document.querySelectorAll('.find-card');

  findCards.forEach(card => {
    card.addEventListener('click', () => {

      // Count only the first answer.
      if (findStartTime === null || findSelection !== null) {
        return;
      }

      const item = card.getAttribute('data-find-item');

      if (!item) return;

      findSelection = item;
      findMs = performance.now() - findStartTime;

      clearInterval(findTimerInterval);
      findTimerInterval = null;

      findCards.forEach(c => {
        c.classList.remove(
          'selected-correct',
          'selected-incorrect'
        );
      });

      card.classList.add(
        item === 'umbrella'
          ? 'selected-correct'
          : 'selected-incorrect'
      );
    });
  });

  if (ch3BackBtn) {
    ch3BackBtn.addEventListener('click', () => {

      clearInterval(findTimerInterval);

      findTimerInterval = null;
      findStartTime = null;
      findSelection = null;
      findMs = null;

      sequenceStartedAt = performance.now();

      if (mindplayCh3) mindplayCh3.classList.add('hidden');
      if (mindplayCh2) mindplayCh2.classList.remove('hidden');
    });
  }

  // ── FASTAPI + PYTHON MINDPLAY INTEGRATION ─────────────

  if (completeMindplayBtn) {

    completeMindplayBtn.addEventListener('click', async () => {

      if (isSubmittingMindplay) return;

      if (findSelection === null || findMs === null) {
        alert('Please select an item in the Find challenge first.');
        return;
      }

      // Actual user answers and browser-measured timings
      const payload = {

        remember_answers: Array.from(selectedCh1Items),

        sequence_answers:
          currentSequence.map(item => item.id),

        find_answer: findSelection,

        remember_time_seconds:
          Number(rememberDuration.toFixed(2)),

        sequence_time_seconds:
          Number(sequenceDuration.toFixed(2)),

        find_time_seconds:
          Number((findMs / 1000).toFixed(2))
      };

      isSubmittingMindplay = true;
      completeMindplayBtn.disabled = true;

      const originalButtonText = completeMindplayBtn.textContent;

      completeMindplayBtn.textContent = 'Scoring your games...';

      try {

        console.log('ALVI MindPlay request:', payload);

        // Send answers to FastAPI
        const response = await fetch(
          'http://127.0.0.1:8000/api/mindplay',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            `MindPlay API error (HTTP ${response.status}): ${JSON.stringify(result?.detail ?? '')}`
          );
        }

        if (
          result?.status !== 'success' ||
          !result.games?.remember ||
          !result.games?.sequence ||
          !result.games?.find
        ) {
          throw new Error(
            'Backend returned incomplete MindPlay scores.'
          );
        }

        console.log('ALVI MINDPLAY API RESULT:', result);

        // All scores below come from Python.
        const { remember, sequence, find } = result.games;

        const ch1_selected = payload.remember_answers;

        // Remember uses a penalty for wrong selections.
        const ch1_score =
          Math.round((remember.score / 100) * 2);

        const ch1_correct = remember.score === 100;

        const ch2_correct = sequence.score === 100;

        const ch3_correct = find.score === 100;

        const ch3_reactionMs =
          find.time_seconds * 1000;

        // Save results to existing ALVI session
        if (window.ALVI?.session) {

          window.ALVI.session.saveMindplay({
            ch1_selected,
            ch1_correct,
            ch1_score,
            ch2_correct,
            ch3_correct,
            ch3_reactionMs,
            completed: true
          });

          // Preserve full backend scores without replacing
          // your current session.js or losing Voice/Story data.
          const session = window.ALVI.session.get();

          session.mindplay.backendScores = result.games;
          session.mindplay.taskVersion = result.task_version;

          sessionStorage.setItem(
            'alvi_session',
            JSON.stringify(session)
          );
        }

        // Update summary using backend-calculated values
        const summaryRecallEl =
          document.getElementById('summary-recall');

        const summaryPatternEl =
          document.getElementById('summary-pattern');

        const summaryTimeEl =
          document.getElementById('summary-time');

        if (summaryRecallEl) {
          summaryRecallEl.textContent =
            `${ch1_score}/2`;
        }

        if (summaryPatternEl) {
          summaryPatternEl.textContent =
            ch2_correct ? 'Correct' : 'Incorrect';
        }

        if (summaryTimeEl) {

          const totalSeconds =
            rememberDuration +
            sequenceDuration +
            find.time_seconds;

          summaryTimeEl.textContent =
            `${totalSeconds.toFixed(1)}s`;
        }

        if (mindplayCh3) {
          mindplayCh3.classList.add('hidden');
        }

        if (mindplaySummary) {
          mindplaySummary.classList.remove('hidden');
        }

      } catch (error) {

        console.error(
          'ALVI MindPlay integration error:',
          error
        );

        alert(
          'Could not score MindPlay. ' + error.message
        );

      } finally {

        isSubmittingMindplay = false;
        completeMindplayBtn.disabled = false;
        completeMindplayBtn.textContent = originalButtonText;

      }
    });
  }

  // Continue to analysis page
  if (analyzeCheckinBtn) {

    analyzeCheckinBtn.addEventListener('click', () => {
      window.location.href = 'analysis.html';
    });

  }

});
