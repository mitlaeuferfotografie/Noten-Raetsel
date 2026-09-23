'use strict';

/* ============================================================
   Inhalts-Datenbank: EINE gemeinsame Quelle für alle sechs Spielformate.
   Einheit: 1 "unit" = eine Achtelnote (gleiche Konvention wie im
   Rhythmus-Generator/Rhythmus-Trainer, damit alle drei Apps inhaltlich
   zueinander passen). "schlaege" ist units/2 (Viertel = 1 Schlag) - für
   Texte wie "Eine Ganze Note dauert 4 Schläge".
   ============================================================ */

// Gleiche echten Notationsformen (Wikimedia-Referenzglyphen) wie im
// Rhythmus-Generator/Rhythmus-Trainer, damit Kinder dieselben Symbole
// wiedererkennen. kopf/hals/fahne beschreiben den Notenaufbau (Punkt 2 der
// Konzeptnotiz) - nur für klingende Noten relevant, nicht für Pausen.
const NOTE_FACTS = [
  {
    id: 'whole', name: 'Ganze Note', units: 8, isRest: false,
    kopf: 'offen (nicht ausgefüllt)', hals: false, fahne: false,
    icon: `<svg viewBox="0 0 40 48"><ellipse cx="16" cy="30" rx="13" ry="8" transform="rotate(-15 16 30)" fill="none" stroke="#1a1a1a" stroke-width="4"/></svg>`,
  },
  {
    id: 'half', name: 'Halbe Note', units: 4, isRest: false,
    kopf: 'offen (nicht ausgefüllt)', hals: true, fahne: false,
    icon: `<svg viewBox="0 0 40 56"><ellipse cx="16" cy="46" rx="11" ry="7.5" transform="rotate(-15 16 46)" fill="none" stroke="#1a1a1a" stroke-width="3.5"/><line x1="26" y1="43" x2="26" y2="3" stroke="#1a1a1a" stroke-width="3.5"/></svg>`,
  },
  {
    id: 'quarter', name: 'Viertelnote', units: 2, isRest: false,
    kopf: 'ausgefüllt (schwarz)', hals: true, fahne: false,
    icon: `<svg viewBox="0 0 40 56"><ellipse cx="16" cy="46" rx="11" ry="7.5" transform="rotate(-15 16 46)" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.5"/><line x1="26" y1="43" x2="26" y2="3" stroke="#1a1a1a" stroke-width="3.5"/></svg>`,
  },
  {
    id: 'eighth', name: 'Achtelnote', units: 1, isRest: false,
    kopf: 'ausgefüllt (schwarz)', hals: true, fahne: true,
    icon: `<svg viewBox="0 0 40 56"><ellipse cx="16" cy="46" rx="11" ry="7.5" transform="rotate(-15 16 46)" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.5"/><line x1="26" y1="43" x2="26" y2="3" stroke="#1a1a1a" stroke-width="3.5"/><path d="M26 3 C25.3 9.1 31.8 11.2 34.9 14 C37.9 16.7 39 19.7 38.9 22.5 C38.9 23.3 38.6 26.7 35.8 30 C39.6 21.6 36.1 18.3 32.6 15.6 C28.5 12.4 25.4 9.4 26 3 Z" fill="#1a1a1a"/></svg>`,
  },
];

const REST_FACTS = [
  {
    id: 'wholeRest', name: 'Ganze Pause', units: 8, isRest: true,
    icon: `<svg viewBox="0 0 40 48"><line x1="4" y1="20" x2="30" y2="20" stroke="#1a1a1a" stroke-width="1.5" opacity="0.3"/><rect x="7" y="20" width="18" height="7" fill="#1a1a1a"/></svg>`,
  },
  {
    id: 'halfRest', name: 'Halbe Pause', units: 4, isRest: true,
    icon: `<svg viewBox="0 0 40 48"><line x1="4" y1="20" x2="30" y2="20" stroke="#1a1a1a" stroke-width="1.5" opacity="0.3"/><rect x="7" y="13" width="18" height="7" fill="#1a1a1a"/></svg>`,
  },
  {
    id: 'quarterRest', name: 'Viertelpause', units: 2, isRest: true,
    icon: `<svg viewBox="0 0 40 48"><path d="M 33.585446,59.378537 49.000347,80.448853 C 34.510389,96.966456 43.303241,103.77053 46.891412,113.31714 L 30.195758,89.013879 c 9.651793,-11.411594 5.787047,-20.20785 2.345326,-29.067873 -0.002,-0.0045 1.042493,-0.561506 1.044362,-0.567469 z" fill="#1a1a1a" transform="translate(10,4) scale(0.564) translate(-28.293569,-59.378536)"/><path d="m 45.566519,110.60468 c -17.76994,-15.91987 -24.592214,4.82994 -7.083379,19.74003 -2.252919,-3.86658 -8.756028,-22.85814 7.953256,-17.07143" fill="#1a1a1a" transform="translate(10,4) scale(0.564) translate(-28.293569,-59.378536)"/></svg>`,
  },
  {
    id: 'eighthRest', name: 'Achtelpause', units: 1, isRest: true,
    icon: `<svg viewBox="0 0 40 48"><path d="m 531.098,74.847 c -0.52,0.098 -0.918,0.457 -1.098,0.953 -0.039,0.16 -0.039,0.199 -0.039,0.418 0,0.301 0.019,0.461 0.16,0.699 0.199,0.399 0.617,0.719 1.094,0.836 0.5,0.141 1.336,0.02 2.293,-0.297 l 0.238,-0.082 -1.176,3.25 -1.156,3.246 c 0,0 0.039,0.02 0.102,0.063 0.117,0.078 0.316,0.137 0.457,0.137 0.238,0 0.539,-0.137 0.578,-0.258 0,-0.039 0.558,-1.934 1.234,-4.184 l 1.195,-4.125 -0.039,-0.058 c -0.097,-0.121 -0.296,-0.16 -0.418,-0.063 -0.039,0.039 -0.101,0.121 -0.14,0.18 -0.18,0.301 -0.637,0.836 -0.875,1.035 -0.219,0.18 -0.34,0.199 -0.539,0.121 -0.18,-0.098 -0.239,-0.199 -0.36,-0.738 -0.117,-0.535 -0.257,-0.778 -0.558,-0.977 -0.278,-0.179 -0.637,-0.238 -0.953,-0.156 z" fill="#1a1a1a" transform="translate(13,8) scale(2.8) translate(-529.96,-74.81)"/></svg>`,
  },
];

const ALL_FACTS = [...NOTE_FACTS, ...REST_FACTS];
const factById = (id) => ALL_FACTS.find((f) => f.id === id);
const schlaege = (units) => units / 2;

function formatSchlaege(units) {
  const b = schlaege(units);
  const n = Number.isInteger(b) ? String(b) : b.toFixed(1).replace('.', ','); // deutsches Dezimalkomma statt Punkt
  return b === 1 ? `${n} Schlag` : `${n} Schläge`;
}

const TIME_SIGNATURE_FACTS = [
  { id: '4/4', top: 4, bottom: 4, units: 8, text: '4 Viertelschläge pro Takt' },
  { id: '3/4', top: 3, bottom: 4, units: 6, text: '3 Viertelschläge pro Takt' },
  { id: '6/8', top: 6, bottom: 8, units: 6, text: '6 Achtelschläge pro Takt' },
];

/* ============================================================
   Level-Definitionen: steuern hier NICHT das Spielformat (das wählt man
   getrennt im Hub), sondern welche Themen inhaltlich abgefragt werden -
   genau wie in der Konzeptnotiz Punkt 4 vorgegeben.
   ============================================================ */

const LEVELS = [
  { id: 1, title: 'Notenwerte', topics: ['notevalues'] },
  { id: 2, title: '+ Pausen', topics: ['notevalues', 'rests'] },
  { id: 3, title: '+ Taktarten & Verhältnisse', topics: ['notevalues', 'rests', 'timesignatures', 'ratios'] },
  { id: 4, title: '+ Notenaufbau', topics: ['notevalues', 'rests', 'structure'] },
];

function levelHasTopic(level, topic) {
  return level.topics.includes(topic);
}

// Notenwerte + (falls im Level freigeschaltet) Pausen - die inhaltliche
// Grundmenge, aus der die meisten Formate ihre Karten/Fragen ziehen.
function factsForLevel(level) {
  const facts = [...NOTE_FACTS];
  if (levelHasTopic(level, 'rests')) facts.push(...REST_FACTS);
  return facts;
}

/* ============================================================
   Zufalls-Hilfsfunktionen (Fisher-Yates) - für ALLE sechs Formate
   verbindlich genutzt, damit wirklich jede Reihenfolge (Fragen, Karten,
   Paare, Dominosteine, Sortier-Elemente) bei jedem Durchlauf neu
   ausgewürfelt wird (siehe Konzeptnotiz Punkt 3, "Wichtig").
   ============================================================ */

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(array, n) {
  return shuffle(array).slice(0, Math.min(n, array.length));
}

function pickOne(array) {
  return array[Math.floor(Math.random() * array.length)];
}

let uidCounter = 1;
const uid = (prefix) => `${prefix}-${uidCounter++}`;

/* ============================================================
   Dauer-Verhältnisse (Punkt 2/"ratios") - für Domino und Quiz/Lückentext.
   Jede Kombination ergibt exakt "units" Achtel und besteht aus 1-4
   gleichen Noten/Pausen (bewusst nur gleiche Werte gemischt, z.B. "2
   Viertel" statt "1 Viertel + 2 Achtel" - bleibt für Grundschulkinder
   eindeutig nachvollziehbar).
   ============================================================ */

function ratioCombosForUnits(units, facts) {
  const combos = [];
  facts.forEach((f) => {
    if (units % f.units === 0) {
      const count = units / f.units;
      if (count >= 1 && count <= 8) combos.push({ factId: f.id, count, units });
    }
  });
  return combos;
}

function comboLabel(combo) {
  const f = factById(combo.factId);
  return `${combo.count} × ${f.name}`;
}

// Alle sinnvollen Verhältnis-Paare innerhalb einer Themenmenge (z.B. "1
// Halbe = 2 Viertel", "1 Ganze = 8 Achtel") - Grundlage für Domino.
function allRatioCombos(facts) {
  const unitsSet = [...new Set(facts.map((f) => f.units))];
  const combosByUnits = new Map();
  unitsSet.forEach((u) => combosByUnits.set(u, ratioCombosForUnits(u, facts)));
  return combosByUnits;
}
