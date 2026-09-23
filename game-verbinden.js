'use strict';

/* ============================================================
   Format 2: Verbinden/Zuordnen - Notenwert (links) mit passender Dauer
   (rechts, als Text + Balkenlänge) per Antippen verbinden. Antippen statt
   freihändigem Linienziehen: auf Touch/Maus/Stift gleich zuverlässig
   bedienbar, ohne eine eigene Zeichenfläche zu brauchen.
   ============================================================ */

const VERBINDEN_POINTS_PER_PAIR = 15;
const VERBINDEN_COMPLETE_BONUS = 20;

let verbindenState = null;

function startVerbinden() {
  const facts = factsForDifficulty(currentDifficulty());
  const pairCount = Math.min(facts.length, currentDifficulty().order >= 2 ? 8 : 6);
  const chosen = sample(facts, pairCount);
  const maxUnits = Math.max(...ALL_FACTS.map((f) => f.units));

  verbindenState = {
    left: shuffle(chosen.map((f) => ({ id: uid('l'), factId: f.id }))),
    right: shuffle(chosen.map((f) => ({ id: uid('r'), factId: f.id }))),
    matchedFactIds: new Set(),
    selectedLeft: null,
    selectedRight: null,
    maxUnits,
  };
  renderVerbinden();
}

function renderVerbinden() {
  const container = document.getElementById('formatContainer');
  const wrap = document.createElement('div');
  wrap.className = 'verbinden-grid';

  const leftCol = document.createElement('div');
  leftCol.className = 'verbinden-col';
  verbindenState.left.forEach((item) => {
    const fact = factById(item.factId);
    const matched = verbindenState.matchedFactIds.has(item.factId);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `verbinden-card${matched ? ' is-matched' : ''}${verbindenState.selectedLeft === item.id ? ' is-selected' : ''}`;
    el.disabled = matched;
    el.innerHTML = `<span class="verbinden-icon">${fact.icon}</span><span>${fact.name}</span>`;
    el.addEventListener('click', () => onVerbindenPick('left', item));
    leftCol.appendChild(el);
  });

  const rightCol = document.createElement('div');
  rightCol.className = 'verbinden-col';
  verbindenState.right.forEach((item) => {
    const fact = factById(item.factId);
    const matched = verbindenState.matchedFactIds.has(item.factId);
    const pct = Math.max(12, (fact.units / verbindenState.maxUnits) * 100);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `verbinden-card verbinden-duration${matched ? ' is-matched' : ''}${verbindenState.selectedRight === item.id ? ' is-selected' : ''}`;
    el.disabled = matched;
    el.innerHTML = `
      <span class="verbinden-bar" style="width:${pct}%"></span>
      <span>${formatSchlaege(fact.units)}</span>
    `;
    el.addEventListener('click', () => onVerbindenPick('right', item));
    rightCol.appendChild(el);
  });

  wrap.appendChild(leftCol);
  wrap.appendChild(rightCol);
  container.innerHTML = '';
  container.appendChild(wrap);
}

function onVerbindenPick(side, item) {
  if (verbindenState.matchedFactIds.has(item.factId)) return;
  playTapSound();

  if (side === 'left') {
    verbindenState.selectedLeft = verbindenState.selectedLeft === item.id ? null : item.id;
  } else {
    verbindenState.selectedRight = verbindenState.selectedRight === item.id ? null : item.id;
  }
  renderVerbinden();

  if (!verbindenState.selectedLeft || !verbindenState.selectedRight) return;

  const leftItem = verbindenState.left.find((l) => l.id === verbindenState.selectedLeft);
  const rightItem = verbindenState.right.find((r) => r.id === verbindenState.selectedRight);

  if (leftItem.factId === rightItem.factId) {
    verbindenState.matchedFactIds.add(leftItem.factId);
    verbindenState.selectedLeft = null;
    verbindenState.selectedRight = null;
    awardPoints(VERBINDEN_POINTS_PER_PAIR);
    renderVerbinden();
    if (verbindenState.matchedFactIds.size === verbindenState.left.length) {
      finishFormatRound(VERBINDEN_COMPLETE_BONUS);
    }
  } else {
    playTryAgainSound();
    showFeedback('wrong', 'Das passt noch nicht zusammen - versuch es noch einmal!');
    setTimeout(() => {
      verbindenState.selectedLeft = null;
      verbindenState.selectedRight = null;
      document.getElementById('feedback').hidden = true;
      renderVerbinden();
    }, 900);
  }
}
