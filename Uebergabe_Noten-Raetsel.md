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

## Stand: 2026-09-24

- Vollständig funktionsfähig, alle sechs Formate lokal durchgetestet (inkl.
  echtem Noten-Werkstatt, Punktevergabe, Schwierigkeits-Filterung,
  Randomisierung, Rundenabschluss) UND live auf GitHub Pages veröffentlicht
  (siehe Repository/Deployment unten - der Stand "noch nicht veröffentlicht"
  ist überholt).
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
- **Redesign live auf `main`** (der frühere Style-Test-Branch
  `style-test-tailwind` ist längst gemerged, nicht mehr relevant): heller
  Slate/Amber-Look mit royalblauer Toolbar - identisch zu Rhythmus-Generator,
  Rhythmus-Trainer und der Musik-Apps-Übersicht (gemeinsame `:root`-
  Variablen in style.css, kein "Baloo 2" mehr).
- Oben rechts in der Toolbar ein Zurück-Link zur Musik-Apps-Übersicht
  (`.toolbar-home-link`, `margin-left: auto`) - bewusst RECHTS, da links
  bereits der In-App-"Zurück"-Button (Hub/Format) sitzt. "Impressum" als
  eigener Menüpunkt am Ende des Einstellungen-Flyouts
  (`.settings-legal-link`, verlinkt auf die zentrale Seite im
  Musik-Apps-Repo).
- Header-Icon vor dem Titel am 2026-09-24 von 🎼 auf ❓ geändert - Teil einer
  app-übergreifenden Konvention, siehe
  [Musik-Apps/README.md](../Musik-Apps/README.md).
- Feedback-Runde nach dem Style-Test (Bugfixes + Inhalt, vor dem Push):
  - **Verbinden-Bug behoben**: Die rechte Spalte zeigt nur die Dauer (z.B.
    "1 Schlag") - eine Note und ihre gleich lange Pause sahen dort
    identisch aus, wurden aber nur bei exakt der ursprünglich zugeordneten
    Karte als richtig gewertet. Matcht jetzt nach `units`-Gleichheit
    (`matchedLeftIds`/`matchedRightIds` statt `matchedFactIds`).
  - **Format 6 umbenannt**: "Drag & Drop" -> "Noten-Werkstatt" (kindgerechter,
    passt zum ✋-Icon).
  - **"Note bauen"-Aufgabe erweitert**: Label "offener Notenkopf" ->
    "unausgefüllter Notenkopf"; Feld-Reihenfolge auf Fähnchen/Notenhals/
    Notenkopf (wie an der echten Note) gedreht; neue Live-Vorschau
    (`buildNotePreviewSvg` in `game-dragdrop.js`) baut die echte Note aus
    den aktuell befüllten Feldern zusammen, auch wenn ein Teil falsch ist.
  - **Memory-Raster quadratisch**: feste Spaltenzahl
    `ceil(sqrt(Kartenzahl))` per `--memory-cols` statt `auto-fit`, damit es
    nicht in eine lange Reihe läuft.
  - **Domino auf echtes Ziehen umgestellt**: war Antippen-basiert
    ("fühlt sich nicht organisch an" laut Nutzer), jetzt Pointer-Events wie
    Noten-Werkstatt (`startDominoDrag`/`onDominoDragMove`/`onDominoDragEnd`).
  - **Schwer-Stufe bei Quiz/Lückentext deutlich ausgebaut**: "Umrechnen"
    (Dauer-Verhältnisse) ist jetzt der inhaltliche Schwerpunkt - ALLE
    sinnvollen Noten-/Pausen-Paare statt nur 1-2 feste Beispiele, plus eine
    Taktart+Notenwert-Kombifrage bei Quiz. Pool-Größe bei "Schwer" dadurch
    von 16/21 auf 29/31 Fragen/Sätze gewachsen (Leicht 4, Mittel 8 bleiben
    unverändert - Schwer hebt sich jetzt klar ab).
- Funktionsumfang/Schwierigkeitsstufen/Punktesystem: siehe README.md.

## Repository / Deployment

- GitHub: `https://github.com/mitlaeuferfotografie/Noten-Raetsel`
  (Branch `main`, GitHub Pages "Deploy from a branch", Ordner `/ (root)`).
- Live-URL: `https://mitlaeuferfotografie.github.io/Noten-Raetsel/`
- Lokal: `node serve.js`, dann `http://localhost:5181`.
- Auf der [Musik-Apps-Übersicht](https://mitlaeuferfotografie.github.io/Musik-Apps/)
  verlinkt (dritte Karte).

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
- Domino/Noten-Werkstatt nutzen den gemeinsamen `#actionBtn` ("✓ Prüfen") in
  der Bottom-Bar (mehrteilige Anordnung, erst als Ganzes bewertbar); alle
  anderen Formate werten jede Aktion sofort einzeln, ohne Extra-Klick.
  `renderApp()` setzt `actionBtn.hidden = true` explizit auf Hub/
  Difficulty-Screen, damit der Button nach `backToHub()` nicht fälschlich
  sichtbar bleibt.
- Noten-Werkstatt UND Domino implementieren echtes Ziehen per Pointer Events
  (eigener, lokaler Mechanismus in `game-dragdrop.js`/`game-domino.js`,
  nicht die native HTML5-DnD-API - touch-tauglich, gemeinsames `#dragGhost`-
  Element). Domino war ursprünglich Antippen-basiert (laut Konzeptnotiz
  gleichwertig), wurde aber nach Nutzerfeedback ("fühlt sich nicht
  organisch an") auf Ziehen umgestellt. Nur Verbinden bleibt bewusst
  Antippen-basiert.
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

## Bugfixes 2026-09-25 (aus dem echten Unterricht gemeldet)

- **Domino - fester Anfangsstein:** Ohne Startpunkt mussten Kinder die
  Kette komplett blind zusammensetzen; zwei Steine konnten lokal
  zueinander passen (rechter Wert von A = linker Wert von B), aber an der
  falschen STELLE der Gesamtkette liegen und wurden beim Prüfen trotzdem
  als falsch markiert - für Kinder wirkte das wie "war doch richtig!".
  Fix in `game-domino.js`/`startDomino()`: der erste Stein der generierten
  Kette (`tiles[0]`) steht von Anfang an fest in Feld 1
  (`dominoState.startTileId`, "Start"-Badge, `onDominoSlotRemove` lässt
  ihn nicht entfernen) - Kinder bauen gezielt von dort nach rechts weiter.
- **Noten-Werkstatt "Leicht" - immer dieselbe Aufgabe:** `buildSortTask()`
  wählte bisher IMMER alle 4 verfügbaren Notenwerte (bei "Leicht" gibt es
  nur diese 4 Fakten insgesamt, je einen pro Dauer - keine Auswahl
  möglich), in der einzig gültigen Zielreihenfolge - dadurch war die
  Aufgabe in allen 5 Runden identisch. Fix: zufällige Teilmengengröße
  (3 oder 4 von 4 Dauern) statt fest 4, dadurch mehrere unterschiedliche
  Aufgaben-Varianten pro Level.
- **Memory - vereinzelt gemeldete "falsche Paare übrig" (NICHT
  reproduziert):** Code-Durchsicht von `game-memory.js` (Pairing über
  `factId` + unterschiedliches `kind`, Karten werden über `sample()` aus
  eindeutigen Fakten gezogen) ergab keine Fehlerquelle - `sample()`
  garantiert eindeutige Fakten, Duplikate sind nicht möglich. Falls es
  erneut auftritt: Level/Schwierigkeit und möglichst einen Screenshot
  festhalten, bevor an dieser Logik etwas geändert wird.

## Offene / mögliche nächste Schritte (nicht beauftragt, nur vorgemerkt)

- Kurzlink + QR-Code in den Einstellungen (analog zum Rhythmus-Generator)
  stehen noch aus - Veröffentlichung selbst ist seit 2026-09-23 erledigt.
- Domino-Kettenlänge/Aufgabenanzahl pro Format sind Startwerte
  (`DOMINO_CHAIN_LENGTH`, `QUIZ_ROUND_SIZE` usw. in den jeweiligen
  `game-*.js`) - bei Bedarf leicht anpassbar.
