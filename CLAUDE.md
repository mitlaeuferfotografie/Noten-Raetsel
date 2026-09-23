# Projektregeln

- Eigenständiges Projekt, kein gemeinsames Repo mit Rhythmus-Generator/
  Rhythmus-Trainer - inhaltlich/stilistisch orientiert es sich an beiden
  (siehe README.md), technisch aber unabhängig.
- Wenn Funktionen der App geändert, hinzugefügt oder entfernt werden, halte
  README.md UND Uebergabe_Noten-Raetsel.md (Cowork-Übergabe) aktuell.
- Randomisierung ist in allen sechs Formaten eine VERBINDLICHE Anforderung
  (siehe README.md) - bei Änderungen an der Aufgaben-/Karten-Erzeugung
  immer `shuffle()`/`sample()` aus content.js nutzen, nie eine feste
  Reihenfolge einführen.
- Neue Fragen/Aufgaben-Vorlagen gehören in die jeweilige `buildXxxPool`/
  `buildXxxTask`-Funktion in der zugehörigen `game-*.js`, nicht als
  hartcodierte Einzelfragen - der Pool soll erweiterbar bleiben.
