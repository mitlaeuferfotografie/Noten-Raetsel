'use strict';

/* ============================================================
   Format 4: Domino - Steine per echtem Ziehen (Pointer Events, wie die
   Noten-Werkstatt) aus dem Vorrat in eine Kette legen, bei der
   berührende Hälften gleich lange Notenwerte zeigen (z.B. "1 Halbe Note"
   passt an "2 Viertelnoten"). Ursprünglich Antippen-basiert (Stein
   antippen, dann Kettenplatz antippen) - auf Nutzerfeedback umgestellt,
   weil sich das zweistufige Antippen zu abstrakt/mechanisch statt greifbar
   anfühlte. Belegten Platz antippen entfernt den Stein weiterhin per Klick.
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
      left: { value: v, factId: leftCombo.factId, count: leftCombo.count, label: comboLabel(leftCombo) },
      right: { value: nextV, factId: rightCombo.factId, count: rightCombo.count, label: comboLabel(rightCombo) },
    };
  });
}

// Notensymbol statt Text auf der Dominostein-Hälfte (kindgerechter - Kinder
// erkennen das Symbol schneller als den Namen). `label` bleibt als
// Alt-Text/Titel erhalten, damit die Bedeutung bei Bedarf nachlesbar ist.
function dominoHalfHtml(half) {
  const fact = factById(half.factId);
  const countBadge = half.count > 1 ? `<span class="domino-tile-count">×${half.count}</span>` : '';
  return `<span class="domino-tile-icon" title="${half.label}">${fact.icon}</span>${countBadge}`;
}

let dominoDrag = null;

function startDomino() {
  const tiles = buildDominoChain(currentDifficulty());
  dominoState = {
    pool: shuffle(tiles.map((t) => t.id)), // Präsentationsreihenfolge jede Runde neu ausgewürfelt
    slots: new Array(tiles.length).fill(null), // Kette: null oder Stein-ID
    tilesById: new Map(tiles.map((t) => [t.id, t])),
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
    const slot = document.createElement('div');
    slot.className = 'domino-slot';
    slot.dataset.slotIndex = String(i);
    if (tileId) {
      const tile = dominoState.tilesById.get(tileId);
      slot.classList.add('is-filled');
      if (dominoState.wrongLinkIndexes.has(i - 1) || dominoState.wrongLinkIndexes.has(i)) {
        slot.classList.add('is-wrong');
      }
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'domino-tile is-placed';
      tileBtn.innerHTML = `${dominoHalfHtml(tile.left)}<span class="domino-divider"></span>${dominoHalfHtml(tile.right)}`;
      tileBtn.addEventListener('click', () => onDominoSlotRemove(i));
      slot.appendChild(tileBtn);
    } else {
      slot.textContent = '+';
    }
    chainEl.appendChild(slot);
  });

  const poolEl = document.createElement('div');
  poolEl.className = 'domino-pool';
  dominoState.pool.forEach((tileId) => {
    const tile = dominoState.tilesById.get(tileId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'domino-tile';
    btn.innerHTML = `${dominoHalfHtml(tile.left)}<span class="domino-divider"></span>${dominoHalfHtml(tile.right)}`;
    btn.addEventListener('pointerdown', (e) => startDominoDrag(e, tileId));
    poolEl.appendChild(btn);
  });

  wrap.innerHTML = '<p class="domino-label">Steine:</p>';
  wrap.appendChild(poolEl);
  wrap.insertAdjacentHTML('beforeend', '<p class="domino-label">Kette:</p>');
  wrap.appendChild(chainEl);

  container.innerHTML = '';
  container.appendChild(wrap);
}

function onDominoSlotRemove(index) {
  // Belegten Platz antippen: Stein zurück in den Vorrat legen.
  const tileId = dominoState.slots[index];
  if (!tileId) return;
  dominoState.pool.push(tileId);
  dominoState.slots[index] = null;
  dominoState.wrongLinkIndexes.clear();
  playTapSound();
  renderDomino();
}

/* ---------- Ziehen (Pointer Events) ---------- */

function startDominoDrag(e, tileId) {
  e.preventDefault();
  const tile = dominoState.tilesById.get(tileId);
  dominoDrag = { tileId };
  const ghost = document.getElementById('dragGhost');
  ghost.innerHTML = `<div class="domino-tile domino-tile-ghost">${dominoHalfHtml(tile.left)}<span class="domino-divider"></span>${dominoHalfHtml(tile.right)}</div>`;
  ghost.style.left = `${e.clientX}px`;
  ghost.style.top = `${e.clientY}px`;
  ghost.hidden = false;
  document.addEventListener('pointermove', onDominoDragMove);
  document.addEventListener('pointerup', onDominoDragEnd);
}

function onDominoDragMove(e) {
  const ghost = document.getElementById('dragGhost');
  ghost.style.left = `${e.clientX}px`;
  ghost.style.top = `${e.clientY}px`;
  document.querySelectorAll('.domino-slot.drag-over').forEach((s) => s.classList.remove('drag-over'));
  const slotEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.domino-slot');
  if (slotEl && !slotEl.classList.contains('is-filled')) slotEl.classList.add('drag-over');
}

function onDominoDragEnd(e) {
  document.removeEventListener('pointermove', onDominoDragMove);
  document.removeEventListener('pointerup', onDominoDragEnd);
  document.getElementById('dragGhost').hidden = true;
  if (!dominoDrag) return;

  const slotEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.domino-slot');
  if (slotEl && !slotEl.classList.contains('is-filled')) {
    const index = Number(slotEl.dataset.slotIndex);
    const { tileId } = dominoDrag;
    dominoState.slots[index] = tileId;
    dominoState.pool = dominoState.pool.filter((id) => id !== tileId);
    dominoState.wrongLinkIndexes.clear();
    playTapSound();
    renderDomino();
  }
  dominoDrag = null;
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
