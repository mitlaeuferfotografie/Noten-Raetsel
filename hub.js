'use strict';

/* ============================================================
   App-Gerüst: Hub mit sechs Format-Kacheln, Punkte, Speicherung,
   Einstellungen. Die Schwierigkeit wird NICHT mehr global im Hub gewählt
   (das war für Kinder verwirrend - zwei getrennte Auswahlreihen, Level
   oben/Format unten), sondern direkt VOR dem Start eines einzelnen
   Formats: Format-Kachel antippen -> kurze Zwischenseite mit drei
   Schwierigkeitsstufen -> Runde startet.
   ============================================================ */

const STORAGE_KEY = 'notenRaetselFortschritt';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { points: 0, completedCombos: [], lastDifficultyByFormat: {}, soundVolume: 0.6 };
    const parsed = JSON.parse(raw);
    return {
      points: Math.max(0, Number(parsed.points) || 0),
      completedCombos: Array.isArray(parsed.completedCombos) ? parsed.completedCombos : [],
      lastDifficultyByFormat: typeof parsed.lastDifficultyByFormat === 'object' && parsed.lastDifficultyByFormat ? parsed.lastDifficultyByFormat : {},
      soundVolume: typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 0.6,
    };
  } catch (err) {
    return { points: 0, completedCombos: [], lastDifficultyByFormat: {}, soundVolume: 0.6 };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      points: game.points,
      completedCombos: Array.from(game.completedCombos),
      lastDifficultyByFormat: game.lastDifficultyByFormat,
      soundVolume: game.soundVolume,
    }));
  } catch (err) {
    /* z.B. Privater Modus ohne Speicherzugriff - Fortschritt bleibt dann nur für diese Sitzung erhalten */
  }
}

const game = {
  screen: 'hub', // 'hub' | 'difficulty' | 'format'
  currentFormatId: null,
  currentDifficultyId: null,
  points: 0,
  completedCombos: new Set(), // "<formatId>-<difficultyId>", z.B. "memory-mittel"
  lastDifficultyByFormat: {}, // merkt sich pro Format die zuletzt gewählte Stufe, nur als Vorauswahl-Hinweis
  soundVolume: 0.6,
};

function currentDifficulty() {
  return DIFFICULTIES.find((d) => d.id === game.currentDifficultyId);
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
const difficultyScreenEl = document.getElementById('difficultyScreen');
const formatScreenEl = document.getElementById('formatScreen');
const backToHubBtn = document.getElementById('backToHubBtn');
const pointsLabel = document.getElementById('pointsLabel');
const difficultyTitleEl = document.getElementById('difficultyTitle');
const formatTitleEl = document.getElementById('formatTitle');
const formatHintEl = document.getElementById('formatHint');
const feedbackEl = document.getElementById('feedback');
const actionBtn = document.getElementById('actionBtn');

function renderApp() {
  hubScreenEl.hidden = game.screen !== 'hub';
  difficultyScreenEl.hidden = game.screen !== 'difficulty';
  formatScreenEl.hidden = game.screen !== 'format';
  backToHubBtn.hidden = game.screen === 'hub';
  pointsLabel.textContent = `⭐ ${game.points} Punkte`;

  if (game.screen === 'hub') {
    actionBtn.hidden = true; // "✓ Prüfen" gehört nur zu Domino/Drag & Drop im Format-Bildschirm
    renderHub();
  } else if (game.screen === 'difficulty') {
    actionBtn.hidden = true;
    renderDifficultyScreen();
  } else {
    const fmt = formatById(game.currentFormatId);
    formatTitleEl.textContent = `${fmt.icon} ${fmt.title}`;
    formatHintEl.textContent = fmt.hint;
    actionBtn.hidden = !fmt.actionBtn;
    feedbackEl.hidden = true;
  }
}

function renderHub() {
  const formatGridEl = document.getElementById('formatGrid');
  formatGridEl.innerHTML = '';
  FORMATS.forEach((fmt, i) => {
    const doneDiffs = DIFFICULTIES.filter((d) => game.completedCombos.has(`${fmt.id}-${d.id}`));
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `format-card${doneDiffs.length === DIFFICULTIES.length ? ' is-done' : ''}`;
    card.style.setProperty('--card-index', i);
    card.innerHTML = `
      <span class="format-card-icon">${fmt.icon}</span>
      <span class="format-card-title">${fmt.title}</span>
      <span class="format-card-dots">
        ${DIFFICULTIES.map((d) => `<span class="format-card-dot${game.completedCombos.has(`${fmt.id}-${d.id}`) ? ' is-done' : ''}"></span>`).join('')}
      </span>
    `;
    card.addEventListener('click', () => chooseFormat(fmt.id));
    formatGridEl.appendChild(card);
  });
}

function renderDifficultyScreen() {
  const fmt = formatById(game.currentFormatId);
  difficultyTitleEl.textContent = `${fmt.icon} ${fmt.title} - Schwierigkeit wählen`;

  const gridEl = document.getElementById('difficultyGrid');
  gridEl.innerHTML = '';
  DIFFICULTIES.forEach((diff) => {
    const done = game.completedCombos.has(`${fmt.id}-${diff.id}`);
    const suggested = game.lastDifficultyByFormat[fmt.id] === diff.id;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `difficulty-card${suggested ? ' is-suggested' : ''}`;
    card.innerHTML = `
      <span class="difficulty-card-title">${diff.title}</span>
      ${done ? '<span class="difficulty-card-check">✓ geschafft</span>' : ''}
    `;
    card.addEventListener('click', () => chooseDifficulty(diff.id));
    gridEl.appendChild(card);
  });
}

function chooseFormat(formatId) {
  game.currentFormatId = formatId;
  game.screen = 'difficulty';
  renderApp();
}

function chooseDifficulty(difficultyId) {
  game.currentDifficultyId = difficultyId;
  game.lastDifficultyByFormat[game.currentFormatId] = difficultyId;
  game.screen = 'format';
  saveProgress();
  renderApp();
  ensureAudioContext();
  formatById(game.currentFormatId).start();
}

function backToHub() {
  game.screen = 'hub';
  game.currentFormatId = null;
  game.currentDifficultyId = null;
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
// aufgerufen - markiert die Format/Schwierigkeit-Kombination als erledigt
// (für die Punkte im Hub bzw. den Haken in der Schwierigkeitsauswahl) und
// kehrt nach kurzer Anzeige automatisch zurück, damit niemand manuell
// navigieren muss.
function finishFormatRound(bonusPoints) {
  game.completedCombos.add(`${game.currentFormatId}-${game.currentDifficultyId}`);
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
  game.lastDifficultyByFormat = {};
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
game.lastDifficultyByFormat = restored.lastDifficultyByFormat;
game.soundVolume = restored.soundVolume;
soundVolumeSlider.value = String(Math.round(game.soundVolume * 100));
soundVolumeValue.textContent = soundVolumeSlider.value;
renderApp();
