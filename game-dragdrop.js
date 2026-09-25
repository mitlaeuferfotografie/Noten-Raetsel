'use strict';

/* ============================================================
   Format 6: Drag & Drop - zwei Aufgabentypen (Konzeptnotiz Punkt 3.6),
   pro Aufgabe zufällig gewählt: (a) Notenwerte nach Dauer sortieren,
   (b) eine Note aus Notenkopf/Notenhals/Fähnchen zusammenbauen (nur wenn
   Level das Thema "structure" freigeschaltet hat). Echtes Ziehen (Pointer
   Events, wie im Rhythmus-Generator/-Trainer) statt Antippen, weil dieses
   Format laut Konzeptnotiz namensgebend das Ziehen selbst übt.
   ============================================================ */

const DRAGDROP_TASK_COUNT = 5;
const DRAGDROP_POINTS_PER_ELEMENT = 10;
const DRAGDROP_COMPLETE_BONUS = 15;

function buildSortTask(difficulty) {
  const facts = factsForDifficulty(difficulty);
  const byUnits = new Map();
  facts.forEach((f) => {
    if (!byUnits.has(f.units)) byUnits.set(f.units, []);
    byUnits.get(f.units).push(f);
  });
  // Zufällige ANZAHL der Dauern (mind. 3, höchstens alle verfügbaren) statt
  // immer exakt aller vorhandenen Dauern: bei "Leicht" gibt es nur die 4
  // Notenwerte (je genau ein Fakt pro Dauer, kein zweiter zur Auswahl) -
  // mit fester Anzahl 4 war die Aufgabe dort deshalb JEDE Runde exakt
  // dieselben 4 Karten in derselben Zielreihenfolge (gemeldet 2026-09-25:
  // "5 mal die gleiche Aufgabe"). Mit variabler Teilmengengröße entstehen
  // auch bei nur 4 möglichen Dauern mehrere unterschiedliche Aufgaben.
  const minCount = Math.min(3, byUnits.size);
  const count = minCount + Math.floor(Math.random() * (byUnits.size - minCount + 1));
  // Ein Fakt pro Dauer auswählen (nie zwei mit gleicher Dauer zusammen) -
  // sonst wäre die Sortierreihenfolge an dieser Stelle nicht eindeutig.
  const chosenUnits = sample([...byUnits.keys()], count);
  const chosenFacts = chosenUnits.map((u) => pickOne(byUnits.get(u)));
  return {
    kind: 'sort',
    tiles: shuffle(chosenFacts).map((f) => ({ id: uid('t'), label: f.name, icon: f.icon, units: f.units })),
  };
}

// `value` hält fest, was die Karte über das Bauteil behauptet (gefüllt/
// vorhanden = true) - unabhängig davon, ob die Karte für die Zielnote
// richtig ist. Die Live-Vorschau (siehe buildNotePreviewSvg) zeichnet
// genau das, was gerade in den Feldern liegt, auch wenn es falsch ist.
function buildBuildTask() {
  const target = pickOne(NOTE_FACTS);
  const isFilled = target.kopf.startsWith('ausgefüllt');
  const tiles = shuffle([
    { id: uid('t'), type: 'kopf', label: isFilled ? 'ausgefüllter Notenkopf' : 'unausgefüllter Notenkopf', value: isFilled, correct: true },
    { id: uid('t'), type: 'kopf', label: isFilled ? 'unausgefüllter Notenkopf' : 'ausgefüllter Notenkopf', value: !isFilled, correct: false },
    { id: uid('t'), type: 'hals', label: target.hals ? 'hat einen Notenhals' : 'hat keinen Notenhals', value: target.hals, correct: true },
    { id: uid('t'), type: 'hals', label: target.hals ? 'hat keinen Notenhals' : 'hat einen Notenhals', value: !target.hals, correct: false },
    { id: uid('t'), type: 'fahne', label: target.fahne ? 'hat ein Fähnchen' : 'hat kein Fähnchen', value: target.fahne, correct: true },
    { id: uid('t'), type: 'fahne', label: target.fahne ? 'hat kein Fähnchen' : 'hat ein Fähnchen', value: !target.fahne, correct: false },
  ]);
  return { kind: 'build', target, tiles };
}

// Zeichnet exakt das, was aktuell in den drei Feldern liegt (auch wenn
// falsch) - dieselbe Geometrie wie die echten Noten-Icons in content.js
// (Ellipse/Linie/Fähnchen-Pfad), damit die Vorschau wie eine "richtige"
// Note aussieht. Noch leere Felder werden als blasser Platzhalter gezeigt.
function buildNotePreviewSvg(kopfTile, halsTile, fahneTile) {
  const kopfFill = kopfTile ? (kopfTile.value ? '#1a1a1a' : 'none') : 'none';
  const kopfStroke = kopfTile ? '#1a1a1a' : 'var(--border-strong)';
  const kopfDash = kopfTile ? '' : ' stroke-dasharray="4 3"';
  const hals = halsTile && halsTile.value
    ? '<line x1="26" y1="43" x2="26" y2="3" stroke="#1a1a1a" stroke-width="3.5"/>' : '';
  const fahne = fahneTile && fahneTile.value
    ? '<path d="M26 3 C25.3 9.1 31.8 11.2 34.9 14 C37.9 16.7 39 19.7 38.9 22.5 C38.9 23.3 38.6 26.7 35.8 30 C39.6 21.6 36.1 18.3 32.6 15.6 C28.5 12.4 25.4 9.4 26 3 Z" fill="#1a1a1a"/>' : '';
  return `<svg viewBox="0 0 40 56"><ellipse cx="16" cy="46" rx="11" ry="7.5" transform="rotate(-15 16 46)" fill="${kopfFill}" stroke="${kopfStroke}" stroke-width="3.5"${kopfDash}/>${hals}${fahne}</svg>`;
}

let dragdropState = null;
let ddDrag = null;

function startDragDrop() {
  const difficulty = currentDifficulty();
  const canBuild = difficultyHasTopic(difficulty, 'structure');
  const tasks = [];
  for (let i = 0; i < DRAGDROP_TASK_COUNT; i++) {
    tasks.push(canBuild && Math.random() < 0.5 ? buildBuildTask() : buildSortTask(difficulty));
  }
  dragdropState = { tasks, index: 0 };
  document.getElementById('actionBtn').onclick = checkDragDropTask;
  renderDragDropTask();
}

function renderDragDropTask() {
  const task = dragdropState.tasks[dragdropState.index];
  const container = document.getElementById('formatContainer');

  const zones = task.kind === 'sort'
    ? task.tiles.map((_, i) => ({ id: String(i), label: i === 0 ? '1. (am längsten)' : i === task.tiles.length - 1 ? `${i + 1}. (am kürzesten)` : `${i + 1}.` }))
    // Reihenfolge wie an der echten Note von oben nach unten: Fähnchen,
    // dann Notenhals, dann Notenkopf ganz unten.
    : [{ id: 'fahne', label: 'Fähnchen?' }, { id: 'hals', label: 'Notenhals?' }, { id: 'kopf', label: 'Notenkopf' }];

  task.zones = zones.map((z) => ({ ...z, filledTileId: null }));
  task.tilesById = new Map(task.tiles.map((t) => [t.id, t]));
  task.pool = shuffle(task.tiles.map((t) => t.id));

  renderDragDropUI(task);
}

function renderDragDropUI(task) {
  const container = document.getElementById('formatContainer');
  const wrap = document.createElement('div');
  wrap.className = 'dragdrop-wrap';

  const progress = document.createElement('div');
  progress.className = 'dragdrop-progress';
  progress.textContent = `Aufgabe ${dragdropState.index + 1} von ${dragdropState.tasks.length}`;
  wrap.appendChild(progress);

  const instr = document.createElement('p');
  instr.className = 'dragdrop-instruction';
  instr.textContent = task.kind === 'sort'
    ? 'Ziehe die Karten in der richtigen Reihenfolge in die Kästchen - die mit der längsten Dauer zuerst.'
    : `Baue eine "${task.target.name}": Ziehe die passenden Bausteine in die drei Felder.`;
  wrap.appendChild(instr);

  const zonesEl = document.createElement('div');
  zonesEl.className = `dragdrop-zones dragdrop-zones-${task.kind}`;
  task.zones.forEach((zone) => {
    const zoneEl = document.createElement('div');
    zoneEl.className = `dd-zone${zone.filledTileId ? ' is-filled' : ''}`;
    zoneEl.dataset.zoneId = zone.id;
    const zoneLabel = document.createElement('span');
    zoneLabel.className = 'dd-zone-label';
    zoneLabel.textContent = zone.label;
    zoneEl.appendChild(zoneLabel);

    if (zone.filledTileId) {
      const tile = task.tilesById.get(zone.filledTileId);
      const tileEl = document.createElement('button');
      tileEl.type = 'button';
      tileEl.className = 'dd-tile is-placed';
      tileEl.innerHTML = tile.icon ? `<span class="dd-tile-icon">${tile.icon}</span><span>${tile.label}</span>` : `<span>${tile.label}</span>`;
      tileEl.addEventListener('click', () => {
        zone.filledTileId = null;
        task.pool.push(tile.id);
        playTapSound();
        renderDragDropUI(task);
      });
      zoneEl.appendChild(tileEl);
    }
    zonesEl.appendChild(zoneEl);
  });

  if (task.kind === 'build') {
    // Baut die Note live aus den aktuell befüllten Feldern zusammen (auch
    // falsche Kombinationen) - so sieht man sofort, wie sich jede
    // Bauteil-Wahl auf die echte Note auswirkt.
    const tileForZone = (zoneId) => {
      const zone = task.zones.find((z) => z.id === zoneId);
      return zone.filledTileId ? task.tilesById.get(zone.filledTileId) : null;
    };
    const row = document.createElement('div');
    row.className = 'dragdrop-build-row';
    row.appendChild(zonesEl);
    const previewEl = document.createElement('div');
    previewEl.className = 'dd-note-preview';
    previewEl.innerHTML = buildNotePreviewSvg(tileForZone('kopf'), tileForZone('hals'), tileForZone('fahne'));
    row.appendChild(previewEl);
    wrap.appendChild(row);
  } else {
    wrap.appendChild(zonesEl);
  }

  const poolEl = document.createElement('div');
  poolEl.className = 'dd-pool';
  task.pool.forEach((tileId) => {
    const tile = task.tilesById.get(tileId);
    const tileEl = document.createElement('button');
    tileEl.type = 'button';
    tileEl.className = 'dd-tile';
    tileEl.innerHTML = tile.icon ? `<span class="dd-tile-icon">${tile.icon}</span><span>${tile.label}</span>` : `<span>${tile.label}</span>`;
    tileEl.addEventListener('pointerdown', (e) => startDDDrag(e, task, tileId));
    poolEl.appendChild(tileEl);
  });
  wrap.appendChild(poolEl);

  container.innerHTML = '';
  container.appendChild(wrap);
}

/* ---------- Ziehen (Pointer Events) ---------- */

function startDDDrag(e, task, tileId) {
  e.preventDefault();
  const tile = task.tilesById.get(tileId);
  ddDrag = { task, tileId };
  const ghost = document.getElementById('dragGhost');
  ghost.innerHTML = `<div class="dd-tile-ghost">${tile.icon ? `<span class="dd-tile-icon">${tile.icon}</span>` : ''}<span>${tile.label}</span></div>`;
  ghost.style.left = `${e.clientX}px`;
  ghost.style.top = `${e.clientY}px`;
  ghost.hidden = false;
  document.addEventListener('pointermove', onDDDragMove);
  document.addEventListener('pointerup', onDDDragEnd);
}

function onDDDragMove(e) {
  const ghost = document.getElementById('dragGhost');
  ghost.style.left = `${e.clientX}px`;
  ghost.style.top = `${e.clientY}px`;
  document.querySelectorAll('.dd-zone.drag-over').forEach((z) => z.classList.remove('drag-over'));
  const zoneEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dd-zone');
  if (zoneEl && !zoneEl.classList.contains('is-filled')) zoneEl.classList.add('drag-over');
}

function onDDDragEnd(e) {
  document.removeEventListener('pointermove', onDDDragMove);
  document.removeEventListener('pointerup', onDDDragEnd);
  document.getElementById('dragGhost').hidden = true;
  if (!ddDrag) return;

  const zoneEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dd-zone');
  if (zoneEl && !zoneEl.classList.contains('is-filled')) {
    const { task, tileId } = ddDrag;
    const zone = task.zones.find((z) => z.id === zoneEl.dataset.zoneId);
    zone.filledTileId = tileId;
    task.pool = task.pool.filter((id) => id !== tileId);
    playTapSound();
    renderDragDropUI(task);
  }
  ddDrag = null;
}

/* ---------- Prüfen ---------- */

function checkDragDropTask() {
  const task = dragdropState.tasks[dragdropState.index];
  if (task.zones.some((z) => !z.filledTileId)) {
    showFeedback('wrong', 'Erst alle Felder befüllen!');
    return;
  }

  let allCorrect;
  if (task.kind === 'sort') {
    const placedUnits = task.zones.map((z) => task.tilesById.get(z.filledTileId).units);
    allCorrect = placedUnits.every((u, i) => i === 0 || placedUnits[i - 1] > u);
  } else {
    allCorrect = task.zones.every((z) => {
      const tile = task.tilesById.get(z.filledTileId);
      return tile.type === z.id && tile.correct;
    });
  }

  if (allCorrect) {
    playSuccessSound();
    awardPoints(DRAGDROP_POINTS_PER_ELEMENT * task.zones.length);
    document.getElementById('feedback').hidden = true;
    dragdropState.index += 1;
    if (dragdropState.index >= dragdropState.tasks.length) {
      finishFormatRound(DRAGDROP_COMPLETE_BONUS);
    } else {
      renderDragDropTask();
    }
  } else {
    playTryAgainSound();
    showFeedback('wrong', 'Noch nicht ganz richtig - schau genau hin und versuch es noch einmal!');
  }
}
