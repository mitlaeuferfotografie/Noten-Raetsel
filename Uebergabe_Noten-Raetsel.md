# Übergabe: Noten-Rätsel (Web-App)

Dieses Dokument fasst den aktuellen Stand, die Architektur und alle
verbindlichen Konventionen der App zusammen, damit auch außerhalb von
Claude Code (z. B. in Cowork) nahtlos weitergearbeitet werden kann. Wird bei
jeder inhaltlichen Änderung aktuell gehalten (siehe CLAUDE.md).

## Kontext

Grundschullehrer (NRW), Musikschwerpunkt. Noten-Rätsel ist die dritte
Musikunterricht-App (Klasse 3/4), neben
[Rhythmus-Generator](https://github.com/mitlaeuferfotografie/Rhythmus-Generator)
und [Rhythmus-Trainer](https://github.com/mitlaeuferfotografie/Rhythmus-Trainer).
Anders als die beiden Rhythmus-Apps kein Bau-/Hör-Werkzeug, sondern ein
breites Wissensquiz zu Notenwerten in sechs unterschiedlichen Spielformaten.
Ursprüngliche Konzeptnotiz lag in
`C:\Users\BrandschP\Documents\ClaudeArbeitsordner\Musikunterricht\Konzeptnotiz_Noten-Raetsel_fuer_Code.md`.

## Stand: 2026-09-23

- Erste Version vollständig funktionsfähig, alle sechs Formate lokal
  durchgetestet (inkl. echtem Drag & Drop, Punktevergabe,
  Schwierigkeits-Filterung, Randomisierung, Rundenabschluss). Noch NICHT
  auf GitHub Pages veröffentlicht (folgt im Anschluss an diese erste
  Version).
- Hub-Redesign (noch am selben Tag, direkt nach erster Rückmeldung):
  Nutzer-Feedback war, dass eine globale Level-Auswahl oben + Format-Wahl
  unten für Kinder verwirrend ist ("das wird kein kind verstehen"). Umbau
  auf 3-Schritte-Flow: Format-Kachel wählen -> Zwischenseite mit 3
  Schwierigkeiten (🟢/🟡/🔴, aus den ursprünglichen 4 Leveln verdichtet,
  die beiden anspruchsvollsten Level zu "Schwer" zusammengelegt) -> Runde
  startet. `LEVELS`/`levelHasTopic`/`factsForLevel` in `content.js`
  umbenannt zu `DIFFICULTIES`/`difficultyHasTopic`/`factsForDifficulty`.
  Fortschrittsanzeige jetzt als 3 kleine Punkte pro Format-Kachel statt
  einem einzigen Haken.
- Funktionsumfang/Schwierigkeitsstufen/Punktesystem: siehe README.md.

## Repository / Deployment

- Lokal: `node serve.js`, dann `http://localhost:5181`.
- GitHub/Live-URL: siehe README.md, sobald veröffentlicht.

## Technik / Architektur

- Reines Vanilla HTML/CSS/JS, kein Build-Schritt, kein Framework, kein
  Backend - wie die beiden anderen Apps.
- Auf mehrere Dateien aufgeteilt (kein Bundler nötig, einfache
  `<script>`-Tags in Reihenfolge in `index.html`):
  - `content.js` - EINE gemeinsame Fakten-Datenbank (Notenwerte, Pausen,
    Taktarten, Dauer-Verhältnisse), `DIFFICULTIES` (3 Stufen), Zufalls-
    Hilfsfunktionen (`shuffle`/`sample`/`pickOne` - Fisher-Yates,
    verbindlich für ALLE Formate zu nutzen).
  - `audio.js` - Erfolgs-/Fehler-/Tipp-Sounds (Web Audio API, gleiche
    Klangbasis wie die Rhythmus-Apps).
  - `hub.js` - App-Gerüst: drei Screens (`hub`/`difficulty`/`format`),
    Format-Kacheln, Schwierigkeits-Zwischenseite, Punkte, `localStorage`,
    Einstellungen. Definiert `game` (globaler Zustand,
    `screen`/`currentFormatId`/`currentDifficultyId`/`points`/
    `completedCombos`/`lastDifficultyByFormat`/`soundVolume`) und die von
    allen Formaten genutzten Helfer `awardPoints`, `showPointsPopup`,
    `showFeedback`, `finishFormatRound`, `backToHub`.
  - `game-memory.js`, `game-verbinden.js`, `game-luecken.js`,
    `game-domino.js`, `game-quiz.js`, `game-dragdrop.js` - je ein Format,
    exportiert eine `startXxx()`-Funktion (von `hub.js`'s `FORMATS`-Array
    aufgerufen).
- Notenwerte-Modell: 1 "unit" = eine Achtelnote (gleiche Konvention wie in
  den Rhythmus-Apps).
- Schwierigkeit bestimmt den INHALT (welche Themen/`topics` erlaubt sind),
  nicht das Format - jedes Format filtert über `difficultyHasTopic()`/
  `factsForDifficulty()` selbst, welche Fakten es nutzen darf. Wird PRO
  Format auf einer eigenen Zwischenseite gewählt (nicht global im Hub) -
  siehe README.md, "Spielprinzip".
- Domino/Drag & Drop nutzen den gemeinsamen `#actionBtn` ("✓ Prüfen") in
  der Bottom-Bar (mehrteilige Anordnung, erst als Ganzes bewertbar); alle
  anderen Formate werten jede Aktion sofort einzeln, ohne Extra-Klick.
  `renderApp()` setzt `actionBtn.hidden = true` explizit auf Hub/
  Difficulty-Screen, damit der Button nach `backToHub()` nicht fälschlich
  sichtbar bleibt.
- Drag & Drop implementiert echtes Ziehen per Pointer Events (eigener,
  lokaler Mechanismus in `game-dragdrop.js`, nicht die native HTML5-DnD-API
  - touch-tauglich). Domino/Verbinden nutzen bewusst Antippen statt Ziehen
  (laut Konzeptnotiz gleichwertig, auf kleinen Touch-Zielen robuster).
- Fortschritt (`localStorage`, Key `notenRaetselFortschritt`): Punkte,
  welche Schwierigkeit/Format-Kombinationen abgeschlossen sind
  (`completedCombos`, Key-Format `"${formatId}-${difficultyId}"`), zuletzt
  gewählte Schwierigkeit pro Format (`lastDifficultyByFormat`, dient als
  Vorschlag/Hervorhebung auf der Zwischenseite), Lautstärke.

## Verbindliche Konventionen

- Randomisierung ist in ALLEN sechs Formaten Pflicht (siehe README.md) -
  bei jeder Änderung an der Aufgaben-Erzeugung sicherstellen, dass
  `shuffle()`/`sample()` verwendet wird.
- Punkte-Gewichtung und ihre Begründung stehen in README.md - dort
  nachschauen statt neue Werte anzunehmen.
- Neue Frage-/Aufgaben-Vorlagen als generierende Funktion in die jeweilige
  `game-*.js` einfügen, nicht als hartcodierte Einzelfrage.

## Offene / mögliche nächste Schritte (nicht beauftragt, nur vorgemerkt)

- Veröffentlichung auf GitHub Pages + Kurzlink + QR-Code (analog zu den
  beiden anderen Apps) steht noch aus.
- Domino-Kettenlänge/Aufgabenanzahl pro Format sind Startwerte
  (`DOMINO_CHAIN_LENGTH`, `QUIZ_ROUND_SIZE` usw. in den jeweiligen
  `game-*.js`) - bei Bedarf leicht anpassbar.
