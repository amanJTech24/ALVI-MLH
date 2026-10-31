// ─────────────────────────────────────────────────────────────────────────────
// ALVI Analysis Page — js/analysis.js  (Change #5F)
//
// Reads real session data from ALVI.session.get() and reflects actual
// activity completion states. Does NOT simulate AI/ML analysis.
//
// Behaviour:
//   • Animates through 3 steps, one per activity (Voice, Story, MindPlay).
//   • Each step turns green (✓) if that activity was completed,
//     or amber (–) if it was skipped, never claiming analysis ran.
//   • If ALL 3 are complete  → auto-redirects to results.html after a brief pause.
//   • If ANY are missing     → shows the incomplete panel with action buttons.
//   • If session.js not loaded → fails gracefully with a warning, still shows UI.
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Read session (safe even if session.js didn't load) ───────────────────
  const session = (window.ALVI && ALVI.session)
    ? ALVI.session.get()
    : { voice: { completed: false }, story: { completed: false }, mindplay: { completed: false } };

  if (!window.ALVI || !ALVI.session) {
    console.warn('ALVI.session not available — analysis.js falling back to empty session.');
  }

  // ── Map the 3 activities to their DOM step elements ──────────────────────
  const activities = [
    { id: 'step-proc-1', completed: session.voice.completed,    skippedLabel: 'Voice Description — not recorded this session' },
    { id: 'step-proc-2', completed: session.story.completed,    skippedLabel: 'Story Recall — not recorded this session' },
    { id: 'step-proc-3', completed: session.mindplay.completed, skippedLabel: 'MindPlay — not completed this session' }
  ];

  const allComplete = activities.every(a => a.completed);
  const completedCount = activities.filter(a => a.completed).length;

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const badgeTextEl        = document.getElementById('analysis-badge-text');
  const headingEl          = document.getElementById('analysis-heading');
  const subtextEl          = document.getElementById('analysis-subtext');
  const footerEl           = document.getElementById('analysis-footer');
  const incompleteMsgEl    = document.getElementById('analysis-incomplete-msg');
  const incompleteTextEl   = document.getElementById('analysis-incomplete-text');

  // Reset all steps to pending state before animating
  activities.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'flex items-center space-x-3 text-slate-500';
    const check = el.querySelector('.step-check');
    if (check) {
      check.textContent = check.getAttribute('data-num') || check.textContent.replace('✓', '').replace('–', '').trim();
      check.className = 'step-check w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]';
    }
  });

  // ── Animate steps sequentially (700ms each) ──────────────────────────────
  let currentStep = 0;
  const STEP_DELAY_MS = 700;

  const interval = setInterval(() => {
    if (currentStep < activities.length) {
      const { id, completed, skippedLabel } = activities[currentStep];
      const el = document.getElementById(id);

      if (el) {
        const check = el.querySelector('.step-check');
        const labelSpan = el.querySelector('span:not(.step-check)');

        if (completed) {
          // Green tick — activity was completed
          el.className = 'flex items-center space-x-3 text-emerald-400 font-bold transition-all';
          if (check) {
            check.textContent = '✓';
            check.className = 'step-check w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-[10px]';
          }
        } else {
          // Amber dash — activity was skipped
          el.className = 'flex items-center space-x-3 text-amber-400 transition-all';
          if (check) {
            check.textContent = '–';
            check.className = 'step-check w-5 h-5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 font-black flex items-center justify-center text-[10px]';
          }
          if (labelSpan) labelSpan.textContent = skippedLabel;
        }
      }

      currentStep++;

    } else {
      // All steps processed
      clearInterval(interval);

      setTimeout(() => {
        if (allComplete) {
          // ── ALL COMPLETE: update UI then redirect ──────────────────────
          if (badgeTextEl) badgeTextEl.textContent = 'All activities complete ✓';
          if (headingEl)   headingEl.textContent   = 'Session snapshot ready';
          if (subtextEl)   subtextEl.textContent   = 'All three activities recorded. Preparing your results...';
          if (footerEl) {
            footerEl.classList.remove('animate-pulse');
            footerEl.textContent = 'Proceeding to your results...';
          }

          setTimeout(() => {
            window.location.href = 'results.html';
          }, 1400);

        } else {
          // ── INCOMPLETE: show options ───────────────────────────────────
          const missing = activities.filter(a => !a.completed).length;
          const label = missing === 1 ? '1 activity' : `${missing} activities`;

          if (badgeTextEl) {
            badgeTextEl.textContent = `${completedCount} / 3 activities completed`;
            const badge = document.getElementById('analysis-status-badge');
            if (badge) {
              badge.className = badge.className
                .replace('bg-indigo-100 text-indigo-700', 'bg-amber-100 text-amber-700');
              const dot = badge.querySelector('span.animate-ping');
              if (dot) dot.className = dot.className
                .replace('bg-indigo-600', 'bg-amber-500');
            }
          }
          if (headingEl) headingEl.textContent = 'Incomplete check-in';
          if (subtextEl) subtextEl.textContent = `${label} skipped. You can still view partial results or return to complete them.`;
          if (footerEl)  footerEl.classList.add('hidden');
          if (incompleteMsgEl) incompleteMsgEl.classList.remove('hidden');
          if (incompleteTextEl) {
            incompleteTextEl.textContent = `${missing} ${missing === 1 ? 'activity was' : 'activities were'} not completed this session.`;
          }
        }
      }, 400);
    }
  }, STEP_DELAY_MS);

});
