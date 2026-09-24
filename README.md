# Noten-Rätsel

Breites Wissensquiz zu Notenwerten für die digitale Tafel/Tablets: sechs
unterschiedliche Spielformate (Memory, Verbinden, Lückentext, Domino, Quiz,
Noten-Werkstatt) fragen dasselbe Themenfeld auf jeweils andere Art ab.

Dritte App im Musik-App-Ökosystem, neben
[Rhythmus-Generator](../Rhythmus-Generator-App) (freies Bau-Werkzeug für
Rhythmen) und [Rhythmus-Trainer](../Rhythmus-Trainer-App) (Hördiktat mit
Punkten/Levels). Anders als die beiden Rhythmus-Apps geht es hier nicht um
das Bauen/Hören von Rhythmen selbst, sondern um Faktenwissen: Notenwerte,
ihre Dauer-Verhältnisse, ihren Aufbau (Notenkopf/-hals/Fähnchen) und (bei
"Schwer") Taktarten.

## Spielprinzip

Kein einzelner Spiel-Loop, sondern ein **Stationen-Hub**:

- Im Hub wählt man zuerst eine der sechs **Spielform**-Kacheln.
- Direkt danach fragt eine kurze Zwischenseite die **Schwierigkeit**
  (🟢 Leicht / 🟡 Mittel / 🔴 Schwer) ab - sie bestimmt den INHALT (welche
  Themen abgefragt werden, siehe unten), nicht das Format. Bewusst PRO
  FORMAT direkt vor dem Start gewählt statt einer globalen Einstellung
  irgendwo im Hub - zwei getrennte Auswahlreihen (Level oben, Format unten)
  waren für Kinder verwirrend.
- Kleine Punkte auf jeder Format-Kachel zeigen, welche der drei
  Schwierigkeiten für dieses Format schon mindestens einmal komplett
  gelöst wurden. Beliebig oft wiederholbar für mehr Punkte/Übung - kein
  Freischalten, keine Bestrafung für falsche Versuche, kein Zeitdruck.
- Alle Punkte aus allen Formaten/Schwierigkeiten fließen in einen
  gemeinsamen Gesamtpunktestand.

## Die sechs Formate

1. **🧠 Memory** - Notensymbol-Karte mit passender Info-Karte (Name +
   Dauer) paaren. Raster ist immer möglichst quadratisch (Spaltenzahl =
   `ceil(sqrt(Kartenzahl))`), läuft auf breiten Bildschirmen also nicht in
   eine einzige lange Reihe.
2. **🔗 Verbinden** - Notenwert antippen, dann die passende Dauer (Text +
   Balkenlänge) antippen.
3. **📝 Lückentext** - Sätze zu Regeln/Notenaufbau ergänzen, per Antippen
   vorgegebener Wortkarten (kein Freitext - kindgerechter, kein Frust durch
   Tippfehler).
4. **🁰 Domino** - Steine per echtem Ziehen in eine Kette legen, bei der
   berührende Hälften gleich lange Notenwerte zeigen (z. B. "1 Halbe Note"
   passt an "2 Viertelnoten"). Ursprünglich Antippen-basiert, nach
   Nutzerfeedback ("fühlt sich nicht organisch an") auf Ziehen umgestellt.
5. **❓ Quiz** - klassisches Multiple-Choice zu Fakten und Regeln.
6. **✋ Noten-Werkstatt** - echtes Ziehen (nicht nur Antippen): entweder
   Notenwerte nach Dauer sortieren (längste zuerst) oder eine Note aus
   Notenkopf/Notenhals/Fähnchen zusammenbauen (Reihenfolge der Felder wie an
   der echten Note: Fähnchen oben, Notenhals, Notenkopf unten) - eine
   Live-Vorschau baut die echte Note dabei sichtbar mit auf, auch wenn ein
   Teil falsch gewählt wurde. Pro Aufgabe zufällig gewählt (Bauen nur, wenn
   Schwierigkeit "Schwer" aktiv ist).

**Randomisierung (verbindlich für alle sechs Formate):** Reihenfolge und
Auswahl von Fragen/Karten/Paaren/Steinen wird bei **jedem** Rundenstart neu
ausgewürfelt (Fisher-Yates-Shuffle, siehe `shuffle()`/`sample()` in
`content.js`) - kein Format zeigt Inhalte in fester Reihenfolge. Wichtig, da
Tablets im Unterricht mehrfach hintereinander von verschiedenen Kindern
genutzt werden und Lösungen nicht auswendig gelernt werden sollen.

## Schwierigkeitsstufen

Die Schwierigkeit steuert den Inhalt, nicht das Format oder den
Bedienungs-Schwierigkeitsgrad. Sie wird PRO Format direkt vor dem Start
gewählt (nicht global im Hub):

1. **🟢 Leicht** - Notenwerte: Ganze, Halbe, Viertel, Achtelnote.
2. **🟡 Mittel** - dieselben Notenwerte, zusätzlich die passenden Pausen.
3. **🔴 Schwer** - zusätzlich 4/4, 3/4, 6/8, Dauer-Verhältnisse (z. B.
   "1 Ganze = 4 Viertel") sowie Notenkopf/Notenhals/Fähnchen; schaltet
   außerdem die "Note bauen"-Aufgabe bei Noten-Werkstatt frei. Bei
   Quiz/Lückentext ist "Umrechnen" (Dauer-Verhältnisse zwischen JEDEM
   sinnvollen Notenwert-/Pausen-Paar, nicht nur ein Beispiel) hier bewusst
   der inhaltliche Schwerpunkt, der die Stufe klar von "Mittel" abhebt -
   siehe [game-quiz.js](game-quiz.js) / [game-luecken.js](game-luecken.js).

Nicht jedes Format nutzt jedes Thema (Memory/Verbinden bleiben z. B. bei
Notenwerten+Pausen, da sich Taktarten/Verhältnisse nicht sinnvoll als
Karten-Paar abbilden lassen) - Quiz und Lückentext schöpfen als
textbasierte Formate das breiteste Themenspektrum aus.

## Punktesystem

| Format | Pro richtiger Aktion | Fertig-Bonus |
|---|---|---|
| Memory | 15 pro gefundenem Paar | +20 |
| Verbinden | 15 pro richtigem Paar | +20 |
| Lückentext | 10 pro Lücke (+5 bei Lösung im 1. Versuch) | +15 |
| Domino | 20 pro Stein (nur bei komplett richtiger Kette) | +20 |
| Quiz | 10 pro Frage (+5 bei Lösung im 1. Versuch) | +15 |
| Noten-Werkstatt | 10 pro sortiertem/gebautem Element | +15 |

## Bewusste Entscheidungen zu offenen Punkten der Konzeptnotiz

- **Punkte-Gewichtung** (siehe Tabelle oben): Memory/Verbinden/Domino
  bekommen mehr Punkte pro Aktion als Quiz/Lückentext/Noten-Werkstatt, weil sie
  strukturell aufwändiger sind (ein Paar/Stein verknüpft zwei Fakten statt
  eine Frage direkt zu beantworten). Domino am höchsten bewertet, da es die
  einzige Aufgabe ist, die über die GANZE Kette hinweg konsistent sein
  muss. Erstversuch-Bonus (+5) nur bei Quiz/Lückentext, weil dort "1.
  Versuch" eindeutig definierbar ist (bei Memory/Domino/Noten-Werkstatt wäre
  das uneindeutig/unfair, da man dort ohnehin mit Zwischenzuständen
  arbeitet).
- **Fragen-/Aufgabenpool:** Startpool deckt alle drei Schwierigkeits-Themen
  ab (`buildQuizPool`/`buildLueckenPool`/`buildDominoChain`/
  `buildSortTask`/`buildBuildTask` in den jeweiligen `game-*.js`) - bewusst
  als generierende Funktionen statt einer starren Fragenliste, damit sich
  der Pool leicht erweitern lässt (neue Frage-Vorlage ergänzen, nicht jede
  einzelne Frage von Hand schreiben).
- **Schwierigkeit/Format als Fortschritt:** Da jedes Format bereits eine
  vollständige Mini-Runde ist (z. B. 8 Quizfragen oder ein 6-Paar-
  Memory-Brett), zählt EIN vollständig gelöster Durchlauf pro
  Schwierigkeit/Format-Kombination als "geschafft" (Punkt auf der
  Format-Kachel) - anders als der Rhythmus-Trainer, der wegen kurzer
  Einzelrunden 10 Wiederholungen braucht, um Übung zu erzwingen.
- **Optik:** seit dem Redesign vom 2026-09-24 dieselbe helle Slate-/Amber-
  Palette mit royalblauer Toolbar wie Rhythmus-Generator, Rhythmus-Trainer
  und die Musik-Apps-Übersicht (identische `:root`-Variablen, Systemschrift
  statt der ursprünglich geplanten "Baloo 2") - bewusst NICHT mehr eigenständig
  gestaltet, damit der Übergang zwischen den Apps nahtlos wirkt.
- **Header-Icon:** ❓ vor dem Titel, oben rechts ein Zurück-Link zur
  Musik-Apps-Übersicht (`.toolbar-home-link`), Impressum als Menüpunkt in
  den Einstellungen (`.settings-legal-link`) - siehe
  [Musik-Apps/README.md](../Musik-Apps/README.md) für die verbindlichen
  Konventionen.
- **Name:** Ordner/Titel "Noten-Rätsel" wie vorgegeben; Arbeitstitel aus
  der Notiz übernommen.

## Lokal starten

Kein Build-Schritt nötig, reines HTML/CSS/JS.

```bash
node serve.js
```

und dann `http://localhost:5181` öffnen - oder `index.html` direkt per
Doppelklick im Browser öffnen.

## Hosting über GitHub Pages

Wie bei den anderen beiden Apps: eigenständiges Repository, GitHub Pages
"Deploy from a branch", Branch `main`, Ordner `/ (root)`.
