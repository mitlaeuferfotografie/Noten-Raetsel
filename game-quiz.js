'use strict';

/* ============================================================
   Format 5: Quizfragen - klassisches Multiple-Choice, Fragen UND
   Antwort-Reihenfolge jede Runde neu ausgewürfelt.
   ============================================================ */

const QUIZ_ROUND_SIZE = 8;
const QUIZ_POINTS_PER_QUESTION = 10;
const QUIZ_FIRST_TRY_BONUS = 5;
const QUIZ_COMPLETE_BONUS = 15;

function buildQuizPool(level) {
  const pool = [];
  const notes = NOTE_FACTS;

  notes.forEach((f) => {
    pool.push({
      text: `Wie viele Schläge dauert eine ${f.name}?`,
      correct: formatSchlaege(f.units),
      choices: buildChoices(formatSchlaege(f.units), notes.map((n) => formatSchlaege(n.units)), 4),
    });
  });

  if (levelHasTopic(level, 'rests')) {
    REST_FACTS.forEach((r) => {
      const matchingNote = notes.find((n) => n.units === r.units);
      if (!matchingNote) return;
      pool.push({
        text: `Wie heißt die Pause, die genauso lange dauert wie eine ${matchingNote.name}?`,
        correct: r.name,
        choices: buildChoices(r.name, REST_FACTS.map((x) => x.name), 4),
      });
    });
  }

  if (levelHasTopic(level, 'structure')) {
    const noFahne = notes.filter((f) => !f.fahne).map((f) => f.name);
    pool.push({
      text: 'Welche dieser Noten hat KEIN Fähnchen?',
      correct: pickOne(noFahne),
      choices: shuffle(notes.map((f) => f.name)),
    });
    pool.push({
      text: 'Welche dieser Noten hat KEINEN Notenhals?',
      correct: notes.find((f) => !f.hals).name,
      choices: shuffle(notes.map((f) => f.name)),
    });
    pool.push({
      text: 'Welche dieser Noten hat einen ausgefüllten (schwarzen) Notenkopf?',
      correct: pickOne(notes.filter((f) => f.kopf.startsWith('ausgefüllt')).map((f) => f.name)),
      choices: shuffle(notes.map((f) => f.name)),
    });
  }

  if (levelHasTopic(level, 'timesignatures')) {
    TIME_SIGNATURE_FACTS.forEach((ts) => {
      pool.push({
        text: `Welche Taktart hat ${ts.top} Zählzeiten pro Takt?`,
        correct: ts.id,
        choices: shuffle(TIME_SIGNATURE_FACTS.map((t) => t.id)),
      });
    });
  }

  if (levelHasTopic(level, 'ratios')) {
    [4, 8].forEach((units) => {
      const bigger = notes.find((f) => f.units === units);
      const smaller = notes.find((f) => f.units === 2);
      const correct = String(units / 2);
      pool.push({
        text: `Wie viele ${pluralNoteName(smaller.name)} ergeben zusammen eine ${bigger.name}?`,
        correct,
        choices: buildChoices(correct, ['2', '3', '4', '8'], 4),
      });
    });
  }

  return pool;
}

let quizState = null;

function startQuiz() {
  const pool = buildQuizPool(currentLevel());
  quizState = {
    items: sample(pool, Math.min(QUIZ_ROUND_SIZE, pool.length)),
    index: 0,
    attemptCount: 0,
  };
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('formatContainer');
  const item = quizState.items[quizState.index];

  const wrap = document.createElement('div');
  wrap.className = 'quiz-wrap';
  wrap.innerHTML = `
    <div class="quiz-progress">Frage ${quizState.index + 1} von ${quizState.items.length}</div>
    <p class="quiz-question">${item.text}</p>
    <div class="quiz-choices"></div>
  `;

  const choicesEl = wrap.querySelector('.quiz-choices');
  item.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-choice';
    btn.textContent = choice;
    btn.addEventListener('click', () => onQuizChoice(choice));
    choicesEl.appendChild(btn);
  });

  container.innerHTML = '';
  container.appendChild(wrap);
}

function onQuizChoice(choice) {
  const item = quizState.items[quizState.index];
  quizState.attemptCount += 1;

  if (choice !== item.correct) {
    playTryAgainSound();
    showFeedback('wrong', 'Das war noch nicht richtig - versuch es noch einmal!');
    return;
  }

  const bonus = quizState.attemptCount === 1 ? QUIZ_FIRST_TRY_BONUS : 0;
  playSuccessSound();
  document.getElementById('feedback').hidden = true;
  awardPoints(QUIZ_POINTS_PER_QUESTION + bonus);

  quizState.index += 1;
  quizState.attemptCount = 0;
  if (quizState.index >= quizState.items.length) {
    finishFormatRound(QUIZ_COMPLETE_BONUS);
  } else {
    renderQuiz();
  }
}
