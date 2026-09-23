'use strict';

/* ============================================================
   App-Gerüst: Stationen-Hub (Level-Wahl + sechs Format-Kacheln), Punkte,
   Speicherung, Einstellungen - siehe Konzeptnotiz Punkt 4/5/7.
   Level und Format sind bewusst UNABHÄNGIG wählbar (Level bestimmt nur den
   INHALT, nicht das Format) - deshalb zwei getrennte Auswahlreihen im Hub
   statt einer verschachtelten Navigation.
   ============================================================ */

const STORAGE_KEY = 'notenRaetselFortschritt';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { points: 0, completedCombos: [], levelId: 1, soundVolume: 0.6 };
    const parsed = JSON.parse(raw);
    return {
      points: Math.max(0, Number(parsed.points) || 0),
      completedCombos: Array.isArray(parsed.completedCombos) ? parsed.completedCombos : [],
      levelId: LEVELS.some((l) => l.id === parsed.levelId) ? parsed.levelId : 1,
      soundVolume: typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 0.6,
    };
  } catch (err) {
    return { points: 0, completedCombos: [], levelId: 1, soundVolume: 0.6 };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      points: game.points,
      completedCombos: Array.from(game.completedCombos),
      levelId: game.levelId,
      soundVolume: game.soundVolume,
    }));
  } catch (err) {
    /* z.B. Privater Modus ohne Speicherzugriff - Fortschritt bleibt dann nur für diese Sitzung erhalten */
  }
}

const game = {
  screen: 'hub', // 'hub' | 'format'
  levelId: 1,
  currentFormatId: null,
  points: 0,
  completedCombos: new Set(), // "<levelId>-<formatId>", z.B. "2-memory"
  soundVolume: 0.6,
};

function currentLevel() {
  return LEVELS.find((l) => l.id === game.levelId);
}

// Jedes Format bekommt hier Titel/Hinweis-Text (zentral, damit sie
// konsistent bleiben) und eine startX()-Funktion aus der jeweiligen
// game-*.js. actionBtn: true = Format braucht den geteilten "Prüfen"-Knopf
// (mehrteilige Anordnung, die man erst als Ganzes bewerten kann), false =
// Format bewertet jede Aktion sofort einzeln (kein Extra-Klick nötig).
const FORMATS = [
  { id: 'memory', icon: '🧠', title: 'Memory', hint: 'Finde die passenden Paare - Notensymbol und Info-Karte.', start: startMemory, actionBtn: false },
  { id: 'verbinden', icon: '🔗', title: 'Verbinden', hint: 'Tippe zuerst eine Note, dann ihre passende Dauer an.', start: startVerbinden, actionBtn: false },
  { id: 'luecken', icon: '📝', title: 'Lückentext', hint: 'Tippe das passende Wort für die Lücke an.', start: startLuecken, actionBtn: false },
  { id: 'domino', icon: '🁰', title: 'Domino', hint: 'Lege die Steine in eine Reihe - berührende Hälften müssen gleich lang klingen.', start: startDomino, actionBtn: true },
  { id: 'quiz', icon: '❓', title: 'Quiz', hint: 'Beantworte die Fragen zu Notenwerten und Regeln.', start: startQuiz, actionBtn: false },
  { id: 'dragdrop', icon: '✋', title: 'Drag & Drop', hint: 'Sortiere Notenwerte oder baue eine Note aus ihren Teilen.', start: startDragDrop, actionBtn: true },
];

function formatById(id) {
  return FORMATS.find((f) => f.id === id);
}

/* ============================================================
   Rendering: Bildschirm-Umschaltung
   ============================================================ */

const hubScreenEl = document.getElementById('hubScreen');
const formatScreenEl = document.getElementById('formatScreen');
const backToHubBtn = document.getElementById('backToHubBtn');
const pointsLabel = document.getElementById('pointsLabel');
const formatTitleEl = document.getElementById('formatTitle');
const formatHintEl = document.getElementById('formatHint');
const formatContainerEl = document.getElementById('formatContainer');
const feedbackEl = document.getElementById('feedback');
const actionBtn = document.getElementById('actionBtn');

function renderApp() {
  const inFormat = game.screen === 'format';
  hubScreenEl.hidden = inFormat;
  formatScreenEl.hidden = !inFormat;
  backToHubBtn.hidden = !inFormat;
  pointsLabel.textContent = `⭐ ${game.points} Punkte`;

  if (inFormat) {
    const fmt = formatById(game.currentFormatId);
    formatTitleEl.textContent = `${fmt.icon} ${fmt.title}`;
    formatHintEl.textContent = fmt.hint;
    actionBtn.hidden = !fmt.actionBtn;
    feedbackEl.hidden = true;
  } else {
    // "✓ Prüfen" gehört nur zu Domino/Drag & Drop - ohne dieses Zurücksetzen
    // bliebe er sichtbar, wenn man von dort zum Hub zurückkehrt.
    actionBtn.hidden = true;
    renderHub();
  }
}

function renderHub() {
  const levelPillsEl = document.getElementById('levelPills');
  levelPillsEl.innerHTML = '';
  LEVELS.forEach((level) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `level-pill${level.id === game.levelId ? ' is-selected' : ''}`;
    btn.textContent = `Level ${level.id}: ${level.title}`;
    btn.addEventListener('click', () => {
      game.levelId = level.id;
      saveProgress();
      renderHub();
    });
    levelPillsEl.appendChild(btn);
  });

  const formatGridEl = document.getElementById('formatGrid');
  formatGridEl.innerHTML = '';
  FORMATS.forEach((fmt, i) => {
    const done = game.completedCombos.has(`${game.levelId}-${fmt.id}`);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `format-card${done ? ' is-done' : ''}`;
    card.style.setProperty('--card-index', i);
    card.innerHTML = `
      <span class="format-card-icon">${fmt.icon}</span>
      <span class="format-card-title">${fmt.title}</span>
      ${done ? '<span class="format-card-check">✓</span>' : ''}
    `;
    card.addEventListener('click', () => startFormat(fmt.id));
    formatGridEl.appendChild(card);
  });
}

function startFormat(formatId) {
  game.currentFormatId = formatId;
  game.screen = 'format';
  renderApp();
  ensureAudioContext();
  formatById(formatId).start();
}

function backToHub() {
  game.screen = 'hub';
  game.currentFormatId = null;
  renderApp();
}

/* ============================================================
   Von den game-*.js-Formaten genutzte, gemeinsame Hilfsfunktionen
   ============================================================ */

function showFeedback(kind, text) {
  feedbackEl.hidden = false;
  feedbackEl.className = `feedback feedback-${kind}`;
  feedbackEl.textContent = text;
}

const pointsPopupEl = document.getElementById('pointsPopup');
let pointsPopupTimeout = null;

function showPointsPopup(points) {
  pointsPopupEl.querySelector('.points-popup-value').textContent = `+${points}`;
  pointsPopupEl.hidden = false;
  pointsPopupEl.classList.remove('is-animating');
  void pointsPopupEl.offsetWidth; // Reflow erzwingen, damit die Animation bei jedem Aufruf neu startet
  pointsPopupEl.classList.add('is-animating');
  clearTimeout(pointsPopupTimeout);
  pointsPopupTimeout = setTimeout(() => {
    pointsPopupEl.hidden = true;
  }, 1400);
}

function awardPoints(points) {
  game.points += points;
  pointsLabel.textContent = `⭐ ${game.points} Punkte`;
  showPointsPopup(points);
  saveProgress();
}

// Wird von jedem Format am Ende einer erfolgreich abgeschlossenen Runde
// aufgerufen - markiert die Level/Format-Kombination als erledigt (für das
// Häkchen im Hub) und kehrt nach kurzer Anzeige automatisch zurück, damit
// niemand manuell navigieren muss.
function finishFormatRound(bonusPoints) {
  game.completedCombos.add(`${game.levelId}-${game.currentFormatId}`);
  saveProgress();
  playRoundCompleteSound();
  if (bonusPoints > 0) awardPoints(bonusPoints);
  showFeedback('correct', 'Format geschafft! 🎉');
  setTimeout(backToHub, 2200);
}

/* ============================================================
   Toolbar / Einstellungen
   ============================================================ */

backToHubBtn.addEventListener('click', backToHub);

const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const soundVolumeSlider = document.getElementById('soundVolumeSlider');
const soundVolumeValue = document.getElementById('soundVolumeValue');
const resetProgressBtn = document.getElementById('resetProgressBtn');

settingsToggle.addEventListener('click', () => {
  const willOpen = settingsPanel.hidden;
  settingsPanel.hidden = !willOpen;
  settingsToggle.setAttribute('aria-expanded', String(willOpen));
});

document.addEventListener('pointerdown', (e) => {
  if (settingsPanel.hidden) return;
  if (settingsPanel.contains(e.target) || e.target === settingsToggle) return;
  settingsPanel.hidden = true;
  settingsToggle.setAttribute('aria-expanded', 'false');
});

soundVolumeSlider.addEventListener('input', () => {
  game.soundVolume = Number(soundVolumeSlider.value) / 100;
  soundVolumeValue.textContent = soundVolumeSlider.value;
  if (masterGain) masterGain.gain.setTargetAtTime(game.soundVolume, audioCtx.currentTime, 0.01);
  saveProgress();
});

// Escape-Hatch für den Fall, dass mehrere Kinder sich ein Tablet teilen und
// der gespeicherte Fortschritt nicht zum aktuellen Kind passt.
resetProgressBtn.addEventListener('click', () => {
  game.points = 0;
  game.completedCombos = new Set();
  saveProgress();
  settingsPanel.hidden = true;
  settingsToggle.setAttribute('aria-expanded', 'false');
  backToHub();
});

/* ============================================================
   Init
   ============================================================ */

const restored = loadProgress();
game.points = restored.points;
game.completedCombos = new Set(restored.completedCombos);
game.levelId = restored.levelId;
game.soundVolume = restored.soundVolume;
soundVolumeSlider.value = String(Math.round(game.soundVolume * 100));
soundVolumeValue.textContent = soundVolumeSlider.value;
renderApp();
