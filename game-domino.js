'use strict';

/* ============================================================
   Format 4: Domino - Steine per Antippen in eine Kette legen, bei der
   berührende Hälften gleich lange Notenwerte zeigen (z.B. "1 Halbe Note"
   passt an "2 Viertelnoten"). Bedienung per Antippen (Stein antippen,
   dann leeren Kettenplatz antippen) statt Drag & Drop - laut Konzeptnotiz
   Punkt 6 ist "Antippen ODER Ziehen" für Verbinden/Zuordnen-artige Formate
   ausdrücklich gleichwertig, und auf kleinen Touch-Zielen robuster.
   ============================================================ */

const DOMINO_CHAIN_LENGTH = 6;
const DOMINO_POINTS_PER_TILE = 20;
const DOMINO_COMPLETE_BONUS = 20;

let dominoState = null;

// Erzeugt eine garantiert lösbare Kette: eine Folge von (chainLength+1)
// Zufallswerten, für jeden Übergang ein Stein mit je einer zufälligen
// (evtl. unterschiedlichen) Kombination pro Seite - die Reihenfolge wird
// danach für die Präsentation ausgewürfelt (siehe startDomino).
function buildDominoChain(difficulty) {
  const facts = factsForDifficulty(difficulty);
  const combosByUnits = allRatioCombos(facts);
  const unitSizes = [...combosByUnits.keys()];

  const values = [];
  for (let i = 0; i <= DOMINO_CHAIN_LENGTH; i++) values.push(pickOne(unitSizes));

  return values.slice(0, -1).map((v, i) => {
    const nextV = values[i + 1];
    const leftCombo = pickOne(combosByUnits.get(v));
    const rightCombo = pickOne(combosByUnits.get(nextV));
    return {
      id: uid('d'),
      left: { value: v, label: comboLabel(leftCombo) },
      right: { value: nextV, label: comboLabel(rightCombo) },
    };
  });
}

function startDomino() {
  const tiles = buildDominoChain(currentDifficulty());
  dominoState = {
    pool: shuffle(tiles.map((t) => t.id)), // Präsentationsreihenfolge jede Runde neu ausgewürfelt
    slots: new Array(tiles.length).fill(null), // Kette: null oder Stein-ID
    tilesById: new Map(tiles.map((t) => [t.id, t])),
    selectedTileId: null,
    wrongLinkIndexes: new Set(),
  };
  document.getElementById('actionBtn').onclick = checkDomino;
  renderDomino();
}

function renderDomino() {
  const container = document.getElementById('formatContainer');
  const wrap = document.createElement('div');
  wrap.className = 'domino-wrap';

  const chainEl = document.createElement('div');
  chainEl.className = 'domino-chain';
  dominoState.slots.forEach((tileId, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'domino-slot';
    if (tileId) {
      const tile = dominoState.tilesById.get(tileId);
      slot.classList.add('is-filled');
      if (dominoState.wrongLinkIndexes.has(i - 1) || dominoState.wrongLinkIndexes.has(i)) {
        slot.classList.add('is-wrong');
      }
      slot.innerHTML = `<span>${tile.left.label}</span><span class="domino-divider"></span><span>${tile.right.label}</span>`;
      slot.addEventListener('click', () => onDominoSlotClick(i));
    } else {
      slot.textContent = '+';
      slot.addEventListener('click', () => onDominoSlotClick(i));
    }
    chainEl.appendChild(slot);
  });

  const poolEl = document.createElement('div');
  poolEl.className = 'domino-pool';
  dominoState.pool.forEach((tileId) => {
    const tile = dominoState.tilesById.get(tileId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `domino-tile${dominoState.selectedTileId === tileId ? ' is-selected' : ''}`;
    btn.innerHTML = `<span>${tile.left.label}</span><span class="domino-divider"></span><span>${tile.right.label}</span>`;
    btn.addEventListener('click', () => onDominoTilePick(tileId));
    poolEl.appendChild(btn);
  });

  wrap.innerHTML = '<p class="domino-label">Steine:</p>';
  wrap.appendChild(poolEl);
  wrap.insertAdjacentHTML('beforeend', '<p class="domino-label">Kette:</p>');
  wrap.appendChild(chainEl);

  container.innerHTML = '';
  container.appendChild(wrap);
}

function onDominoTilePick(tileId) {
  playTapSound();
  dominoState.selectedTileId = dominoState.selectedTileId === tileId ? null : tileId;
  renderDomino();
}

function onDominoSlotClick(index) {
  const existing = dominoState.slots[index];
  if (existing) {
    // Belegten Platz antippen: Stein zurück in den Vorrat legen.
    dominoState.pool.push(existing);
    dominoState.slots[index] = null;
    dominoState.wrongLinkIndexes.clear();
    playTapSound();
    renderDomino();
    return;
  }
  if (!dominoState.selectedTileId) return;
  dominoState.slots[index] = dominoState.selectedTileId;
  dominoState.pool = dominoState.pool.filter((id) => id !== dominoState.selectedTileId);
  dominoState.selectedTileId = null;
  dominoState.wrongLinkIndexes.clear();
  playTapSound();
  renderDomino();
}

// Wird vom gemeinsamen "✓ Prüfen"-Knopf (siehe hub.js) aufgerufen.
function checkDomino() {
  if (dominoState.slots.some((s) => !s)) {
    showFeedback('wrong', 'Erst alle Steine in die Kette legen!');
    return;
  }

  const tiles = dominoState.slots.map((id) => dominoState.tilesById.get(id));
  const wrongLinks = new Set();
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i].right.value !== tiles[i + 1].left.value) wrongLinks.add(i);
  }
  dominoState.wrongLinkIndexes = wrongLinks;

  if (wrongLinks.size === 0) {
    playSuccessSound();
    awardPoints(DOMINO_POINTS_PER_TILE * tiles.length);
    finishFormatRound(DOMINO_COMPLETE_BONUS);
  } else {
    playTryAgainSound();
    showFeedback('wrong', 'Manche Übergänge passen noch nicht zusammen - rot markiert. Steine antippen, um sie zu entfernen.');
    renderDomino();
  }
}
