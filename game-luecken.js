'use strict';

/* ============================================================
   Format 3: Lückentexte - Sätze zu Regeln/Notenaufbau ergänzen. Auswahl
   aus vorgegebenen Wortkarten statt Freitext (kindgerechter, kein Frust
   durch Tippfehler - siehe Konzeptnotiz Punkt 3).
   ============================================================ */

const LUECKEN_ROUND_SIZE = 6;
const LUECKEN_POINTS_PER_BLANK = 10;
const LUECKEN_FIRST_TRY_BONUS = 5;
const LUECKEN_COMPLETE_BONUS = 15;

const pluralNoteName = (name) => name.replace(/Note$/, 'Noten');

function buildChoices(correct, distractorPool, maxChoices) {
  const distractors = sample([...new Set(distractorPool.filter((d) => d !== correct))], maxChoices - 1);
  return shuffle([correct, ...distractors]);
}

// Baut den vollständigen Lückentext-Pool für eine Schwierigkeitsstufe -
// jede Vorlage erzeugt mehrere konkrete Sätze (einen pro passender
// Note/Pause/Taktart), gefiltert auf die freigeschalteten Themen.
function buildLueckenPool(difficulty) {
  const pool = [];
  const notes = NOTE_FACTS;
  const allSchlaegeTexts = notes.map((f) => formatSchlaege(f.units));

  // Thema "notevalues": Dauer einer Note in Schlägen.
  notes.forEach((f) => {
    const correct = formatSchlaege(f.units);
    pool.push({
      text: `Eine ${f.name} dauert ___.`,
      correct,
      choices: buildChoices(correct, allSchlaegeTexts, 4),
    });
  });

  // Thema "rests": eine Pause dauert genauso lange wie welche Note?
  if (difficultyHasTopic(difficulty, 'rests')) {
    REST_FACTS.forEach((r) => {
      const matchingNote = notes.find((n) => n.units === r.units);
      if (!matchingNote) return;
      pool.push({
        text: `Eine ${r.name} dauert genauso lange wie eine ___.`,
        correct: matchingNote.name,
        choices: buildChoices(matchingNote.name, notes.map((n) => n.name), 4),
      });
    });
  }

  // Thema "structure": Notenaufbau (Notenhals/Fähnchen ja oder nein).
  if (difficultyHasTopic(difficulty, 'structure')) {
    notes.forEach((f) => {
      pool.push({
        text: `Hat die ${f.name} einen Notenhals?`,
        correct: f.hals ? 'Ja' : 'Nein',
        choices: ['Ja', 'Nein'],
      });
      pool.push({
        text: `Hat die ${f.name} ein Fähnchen?`,
        correct: f.fahne ? 'Ja' : 'Nein',
        choices: ['Ja', 'Nein'],
      });
    });
  }

  // Thema "timesignatures": bis wohin zählt man im Takt.
  if (difficultyHasTopic(difficulty, 'timesignatures')) {
    TIME_SIGNATURE_FACTS.forEach((ts) => {
      const correct = String(ts.top);
      pool.push({
        text: `Im ${ts.id}-Takt zählt man bis ___.`,
        correct,
        choices: buildChoices(correct, TIME_SIGNATURE_FACTS.map((t) => String(t.top)).concat(['2', '5']), 4),
      });
    });
  }

  // Thema "ratios": Dauer-Verhältnisse zwischen Notenwerten.
  if (difficultyHasTopic(difficulty, 'ratios')) {
    const bigOnes = notes.filter((f) => f.units >= 4);
    bigOnes.forEach((bigger) => {
      const smaller = pickOne(notes.filter((f) => f.units < bigger.units));
      if (!smaller) return;
      const correct = String(bigger.units / smaller.units);
      pool.push({
        text: `Eine ${bigger.name} ist genauso lang wie ___ ${pluralNoteName(smaller.name)}.`,
        correct,
        choices: buildChoices(correct, ['2', '3', '4', '8'], 4),
      });
    });
  }

  return pool;
}

let lueckenState = null;

function startLuecken() {
  const pool = buildLueckenPool(currentDifficulty());
  lueckenState = {
    items: sample(pool, Math.min(LUECKEN_ROUND_SIZE, pool.length)), // Reihenfolge + Auswahl jede Runde neu
    index: 0,
    attemptCount: 0,
  };
  renderLuecken();
}

function renderLuecken() {
  const container = document.getElementById('formatContainer');
  const item = lueckenState.items[lueckenState.index];
  const [before, after] = item.text.split('___');

  const wrap = document.createElement('div');
  wrap.className = 'luecken-wrap';
  wrap.innerHTML = `
    <div class="luecken-progress">Satz ${lueckenState.index + 1} von ${lueckenState.items.length}</div>
    <p class="luecken-sentence">${before}<span class="luecken-blank">___</span>${after || ''}</p>
    <div class="luecken-choices"></div>
  `;

  const choicesEl = wrap.querySelector('.luecken-choices');
  item.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'luecken-choice';
    btn.textContent = choice;
    btn.addEventListener('click', () => onLueckenChoice(choice));
    choicesEl.appendChild(btn);
  });

  container.innerHTML = '';
  container.appendChild(wrap);
}

function onLueckenChoice(choice) {
  const item = lueckenState.items[lueckenState.index];
  lueckenState.attemptCount += 1;

  if (choice !== item.correct) {
    playTryAgainSound();
    showFeedback('wrong', 'Noch nicht ganz richtig - versuch es noch einmal!');
    return;
  }

  const bonus = lueckenState.attemptCount === 1 ? LUECKEN_FIRST_TRY_BONUS : 0;
  playSuccessSound();
  document.getElementById('feedback').hidden = true;
  awardPoints(LUECKEN_POINTS_PER_BLANK + bonus);

  lueckenState.index += 1;
  lueckenState.attemptCount = 0;
  if (lueckenState.index >= lueckenState.items.length) {
    finishFormatRound(LUECKEN_COMPLETE_BONUS);
  } else {
    renderLuecken();
  }
}
