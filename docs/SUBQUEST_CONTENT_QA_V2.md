# Sub Quest Content QA V2

## Summary

- Vocab checked: 26
- Questions checked: 260 (26 × 10)
- Speaking questions: 26
- Passed: 26 / 26 Sub Quests (automated audit: 0 failures; manual per-word review below)
- Fixed: all 26 Sub Quests were rebuilt from scratch as hand-authored content in
  `src/lib/subQuestData/` (cafe/reise/schule/freunde). The generic template generation in
  `quizBuilder.ts` (particle detection, predicate pools, reinforced-sentence fallbacks,
  kana-recognition Q10, related-pool distractors) was removed entirely. Q10 is now a
  Speaking Challenge for every word.
- Remaining issues: none blocking. One accepted design note:
  1. Kanji↔kana speech matching relies on `acceptedTranscripts` containing both spellings
     (by design, per brief); regional recognition engines that return unusual mixed
     spellings (e.g. 御免なさい-style variants) would need more entries later.

## Data structure

Each word is defined in its category file as 9 explicit question specs + 1 speaking spec,
assembled by `defineSubQuest()` (`src/lib/subQuestData/shared.ts`), which only adds ids /
categoryId / vocabId — every prompt, choice, answer, clue and feedback sentence is written
per word. `buildPracticeQuestions(vocabId)` keeps its public interface and now just returns
a defensive copy of the curated data. Client-side choice shuffling in the practice page is
unchanged (speaking questions have no choices and pass through).

Question frame (varied per word where noted): Q1 JP word → DE meaning · Q2 DE → JP word ·
Q3 particle-choice with German clue in the prompt body · Q4 fill-blank with German clue ·
Q5 JP sentence → DE meaning · Q6 DE sentence → natural JP sentence · Q7 mistake contrast ·
Q8 related-word combo sentence · Q9 longer 4-choice Mini Challenge · Q10 Speaking.
All fill-blank/particle prompts are two-line: `„German clue“\n…____…` (rendered via the
existing `whitespace-pre-line`), so exactly one choice matches the German meaning.

## Per Vocab Review

### coffee
Target level: A0–A1
Learning goals: コーヒー=Kaffee · を+ください (bestellen) · を+飲みます (beschreiben) · Bestellung vs. Beschreibung · と-Aufzählung
Questions:
1. コーヒー → Kaffee (meaning)
2. Kaffee → コーヒー (word)
3. „Einen Kaffee bitte.“ コーヒー____ください。→ を
4. „Ich trinke Kaffee.“ コーヒーを____。→ 飲みます
5. コーヒーとパンをください。→ Kaffee und Brot bitte.
6. Ich trinke Kaffee. → コーヒーを飲みます。
7. Bestellung (ください) vs. Beschreibung (飲みます) → コーヒーをください。
8. コーヒーを飲みます。パンを食べます。→ Ich trinke Kaffee und esse Brot.
9. Mini: Kaffee und Wasser bitte. → コーヒーと水をください。
Speaking: コーヒーをください。 / コーヒーをください。 / koohii o kudasai / Einen Kaffee bitte. (accepted: コーヒーをください, こーひーをください)
Issues: None
Rating: Ready

### water
Target level: A0–A1
Learning goals: 水=Wasser · を · ください vs. 飲みます (die im Brief genannte Ambiguität, gelöst durch Clue im Prompt) · と-Aufzählung · ますか-Frage
Questions:
1. 水 → Wasser
2. Wasser → 水
3. „Ich trinke Wasser.“ 水____飲みます。→ を
4. „Wasser bitte.“ 水を____。→ ください
5. 水を飲みます。→ Ich trinke Wasser.
6. Wasser bitte. → 水をください。
7. Bestellung, keine Beschreibung → 水をください。 (Distraktoren 飲みます/食べます/です)
8. Wasser und Brot bitte. → 水とパンをください。
9. Mini: Trinkst du Wasser? → 水を飲みますか。
Speaking: 水をください。 / みずをください。 / mizu o kudasai / Wasser bitte. (accepted: 水をください, みずをください)
Issues: None
Rating: Ready

### bread
Target level: A0–A1
Learning goals: パン=Brot · を · ください vs. 食べます · 食べます vs. 飲みます · Zwei-Satz-Lesen
Questions:
1. パン → Brot
2. Brot → パン
3. „Ich esse Brot.“ パン____食べます。→ を
4. „Brot bitte.“ パンを____。→ ください
5. パンを食べます。→ Ich esse Brot.
6. Brot bitte. → パンをください。
7. Essen, nicht trinken → パンを食べます。
8. Brot und Wasser bitte. → パンと水をください。
9. Mini: パンを食べます。水を飲みます。→ Ich esse Brot und trinke Wasser.
Speaking: パンをください。 / パンをください。 / pan o kudasai / Brot bitte. (accepted: パンをください, ぱんをください)
Issues: None
Rating: Ready

### drink
Target level: A0–A1
Learning goals: 飲む=trinken · [Getränk]を飲みます · 飲みます vs. ください/食べます · ますか-Frage · Zwei-Satz-Lesen
Questions:
1. 飲む → trinken
2. trinken → 飲む
3. „Ich trinke Kaffee.“ コーヒー____飲みます。→ を
4. „Ich trinke Wasser.“ 水を____。→ 飲みます
5. コーヒーを飲みます。→ Ich trinke Kaffee.
6. Ich trinke Wasser. → 水を飲みます。
7. Beschreibung, keine Bestellung → コーヒーを飲みます。
8. Trinkst du Kaffee? → コーヒーを飲みますか。
9. Mini: パンを食べます。コーヒーを飲みます。→ Ich esse Brot und trinke Kaffee.
Speaking: 水を飲みます。 / みずをのみます。 / mizu o nomimasu / Ich trinke Wasser. (accepted: 水を飲みます, みずをのみます)
Issues: None
Rating: Ready

### eat
Target level: A0–A1
Learning goals: 食べる=essen · [Essen]を食べます · 食べます vs. 飲みます · Partikelfehler を/で/に · ますか-Frage
Questions:
1. 食べる → essen
2. essen → 食べる
3. „Ich esse Brot.“ パン____食べます。→ を
4. „Ich esse Brot.“ パンを____。→ 食べます
5. パンを食べます。→ Ich esse Brot.
6. Isst du Brot? → パンを食べますか。
7. Essen, nicht trinken (+ Partikelfehler で/に) → パンを食べます。
8. パンを食べます。コーヒーを飲みます。→ Ich esse Brot und trinke Kaffee.
9. Mini: Ich esse Brot. Ich trinke Wasser. → パンを食べます。水を飲みます。
Speaking: パンを食べます。 / パンをたべます。 / pan o tabemasu / Ich esse Brot. (accepted: パンを食べます, ぱんをたべます)
Issues: None
Rating: Ready

### station
Target level: A0–A1
Learning goals: 駅=Bahnhof · 〜はどこですか · 〜に行きます · に vs. で/を · すみません-Höflichkeit · 電車で+駅に-Kombination
Questions:
1. 駅 → Bahnhof
2. Bahnhof → 駅
3. „Wo ist der Bahnhof?“ 駅____どこですか。→ は
4. „Ich gehe zum Bahnhof.“ 駅に____。→ 行きます
5. 駅は近いです。→ Der Bahnhof ist nah.
6. Wo ist der Bahnhof? → 駅はどこですか。
7. Ziel mit に → 駅に行きます。 (Distraktoren で/を/は)
8. Ich fahre mit dem Zug zum Bahnhof. → 電車で駅に行きます。
9. Mini: Entschuldigung, wo ist der Bahnhof? → すみません、駅はどこですか。
Speaking: すみません、駅はどこですか。 / すみません、えきはどこですか。 / sumimasen, eki wa doko desu ka / Entschuldigung, wo ist der Bahnhof? (accepted: すみません駅はどこですか, すみませんえきはどこですか)
Issues: None
Rating: Ready

### hotel
Target level: A0–A1
Learning goals: ホテル=Hotel · 〜に行きます · 遠い/近い · 〜はどこですか · 電車で-Kombination
Questions:
1. ホテル → Hotel
2. Hotel → ホテル
3. „Ich gehe zum Hotel.“ ホテル____行きます。→ に
4. „Das Hotel ist weit entfernt.“ ホテルは____です。→ 遠い
5. ホテルはどこですか。→ Wo ist das Hotel?
6. Das Hotel ist nah. → ホテルは近いです。
7. Ziel mit に → ホテルに行きます。
8. Ich fahre mit dem Zug zum Hotel. → 電車でホテルに行きます。
9. Mini: Entschuldigung, wo ist das Hotel? → すみません、ホテルはどこですか。
Speaking: ホテルに行きます。 / ホテルにいきます。 / hoteru ni ikimasu / Ich gehe zum Hotel. (accepted: ホテルに行きます, ほてるにいきます)
Issues: None
Rating: Ready

### train
Target level: A0–A1
Learning goals: 電車=Zug · Verkehrsmittel mit で (Kernlektion) · で vs. に · 電車で〜に行きます
Questions:
1. 電車 → Zug
2. Zug → 電車
3. „Ich fahre mit dem Zug.“ 電車____行きます。→ で
4. „…mit dem Zug zum Bahnhof.“ 電車で駅に____。→ 行きます
5. 電車で行きます。→ Ich fahre mit dem Zug.
6. Ich fahre mit dem Zug zum Hotel. → 電車でホテルに行きます。
7. Verkehrsmittel mit で → 電車で行きます。 (Distraktor 電車に行きます = anderes Ziel!)
8. 電車で駅に行きます。→ Ich fahre mit dem Zug zum Bahnhof.
9. Mini: Entschuldigung, wo ist der Zug? → すみません、電車はどこですか。
Speaking: 電車で行きます。 / でんしゃでいきます。 / densha de ikimasu / Ich fahre mit dem Zug. (accepted: 電車で行きます, でんしゃでいきます)
Issues: None
Rating: Ready

### toilet
Target level: A0–A1
Learning goals: トイレ=Toilette · 〜はどこですか · 右/左-Antworten · すみません-Höflichkeit
Questions:
1. トイレ → Toilette
2. Toilette → トイレ
3. „Wo ist die Toilette?“ トイレ____どこですか。→ は
4. „Die Toilette ist links.“ トイレは____です。→ 左
5. トイレは右です。→ Die Toilette ist rechts.
6. Wo ist die Toilette? → トイレはどこですか。
7. Ziel mit に → トイレに行きます。
8. トイレは近いです。→ Die Toilette ist nah.
9. Mini: Entschuldigung, wo ist die Toilette? → すみません、トイレはどこですか。
Speaking: すみません、トイレはどこですか。 / すみません、トイレはどこですか。 / sumimasen, toire wa doko desu ka / Entschuldigung, wo ist die Toilette? (accepted: すみませんトイレはどこですか, すみませんといれはどこですか)
Issues: None
Rating: Ready

### go
Target level: A0–A1
Learning goals: 行く=gehen · Ziel mit に · で(womit)+に(wohin) · ますか-Frage
Questions:
1. 行く → gehen
2. gehen → 行く
3. „Ich gehe zum Bahnhof.“ 駅____行きます。→ に
4. „Ich gehe zum Hotel.“ ホテルに____。→ 行きます
5. 駅に行きます。→ Ich gehe zum Bahnhof.
6. Ich gehe zum Hotel. → ホテルに行きます。
7. で+に-Kombination → 電車で駅に行きます。
8. トイレに行きます。→ Ich gehe zur Toilette.
9. Mini: Gehst du zum Bahnhof? → 駅に行きますか。
Speaking: ホテルに行きます。 / ホテルにいきます。 / hoteru ni ikimasu / Ich gehe zum Hotel. (accepted: ホテルに行きます, ほてるにいきます)
Issues: None
Rating: Ready

### where
Target level: A0–A1
Learning goals: どこ=wo · [Ort]はどこですか · Frage braucht か · すみません-Kombination
Questions:
1. どこ → wo
2. wo → どこ
3. „Wo ist der Bahnhof?“ 駅____どこですか。→ は
4. „Wo ist das Hotel?“ ホテルは____ですか。→ どこ
5. トイレはどこですか。→ Wo ist die Toilette?
6. Wo ist der Bahnhof? → 駅はどこですか。
7. Frage braucht か → ホテルはどこですか。 (Distraktor ohne か)
8. Entschuldigung, wo ist der Bahnhof? → すみません、駅はどこですか。
9. Mini: Entschuldigung, wo ist die Toilette? → すみません、トイレはどこですか。
Speaking: 駅はどこですか。 / えきはどこですか。 / eki wa doko desu ka / Wo ist der Bahnhof? (accepted: 駅はどこですか, えきはどこですか)
Issues: None
Rating: Ready

### excuseMe
Target level: A0–A1
Learning goals: すみません=Entschuldigung · Türöffner vor Fragen · Entschuldigungs-Situation · auch beim Bestellen
Questions:
1. すみません → Entschuldigung (Distraktoren: Danke/Guten Tag/Auf Wiedersehen)
2. Entschuldigung → すみません (Distraktoren: ありがとう/こんにちは/さようなら)
3. „Entschuldigung, wo ist der Bahnhof?“ すみません、駅____どこですか。→ は
4. „Entschuldigung, wo ist die Toilette?“ ____、トイレはどこですか。→ すみません
5. すみません、駅はどこですか。→ Entschuldigung, wo ist der Bahnhof?
6. Entschuldigung, wo ist die Toilette? → すみません、トイレはどこですか。
7. Situation (jemandem auf den Fuß getreten) → すみません。
8. Entschuldigung, wo ist das Hotel? → すみません、ホテルはどこですか。
9. Mini: すみません、水をください。→ Entschuldigung, Wasser bitte. (すみません auch beim Bestellen)
Speaking: すみません、駅はどこですか。 / すみません、えきはどこですか。 / sumimasen, eki wa doko desu ka / Entschuldigung, wo ist der Bahnhof? (accepted: すみません駅はどこですか, すみませんえきはどこですか)
Issues: None
Rating: Ready

### right
Target level: A0–A1
Learning goals: 右=rechts · [Ort]は右です · rechts vs. links · Aussage vs. Frage (です/ですか)
Questions:
1. 右 → rechts
2. rechts → 右
3. „Der Bahnhof ist rechts.“ 駅____右です。→ は
4. „Die Toilette ist rechts.“ トイレは____です。→ 右
5. 駅は右です。→ Der Bahnhof ist rechts.
6. Das Hotel ist rechts. → ホテルは右です。
7. Rechts, nicht links; Antwort, keine Frage → 右です。
8. Entschuldigung, ist der Bahnhof rechts? → すみません、駅は右ですか。
9. Mini: トイレは右です。駅は左です。→ Die Toilette ist rechts. Der Bahnhof ist links.
Speaking: 駅は右です。 / えきはみぎです。 / eki wa migi desu / Der Bahnhof ist rechts. (accepted: 駅は右です, えきはみぎです)
Issues: None
Rating: Ready

### left
Target level: A0–A1
Learning goals: 左=links · [Ort]は左です · links vs. rechts · ですか-Frage
Questions:
1. 左 → links
2. links → 左
3. „Die Toilette ist links.“ トイレ____左です。→ は
4. „Der Bahnhof ist links.“ 駅は____です。→ 左
5. ホテルは左です。→ Das Hotel ist links.
6. Der Bahnhof ist links. → 駅は左です。
7. Links, nicht rechts; Antwort, keine Frage → 左です。
8. Entschuldigung, ist die Toilette links? → すみません、トイレは左ですか。
9. Mini: 駅は左です。ホテルは右です。→ Der Bahnhof ist links. Das Hotel ist rechts.
Speaking: 駅は左です。 / えきはひだりです。 / eki wa hidari desu / Der Bahnhof ist links. (accepted: 駅は左です, えきはひだりです)
Issues: None
Rating: Ready

### near
Target level: A0–A1
Learning goals: 近い=nah · [Ort]は近いです · nah vs. weit · ですか-Frage
Questions:
1. 近い → nah
2. nah → 近い
3. „Der Bahnhof ist nah.“ 駅____近いです。→ は (が bewusst nicht angeboten — wäre ebenfalls korrekt)
4. „Das Hotel ist nah.“ ホテルは____です。→ 近い
5. 駅は近いです。→ Der Bahnhof ist nah.
6. Die Toilette ist nah. → トイレは近いです。
7. Nah, nicht weit; Aussage, keine Frage → 駅は近いです。
8. Ist das Hotel nah? → ホテルは近いですか。
9. Mini: ホテルは近いです。駅は遠いです。→ Das Hotel ist nah. Der Bahnhof ist weit entfernt.
Speaking: 駅は近いです。 / えきはちかいです。 / eki wa chikai desu / Der Bahnhof ist nah. (accepted: 駅は近いです, えきはちかいです)
Issues: None
Rating: Ready

### far
Target level: A0–A1
Learning goals: 遠い=weit entfernt · [Ort]は遠いです · weit vs. nah · praktische Folge (電車で行きます)
Questions:
1. 遠い → weit entfernt
2. weit entfernt → 遠い
3. „Das Hotel ist weit entfernt.“ ホテル____遠いです。→ は
4. „Der Bahnhof ist weit entfernt.“ 駅は____です。→ 遠い
5. ホテルは遠いです。→ Das Hotel ist weit entfernt.
6. Der Bahnhof ist weit entfernt. → 駅は遠いです。
7. Weit entfernt, nicht nah → トイレは遠いです。
8. Ist der Bahnhof weit entfernt? → 駅は遠いですか。
9. Mini: ホテルは遠いです。電車で行きます。→ Das Hotel ist weit entfernt. Ich fahre mit dem Zug.
Speaking: ホテルは遠いです。 / ホテルはとおいです。 / hoteru wa tooi desu / Das Hotel ist weit entfernt. (accepted: ホテルは遠いです, ほてるはとおいです)
Issues: None
Rating: Ready

### school
Target level: A0–A1
Learning goals: 学校=Schule · 学校に行きます · Ort der Handlung mit で (学校で) · 今日-Kombination · 電車で-Kombination
Questions:
1. 学校 → Schule
2. Schule → 学校
3. „Ich gehe zur Schule.“ 学校____行きます。→ に
4. „Heute gehe ich zur Schule.“ 今日、学校に____。→ 行きます
5. 学校は近いです。→ Die Schule ist nah.
6. Ich gehe zur Schule. → 学校に行きます。
7. Ort der Handlung mit で → 学校で日本語を勉強します。
8. 今日、学校に行きます。→ Heute gehe ich zur Schule.
9. Mini: Ich fahre mit dem Zug zur Schule. → 電車で学校に行きます。
Speaking: 学校に行きます。 / がっこうにいきます。 / gakkou ni ikimasu / Ich gehe zur Schule. (accepted: 学校に行きます, がっこうにいきます)
Issues: None
Rating: Ready

### teacher
Target level: A0–A1
Learning goals: 先生=Lehrer/Lehrerin · mit jemandem = と · 先生はどこですか · 今日-Kombination · höfliche Frage mit すみません
Questions:
1. 先生 → Lehrer/Lehrerin
2. Lehrer/Lehrerin → 先生
3. „Ich lerne mit dem Lehrer Japanisch.“ 先生____日本語を勉強します。→ と
4. „Wo ist der Lehrer?“ 先生は____ですか。→ どこ
5. 先生と勉強します。→ Ich lerne mit dem Lehrer.
6. Ich gehe mit dem Lehrer zur Schule. → 先生と学校に行きます。
7. mit = と (Distraktor 先生は… = „Der Lehrer lernt“) → 先生と日本語を勉強します。
8. 今日、先生と勉強します。→ Heute lerne ich mit dem Lehrer.
9. Mini: Entschuldigung, wo ist der Lehrer? → すみません、先生はどこですか。
Speaking: 先生と日本語を勉強します。 / せんせいとにほんごをべんきょうします。 / sensei to nihongo o benkyou shimasu / Ich lerne mit dem Lehrer Japanisch. (accepted: 先生と日本語を勉強します, せんせいとにほんごをべんきょうします)
Issues: None
Rating: Ready

### japaneseLanguage
Target level: A0–A1
Learning goals: 日本語=Japanisch · 日本語を勉強します · を als Objektpartikel · 学校で/先生と-Kombinationen · 今日-Zeitangabe
Questions:
1. 日本語 → Japanisch
2. Japanisch → 日本語
3. „Ich lerne Japanisch.“ 日本語____勉強します。→ を
4. „Heute lerne ich Japanisch.“ 今日、____を勉強します。→ 日本語
5. 日本語を勉強します。→ Ich lerne Japanisch.
6. Heute lerne ich Japanisch. → 今日、日本語を勉強します。
7. Objekt mit を → 日本語を勉強します。
8. 学校で日本語を勉強します。→ Ich lerne in der Schule Japanisch.
9. Mini: Ich lerne mit dem Lehrer Japanisch. → 先生と日本語を勉強します。
Speaking: 日本語を勉強します。 / にほんごをべんきょうします。 / nihongo o benkyou shimasu / Ich lerne Japanisch. (accepted: 日本語を勉強します, にほんごをべんきょうします)
Issues: None
Rating: Ready

### study
Target level: A0–A1
Learning goals: 勉強する=lernen · [Fach]を勉強します · Ort mit で · 今日-Zeitangabe · langer Satz 今日、学校で日本語を…
Questions:
1. 勉強する → lernen
2. lernen → 勉強する
3. „Ich lerne Japanisch.“ 日本語____勉強します。→ を
4. „Heute lerne ich Japanisch.“ 今日、日本語を____。→ 勉強します
5. 学校で勉強します。→ Ich lerne in der Schule.
6. Ich lerne Japanisch. → 日本語を勉強します。
7. Ort der Handlung mit で → 学校で勉強します。
8. 今日、日本語を勉強します。→ Heute lerne ich Japanisch.
9. Mini: Heute lerne ich in der Schule Japanisch. → 今日、学校で日本語を勉強します。
Speaking: 今日、日本語を勉強します。 / きょう、にほんごをべんきょうします。 / kyou, nihongo o benkyou shimasu / Heute lerne ich Japanisch. (accepted: 今日日本語を勉強します, きょうにほんごをべんきょうします)
Issues: None
Rating: Ready

### today
Target level: A0–A1
Learning goals: 今日=heute · 今日、〜 am Satzanfang · heute vs. morgen (deutsche Distraktoren) · Kombination mit Schule/Lehrer/Japanisch
Questions:
1. 今日 → heute (Distraktor: morgen)
2. heute → 今日
3. „Heute gehe ich zur Schule.“ 今日、学校____行きます。→ に
4. „Heute lerne ich Japanisch.“ ____、日本語を勉強します。→ 今日
5. 今日、学校に行きます。→ Heute gehe ich zur Schule. (Distraktor: Morgen …)
6. Heute lerne ich Japanisch. → 今日、日本語を勉強します。
7. Ziel mit に → 今日、学校に行きます。
8. 今日、先生と勉強します。→ Heute lerne ich mit dem Lehrer.
9. Mini: 今日、学校で日本語を勉強します。→ Heute lerne ich in der Schule Japanisch.
Speaking: 今日、日本語を勉強します。 / きょう、にほんごをべんきょうします。 / kyou, nihongo o benkyou shimasu / Heute lerne ich Japanisch. (accepted: 今日日本語を勉強します, きょうにほんごをべんきょうします)
Issues: None
Rating: Ready

### friend
Target level: A0–A1
Learning goals: 友だち=Freund/Freundin · Person mit に (会います) · と (話します) · が好きです · 明日-Kombination
Questions:
1. 友だち → Freund/Freundin
2. Freund/Freundin → 友だち
3. „Ich treffe einen Freund.“ 友だち____会います。→ に (と bewusst nicht angeboten — wäre ebenfalls korrekt)
4. „Ich spreche mit einem Freund.“ 友だちと____。→ 話します
5. 友だちに会います。→ Ich treffe einen Freund.
6. Ich mag meine Freunde. → 友だちが好きです。
7. Person mit に → 友だちに会います。 (Distraktoren を/で/は)
8. Morgen treffe ich einen Freund. → 明日、友だちに会います。
9. Mini: 明日、友だちと日本語を話します。→ Morgen spreche ich mit einem Freund Japanisch.
Speaking: 友だちに会います。 / ともだちにあいます。 / tomodachi ni aimasu / Ich treffe einen Freund. (accepted: 友だちに会います, 友達に会います, ともだちにあいます — inkl. 友達-Schreibweise der Erkennung)
Issues: None
Rating: Ready

### meet
Target level: A0–A1
Learning goals: 会う=treffen · [Person]に会います · 会います vs. 話します · 明日/今日-Kontrast · 駅で-Ortsangabe
Questions:
1. 会う → treffen
2. treffen → 会う
3. „Morgen treffe ich einen Freund.“ 明日、友だち____会います。→ に
4. „Ich treffe einen Freund.“ 友だちに____。→ 会います
5. 明日、友だちに会います。→ Morgen treffe ich einen Freund.
6. Heute treffe ich einen Freund. → 今日、友だちに会います。
7. Treffen, nicht sprechen → 友だちに会います。 (Distraktor 友だちに行きます = typischer Fehler)
8. Ich treffe den Lehrer. → 先生に会います。
9. Mini: 明日、駅で友だちに会います。→ Morgen treffe ich am Bahnhof einen Freund.
Speaking: 明日、友だちに会います。 / あした、ともだちにあいます。 / ashita, tomodachi ni aimasu / Morgen treffe ich einen Freund. (accepted: 明日友だちに会います, 明日友達に会います, あしたともだちにあいます)
Issues: None
Rating: Ready

### talk
Target level: A0–A1
Learning goals: 話す=sprechen · [Person]と話します · 日本語を話します · と vs. を · 学校で-Ortsangabe
Questions:
1. 話す → sprechen
2. sprechen → 話す
3. „Ich spreche mit einem Freund.“ 友だち____話します。→ と
4. „Ich spreche Japanisch.“ 日本語を____。→ 話します
5. 友だちと話します。→ Ich spreche mit einem Freund.
6. Ich spreche mit dem Lehrer. → 先生と話します。
7. Mit jemandem sprechen = と → 友だちと話します。 (Distraktor 友だちが話します = „Der Freund spricht“)
8. Morgen spreche ich mit einem Freund. → 明日、友だちと話します。
9. Mini: 学校で友だちと話します。→ Ich spreche in der Schule mit einem Freund.
Speaking: 友だちと話します。 / ともだちとはなします。 / tomodachi to hanashimasu / Ich spreche mit einem Freund. (accepted: 友だちと話します, 友達と話します, ともだちとはなします)
Issues: None
Rating: Ready

### tomorrow
Target level: A0–A1
Learning goals: 明日=morgen · 明日、〜 am Satzanfang · morgen vs. heute · Kombination mit 会う/話す/学校
Questions:
1. 明日 → morgen (Distraktor: heute)
2. morgen → 明日 (Distraktor: 今日)
3. „Morgen treffe ich einen Freund.“ 明日、友だち____会います。→ に
4. „Morgen treffe ich einen Freund.“ ____、友だちに会います。→ 明日
5. 明日、友だちに会います。→ Morgen treffe ich einen Freund.
6. Morgen gehe ich zur Schule. → 明日、学校に行きます。
7. Morgen, nicht heute → 明日、日本語を勉強します。
8. 明日、友だちと話します。→ Morgen spreche ich mit einem Freund.
9. Mini: Morgen treffe ich am Bahnhof einen Freund. → 明日、駅で友だちに会います。
Speaking: 明日、友だちに会います。 / あした、ともだちにあいます。 / ashita, tomodachi ni aimasu / Morgen treffe ich einen Freund. (accepted: 明日友だちに会います, 明日友達に会います, あしたともだちにあいます)
Issues: None
Rating: Ready

### like
Target level: A0–A1
Learning goals: 好き=mögen · 〜が好きです mit が (Kernlektion, nicht を) · Anwendung auf 友だち/コーヒー/パン/日本語
Questions:
1. 好き → mögen / gern haben
2. mögen / gern haben → 好き
3. „Ich mag Japanisch.“ 日本語____好きです。→ が
4. „Ich mag meine Freunde.“ 友だちが____です。→ 好き
5. 友だちが好きです。→ Ich mag meine Freunde.
6. Ich mag Kaffee. → コーヒーが好きです。 (Distraktor コーヒーを好きです = häufigster Fehler)
7. 好き braucht が, nicht を → 日本語が好きです。
8. パンが好きです。→ Ich mag Brot.
9. Mini: 日本語が好きです。今日、日本語を勉強します。→ Ich mag Japanisch. Heute lerne ich Japanisch.
Speaking: 日本語が好きです。 / にほんごがすきです。 / nihongo ga suki desu / Ich mag Japanisch. (accepted: 日本語が好きです, にほんごがすきです)
Issues: None
Rating: Ready

## Speaking QA

| Case | Result |
|---|---|
| Supported browser | Sprechen → „Ich höre zu...“ → Ergebnis. Erfolg: Correct-Sound, „Gut gesprochen!“, erkannter Text angezeigt, Weiter → Result. Verified in browser (water/station/coffee/teacher/like, incl. transcript with 、/。 punctuation normalized away). |
| Unsupported browser | Simulated (both constructors removed): „Spracherkennung wird in diesem Browser nicht unterstützt.“ + Überspringen shown, kein Sprechen-Button, no crash (excuseMe run). |
| Permission denied | `not-allowed`/`service-not-allowed` → „Der Mikrofon-Zugriff ist blockiert. Du kannst die Übung überspringen.“ — no failed-attempt increment, no incorrect sound (code path in `speechRecognition.ts` + practice page). |
| No speech | `no-speech`/silent end → „Ich habe nichts gehört. Versuch es noch einmal.“ — no attempt increment. |
| Retry | Wrong utterance → Incorrect-Sound, „Noch nicht ganz. Versuch es noch einmal.“ + „Noch einmal sprechen“. Verified (station: 駅はどこですか rejected, retry with すみません、駅はどこですか。 succeeded). After 3 failed pronunciation attempts the retry button is replaced by an emphasized skip hint; skip stays available — never auto-failed. |
| Skip | Always available (except after success); aborts nothing destructive; unmount aborts an in-flight session. |
| 9-question scoring | Skip → Result „9 / 9 richtig“ (all correct) / „8 / 9 richtig“ (one wrong) + Badge „Sprechen übersprungen“. Verified in browser. |
| 10-question scoring | Speaking attempted & correct → „10 / 10 richtig“. Verified in browser. |

Matching: engine transcripts (maxAlternatives=3, all alternatives checked) are normalized
(NFKC → lowercase → whitespace/punctuation stripped → katakana→hiragana) and compared for
full-string equality against the normalized `acceptedTranscripts`. No partial/substring
matching — saying only „水“ is rejected (covered by an automated test in the audit script).

## Regression QA

| Area | Result |
|---|---|
| Access control | Uncollected card (friend removed from `nvq_collected_cards`) → „Diese Karte wurde noch nicht gesammelt.“ block view. Verified. |
| Shuffling | Client-side per-mount choice shuffle unchanged; observed authored order ≠ rendered order across runs. Speaking question (0 choices) passes through safely. |
| Sounds | Answer sounds unchanged (playCorrect/playIncorrectSound on choice). Speaking success/fail reuses the same sounds. |
| Result | Result sound uses effectiveTotal: 9/9 skip → Perfect, 8/9 → Normal, 0 → Failed. Badges show `richtig`-count, question count, and „Sprechen übersprungen“ when skipped. |
| knownWords | 10/10 (speaking ok) and 9/9 (skip) both add the word. Verified (water, station, coffee, excuseMe, teacher, like). |
| weakWords | Any wrong Q1–Q9 answer adds the word (8/9 skip case verified: water → weak). Skipping alone never marks weak. |
| Review | /review shows weak word under „Üben“ and known words under „Schon sicher“. Verified. |
| Hydration | No console errors/warnings, no server errors across all runs (curated data is static; shuffle stays in useEffect). |
| Lesson (Main Quest) | Untouched `questData.ts`; `buildLessonQuestions` retained; /lesson?category=cafe renders and plays normally. |
| Vocabulary | Untouched; 25+ „Aussprache hören“ speaker buttons present and page renders. |

## Build / Lint

- `npm run build`: success (Next.js 16.2.10, TypeScript pass, 0 errors)
- `npm run lint`: success (0 errors, 0 warnings)
- Automated audit (all 26 words / 260 questions): `OK: no failures found.`
