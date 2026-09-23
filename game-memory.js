'use strict';

/* ============================================================
   Format 1: Memory - Notensymbol-Karte mit passender Info-Karte paaren.
   Punkte: siehe README "Bewusste Entscheidungen" für die Begründung der
   Gewichtung (hier: 15 pro Paar + 20 Fertig-Bonus).
   ============================================================ */

const MEMORY_POINTS_PER_PAIR = 15;
const MEMORY_COMPLETE_BONUS = 20;

let memoryState = null;

function startMemory() {
  const facts = factsForLevel(currentLevel());
  const pairCount = Math.min(facts.length, currentLevel().id >= 2 ? 8 : 6);
  const chosen = sample(facts, pairCount);

  const cards = [];
  chosen.forEach((f) => {
    cards.push({ id: uid('c'), factId: f.id, kind: 'symbol' });
    cards.push({ id: uid('c'), factId: f.id, kind: 'info' });
  });

  memoryState = {
    cards: shuffle(cards), // Kartenposition JEDE Runde neu ausgewürfelt (Konzeptnotiz Punkt 3)
    flipped: [], // aktuell aufgedeckte, noch nicht gematchte Karten-IDs
    matchedFactIds: new Set(),
    busy: false, // während der kurzen "falsch"-Pause blockiert, damit man nicht eine 3. Karte aufdeckt
  };
  renderMemory();
}

function renderMemory() {
  const container = document.getElementById('formatContainer');
  const grid = document.createElement('div');
  grid.className = 'memory-grid';

  memoryState.cards.forEach((card) => {
    const fact = factById(card.factId);
    const el = document.createElement('button');
    el.type = 'button';
    const isMatched = memoryState.matchedFactIds.has(card.factId);
    const isFlipped = isMatched || memoryState.flipped.includes(card.id);
    el.className = `memory-card${isFlipped ? ' is-flipped' : ''}${isMatched ? ' is-matched' : ''}`;
    el.disabled = isMatched;
    el.innerHTML = `
      <span class="memory-card-back">?</span>
      <span class="memory-card-front">
        ${card.kind === 'symbol'
          ? `<span class="memory-card-icon">${fact.icon}</span>`
          : `<span class="memory-card-info"><strong>${fact.name}</strong><br>${formatSchlaege(fact.units)}</span>`}
      </span>
    `;
    el.addEventListener('click', () => onMemoryCardClick(card.id));
    grid.appendChild(el);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}

function onMemoryCardClick(cardId) {
  if (memoryState.busy) return;
  const card = memoryState.cards.find((c) => c.id === cardId);
  if (memoryState.matchedFactIds.has(card.factId)) return;
  if (memoryState.flipped.includes(cardId)) return;
  if (memoryState.flipped.length >= 2) return;

  playTapSound();
  memoryState.flipped.push(cardId);
  renderMemory();

  if (memoryState.flipped.length === 2) {
    const [firstId, secondId] = memoryState.flipped;
    const first = memoryState.cards.find((c) => c.id === firstId);
    const second = memoryState.cards.find((c) => c.id === secondId);
    const isMatch = first.factId === second.factId && first.kind !== second.kind;

    if (isMatch) {
      memoryState.matchedFactIds.add(first.factId);
      memoryState.flipped = [];
      awardPoints(MEMORY_POINTS_PER_PAIR);
      renderMemory();
      const totalPairs = memoryState.cards.length / 2;
      if (memoryState.matchedFactIds.size === totalPairs) {
        finishFormatRound(MEMORY_COMPLETE_BONUS);
      }
    } else {
      memoryState.busy = true;
      setTimeout(() => {
        memoryState.flipped = [];
        memoryState.busy = false;
        renderMemory();
      }, 800);
    }
  }
}
