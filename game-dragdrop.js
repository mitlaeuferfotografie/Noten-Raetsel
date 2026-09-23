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
  // Ein Fakt pro Dauer auswählen (nie zwei mit gleicher Dauer zusammen) -
  // sonst wäre die Sortierreihenfolge an dieser Stelle nicht eindeutig.
  const chosenUnits = sample([...byUnits.keys()], Math.min(4, byUnits.size));
  const chosenFacts = chosenUnits.map((u) => pickOne(byUnits.get(u)));
  return {
    kind: 'sort',
    tiles: shuffle(chosenFacts).map((f) => ({ id: uid('t'), label: f.name, icon: f.icon, units: f.units })),
  };
}

function buildBuildTask() {
  const target = pickOne(NOTE_FACTS);
  const kopfCorrect = target.kopf.startsWith('ausgefüllt') ? 'ausgefüllter Notenkopf' : 'offener Notenkopf';
  const kopfWrong = target.kopf.startsWith('ausgefüllt') ? 'offener Notenkopf' : 'ausgefüllter Notenkopf';
  const halsCorrect = target.hals ? 'hat einen Notenhals' : 'hat keinen Notenhals';
  const halsWrong = target.hals ? 'hat keinen Notenhals' : 'hat einen Notenhals';
  const fahneCorrect = target.fahne ? 'hat ein Fähnchen' : 'hat kein Fähnchen';
  const fahneWrong = target.fahne ? 'hat kein Fähnchen' : 'hat ein Fähnchen';
  const tiles = shuffle([
    { id: uid('t'), type: 'kopf', label: kopfCorrect, correct: true },
    { id: uid('t'), type: 'kopf', label: kopfWrong, correct: false },
    { id: uid('t'), type: 'hals', label: halsCorrect, correct: true },
    { id: uid('t'), type: 'hals', label: halsWrong, correct: false },
    { id: uid('t'), type: 'fahne', label: fahneCorrect, correct: true },
    { id: uid('t'), type: 'fahne', label: fahneWrong, correct: false },
  ]);
  return { kind: 'build', target, tiles };
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
    : [{ id: 'kopf', label: 'Notenkopf' }, { id: 'hals', label: 'Notenhals?' }, { id: 'fahne', label: 'Fähnchen?' }];

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
  wrap.appendChild(zonesEl);

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
