'use strict';

/* ============================================================
   Audio (Web Audio API) - gleiche Klangbasis wie Rhythmus-Generator/
   Rhythmus-Trainer (FM-Glocke + einfache Sinustöne), damit sich alle drei
   Apps klanglich zusammengehörig anfühlen. Hier reichen kurze
   Feedback-Töne (richtig/falsch/klick) - kein Scheduler nötig, da nichts
   "vorgespielt" wird wie beim Rhythmus-Trainer.
   ============================================================ */

let audioCtx = null;
let masterGain = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = game.soundVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Kurzer, weicher Antippen/Umdrehen-Klick (Karte umdrehen, Auswahl treffen) -
// bewusst unauffällig, damit er bei häufigem Antippen (z.B. Memory) nicht nervt.
function playTapSound() {
  ensureAudioContext();
  const t = audioCtx.currentTime + 0.01;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 700;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.13);
}

// Freundliches, kurzes Dur-Arpeggio für "richtig" - identisch zum
// Rhythmus-Trainer, damit Kinder den Erfolgsklang app-übergreifend
// wiedererkennen.
function playSuccessSound() {
  ensureAudioContext();
  const now = audioCtx.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const t = now + i * 0.09;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

// Einzelner, weicher, tiefer Ton statt eines harten Fehler-Buzzers - keine
// Bestrafung, keine Frustration (gleiches Prinzip wie Rhythmus-Trainer).
function playTryAgainSound() {
  ensureAudioContext();
  const t = audioCtx.currentTime + 0.02;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 220;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc.connect(gain).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.5);
}

// Größerer Erfolgsklang für "ganze Runde/Format geschafft" - zwei
// aufeinanderfolgende Erfolgsklänge, etwas höher gesetzt.
function playRoundCompleteSound() {
  ensureAudioContext();
  const now = audioCtx.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    const t = now + i * 0.08;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.38, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.45);
  });
}
