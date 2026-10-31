// Voice Description & Check-in Flow Script
// Waveform: real mic via Web Audio API AnalyserNode (bar style, matches story page).
// Playback: MediaRecorder captures audio; object URL presented after stop.

document.addEventListener('DOMContentLoaded', () => {

  // Ã¢â€â‚¬Ã¢â€â‚¬ Section visibility toggle Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const beginCheckinFlowBtn     = document.getElementById('begin-checkin-flow-btn');
  const todayOverviewSection    = document.getElementById('page-today-checkin');
  const voiceDescriptionSection = document.getElementById('page-voice-description');

  if (beginCheckinFlowBtn && todayOverviewSection && voiceDescriptionSection) {
    beginCheckinFlowBtn.addEventListener('click', () => {
      todayOverviewSection.classList.add('hidden');
      voiceDescriptionSection.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Ã¢â€â‚¬Ã¢â€â‚¬ Session: start a fresh check-in session when the user
      // deliberately begins. This is the only place init() is called so
      // that returning to this page via the sidebar does NOT wipe a
      // session that is already in progress.
      if (window.ALVI && window.ALVI.session) {
        window.ALVI.session.init();
      }
    });
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ DOM refs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const toggleRecordBtn   = document.getElementById('toggle-record-btn');
  const recordIcon        = document.getElementById('record-icon');
  const recordBtnText     = document.getElementById('record-btn-text');
  const recordStatusText  = document.getElementById('record-status-text');
  const voiceTimerDisplay = document.getElementById('voice-timer-display');
  const toStoryRecallBtn  = document.getElementById('to-story-recall-btn');
  const resetRecordBtn    = document.getElementById('reset-record-btn');
  const canvas            = document.getElementById('voice-waveform-canvas');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Ã¢â€â‚¬Ã¢â€â‚¬ State Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  let isRecording         = false;
  let voiceRecordingTimer = null;
  let voiceElapsedSeconds = 0;
  let animFrameId         = null;

  // Web Audio API Ã¢â‚¬â€ analysis only (NOT connected to destination, no echo)
  let audioCtx    = null;
  let analyser    = null;
  let micSource   = null;
  let micStream   = null;
  let dataArray   = null;
  let waveformSamples = null;
  let maxMicRms = 0;
  // MediaRecorder Ã¢â‚¬â€ captures audio for playback
  let mediaRecorder   = null;
  let recordedChunks  = [];
  let playbackURL     = null;   // current object URL; revoked on reset
  let recordedBlob    = null;   // send real recorded audio, never a Blob URL
  let recordingReady  = Promise.resolve(null);
  let recordingVersion = 0;
  let isUploading = false;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Playback element (injected once, hidden/shown) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Insert a persistent <audio> element near the status text so it doesn't
  // get overwritten by status updates.
  const playbackContainer = document.createElement('div');
  playbackContainer.id    = 'voice-playback-container';
  playbackContainer.className = 'hidden flex items-center gap-3 pt-1';
  playbackContainer.innerHTML =
    '<span class="text-xs text-emerald-400 font-semibold">Ã¢â€“Â¶ Your recording:</span>' +
    '<audio id="voice-playback-audio" controls class="h-8 rounded-lg" style="max-width:240px;filter:invert(1) hue-rotate(210deg) brightness(0.9)"></audio>';

  // Insert after the record-status-text paragraph inside the dark panel
  if (recordStatusText && recordStatusText.parentNode) {
    recordStatusText.parentNode.insertBefore(playbackContainer, recordStatusText.nextSibling);
  }
  const playbackAudio = document.getElementById('voice-playback-audio');
if (playbackAudio) {
  playbackAudio.addEventListener('loadedmetadata', () => {
    console.log('ALVI playback ready:', {
      duration: playbackAudio.duration,
      volume: playbackAudio.volume,
      muted: playbackAudio.muted,
      readyState: playbackAudio.readyState
    });
  });

  playbackAudio.addEventListener('error', () => {
    if (playbackURL) {
      console.error('ALVI playback error:', playbackAudio.error);
    }
  });

  playbackAudio.addEventListener('play', () => {
    console.log('ALVI playback started');
  });
}
  // Ã¢â€â‚¬Ã¢â€â‚¬ Canvas: stamp real pixel dimensions at draw time Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Re-stamp every frame so resize events are automatically handled.
  function stampCanvas() {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth  : canvas.offsetWidth;
    const h = parent ? parent.clientHeight : canvas.offsetHeight;
    if (w > 0 && canvas.width  !== w) canvas.width  = w;
    if (h > 0 && canvas.height !== h) canvas.height = h;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Idle baseline Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  function drawIdle() {
    stampCanvas();
    if (canvas.width === 0 || canvas.height === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars   = 45;
    const barW   = (canvas.width / bars) - 2;
    const centerY = canvas.height / 2;
    ctx.fillStyle = '#334155';
    for (let i = 0; i < bars; i++) {
      const x = i * (barW + 2);
      const h = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, centerY - h / 2, barW, h, 2);
      else ctx.rect(x, centerY - h / 2, barW, h);
      ctx.fill();
    }
  }

  drawIdle();

  // Ã¢â€â‚¬Ã¢â€â‚¬ Live waveform Ã¢â‚¬â€ bar style matching Story Recall Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Uses getByteFrequencyData so bars react visibly to speech amplitude.
  function drawLiveWaveform() {
    if (!isRecording || !analyser) return;
    animFrameId = requestAnimationFrame(drawLiveWaveform);

    stampCanvas();
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    analyser.getByteFrequencyData(dataArray);
    if (waveformSamples) {
  analyser.getByteTimeDomainData(waveformSamples);

  let sumSquares = 0;

  for (const sample of waveformSamples) {
    const amplitude = (sample - 128) / 128;
    sumSquares += amplitude * amplitude;
  }

  const rms = Math.sqrt(
    sumSquares / waveformSamples.length
  );

  maxMicRms = Math.max(maxMicRms, rms);
}
    ctx.clearRect(0, 0, W, H);

    const bars  = 45;
    const barW  = (W / bars) - 2;
    const centerY = H / 2;

    for (let i = 0; i < bars; i++) {
      // Map frequency bins evenly across bar count
      const binIndex = Math.floor(i * dataArray.length / bars);
      const amplitude = dataArray[binIndex] / 255;   // 0Ã¢â‚¬â€œ1

      // Minimum 3 px tall (silence baseline), scales to ~80% of half-height
      const h = Math.max(3, amplitude * H * 0.85);
      const x = i * (barW + 2);
      const y = centerY - h / 2;

      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, h, 2);
      else ctx.rect(x, y, barW, h);
      ctx.fill();
    }
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Start recording Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  async function startRecording() {
    isRecording = false;
    voiceElapsedSeconds = 0;
    if (voiceTimerDisplay) voiceTimerDisplay.textContent = '0:00 / 0:30';

    if (recordIcon)       recordIcon.textContent = 'Ã¢ÂÂ³';
    if (recordBtnText)    recordBtnText.textContent = 'Requesting micÃ¢â‚¬Â¦';
    if (recordStatusText) {
      recordStatusText.textContent = 'Waiting for microphone permissionÃ¢â‚¬Â¦';
      recordStatusText.className   = 'text-xs text-slate-400';
    }
    playbackContainer.classList.add('hidden');

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const microphone = micStream.getAudioTracks()[0];

console.log('ALVI microphone input:', {
  label: microphone?.label,
  enabled: microphone?.enabled,
  muted: microphone?.muted,
  readyState: microphone?.readyState
});
      // Ã¢â€â‚¬Ã¢â€â‚¬ Web Audio graph (analysis only) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize               = 256;   // 128 frequency bins Ã¢â‚¬â€ enough for bars
      analyser.smoothingTimeConstant = 0.75;

      micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(analyser);
      // NOT wired to destination Ã¢â€ â€™ no loopback / echo

      dataArray = new Uint8Array(analyser.frequencyBinCount); // 128 bins
      waveformSamples = new Uint8Array(analyser.fftSize);
maxMicRms = 0;
      // Ã¢â€â‚¬Ã¢â€â‚¬ MediaRecorder (capture for playback + backend analysis) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      recordedChunks = [];
      recordedBlob = null;
      const currentRecordingVersion = ++recordingVersion;
      let resolveReady;
      recordingReady = new Promise(resolve => { resolveReady = resolve; });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      mediaRecorder = new MediaRecorder(micStream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // A recording that was reset must not overwrite the new session.
        if (currentRecordingVersion !== recordingVersion) {
          resolveReady(null);
          return;
        }
        if (recordedChunks.length > 0) {
          recordedBlob = new Blob(recordedChunks, { type: mimeType });
          if (playbackURL) URL.revokeObjectURL(playbackURL);
          playbackURL = URL.createObjectURL(recordedBlob);
          if (playbackAudio) {
            playbackAudio.src = playbackURL;
            playbackAudio.load();
          }
          playbackContainer.classList.remove('hidden');

          // Capturing a recording is not equivalent to successfully analyzing
          // it. We mark voice.completed only after /analyze succeeds.
          if (window.ALVI && window.ALVI.session) {
            window.ALVI.session.saveVoice({
              completed: false,
              durationSeconds: voiceElapsedSeconds,
              mlStatus: null,
              speechFeatures: null
            });
          }
        }
        resolveReady(recordedBlob);
        console.log('ALVI recording finalized:', {
  bytes: recordedBlob?.size ?? 0,
  mimeType: recordedBlob?.type ?? '',
  chunks: recordedChunks.length,
  peakMicRms: Number(maxMicRms.toFixed(5))
});
      };

      mediaRecorder.onerror = (event) => {
        console.error('ALVI MediaRecorder error:', event);
        resolveReady(null);
      };

      mediaRecorder.start(100); // collect data every 100 ms

      // Ã¢â€â‚¬Ã¢â€â‚¬ Animation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      isRecording = true;
      animFrameId = requestAnimationFrame(drawLiveWaveform);

      // Ã¢â€â‚¬Ã¢â€â‚¬ UI Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      if (recordIcon)       recordIcon.textContent = 'Ã¢ÂÂ¹';
      if (recordBtnText)    recordBtnText.textContent = 'Stop Recording';
      if (recordStatusText) {
        recordStatusText.textContent = 'Recording in progressÃ¢â‚¬Â¦ Describe the scene aloud.';
        recordStatusText.className   = 'text-xs text-indigo-400 font-semibold animate-pulse';
      }
      if (resetRecordBtn)   resetRecordBtn.classList.remove('hidden');

      // 30-second timer
      voiceRecordingTimer = setInterval(() => {
        voiceElapsedSeconds++;
        const mins = Math.floor(voiceElapsedSeconds / 60);
        const secs = (voiceElapsedSeconds % 60).toString().padStart(2, '0');
        if (voiceTimerDisplay) voiceTimerDisplay.textContent = `${mins}:${secs} / 0:30`;
        if (voiceElapsedSeconds >= 30) stopRecording(true);
      }, 1000);

    } catch (err) {
      isRecording = false;
      if (recordIcon)       recordIcon.textContent = 'Ã°Å¸Å½â„¢Ã¯Â¸Â';
      if (recordBtnText)    recordBtnText.textContent = 'Start Recording';
      if (recordStatusText) {
        const msg = err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow mic permission and try again.'
          : 'Microphone unavailable. Please check your device settings.';
        recordStatusText.textContent = msg;
        recordStatusText.className   = 'text-xs text-red-400 font-semibold';
      }
      drawIdle();
    }
}
  // Ã¢â€â‚¬Ã¢â€â‚¬ Stop recording Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  async function stopRecording() {
    if (!isRecording) return;

    const versionAtStop = recordingVersion;

    isRecording = false;
    clearInterval(voiceRecordingTimer);

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (toggleRecordBtn) toggleRecordBtn.disabled = true;

    if (recordStatusText) {
      recordStatusText.textContent = 'Finishing recordingÃ¢â‚¬Â¦';
    }

    try {
      // Allow MediaRecorder to finalize its audio data.
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      // Wait for onstop to create the final audio Blob.
      const blob = await recordingReady;

      // Ignore an old recording if the user pressed Reset.
      if (versionAtStop !== recordingVersion) return;

      if (!blob || blob.size === 0) {
        throw new Error(
          'No recording data captured. Check your microphone and retry.'
        );
      }

      if (recordIcon) {
        recordIcon.textContent = 'Ã¢Å“â€œ';
      }

      if (recordBtnText) {
        recordBtnText.textContent = 'Recording Complete';
      }

      if (recordStatusText) {
        recordStatusText.textContent =
          'Recording captured. Play it back before continuing.';

        recordStatusText.className =
          'text-xs text-emerald-400 font-bold';
      }

    } catch (error) {
      console.error('ALVI recording error:', error);

      if (recordStatusText &&
          versionAtStop === recordingVersion) {
        recordStatusText.textContent = error.message;
        recordStatusText.className =
          'text-xs text-red-400 font-semibold';
      }

    } finally {
      if (versionAtStop === recordingVersion) {

        // Release microphone AFTER recording has finished.
        if (micSource) {
          try { micSource.disconnect(); } catch (_) {}
          micSource = null;
        }

        if (analyser) {
          try { analyser.disconnect(); } catch (_) {}
          analyser = null;
        }

        if (audioCtx) {
          try { await audioCtx.close(); } catch (_) {}
          audioCtx = null;
        }

        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
          micStream = null;
        }

        dataArray = null;
        waveformSamples = null;

        drawIdle();

        if (toggleRecordBtn) {
          toggleRecordBtn.disabled = false;
        }
      }
    }
  }


  // Ã¢â€â‚¬Ã¢â€â‚¬ Reset / Retry Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  function resetRecording() {
    isRecording = false;
    clearInterval(voiceRecordingTimer);
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    mediaRecorder  = null;
    recordedChunks = [];
    recordedBlob = null;
    recordingVersion++;
    recordingReady = Promise.resolve(null);

    if (micSource) { try { micSource.disconnect(); } catch (_) {} micSource = null; }
    if (analyser)  { try { analyser.disconnect();  } catch (_) {} analyser  = null; }
    if (audioCtx)  { try { audioCtx.close();       } catch (_) {} audioCtx  = null; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    dataArray = null;
    waveformSamples = null;
maxMicRms = 0;

if (toggleRecordBtn) {
  toggleRecordBtn.disabled = false;
}
    // Revoke old playback URL and hide player
    if (playbackURL) { URL.revokeObjectURL(playbackURL); playbackURL = null; }
    if (playbackAudio) { playbackAudio.src = ''; }
    playbackContainer.classList.add('hidden');

    // Ã¢â€â‚¬Ã¢â€â‚¬ Session: reset only the Voice activity back to "not completed".
    // Uses saveVoice() Ã¢â‚¬â€ not init() Ã¢â‚¬â€ so Story Recall or MindPlay data
    // that may already be in the session is preserved untouched.
    if (window.ALVI && window.ALVI.session) {
      window.ALVI.session.saveVoice({
        completed: false, durationSeconds: 0,
        mlStatus: null, speechFeatures: null, modelVersion: null
      });
    }

    voiceElapsedSeconds = 0;
    if (voiceTimerDisplay)  voiceTimerDisplay.textContent = '0:00 / 0:30';
    if (recordIcon)         recordIcon.textContent = 'Ã°Å¸Å½â„¢Ã¯Â¸Â';
    if (recordBtnText)      recordBtnText.textContent = 'Start Recording';
    if (recordStatusText) {
      recordStatusText.textContent = 'Click to start recording your response aloud.';
      recordStatusText.className   = 'text-xs text-slate-400';
    }
    if (resetRecordBtn)     resetRecordBtn.classList.add('hidden');

    drawIdle();
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Button wiring Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (toggleRecordBtn) {
    toggleRecordBtn.addEventListener('click', () => {
      if (!isRecording) startRecording();
      else              stopRecording();
    });
  }

  if (resetRecordBtn) {
    resetRecordBtn.addEventListener('click', resetRecording);
  }

  if (toStoryRecallBtn) {
    toStoryRecallBtn.addEventListener('click', async () => {
      if (isUploading) return;
      isUploading = true;
      toStoryRecallBtn.disabled = true;

      try {
        if (isRecording) stopRecording();
        // MediaRecorder's stop event is asynchronous. Wait for its actual Blob.
        const blob = recordedBlob || await recordingReady;
        if (!blob || blob.size === 0) {
          throw new Error('Record your voice before continuing.');
        }

        if (recordStatusText) {
          recordStatusText.textContent = 'Sending recording for speech analysisÃ¢â‚¬Â¦';
          recordStatusText.className = 'text-xs text-indigo-400 font-semibold';
        }

        const formData = new FormData();
        const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
        formData.append('audio', blob, `voice.${extension}`);

        const response = await fetch('http://127.0.0.1:8000/analyze', {
          method: 'POST',
          body: formData
          // Do not manually set Content-Type: browser builds multipart boundary.
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(`Speech analysis failed (HTTP ${response.status}).`);
        }
        if (data?.ml_status !== 'connected' ||
            data?.ml?.status !== 'success' ||
            !data?.ml?.speech_features) {
          throw new Error('Backend did not return valid speech measurements.');
        }

        const features = data.ml.speech_features;
        // In the previous integration test all three values were 0, 0, 1.
        // Never silently present an all-silent recording as real speech.
        if (Number(features.rms_energy) === 0 &&
            Number(features.spectral_centroid) === 0 &&
            Number(features.low_energy_ratio) === 1) {
          throw new Error('No measurable voice detected. Check playback and retry the recording.');
        }

        console.log('ALVI ML RESULT:', data);
        if (window.ALVI && window.ALVI.session) {
          window.ALVI.session.saveVoice({
            completed: true,
            durationSeconds: data.ml.duration_seconds ?? voiceElapsedSeconds,
            mlStatus: 'connected',
            speechFeatures: features,
            modelVersion: data.ml.model_version ?? null
          });
        }
        if (playbackURL) { URL.revokeObjectURL(playbackURL); playbackURL = null; }
        window.location.href = 'story.html';
      } catch (error) {
        console.error('ALVI voice analysis error:', error);
        if (recordStatusText) {
          recordStatusText.textContent = error.message || 'Voice upload failed.';
          recordStatusText.className = 'text-xs text-red-400 font-semibold';
        }
      } finally {
        isUploading = false;
        toStoryRecallBtn.disabled = false;
      }
    });
  }

});
