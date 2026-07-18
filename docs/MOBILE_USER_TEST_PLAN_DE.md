# Nutzertest-Plan (Smartphone) – Area 1

Testplan für einen moderierten Smartphone-Test der kostenlosen Area 1 „Erste Schritte in
Japan". Sprache des Tests: Deutsch. Dieses Dokument ist für die Testleitung, nicht für die
Testpersonen.

## Ziel

Herausfinden, ob eine deutschsprachige Person (Japanisch A0–A2) die App **ohne Erklärung**
auf dem eigenen Smartphone verstehen, bedienen und als angenehm empfinden kann – und ob
sie am nächsten Tag zurückkehren würde.

Wir testen **nicht**, ob die Person Japanisch „richtig" kann. Wir beobachten Verhalten,
Zögern, Verwirrung und Emotion.

## Zielgruppe

- Deutsche Muttersprache.
- Japanisch-Niveau A0 bis A2 (Anfänger bis leicht fortgeschritten).
- Nutzt das **eigene** Smartphone im Hochformat.
- Bekommt vorab nur den Link – keine Einführung, keine Tipps.
- Idealerweise Mischung: mit und ohne Erfahrung mit Lern-Apps (z. B. Duolingo).

## Stichprobe & Ablauf

- **Erste Welle: 5–8 Personen.** (Genug, um die größten Probleme zu finden, ohne zu viel
  Aufwand vor der ersten Überarbeitung.)
- **Dauer pro Person: 15–25 Minuten.**
- Wenn möglich **zwei Sitzungen**:
  - **Sitzung 1:** Erstnutzung (heute).
  - **Sitzung 2:** Rückkehr nach mindestens 24 Stunden (kann remote/asynchron sein).

## Wichtige Moderationsregeln

- **Niemals Antworten verraten** – weder im Japanisch-Quiz noch bei der Bedienung.
- **Nicht helfen, solange die Person nicht ausdrücklich aufgibt.** Zögern ist Information.
- Keine Suggestivfragen („War das nicht einfach?"). Stattdessen offen: „Was denkst du
  gerade?", „Was würdest du jetzt tun?".
- Die Testperson bitten, **laut zu denken** (Think-Aloud).
- Bei Blockade > ~60 Sekunden: notieren, dann neutral fragen „Was erwartest du hier?".
  Erst danach minimal weiterhelfen und das als „brauchte Hilfe" markieren.

## Vorbereitung durch die Testleitung

- Link bereithalten (Vercel-URL aus `MOBILE_BETA_RELEASE_CHECKLIST.md`).
- Gerät der Testperson: Betriebssystem, Browser, Bildschirmgröße notieren.
- Für Sitzung 1 sicherstellen, dass die App-Daten frisch sind (die App speichert lokal;
  ggf. Person auf „Onboarding erscheint" hinweisen – falls schon Daten da sind, im Browser
  die Website-Daten löschen lassen, **ohne** zu erklären, was danach kommt).
- Mikrofon: Der Test enthält eine Sprechübung. Der Browser wird nach Mikrofon-Erlaubnis
  fragen. Die Person entscheidet selbst – **nicht** dazu drängen.

## Aufgaben (der Testperson vorlesen oder zeigen)

Die Aufgaben bewusst knapp halten. Kein „So geht das".

1. **Link öffnen.**
2. **Das Setup am Anfang abschließen** – ohne dass ich dir erkläre, was die Fragen sollen.
3. **Die erste Etappe starten.**
4. **Café abschließen.**
5. **Zur Karte zurückkehren.**
6. **Finde heraus, was du als Nächstes machen kannst, und starte es** (nur beginnen,
   nicht unbedingt abschließen).
7. **Eine Wortkarte suchen** (z. B. ein Wort, das du gerade gelernt hast).
8. **Bei einer Wortkarte „Locker" und „Höflich" vergleichen.**
9. **Eine Wortkarte üben.**
10. **Die App schließen.**
11. **(Später, Sitzung 2) Die App erneut öffnen und weitermachen, wo du warst.**

## Beobachtungsbogen (pro Aufgabe ausfüllen)

Für jede Aufgabe notieren:

- **Erfolg:** allein / mit Hilfe / nicht geschafft.
- **Zeit / Zögern:** Wo hat die Person angehalten oder gesucht?
- **Fehltaps:** Wurde etwas Falsches getippt? Was?
- **Zurück-Verhalten:** Wie ist die Person „zurück" gegangen (Button, Browser-Zurück)?
- **Übersprungener Text:** Welche Texte wurden sichtbar **nicht** gelesen?
- **Spontane Aussagen:** Wörtliche Zitate (positiv wie negativ).
- **Freude/Spaß:** Gab es ein Lächeln, „cool", ein Aha?
- **Frust:** Seufzen, „hä?", mehrfaches Tippen, Scrollen-Suchen.
- **Nächster Schritt klar?** Wusste die Person nach jedem Abschnitt, was als Nächstes zu
  tun ist?

## Gezielt beobachten (unsere offenen Fragen)

Diese Punkte kommen aus dem UX-Audit. Bitte besonders darauf achten – aber **nicht**
danach fragen, sondern nur beobachten:

- **Startseite (Karte):** Scrollt die Person automatisch zur richtigen Stelle, oder sucht
  sie „Wo fange ich an"? Wie lange bis zum ersten „Starten"-Tap?
- **Nach dem Beantworten einer Frage:** Sieht die Person sofort „Richtig!/Leider falsch"
  und den „Weiter"-Knopf, oder muss sie scrollen/suchen? (Wir haben hier etwas geändert –
  bitte genau hinschauen.)
- **Falsche Antwort:** Wirkt die Person entmutigt/„beschuldigt", oder gelassen?
- **Sprechübung (Speaking):** Was passiert bei der Mikrofon-Frage? Nutzt die Person
  „Sprechen" oder „Überspringen"? Wirkt sie unsicher?
- **Wortkarten-Suche:** Findet die Person das Suchfeld? Tippt sie Deutsch, Romaji, Kana
  oder Kanji?
- **Locker/Höflich:** Versteht die Person den Unterschied aus dem Vergleich – oder wirkt
  es verwirrend?
- **Zweite Sitzung:** Weiß die Person beim erneuten Öffnen sofort, wo sie weitermachen
  soll?

## Kurzes Abschlussgespräch (nach den Aufgaben, offen)

Nicht wertend, nicht suggestiv:

- „Was war das hier für eine App, in deinen Worten?"
- „An welcher Stelle warst du unsicher, was zu tun ist?"
- „Welche Texte hast du übersprungen – und warum?"
- „Hattest du das Gefühl, wirklich etwas gelernt zu haben?"
- „Würdest du die App morgen noch einmal öffnen? Warum (nicht)?"
- „Wirkte die App eher verspielt, kindlich oder professionell?"
- „Was war für dich am nützlichsten?"
- „Was hat dich am meisten gestört?"

## Danach

- Beobachtungsbögen und Zitate sammeln.
- Zusätzlich (oder stattdessen, bei asynchronem Test) das Formular
  `MOBILE_USER_FEEDBACK_FORM_DE.md` ausfüllen lassen.
- Auswertung nach `MOBILE_BETA_RELEASE_CHECKLIST.md` → „Post-Test Analysis".
