/**
 * German → English dictionary for all learning-DATA explanation strings (quest and
 * sub-quest questions, word meanings, tips, examples, Zukan/dex texts, culture
 * notes, category + world metadata). The German data files are the source of truth;
 * this file maps each distinct German string to natural, product-quality English.
 *
 * Rules the English here follows (see docs/LOCALIZATION_STYLE_GUIDE_EN.md):
 * - Natural and concise, never a word-for-word rendering of the German.
 * - Japanese inside a string (kanji/kana, example sentences) is kept EXACTLY as-is
 *   — only the surrounding German is translated. Fill-in-the-blank prompts keep
 *   their `____` and Japanese frame unchanged.
 * - Grammar facts are preserved exactly (particles, register, cultural claims and
 *   their hedging — "often/many/usually", never "all Japanese …").
 * - The dry, light field-guide humor of the dex descriptions is carried over, not
 *   flattened into a literal gloss.
 *
 * Completeness is asserted by the coverage test (every distinct German data string
 * must be a key here). Keys must match the runtime string byte-for-byte, including
 * `\n` line breaks and „…“ / “…” typographic quotes.
 */
export const contentTranslations: Record<string, string> = {
  // ---------------------------------------------------------------------------
  // Instructions (question stems) — a small, highly repeated closed set.
  // ---------------------------------------------------------------------------
  "Wähle die richtige Bedeutung.": "Choose the correct meaning.",
  "Wähle das passende japanische Wort.": "Choose the matching Japanese word.",
  "Wähle die passende Wortkarte.": "Choose the matching word card.",
  "Wähle die passende japanische Wortkarte.": "Choose the matching Japanese word card.",
  "Wähle die passende Partikel.": "Choose the right particle.",
  "Ergänze den Satz.": "Complete the sentence.",
  "Wähle den natürlichen japanischen Satz.": "Choose the natural Japanese sentence.",
  "Was bedeutet dieser Satz?": "What does this sentence mean?",
  "Achtung, Verwechslungsgefahr: Wähle den richtigen Satz.":
    "Careful — easy to mix up: choose the right sentence.",
  "Achtung: Wähle das passende Wort für diese Situation.":
    "Careful: choose the right word for this situation.",
  "Wähle die passende Antwort.": "Choose the right answer.",
  "Wähle das passende Satzpaar.": "Choose the matching pair of sentences.",
  "Wähle den natürlichen Satz für diese Situation.":
    "Choose the natural sentence for this situation.",
  "Wähle die passende Kombination aus Situation und Satz.":
    "Choose the matching situation-and-sentence combination.",
  "Wähle das passende Satz-Set für A, B und C.":
    "Choose the matching set of sentences for A, B, and C.",
  "Welche Kombination ist richtig?": "Which combination is correct?",
  "Welche beiden Sätze haben dieselbe Bedeutung, aber einen anderen Ton?":
    "Which two sentences share the same meaning but a different tone?",
  "Welches Satzpaar zeigt „に“ (Ziel) und „で“ (Ort der Handlung) richtig?":
    "Which pair of sentences uses „に“ (destination) and „で“ (place of action) correctly?",
  "Mini Challenge: Was bedeutet dieser Satz?": "Mini challenge: what does this sentence mean?",
  "Mini Challenge: Wähle den natürlichen japanischen Satz.":
    "Mini challenge: choose the natural Japanese sentence.",
  "Mini Challenge: Wähle den vollständigen, höflichen Satz.":
    "Mini challenge: choose the complete, polite sentence.",
  "Mini Challenge: Wähle die passende Kombination aus Situation und Satz.":
    "Mini challenge: choose the matching situation-and-sentence combination.",
  "Mini Challenge: Wähle die richtige Kombination aus „に“ und „で“.":
    "Mini challenge: choose the correct combination of „に“ and „で“.",

  // ---------------------------------------------------------------------------
  // Category / world / area metadata.
  // ---------------------------------------------------------------------------
  "Café": "Café",
  "Reise": "Travel",
  "Schule": "School",
  "Freunde": "Friends",
  "Erste Bestellung": "First order",
  "Ankunft in Japan": "Arriving in Japan",
  "Lernen und Alltag": "Studying & daily life",
  "Treffen und Pläne": "Meeting up & plans",
  "Alles zusammen": "All together",
  "Abschluss-Review": "Final Review",
  "Bestelle einfache Dinge auf Japanisch.": "Order simple things in Japanese.",
  "Frage nach Orten und bewege dich in Japan.": "Ask for places and get around in Japan.",
  "Sprich über Schule, Sprache und den heutigen Tag.":
    "Talk about school, language, and today.",
  "Sprich über Freunde und Pläne für morgen.": "Talk about friends and plans for tomorrow.",
  "Wiederhole Wörter aus allen Kategorien.": "Review words from every category.",
  "Bestellen, Essen und Trinken.": "Ordering, eating, and drinking.",
  "Orte, Verkehrsmittel und Wegfragen.": "Places, transport, and asking directions.",
  "Orte, Verkehrsmittel und nach dem Weg fragen.":
    "Places, transport, and asking for directions.",
  "Schule, Lernen und der heutige Tag.": "School, studying, and today.",
  "Schule, Lehrkraft und über das Lernen sprechen.":
    "School, teachers, and talking about studying.",
  "Treffen, Sprechen und Pläne.": "Meeting, talking, and plans.",
  "Freunde treffen, sprechen und Pläne machen.": "Meeting friends, talking, and making plans.",
  "Wiederhole Wörter und Sätze aus deiner ersten Reise.":
    "Review words and sentences from your first journey.",
  "Zeige, was du auf deiner ersten Reise gelernt hast.":
    "Show what you've learned on your first journey.",
  "Erste Schritte in Japan": "First Steps in Japan",
  "Deine Reise beginnt hier.": "Your journey starts here.",
  "Alltag in Japan": "Everyday Japan",
  "Neue Orte, neue Gespräche und eine Hör-Quest.":
    "New places, new conversations, and a listening quest.",
  "Demnächst": "Coming soon",
  "Deine ersten Wörter für Café, Reise, Schule und Freunde.":
    "Your first words for café, travel, school, and friends.",
  "Getränke, ein Snack und die sichere Bestellform.":
    "Drinks, a snack, and the safe way to order.",
  "Orientierung unterwegs": "Finding your way",
  "Erste Gespräche": "First conversations",
  "Lernen und Sprache": "Studying & language",
  "Wörter für Bestellungen, Getränke und kleine Pausen.":
    "Words for orders, drinks, and little breaks.",
  "Wörter, die dir unterwegs den Weg zeigen.": "Words that point the way when you're out.",
  "Wörter rund um Lernen, Unterricht und Sprache.":
    "Words about studying, class, and language.",
  "Wörter für Gespräche, Pläne und gemeinsame Zeit.":
    "Words for conversations, plans, and time together.",

  // Zukan category flavor lines (legacy, not rendered, but present in data).
  "Alle Café-Wörter entdeckt – Bestellen kann kommen!":
    "All café words discovered — bring on the ordering!",
  "Alle Reise-Wörter entdeckt – du findest deinen Weg!":
    "All travel words discovered — you'll find your way!",
  "Alle Schul-Wörter entdeckt – Streberstufe erreicht!":
    "All school words discovered — top-of-the-class unlocked!",
  "Alle Freunde-Wörter entdeckt – Gesprächsstoff gesichert!":
    "All friends words discovered — plenty to talk about!",

  // Stage labels.
  "Abschluss-Challenge": "Final Challenge",

  // ---------------------------------------------------------------------------
  // Word meanings (vocab.german) and short glosses used as quiz choices.
  // ---------------------------------------------------------------------------
  "Kaffee": "Coffee",
  "Wasser": "Water",
  "Brot": "Bread",
  "trinken": "to drink",
  "essen": "to eat",
  "Bahnhof": "station",
  "Hotel": "hotel",
  "Zug": "train",
  "Toilette": "toilet",
  "gehen": "to go",
  "wo": "where",
  "Entschuldigung": "excuse me",
  "rechts": "right",
  "links": "left",
  "nah": "near",
  "weit": "far",
  "weit entfernt": "far away",
  "weit / entfernt": "far / distant",
  "Japanisch": "Japanese",
  "Lehrer/Lehrerin": "teacher",
  "lernen": "to study",
  "heute": "today",
  "Freund/Freundin": "friend",
  "treffen": "to meet",
  "sprechen": "to talk",
  "morgen": "tomorrow",
  "mögen / gern haben": "to like",
  "Deutsch": "German",
  "Danke": "Thank you",
  "Guten Tag": "Hello",
  "Auf Wiedersehen": "Goodbye",

  // ---------------------------------------------------------------------------
  // Order / café phrases (German meanings shown as choices, answers, examples).
  // ---------------------------------------------------------------------------
  "Einen Kaffee bitte.": "A coffee, please.",
  "Wasser bitte.": "Water, please.",
  "Brot bitte.": "Bread, please.",
  "Kaffee und Brot bitte.": "Coffee and bread, please.",
  "Brot und Kaffee bitte.": "Bread and coffee, please.",
  "Kaffee und Wasser bitte.": "Coffee and water, please.",
  "Wasser und Brot bitte.": "Water and bread, please.",
  "Brot und Wasser bitte.": "Bread and water, please.",
  "Ich trinke Wasser.": "I drink water.",
  "Ich trinke Kaffee.": "I drink coffee.",
  "Ich esse Brot.": "I eat bread.",
  "Ich trinke Kaffee und esse Brot.": "I drink coffee and eat bread.",
  "Ich esse Brot und trinke Kaffee.": "I eat bread and drink coffee.",
  "Ich esse Brot und trinke Wasser.": "I eat bread and drink water.",
  "Ich trinke Wasser und esse Brot.": "I drink water and eat bread.",
  "Ich esse Brot. Ich trinke Wasser.": "I eat bread. I drink water.",
  "Trinkst du Wasser?": "Do you drink water?",
  "Trinkst du Kaffee?": "Do you drink coffee?",
  "Isst du Brot?": "Do you eat bread?",
  "Entschuldigung, Wasser bitte.": "Excuse me, water please.",
  "Entschuldigung, einen Kaffee bitte.": "Excuse me, a coffee please.",
  "Entschuldigung.": "Excuse me.",
  "Entschuldigung, wo ist das Wasser?": "Excuse me, where is the water?",

  // ---------------------------------------------------------------------------
  // Travel phrases.
  // ---------------------------------------------------------------------------
  "Wo ist der Bahnhof?": "Where is the station?",
  "Wo ist die Toilette?": "Where is the toilet?",
  "Wo ist das Hotel?": "Where is the hotel?",
  "Wo ist der Lehrer?": "Where is the teacher?",
  "Wo ist die Schule?": "Where is the school?",
  "Entschuldigung, wo ist der Bahnhof?": "Excuse me, where is the station?",
  "Entschuldigung, wo ist die Toilette?": "Excuse me, where is the toilet?",
  "Entschuldigung, wo ist das Hotel?": "Excuse me, where is the hotel?",
  "Entschuldigung, wo ist der Zug?": "Excuse me, where is the train?",
  "Entschuldigung, wo ist der Lehrer?": "Excuse me, where is the teacher?",
  "Entschuldigung, ist der Bahnhof rechts?": "Excuse me, is the station on the right?",
  "Entschuldigung, ist die Toilette links?": "Excuse me, is the toilet on the left?",
  "Gehst du zum Bahnhof?": "Are you going to the station?",
  "Ich gehe zum Bahnhof.": "I go to the station.",
  "Ich gehe zum Hotel.": "I go to the hotel.",
  "Ich gehe zur Schule.": "I go to school.",
  "Ich gehe zur Toilette.": "I go to the toilet.",
  "Ich gehe zur Schule. Ich lerne in der Schule.": "I go to school. I study at school.",
  "Ich fahre mit dem Zug.": "I go by train.",
  "Ich fahre mit dem Zug zum Bahnhof.": "I take the train to the station.",
  "Ich fahre mit dem Zug zum Hotel.": "I take the train to the hotel.",
  "Ich fahre mit dem Zug zur Schule.": "I take the train to school.",
  "Der Bahnhof ist rechts.": "The station is on the right.",
  "Der Bahnhof ist links.": "The station is on the left.",
  "Der Bahnhof ist nah.": "The station is near.",
  "Der Bahnhof ist weit entfernt.": "The station is far away.",
  "Die Toilette ist rechts.": "The toilet is on the right.",
  "Die Toilette ist links.": "The toilet is on the left.",
  "Die Toilette ist nah.": "The toilet is near.",
  "Die Toilette ist weit entfernt.": "The toilet is far away.",
  "Das Hotel ist rechts.": "The hotel is on the right.",
  "Das Hotel ist links.": "The hotel is on the left.",
  "Das Hotel ist nah.": "The hotel is near.",
  "Das Hotel ist weit entfernt.": "The hotel is far away.",
  "Die Schule ist nah.": "The school is near.",
  "Die Schule ist weit entfernt.": "The school is far away.",
  "Der Zug ist nah.": "The train is near.",
  "Der Zug ist weit entfernt.": "The train is far away.",
  "Es ist rechts.": "It's on the right.",
  "Es ist links.": "It's on the left.",
  "Ist das Hotel nah?": "Is the hotel near?",
  "Ist der Bahnhof weit entfernt?": "Is the station far away?",
  "Die Toilette ist rechts. Der Bahnhof ist links.":
    "The toilet is on the right. The station is on the left.",
  "Die Toilette ist links. Der Bahnhof ist rechts.":
    "The toilet is on the left. The station is on the right.",
  "Die Toilette und der Bahnhof sind rechts.": "The toilet and the station are on the right.",
  "Der Bahnhof ist rechts. Das Hotel ist links.":
    "The station is on the right. The hotel is on the left.",
  "Der Bahnhof ist links. Das Hotel ist rechts.":
    "The station is on the left. The hotel is on the right.",
  "Der Bahnhof und das Hotel sind links.": "The station and the hotel are on the left.",
  "Das Hotel ist nah. Der Bahnhof ist weit entfernt.":
    "The hotel is near. The station is far away.",
  "Das Hotel ist weit entfernt. Der Bahnhof ist nah.":
    "The hotel is far away. The station is near.",
  "Das Hotel ist nah. Ich fahre mit dem Zug.": "The hotel is near. I go by train.",
  "Das Hotel ist weit entfernt. Ich fahre mit dem Zug.":
    "The hotel is far away. I go by train.",
  "Das Hotel ist weit entfernt. Ich gehe zum Bahnhof.":
    "The hotel is far away. I go to the station.",
  "Das Hotel und der Bahnhof sind nah.": "The hotel and the station are near.",

  // ---------------------------------------------------------------------------
  // School / study phrases.
  // ---------------------------------------------------------------------------
  "Ich lerne Japanisch.": "I study Japanese.",
  "Ich lerne in der Schule.": "I study at school.",
  "Ich lerne in der Schule Japanisch.": "I study Japanese at school.",
  "Ich lerne mit dem Lehrer.": "I study with the teacher.",
  "Ich lerne mit dem Lehrer Japanisch.": "I study Japanese with the teacher.",
  "Ich lerne mit der Lehrkraft Japanisch.": "I study Japanese with the teacher.",
  "Ich lerne in der Schule mit einem Freund.": "I study at school with a friend.",
  "Ich gehe mit dem Lehrer zur Schule.": "I go to school with the teacher.",
  "Ich gehe mit einem Freund zur Schule.": "I go to school with a friend.",
  "Ich frage den Lehrer.": "I ask the teacher.",
  "Ich treffe den Lehrer.": "I meet the teacher.",
  "Ich spreche mit dem Lehrer.": "I talk with the teacher.",
  "Ich spreche in der Schule mit dem Lehrer.": "I talk with the teacher at school.",
  "Ich spreche in der Schule mit einem Freund.": "I talk with a friend at school.",
  "Ich spreche Japanisch.": "I speak Japanese.",
  "Heute gehe ich zur Schule.": "Today I go to school.",
  "Heute gehe ich zum Bahnhof.": "Today I go to the station.",
  "Heute gehe ich mit dem Lehrer zur Schule.": "Today I go to school with the teacher.",
  "Heute lerne ich Japanisch.": "Today I study Japanese.",
  "Heute lerne ich in der Schule.": "Today I study at school.",
  "Heute lerne ich in der Schule Japanisch.": "Today I study Japanese at school.",
  "Heute lerne ich mit dem Lehrer.": "Today I study with the teacher.",
  "Heute lernt der Lehrer.": "Today the teacher studies.",
  "Heute spreche ich in der Schule Japanisch.": "Today I speak Japanese at school.",
  "Heute spreche ich mit dem Lehrer.": "Today I talk with the teacher.",
  "Heute spreche ich mit einem Freund.": "Today I talk with a friend.",
  "Heute spreche ich mit einem Freund. Heute spreche ich mit der Lehrkraft.":
    "Today I talk with a friend. Today I talk with the teacher.",
  "Morgen lerne ich Japanisch.": "Tomorrow I study Japanese.",
  "Morgen lernt mein Freund Japanisch.": "Tomorrow my friend studies Japanese.",
  "Morgen gehe ich zur Schule.": "Tomorrow I go to school.",
  "Ich mag Japanisch.": "I like Japanese.",
  "Ich mag Kaffee.": "I like coffee.",
  "Ich mag Brot.": "I like bread.",
  "Ich mag meine Freunde.": "I like my friends.",
  "Ich mag Japanisch. Heute lerne ich Japanisch.":
    "I like Japanese. Today I study Japanese.",
  "Ich mag Japanisch. Heute spreche ich Japanisch.":
    "I like Japanese. Today I speak Japanese.",
  "Ich mag die Schule. Heute lerne ich Japanisch.":
    "I like school. Today I study Japanese.",
  "Ich mag meine Freunde. Ich mag Japanisch.": "I like my friends. I like Japanese.",

  // ---------------------------------------------------------------------------
  // Friends / plans phrases.
  // ---------------------------------------------------------------------------
  "Ich treffe einen Freund.": "I meet a friend.",
  "Ich spreche mit einem Freund.": "I talk with a friend.",
  "Morgen treffe ich einen Freund.": "Tomorrow I meet a friend.",
  "Morgen treffe ich am Bahnhof einen Freund.": "Tomorrow I meet a friend at the station.",
  "Morgen spreche ich mit einem Freund.": "Tomorrow I talk with a friend.",
  "Morgen spreche ich mit einem Freund Japanisch.":
    "Tomorrow I speak Japanese with a friend.",
  "Morgen spreche ich am Bahnhof mit einem Freund.":
    "Tomorrow I talk with a friend at the station.",
  "Morgen gehe ich mit einem Freund zum Bahnhof.":
    "Tomorrow I go to the station with a friend.",
  "Heute treffe ich einen Freund.": "Today I meet a friend.",
  "Heute treffe ich am Bahnhof einen Freund.": "Today I meet a friend at the station.",

  // ---------------------------------------------------------------------------
  // Fill-in-the-blank prompts (German frame + Japanese with a ____ gap).
  // ---------------------------------------------------------------------------
  "„Einen Kaffee bitte.“\nコーヒー____ください。": "“A coffee, please.”\nコーヒー____ください。",
  "„Ich trinke Kaffee.“\nコーヒーを____。": "“I drink coffee.”\nコーヒーを____。",
  "„Ich trinke Kaffee.“\nコーヒー____飲みます。": "“I drink coffee.”\nコーヒー____飲みます。",
  "„Ich esse Brot.“\nパンを____。": "“I eat bread.”\nパンを____。",
  "„Ich esse Brot.“\nパン____食べます。": "“I eat bread.”\nパン____食べます。",
  "„Wasser bitte.“\n水を____。": "“Water, please.”\n水を____。",
  "„Ich trinke Wasser.“\n水____飲みます。": "“I drink water.”\n水____飲みます。",
  "„Ich trinke Wasser.“\n水を____。": "“I drink water.”\n水を____。",
  "„Brot bitte.“\nパンを____。": "“Bread, please.”\nパンを____。",
  "„Ich gehe zum Bahnhof.“\n駅に____。": "“I go to the station.”\n駅に____。",
  "„Ich gehe zum Bahnhof.“\n駅____行きます。": "“I go to the station.”\n駅____行きます。",
  "„Ich gehe zum Hotel.“\nホテルに____。": "“I go to the hotel.”\nホテルに____。",
  "„Ich gehe zum Hotel.“\nホテル____行きます。": "“I go to the hotel.”\nホテル____行きます。",
  "„Ich gehe zur Schule.“\n学校____行きます。": "“I go to school.”\n学校____行きます。",
  "„Ich fahre mit dem Zug.“\n電車____行きます。": "“I go by train.”\n電車____行きます。",
  "„Ich fahre mit dem Zug zum Bahnhof.“\n電車で駅に____。":
    "“I take the train to the station.”\n電車で駅に____。",
  "„Ich fahre mit dem Zug zum Hotel.“\n電車でホテル____行きます。":
    "“I take the train to the hotel.”\n電車でホテル____行きます。",
  "„Wo ist der Bahnhof?“\n駅____どこですか。": "“Where is the station?”\n駅____どこですか。",
  "„Wo ist die Toilette?“\nトイレ____どこですか。": "“Where is the toilet?”\nトイレ____どこですか。",
  "„Wo ist das Hotel?“\nホテルは____ですか。": "“Where is the hotel?”\nホテルは____ですか。",
  "„Wo ist der Lehrer?“\n先生は____ですか。": "“Where is the teacher?”\n先生は____ですか。",
  "„Entschuldigung, wo ist der Bahnhof?“\nすみません、駅____どこですか。":
    "“Excuse me, where is the station?”\nすみません、駅____どこですか。",
  "„Entschuldigung, wo ist die Toilette?“\n____、トイレはどこですか。":
    "“Excuse me, where is the toilet?”\n____、トイレはどこですか。",
  "„Der Bahnhof ist rechts.“\n駅____右です。": "“The station is on the right.”\n駅____右です。",
  "„Der Bahnhof ist nah.“\n駅____近いです。": "“The station is near.”\n駅____近いです。",
  "„Der Bahnhof ist nah.“\n駅は____です。": "“The station is near.”\n駅は____です。",
  "„Der Bahnhof ist links.“\n駅は____です。": "“The station is on the left.”\n駅は____です。",
  "„Der Bahnhof ist weit entfernt.“\n駅は____です。":
    "“The station is far away.”\n駅は____です。",
  "„Die Toilette ist rechts.“\nトイレは____です。":
    "“The toilet is on the right.”\nトイレは____です。",
  "„Die Toilette ist links.“\nトイレ____左です。":
    "“The toilet is on the left.”\nトイレ____左です。",
  "„Die Toilette ist links.“\nトイレは____です。":
    "“The toilet is on the left.”\nトイレは____です。",
  "„Das Hotel ist nah.“\nホテルは____です。": "“The hotel is near.”\nホテルは____です。",
  "„Das Hotel ist weit entfernt.“\nホテル____遠いです。":
    "“The hotel is far away.”\nホテル____遠いです。",
  "„Das Hotel ist weit entfernt.“\nホテルは____です。":
    "“The hotel is far away.”\nホテルは____です。",
  "„Heute gehe ich zur Schule.“\n今日、学校____行きます。":
    "“Today I go to school.”\n今日、学校____行きます。",
  "„Heute gehe ich zur Schule.“\n今日、学校に____。":
    "“Today I go to school.”\n今日、学校に____。",
  "„Heute lerne ich Japanisch.“\n今日、____を勉強します。":
    "“Today I study Japanese.”\n今日、____を勉強します。",
  "„Heute lerne ich Japanisch.“\n今日、日本語を____。":
    "“Today I study Japanese.”\n今日、日本語を____。",
  "„Heute lerne ich Japanisch.“\n____、日本語を勉強します。":
    "“Today I study Japanese.”\n____、日本語を勉強します。",
  "„Ich lerne Japanisch.“\n日本語____勉強します。":
    "“I study Japanese.”\n日本語____勉強します。",
  "„Ich lerne in der Schule.“\n学校____勉強します。":
    "“I study at school.”\n学校____勉強します。",
  "„Ich lerne mit dem Lehrer Japanisch.“\n先生____日本語を勉強します。":
    "“I study Japanese with the teacher.”\n先生____日本語を勉強します。",
  "„Ich mag Japanisch.“\n日本語____好きです。": "“I like Japanese.”\n日本語____好きです。",
  "„Ich mag meine Freunde.“\n友だちが____です。": "“I like my friends.”\n友だちが____です。",
  "„Ich spreche Japanisch.“\n日本語を____。": "“I speak Japanese.”\n日本語を____。",
  "„Ich spreche mit einem Freund.“\n友だち____話します。":
    "“I talk with a friend.”\n友だち____話します。",
  "„Ich spreche mit einem Freund.“\n友だちと____。": "“I talk with a friend.”\n友だちと____。",
  "„Ich treffe einen Freund.“\n友だち____会います。":
    "“I meet a friend.”\n友だち____会います。",
  "„Ich treffe einen Freund.“\n友だちに____。": "“I meet a friend.”\n友だちに____。",
  "„Morgen treffe ich einen Freund.“\n明日、友だち____会います。":
    "“Tomorrow I meet a friend.”\n明日、友だち____会います。",
  "„Morgen treffe ich einen Freund.“\n____、友だちに会います。":
    "“Tomorrow I meet a friend.”\n____、友だちに会います。",

  // ---------------------------------------------------------------------------
  // Situation prompts (multi-line scenarios).
  // ---------------------------------------------------------------------------
  "Du bestellst im Café: „Einen Kaffee bitte.“": "You're ordering at a café: “A coffee, please.”",
  "Du bestellst höflich bei einer Servicekraft im Café: Kaffee und Brot.":
    "You politely order from a café's staff: coffee and bread.",
  "Du bist jemandem aus Versehen auf den Fuß getreten. Was sagst du?":
    "You've accidentally stepped on someone's foot. What do you say?",
  "Du sprichst locker mit einem Freund.\nWelche Aussage passt natürlich?":
    "You're chatting casually with a friend.\nWhich sentence sounds natural?",
  "Du sprichst locker mit einem engen Freund.\nWelche Aussage passt natürlich?":
    "You're chatting casually with a close friend.\nWhich sentence sounds natural?",
  "Du sprichst mit einer Lehrkraft oder einer unbekannten Person.\nWelche Aussage ist hier passend?":
    "You're speaking with a teacher or someone you don't know.\nWhich sentence fits here?",
  "Du sprichst höflich mit einer Lehrkraft, mit Servicepersonal oder mit einer unbekannten Person.\nWelche Aussage ist hier passend?":
    "You're speaking politely with a teacher, staff, or someone you don't know.\nWhich sentence fits here?",
  "Ein Freund fragt dich:\n„Was machst du heute?“\nWelche Antwort klingt locker und natürlich?":
    "A friend asks you:\n“What are you doing today?”\nWhich answer sounds casual and natural?",
  "Eine Lehrkraft fragt dich:\n„Was machst du heute?“\nWelche Antwort ist höflich und natürlich?":
    "A teacher asks you:\n“What are you doing today?”\nWhich answer is polite and natural?",
  "Welche beiden Sätze haben dieselbe Bedeutung, aber einen anderen Ton?\n":
    "Which two sentences share the same meaning but a different tone?\n",
  "Situation 1: Du sprichst mit einem Freund.\nSituation 2: Du sprichst mit einer fremden Person.\n\nWelche Kombination passt?":
    "Situation 1: You talk with a friend.\nSituation 2: You talk with a stranger.\n\nWhich combination fits?",
  "Situation 1: Freund\nSituation 2: Lehrkraft\n\nSatz A: 明日は学校に行く。\nSatz B: 明日は学校に行きます。\n\nWelche Zuordnung passt am besten?":
    "Situation 1: friend\nSituation 2: teacher\n\nSentence A: 明日は学校に行く。\nSentence B: 明日は学校に行きます。\n\nWhich mapping fits best?",
  "Situation A: Du sprichst mit einem Freund.\nSituation B: Du sprichst mit Servicepersonal oder einer Lehrkraft.\n\nWelche Kombination passt am besten?":
    "Situation A: You talk with a friend.\nSituation B: You talk with staff or a teacher.\n\nWhich combination fits best?",
  "A. Du bestellst höflich im Café.\nB. Du sprichst höflich mit deiner Lehrkraft in der Schule.\nC. Du sprichst locker mit einem Freund.\n\nWelche drei Sätze passen zu A, B und C?":
    "A. You order politely at the café.\nB. You speak politely with your teacher at school.\nC. You chat casually with a friend.\n\nWhich three sentences match A, B, and C?",
  "A: Du sprichst mit einem engen Freund.\nB: Du sprichst mit einer Lehrkraft.\n\nWelche Sätze passen zu A und B?":
    "A: You talk with a close friend.\nB: You talk with a teacher.\n\nWhich sentences match A and B?",

  // German answer/choice labels for pairing questions.
  "Freund → Satz A, Lehrkraft → Satz A": "Friend → sentence A, teacher → sentence A",
  "Freund → Satz A, Lehrkraft → Satz B": "Friend → sentence A, teacher → sentence B",
  "Freund → Satz B, Lehrkraft → Satz A": "Friend → sentence B, teacher → sentence A",
  "Freund → Satz B, Lehrkraft → Satz B": "Friend → sentence B, teacher → sentence B",
  "A: Ich spreche mit einem Freund. B: Ich spreche mit der Lehrkraft.":
    "A: I talk with a friend. B: I talk with the teacher.",
  "A: Kaffee und Brot bitte. / B: Heute lerne ich in der Schule Japanisch. / C: Morgen treffe ich einen Freund.":
    "A: Coffee and bread, please. / B: Today I study Japanese at school. / C: Tomorrow I meet a friend.",

  // ---------------------------------------------------------------------------
  // Short tips (shortTip) and hint one-liners.
  // ---------------------------------------------------------------------------
  "„コーヒーをください“ ist dein Standardsatz, um einen Kaffee zu bestellen.":
    "“コーヒーをください” is your go-to sentence for ordering a coffee.",
  "„〜をください“ ist dein sicherer Standardsatz zum Bestellen.":
    "“〜をください” is your safe go-to sentence for ordering.",
  "„パン“ ist ein kurzes Lehnwort aus dem Portugiesischen – leicht zu merken.":
    "“パン” is a short loanword from Portuguese — easy to remember.",
  "„飲みます“ benutzt du für alles, was du trinkst – Wasser, Kaffee, Tee.":
    "Use “飲みます” for anything you drink — water, coffee, tea.",
  "„食べます“ ist dein Verb für alles, was du isst.": "“食べます” is your verb for anything you eat.",
  "„A と B“ ist dein Werkzeug, um zwei Dinge auf einmal zu bestellen.":
    "“A と B” is your tool for ordering two things at once.",
  "„駅はどこですか“ ist deine Rettung, wenn du den Bahnhof suchst.":
    "“駅はどこですか” is your lifeline when you're looking for the station.",
  "„トイレはどこですか“ – vielleicht der nützlichste Satz auf jeder Reise.":
    "“トイレはどこですか” — maybe the most useful sentence of any trip.",
  "„〜に行きます“ zeigt, wohin du gehst oder fährst.":
    "“〜に行きます” shows where you're going.",
  "„で“ zeigt hier, womit du dich bewegst: Zug, Bus oder Auto.":
    "Here “で” shows what you travel by: train, bus, or car.",
  "„〜はどこですか“ ist dein Werkzeug, um nach jedem Ort zu fragen.":
    "“〜はどこですか” is your tool for asking about any place.",
  "„どこですか“ ist dein Werkzeug, um nach jedem Ort zu fragen.":
    "“どこですか” is your tool for asking about any place.",
  "„右です“ ist deine kurze Antwort, wenn jemand nach dem Weg fragt.":
    "“右です” is your short answer when someone asks for directions.",
  "„左です“ ist das Gegenstück zu „右です“ – links statt rechts.":
    "“左です” is the counterpart to “右です” — left instead of right.",
  "„近いです“ sagt: das ist nicht weit von hier.": "“近いです” says: it's not far from here.",
  "„遠いです“ sagt: das ist ein ganzes Stück entfernt.":
    "“遠いです” says: it's quite a way off.",
  "„すみません“ am Satzanfang macht jede Frage automatisch höflicher.":
    "“すみません” at the start makes any question automatically more polite.",
  "„すみません“ ist deine Türöffner-Floskel, bevor du jemanden ansprichst.":
    "“すみません” is your ice-breaker before you approach someone.",
  "„電車で“ zeigt das Verkehrsmittel, „ホテルに“ zeigt das Ziel – zusammen ein kompletter Reisesatz.":
    "“電車で” shows the means of transport, “ホテルに” shows the destination — together, a complete travel sentence.",
  "„学校“ ist dein Grundwort für alles rund ums Lernen.":
    "“学校” is your base word for everything about studying.",
  "„先生“ ist eine höfliche Anrede – nicht nur für Lehrer.":
    "“先生” is a polite form of address — not just for teachers.",
  "„に“ markiert hier das Ziel: 学校に行きます。": "Here “に” marks the destination: 学校に行きます。",
  "„で“ zeigt den Ort, an dem eine Handlung stattfindet.":
    "“で” shows the place where an action happens.",
  "„を“ markiert, was du lernst: 日本語を勉強します。":
    "“を” marks what you study: 日本語を勉強します。",
  "„今日は“ setzt „heute“ als Thema an den Satzanfang.":
    "“今日は” puts “today” at the start as the topic.",
  "„今日“ steht fast immer am Satzanfang, oft mit „は“.":
    "“今日” almost always comes at the start, often with “は”.",
  "„日本語を勉強します“ ist dein Grundsatz für „Ich lerne Japanisch“.":
    "“日本語を勉強します” is your base sentence for “I study Japanese”.",
  "„と“ bedeutet hier „mit“: 先生と勉強します。": "Here “と” means “with”: 先生と勉強します。",
  "„友だち“ ist die Grundlage für alle Sätze in dieser Etappe.":
    "“友だち” is the foundation for every sentence in this stage.",
  "„友だち“ selbst ist weder locker noch höflich – das entscheidet der Satz.":
    "“友だち” itself is neither casual nor polite — the sentence decides.",
  "„会う“ ist das Verb, das du am häufigsten mit „友だち“ kombinierst.":
    "“会う” is the verb you'll pair with “友だち” most often.",
  "„会う“ + „に“ zeigt, wen du triffst – locker oder höflich.":
    "“会う” + “に” shows who you meet — casual or polite.",
  "„と話す“ heißt „mit jemandem sprechen“ – lockerer oder höflicher, je nach Satzende.":
    "“と話す” means “to talk with someone” — casual or polite, depending on the ending.",
  "„食べる“ heißt „essen“ – höflich sagst du „食べます“.":
    "“食べる” means “to eat” — politely, you say “食べます”.",
  "„駅はどこですか“ ist dein Standardsatz, um nach dem Bahnhof zu fragen.":
    "“駅はどこですか” is your go-to sentence for asking where the station is.",
  "„A と B をください“ bestellt zwei Dinge auf einmal – höflich und einfach.":
    "“A と B をください” orders two things at once — polite and simple.",
  "„に“ zeigt das Ziel deiner Bewegung – hier: das Hotel.":
    "“に” shows the destination of your movement — here, the hotel.",
  "„です“ macht aus der Aussage eine höfliche, vollständige Antwort.":
    "“です” turns the statement into a polite, complete answer.",
  "„-masu“ macht die Aussage höflich, ohne den Inhalt zu verändern.":
    "“-masu” makes the statement polite without changing its meaning.",
  "„明日“ steht am Satzanfang – der Ton kommt vom Verb danach.":
    "“明日” goes at the start — the tone comes from the verb after it.",
  "„勉強する“ heißt „lernen“ – die höfliche Form ist „勉強します“.":
    "“勉強する” means “to study” — the polite form is “勉強します”.",
  "„日本語“ ist die Sprache, „日本“ ist das Land.":
    "“日本語” is the language, “日本” is the country.",
  "„ホテル“ ist ein Fremdwort – klingt fast wie im Deutschen.":
    "“ホテル” is a loanword — it sounds almost like “hotel” in English.",

  // Register / situation hint one-liners (feedback for pairing/casual-polite Qs).
  "Bei einer Lehrkraft ist die „-masu“-Form die sichere, höfliche Wahl.":
    "With a teacher, the “-masu” form is the safe, polite choice.",
  "Bei einer Lehrkraft, Servicepersonal oder einer fremden Person ist die „-masu“-Form die sichere Wahl.":
    "With a teacher, staff, or a stranger, the “-masu” form is the safe choice.",
  "Bei „好き“ bleibt „が“ gleich – nur „です“ macht den Unterschied.":
    "With “好き”, “が” stays the same — only “です” makes the difference.",
  "Bei „好き“ bleibt „が“ immer gleich – nur das Satzende ändert sich.":
    "With “好き”, “が” always stays the same — only the sentence ending changes.",
  "Beide Formen sind richtig – „友だちと話す“ passt aber besser zu einem lockeren Gespräch unter Freunden.":
    "Both forms are correct — but “友だちと話す” fits a casual chat among friends better.",
  "Beide Sätze bedeuten dasselbe – nur der Ton ist unterschiedlich.":
    "Both sentences mean the same thing — only the tone differs.",
  "Beide Sätze bedeuten dasselbe – nur die Satzendung zeigt den Unterschied zwischen Locker und Höflich.":
    "Both sentences mean the same thing — only the ending shows the casual-vs-polite difference.",
  "Beschreibung, keine Bestellung: „Ich trinke Kaffee.“":
    "A description, not an order: “I drink coffee.”",
  "Bestellung, keine Beschreibung: „Wasser bitte.“":
    "An order, not a description: “Water, please.”",
  "Essen, nicht trinken: „Ich esse Brot.“": "Eating, not drinking: “I eat bread.”",
  "Objekt mit を: „Ich lerne Japanisch.“": "Object with を: “I study Japanese.”",
  "Ort der Handlung mit で: „Ich lerne in der Schule Japanisch.“":
    "Place of action with で: “I study Japanese at school.”",
  "Ort der Handlung mit で: „Ich lerne in der Schule.“":
    "Place of action with で: “I study at school.”",
  "Person mit に: „Ich treffe einen Freund.“": "Person with に: “I meet a friend.”",
  "Person + と + 話す: 友だちと話します.": "Person + と + 話す: 友だちと話します.",
  "Person + に + 会う: 友だちに会います.": "Person + に + 会う: 友だちに会います.",
  "Mit jemandem sprechen = と: „Ich spreche mit einem Freund.“":
    "Talking with someone = と: “I talk with a friend.”",
  "Treffen, nicht sprechen: „Ich treffe einen Freund.“":
    "Meeting, not talking: “I meet a friend.”",
  "Ziel mit に: „Heute gehe ich zur Schule.“": "Destination with に: “Today I go to school.”",
  "Ziel mit に: „Ich gehe zum Bahnhof.“": "Destination with に: “I go to the station.”",
  "Ziel mit に: „Ich gehe zum Hotel.“": "Destination with に: “I go to the hotel.”",
  "Ziel mit に: „Ich gehe zur Toilette.“": "Destination with に: “I go to the toilet.”",
  "Ziel + に + 行きます: ホテルに行きます.": "Destination + に + 行きます: ホテルに行きます.",
  "Verkehrsmittel mit で: „Ich fahre mit dem Zug.“": "Transport with で: “I go by train.”",
  "Verkehrsmittel + で: 電車で行きます = Ich fahre mit dem Zug.":
    "Transport + で: 電車で行きます = I go by train.",
  "de (womit) und に (wohin): „Ich fahre mit dem Zug zum Bahnhof.“":
    "で (by what) and に (to where): “I take the train to the station.”",
  "で (womit) und に (wohin): „Ich fahre mit dem Zug zum Bahnhof.“":
    "で (by what) and に (to where): “I take the train to the station.”",
  "Rechts, nicht links – und eine Antwort, keine Frage: „Es ist rechts.“":
    "Right, not left — and an answer, not a question: “It's on the right.”",
  "Links, nicht rechts – und eine Antwort, keine Frage: „Es ist links.“":
    "Left, not right — and an answer, not a question: “It's on the left.”",
  "Nah, nicht weit – und eine Aussage, keine Frage: „Der Bahnhof ist nah.“":
    "Near, not far — and a statement, not a question: “The station is near.”",
  "Weit entfernt, nicht nah: „Die Toilette ist weit entfernt.“":
    "Far away, not near: “The toilet is far away.”",
  "Eine Frage braucht か: „Wo ist das Hotel?“": "A question needs か: “Where is the hotel?”",
  "Morgen, nicht heute: „Morgen lerne ich Japanisch.“":
    "Tomorrow, not today: “Tomorrow I study Japanese.”",
  "„Ich lerne mit dem Lehrer Japanisch.“ – mit = と":
    "“I study Japanese with the teacher.” — with = と",
  "好き braucht が, nicht を: „Ich mag Japanisch.“": "好き needs が, not を: “I like Japanese.”",
  "〜が好き(です) – mit が, nicht mit を.": "〜が好き(です) — with が, not を.",
  "Die höfliche Form ist bei einer Lehrkraft oder einer unbekannten Person eine sichere Wahl.":
    "The polite form is a safe choice with a teacher or someone you don't know.",
  "Die „-masu“-Form ist die sichere Wahl, wenn du dir nicht sicher bist.":
    "The “-masu” form is the safe choice when you're not sure.",
  "Die „-masu“-Form passt zu jeder formelleren oder unbekannten Situation.":
    "The “-masu” form fits any more formal or unfamiliar situation.",
  "Die Wörterbuchform „会う“ ist im lockeren Gespräch die natürliche Wahl.":
    "The dictionary form “会う” is the natural choice in a casual conversation.",
  "Die einfache Form „会う“ klingt unter Freunden ganz normal.":
    "The plain form “会う” sounds perfectly normal among friends.",
  "Die einfache Form „行く“ ohne „です/ます“ klingt unter Freunden ganz normal.":
    "The plain form “行く” without “です/ます” sounds perfectly normal among friends.",
  "Für den lockeren Plausch reicht die einfache Form ohne „です/ます“.":
    "For a casual chat, the plain form without “です/ます” is enough.",
  "Locker unter Freunden: „話す“. Höflich mit einer Lehrkraft oder Servicepersonal: „話します“.":
    "Casual among friends: “話す”. Polite with a teacher or staff: “話します”.",
  "Mit „-masu“ ist die Aussage auch für die Lehrkraft selbst passend.":
    "With “-masu”, the statement also fits when speaking to the teacher directly.",
  "Mit „-masu“ ist die Aussage auch für weniger vertraute Personen passend.":
    "With “-masu”, the statement also fits people you're less close to.",
  "Ohne „です/ます“ klingt der Satz unter Freunden entspannt, nicht unhöflich.":
    "Without “です/ます”, the sentence sounds relaxed among friends, not rude.",
  "Ohne „です“ klingt „好き“ unter Freunden natürlich und nicht abgehackt.":
    "Without “です”, “好き” sounds natural among friends, not clipped.",
  "Unter Freunden reicht die einfache Form – ganz ohne „です/ます“.":
    "Among friends, the plain form is enough — no “です/ます” needed.",
  "Unter engen Freunden reicht die einfache Form „会う“ – ganz ohne „です/ます“.":
    "Among close friends, the plain form “会う” is enough — no “です/ます” needed.",
  "„会います“ bleibt höflich, auch wenn die Person, die du triffst, ein Freund ist.":
    "“会います” stays polite even when the person you meet is a friend.",
  "„勉強します“ ist die sichere Form für Gespräche außerhalb des Freundeskreises.":
    "“勉強します” is the safe form for conversations outside your circle of friends.",
  "„勉強する“ ohne „-masu“ ist die Wörterbuchform, typisch im lockeren Gespräch.":
    "“勉強する” without “-masu” is the dictionary form, typical in casual conversation.",
  "„話します“ passt, wenn du in einer etwas formelleren Situation bist.":
    "“話します” fits when you're in a slightly more formal situation.",
  "Diese lockere Form richtet sich an einen Freund, nicht an die Lehrkraft selbst.":
    "This casual form is aimed at a friend, not at the teacher directly.",
  "Du erzählst einem Freund locker davon, dass du mit der Lehrkraft lernst.":
    "You casually tell a friend that you study with the teacher.",
  "Du erzählst einem Freund locker von deinem Tag.":
    "You casually tell a friend about your day.",
  "Du erzählst einem Freund locker von deinen Plänen für morgen.":
    "You casually tell a friend about your plans for tomorrow.",
  "Du erzählst locker von deinen Plänen.": "You casually talk about your plans.",
  "Du sprichst höflich darüber – zum Beispiel mit der Lehrkraft selbst oder in einer offiziellen Situation.":
    "You speak about it politely — for example with the teacher directly or in a formal setting.",
  "Du sprichst höflich mit einer Lehrkraft oder einer weniger vertrauten Person.":
    "You speak politely with a teacher or someone you're less close to.",
  "Du sprichst höflich über deine Pläne, zum Beispiel mit einer Lehrkraft.":
    "You speak politely about your plans, for example with a teacher.",
  "Du sprichst höflich, zum Beispiel mit einer Lehrkraft oder in der Schule.":
    "You speak politely, for example with a teacher or at school.",
  "Du sprichst höflich, zum Beispiel mit einer Lehrkraft.":
    "You speak politely, for example with a teacher.",
  "Du sprichst höflich, zum Beispiel mit einer neuen Bekanntschaft.":
    "You speak politely, for example with someone you've just met.",
  "Du sprichst locker mit einem Freund oder Familienmitglied.":
    "You talk casually with a friend or family member.",
  "Du sprichst locker mit einem Freund oder Mitschüler.":
    "You talk casually with a friend or classmate.",
  "Du sprichst locker mit einem Freund oder einer Freundin.":
    "You talk casually with a friend.",
  "Die einfache Form „行く“ ohne „です/ます“ klingt unter Freunden entspannt.":
    "The plain form “行く” without “です/ます” sounds relaxed among friends.",

  // ---------------------------------------------------------------------------
  // Longer explanatory feedback (detailTip / long answers).
  // ---------------------------------------------------------------------------
  "Im Café sagst du einfach [Ding] + „をください“ – das ist die sichere Bestellform, egal was du willst. „コーヒーをください“ heißt „Einen Kaffee bitte“. Kurz und locker geht auch „コーヒーください“. Merk dir „ください“ als dein Zauberwort zum Bestellen.":
    "At a café you just say [thing] + “をください” — the safe way to order, whatever you want. “コーヒーをください” means “A coffee, please.” Short and casual, “コーヒーください” works too. Remember “ください” as your magic word for ordering.",
  "Wenn du in Japan etwas bestellen willst, ist „〜をください“ die einfachste sichere Form. Setze einfach das Ding davor: 水をください = Wasser bitte. Das klingt höflich genug für Cafés und Läden. Nicht verwechseln: „水を飲みます“ heißt „Ich trinke Wasser“, nicht „Wasser bitte“ – das eine ist eine Bestellung, das andere eine Beschreibung.":
    "When you want to order something in Japan, “〜をください” is the simplest safe form. Just put the thing in front: 水をください = Water, please. It's polite enough for cafés and shops. Don't mix it up: “水を飲みます” means “I drink water,” not “Water, please” — one is an order, the other a description.",
  "Wenn du in Japan etwas bestellen willst, ist „〜をください“ die einfachste sichere Form. Setze einfach das Ding davor: 水をください = Wasser bitte. Das klingt höflich genug für Cafés und Läden. Nicht verwechseln: „水を飲みます“ heißt „Ich trinke Wasser“, nicht „Wasser bitte“.":
    "When you want to order something in Japan, “〜をください” is the simplest safe form. Just put the thing in front: 水をください = Water, please. It's polite enough for cafés and shops. Don't mix it up: “水を飲みます” means “I drink water,” not “Water, please.”",
  "„パン“ kommt ursprünglich aus dem Portugiesischen („pão“) und ist als kurzes Lehnwort leicht zu merken. „パンをください“ bestellt Brot, „パンを食べます“ beschreibt nur, dass du Brot isst. Das „を“ zeigt jeweils, worum es geht. Achte auf den Unterschied: Bestellung vs. Handlung.":
    "“パン” originally comes from Portuguese (“pão”) and is easy to remember as a short loanword. “パンをください” orders bread; “パンを食べます” just describes that you eat bread. In each case “を” marks what's involved. Watch the difference: order vs. action.",
  "„飲む“ ist das Verb für „trinken“, höflich „飲みます“. Das Muster ist immer gleich: [Getränk] + を + 飲みます, z. B. 水を飲みます = Ich trinke Wasser. Anders als im Deutschen steht das Verb im Japanischen immer am Satzende. Verwechsle es nicht mit „食べます“ – das ist für Essen, nicht für Getränke.":
    "“飲む” is the verb for “to drink,” politely “飲みます”. The pattern is always the same: [drink] + を + 飲みます, e.g. 水を飲みます = I drink water. Unlike in English, the Japanese verb always comes at the end of the sentence. Don't confuse it with “食べます” — that's for food, not drinks.",
  "„食べる“ heißt „essen“, höflich „食べます“. Das Muster [Essen] + を + 食べます funktioniert immer: パンを食べます = Ich esse Brot. Getränke bekommen „飲みます“, feste Nahrung „食べます“ – eine der ersten Unterscheidungen, die Anfänger lernen. Merk dir: „を“ zeigt das Objekt, das Verb kommt zuletzt.":
    "“食べる” means “to eat,” politely “食べます”. The pattern [food] + を + 食べます always works: パンを食べます = I eat bread. Drinks take “飲みます,” solid food takes “食べます” — one of the first distinctions beginners learn. Remember: “を” marks the object, and the verb comes last.",
  "„と“ verbindet zwei Nomen wie das deutsche „und“: コーヒーとパン = Kaffee und Brot. Häng „〜をください“ dran, und du hast einen kompletten Bestellsatz: コーヒーとパンをください。 Das Muster funktioniert auch mit mehr als zwei Dingen. Ein Wort, doppelte Bestellung.":
    "“と” links two nouns like English “and”: コーヒーとパン = coffee and bread. Add “〜をください” and you have a complete order: コーヒーとパンをください。 The pattern works with more than two things too. One word, a double order.",
  "„駅“ heißt „Bahnhof“ und ist eines der wichtigsten Reisewörter überhaupt. Das Muster „〜はどこですか“ bedeutet „Wo ist …?“ und funktioniert für jeden Ort: ホテルはどこですか, トイレはどこですか. Vergiss das „は“ nicht – ohne „は“ klingt der Satz unvollständig. Mit diesem einen Muster findest du fast alles.":
    "“駅” means “station” and is one of the most important travel words there is. The pattern “〜はどこですか” means “Where is …?” and works for any place: ホテルはどこですか, トイレはどこですか. Don't forget the “は” — without it the sentence sounds incomplete. With this one pattern you can find almost anything.",
  "„駅“ heißt „Bahnhof“ und ist eines der wichtigsten Reisewörter überhaupt. Das Muster „〜はどこですか“ bedeutet „Wo ist …?“ und funktioniert für jeden Ort: ホテルはどこですか, トイレはどこですか. Ein häufiger Fehler ist, das „は“ wegzulassen – ohne „は“ klingt der Satz unvollständig. Mit diesem einen Muster findest du fast alles.":
    "“駅” means “station” and is one of the most important travel words there is. The pattern “〜はどこですか” means “Where is …?” and works for any place: ホテルはどこですか, トイレはどこですか. A common mistake is dropping the “は” — without it the sentence sounds incomplete. With this one pattern you can find almost anything.",
  "„トイレ“ kommt aus dem Englischen „toilet“ und wird ähnlich ausgesprochen. Mit „トイレはどこですか“ fragst du höflich nach der Toilette – das gleiche Muster wie bei „駅はどこですか“. Für noch mehr Höflichkeit stellst du „すみません“ voran. Diesen Satz solltest du zuerst auswendig lernen.":
    "“トイレ” comes from English “toilet” and is pronounced similarly. With “トイレはどこですか” you politely ask where the toilet is — the same pattern as “駅はどこですか”. For extra politeness, put “すみません” in front. This is the sentence to memorize first.",
  "„トイレ“ kommt aus dem Englischen „toilet“ und wird ähnlich ausgesprochen. Mit „トイレはどこですか“ fragst du höflich nach der Toilette – das gleiche Muster wie bei „駅はどこですか“. Für noch mehr Höflichkeit stellst du „すみません“ voran: すみません、トイレはどこですか。 Diesen Satz solltest du als Ersten auswendig lernen.":
    "“トイレ” comes from English “toilet” and is pronounced similarly. With “トイレはどこですか” you politely ask where the toilet is — the same pattern as “駅はどこですか”. For extra politeness, put “すみません” in front: すみません、トイレはどこですか。 This is the sentence to memorize first.",
  "„に“ markiert das Ziel: ホテルに行きます = Ich gehe zum Hotel. Ein häufiger Fehler ist, hier „で“ statt „に“ zu benutzen – „で“ ist für das Verkehrsmittel reserviert, nicht das Ziel. Eselsbrücke: „に“ zeigt wie ein Pfeil auf den Ort, wo du hinwillst. Das Muster funktioniert für jedes Reiseziel.":
    "“に” marks the destination: ホテルに行きます = I go to the hotel. A common mistake is using “で” instead of “に” here — “で” is reserved for the means of transport, not the destination. Memory aid: “に” points like an arrow at the place you're heading. The pattern works for any destination.",
  "In „電車で行きます“ bedeutet „電車で“ ungefähr „mit dem Zug“. Das Muster ist sehr nützlich: 乗り物 + で + 行きます. Du kannst es austauschen: バスで行きます = Ich fahre mit dem Bus. Wichtig: Für das Ziel benutzt du nicht „で“, sondern „に“, z. B. ホテルに行きます.":
    "In “電車で行きます,” “電車で” means roughly “by train.” The pattern is very useful: 乗り物 + で + 行きます. You can swap it out: バスで行きます = I go by bus. Important: for the destination you don't use “で” but “に,” e.g. ホテルに行きます.",
  "„どこ“ bedeutet „wo“, zusammen mit „ですか“ wird daraus eine höfliche Frage. Das Muster [Ort] + はどこですか funktioniert universell: 駅はどこですか, ホテルはどこですか. Das „は“ verbindet den Ort mit der Frage – lass es nicht weg. Wenn du dir nur einen Reisesatz merkst, dann diesen.":
    "“どこ” means “where,” and together with “ですか” it becomes a polite question. The pattern [place] + はどこですか works universally: 駅はどこですか, ホテルはどこですか. The “は” links the place to the question — don't drop it. If you remember only one travel sentence, make it this one.",
  "„どこ“ bedeutet „wo“, und zusammen mit „ですか“ wird daraus eine höfliche Frage. Das Muster [Ort] + はどこですか funktioniert universell: 駅はどこですか, ホテルはどこですか. Vergiss das „は“ nicht – es verbindet den Ort mit der Frage. Wenn du dir nur einen Reisesatz merkst, dann diesen.":
    "“どこ” means “where,” and together with “ですか” it becomes a polite question. The pattern [place] + はどこですか works universally: 駅はどこですか, ホテルはどこですか. Don't forget the “は” — it links the place to the question. If you remember only one travel sentence, make it this one.",
  "„右“ bedeutet „rechts“. Mit „です“ dahinter wird daraus eine vollständige, höfliche Antwort: 右です = Es ist rechts. Das gleiche Muster gilt für „左です“ (links). Bei Wegbeschreibungen auf Reisen reicht oft schon dieses eine Wort plus „です“.":
    "“右” means “right.” With “です” after it, it becomes a complete, polite answer: 右です = It's on the right. The same pattern applies to “左です” (left). For directions while traveling, this one word plus “です” is often all you need.",
  "„右“ bedeutet „rechts“. Mit „です“ dahinter wird daraus eine vollständige, höfliche Antwort: 右です = Es ist rechts. Das gleiche Muster gilt für „左です“ (links). Bei Wegbeschreibungen reicht oft schon dieses eine Wort plus „です“.":
    "“右” means “right.” With “です” after it, it becomes a complete, polite answer: 右です = It's on the right. The same pattern applies to “左です” (left). For directions, this one word plus “です” is often all you need.",
  "„左“ heißt „links“, genau wie „右“ für „rechts“ steht. Mit „です“ wird daraus eine kurze, höfliche Antwort: 左です = Es ist links. Ein guter Trick, um beide nicht zu verwechseln: lerne sie immer als Paar. Übe beide zusammen, dann sitzen sie schneller.":
    "“左” means “left,” just as “右” stands for “right.” With “です” it becomes a short, polite answer: 左です = It's on the left. A good trick to avoid mixing them up: always learn them as a pair. Practice both together and they'll stick faster.",
  "„近い“ bedeutet „nah“, mit „です“ wird es zur höflichen Aussage: 駅は近いです = Der Bahnhof ist nah. Das Gegenteil ist „遠いです“ (weit entfernt) – lerne beide Wörter als Paar. Das Muster [Ort] + は近いです funktioniert für jeden Ort. Praktisch, um schnell einzuschätzen, ob sich ein Fußweg lohnt.":
    "“近い” means “near,” and with “です” it becomes a polite statement: 駅は近いです = The station is near. The opposite is “遠いです” (far away) — learn both words as a pair. The pattern [place] + は近いです works for any place. Handy for quickly judging whether a walk is worth it.",
  "„近い“ bedeutet „nah“, und mit „です“ wird es zur höflichen Aussage: 駅は近いです = Der Bahnhof ist nah. Das Gegenteil ist „遠いです“ (weit entfernt) – lerne beide Wörter als Paar. Das Muster [Ort] + は近いです funktioniert für jeden Ort. Praktisch, um schnell einzuschätzen, ob sich ein Fußweg lohnt.":
    "“近い” means “near,” and with “です” it becomes a polite statement: 駅は近いです = The station is near. The opposite is “遠いです” (far away) — learn both words as a pair. The pattern [place] + は近いです works for any place. Handy for quickly judging whether a walk is worth it.",
  "„遠い“ bedeutet „weit“ oder „entfernt“, mit „です“ höflich als Aussage: ホテルは遠いです = Das Hotel ist weit entfernt. Es ist das Gegenteil von „近い“ (nah) – lerne beide zusammen als Paar. Diese Info hilft dir zu entscheiden, ob du lieber ein Taxi oder den Zug nimmst. Ein einfaches Wort mit großer praktischer Wirkung.":
    "“遠い” means “far” or “distant,” politely stated with “です”: ホテルは遠いです = The hotel is far away. It's the opposite of “近い” (near) — learn them together as a pair. This tells you whether to take a taxi or the train instead. A simple word with a big practical payoff.",
  "„遠い“ bedeutet „weit“ oder „entfernt“, mit „です“ höflich als Aussage: ホテルは遠いです = Das Hotel ist weit entfernt. Es ist das Gegenteil von „近い“ (nah) – lerne beide zusammen. Diese Info hilft dir zu entscheiden, ob du lieber ein Taxi nimmst. Ein einfaches Wort mit großer praktischer Wirkung.":
    "“遠い” means “far” or “distant,” politely stated with “です”: ホテルは遠いです = The hotel is far away. It's the opposite of “近い” (near) — learn them together. This helps you decide whether to take a taxi instead. A simple word with a big practical payoff.",
  "„すみません“ bedeutet „Entschuldigung“ und ist die perfekte Türöffner-Floskel, bevor du jemanden ansprichst. Vor einer Wegfrage klingt sie automatisch freundlicher: すみません、トイレはどこですか。 Du kannst „すみません“ auch allein benutzen, um Aufmerksamkeit zu bekommen. Ein Wort, unzählige Situationen.":
    "“すみません” means “excuse me” and is the perfect ice-breaker before you approach someone. Before asking for directions it automatically sounds friendlier: すみません、トイレはどこですか。 You can also use “すみません” on its own to get attention. One word, countless situations.",
  "„すみません“ bedeutet „Entschuldigung“ und wird benutzt, um höflich ein Gespräch zu beginnen – ähnlich wie „Entschuldigen Sie“ im Deutschen. Vor einer Wegfrage klingt es automatisch freundlicher: すみません、駅はどこですか。 Du kannst es auch allein benutzen, um dich zu entschuldigen oder Aufmerksamkeit zu bekommen. Ein Wort, unzählige Situationen.":
    "“すみません” means “excuse me” and is used to start a conversation politely — like “excuse me” in English. Before asking for directions it automatically sounds friendlier: すみません、駅はどこですか。 You can also use it on its own to apologize or get attention. One word, countless situations.",
  "„電車でホテルに行きます“ verbindet Mittel und Ziel in einem Satz: „で“ für womit (mit dem Zug), „に“ für wohin (zum Hotel). Das Muster [Verkehrsmittel] + で + [Ort] + に + 行きます kannst du immer wieder benutzen: バスで駅に行きます = Ich fahre mit dem Bus zum Bahnhof. Ein typischer Fehler ist, „で“ und „に“ zu vertauschen – dann klingt der Satz falsch. Merk dir: で = womit, に = wohin.":
    "“電車でホテルに行きます” combines the means and the destination in one sentence: “で” for by-what (by train), “に” for to-where (to the hotel). You can reuse the pattern [transport] + で + [place] + に + 行きます over and over: バスで駅に行きます = I take the bus to the station. A typical mistake is swapping “で” and “に” — then the sentence sounds wrong. Remember: で = by what, に = to where.",
  "„電車で“ zeigt das Verkehrsmittel (womit), „ホテルに“ zeigt das Ziel (wohin) – zusammen ein kompletter Reisesatz. Bist du angekommen, hilft dir vielleicht „右です“ (rechts) oder „左です“ (links) weiter, und „近いです“ (nah) / „遠いです“ (weit) sagt dir, ob es noch ein Stück ist.":
    "“電車で” shows the means of transport (by what), “ホテルに” shows the destination (to where) — together a complete travel sentence. Once you arrive, “右です” (right) or “左です” (left) may help, and “近いです” (near) / “遠いです” (far) tells you whether there's still a way to go.",
  "„学校“ bedeutet „Schule“. Mit „学校に行きます“ sagst du „Ich gehe zur Schule“ – „に“ zeigt hier das Ziel. Mit „学校で勉強します“ sagst du „Ich lerne in der Schule“ – „で“ zeigt den Ort der Handlung. Die nächsten Aufgaben üben genau diesen Unterschied.":
    "“学校” means “school.” With “学校に行きます” you say “I go to school” — here “に” shows the destination. With “学校で勉強します” you say “I study at school” — “で” shows the place of the action. The next tasks practice exactly this difference.",
  "„学校“ bedeutet „Schule“. Mit „学校に行きます“ sagst du „Ich gehe zur Schule“ – „に“ zeigt hier das Ziel. Mit „学校で勉強します“ sagst du „Ich lerne in der Schule“ – „で“ zeigt den Ort der Handlung. Ein häufiger Anfängerfehler ist, „に“ und „で“ zu vertauschen. Am besten lernst du beide Sätze als Paar: 学校に行きます (wohin) und 学校で勉強します (wo).":
    "“学校” means “school.” With “学校に行きます” you say “I go to school” — here “に” shows the destination. With “学校で勉強します” you say “I study at school” — “で” shows the place of the action. A common beginner mistake is swapping “に” and “で.” Best to learn both sentences as a pair: 学校に行きます (to where) and 学校で勉強します (where).",
  "„先生“ bedeutet „Lehrer“ oder „Lehrerin“. In Japan wird das Wort mit Respekt auch für andere Berufe benutzt, zum Beispiel für Ärztinnen und Ärzte. Als Anfänger merkst du dir „先生“ am einfachsten als „Lehrer/Lehrerin“. Wichtig: Du nennst dich selbst nie „先生“ – das Wort ist eine Anrede für andere.":
    "“先生” means “teacher.” In Japan the word is also used respectfully for other professions, for example doctors. As a beginner, the easiest way to remember “先生” is simply as “teacher.” Important: you never call yourself “先生” — it's a form of address for others.",
  "„先生“ bedeutet „Lehrer“ oder „Lehrerin“. In Japan wird das Wort auch für andere Berufe mit Respekt benutzt, zum Beispiel für Ärztinnen und Ärzte. Als Anfänger merkst du dir „先生“ am einfachsten als „Lehrer/Lehrerin“. Wichtig: Du nennst dich selbst nie „先生“ – das Wort ist eine Anrede für andere, nicht für dich.":
    "“先生” means “teacher.” In Japan the word is also used respectfully for other professions, for example doctors. As a beginner, the easiest way to remember “先生” is simply as “teacher.” Important: you never call yourself “先生” — it's a form of address for others, not for yourself.",
  "Bei Bewegungsverben wie 行きます zeigt „に“, wohin du gehst. Vergleiche: 学校に行きます = Ich gehe zur Schule. 学校で勉強します = Ich lerne in der Schule. „に“ ist das Ziel, „で“ ist der Ort der Handlung.":
    "With motion verbs like 行きます, “に” shows where you're going. Compare: 学校に行きます = I go to school. 学校で勉強します = I study at school. “に” is the destination, “で” is the place of the action.",
  "In 学校で勉強します passiert die Handlung 勉強します in der Schule. Merke: 学校に行きます → Ziel. 学校で勉強します → Ort der Handlung.":
    "In 学校で勉強します, the action 勉強します happens at school. Remember: 学校に行きます → destination. 学校で勉強します → place of action.",
  "„を“ zeigt das Objekt einer Handlung – das, worauf sich das Verb bezieht. In 日本語を勉強します ist „日本語“ das, was du lernst. Verwechsle „を“ nicht mit „に“ (Ziel) oder „で“ (Ort): 日本語を勉強します bleibt richtig, egal wo oder wohin du gehst.":
    "“を” marks the object of an action — what the verb applies to. In 日本語を勉強します, “日本語” is what you study. Don't confuse “を” with “に” (destination) or “で” (place): 日本語を勉強します stays correct no matter where you are or where you're going.",
  "„今日は学校に行きます“ bedeutet „Heute gehe ich zur Schule“. Das „は“ nach „今日“ zeigt: Heute ist das Thema dieses Satzes. Achte auf die Reihenfolge: [Zeit] + は + [Ziel] + に + 行きます. „明日“ bedeutet „morgen“ – das lernst du erst in einer späteren Etappe.":
    "“今日は学校に行きます” means “Today I go to school.” The “は” after “今日” shows that today is the topic of the sentence. Watch the order: [time] + は + [destination] + に + 行きます. “明日” means “tomorrow” — you'll learn that in a later stage.",
  "Das Muster [Sprache] + を + 勉強します funktioniert immer: 日本語を勉強します = Ich lerne Japanisch. Ein häufiger Fehler ist „に“ statt „を“ zu benutzen – „に“ passt hier nicht, weil 日本語 kein Ziel ist, sondern das, was du lernst. Verwechsle „勉強します“ (lernen) auch nicht mit anderen Verben wie „飲みます“ (trinken).":
    "The pattern [language] + を + 勉強します always works: 日本語を勉強します = I study Japanese. A common mistake is using “に” instead of “を” — “に” doesn't fit here, because 日本語 isn't a destination but the thing you study. Also don't confuse “勉強します” (to study) with other verbs like “飲みます” (to drink).",
  "„と“ zeigt, mit wem du etwas zusammen machst: 先生と日本語を勉強します = Ich lerne mit dem Lehrer Japanisch. Verwechsle „と“ (mit) nicht mit „に“ – „先生に日本語を勉強します“ klingt falsch. Merke dir „と“ einfach als „zusammen mit“.":
    "“と” shows who you do something together with: 先生と日本語を勉強します = I study Japanese with the teacher. Don't confuse “と” (with) with “に” — “先生に日本語を勉強します” sounds wrong. Just remember “と” as “together with.”",
  "Beide Sätze benutzen „学校“, aber mit unterschiedlichen Partikeln: 学校に行きます = Ich gehe zur Schule (に = Ziel). 学校で勉強します = Ich lerne in der Schule (で = Ort der Handlung). Wenn du beide Sätze zusammen übst, prägt sich der Unterschied am besten ein.":
    "Both sentences use “学校” but with different particles: 学校に行きます = I go to school (に = destination). 学校で勉強します = I study at school (で = place of action). Practicing both together makes the difference stick best.",
  "Beide Sätze benutzen „学校“, aber mit unterschiedlichen Partikeln: 学校に行きます zeigt das Ziel (wohin du gehst), 学校で勉強します zeigt den Ort der Handlung (wo du lernst). Der gleiche Unterschied gilt für jeden Ort. Übe beide Sätze zusammen, dann bleibt der Unterschied im Kopf.":
    "Both sentences use “学校” but with different particles: 学校に行きます shows the destination (where you go), 学校で勉強します shows the place of action (where you study). The same distinction applies to any place. Practice both together and the difference will stay with you.",
  "„今日は学校で日本語を勉強します“ besteht aus vier Bausteinen: „今日は“ (heute, als Thema), „学校で“ (Ort der Handlung), „日本語を“ (was du lernst) und „勉強します“ (die Handlung selbst). Diese vier Teile hast du einzeln in der Schule-Etappe geübt – hier kombinierst du sie zu einem vollständigen Satz.":
    "“今日は学校で日本語を勉強します” has four building blocks: “今日は” (today, as the topic), “学校で” (place of action), “日本語を” (what you study), and “勉強します” (the action itself). You practiced these four parts one by one in the School stage — here you combine them into a complete sentence.",
  "„今日は学校で日本語を勉強します“ besteht aus vier Bausteinen: „今日は“ setzt heute als Thema, „学校で“ zeigt den Ort der Handlung, „日本語を“ zeigt, was du lernst, und „勉強します“ ist die Handlung selbst. Zusammen ergibt das: Heute lerne ich in der Schule Japanisch. Genau diese vier Bausteine hast du in dieser Etappe einzeln geübt – jetzt kombinierst du sie zu einem vollständigen Satz.":
    "“今日は学校で日本語を勉強します” has four building blocks: “今日は” sets today as the topic, “学校で” shows the place of action, “日本語を” shows what you study, and “勉強します” is the action itself. Together they mean: Today I study Japanese at school. You practiced these four blocks one by one in this stage — now you combine them into a complete sentence.",
  "„友だち“ bedeutet „Freund“ oder „Freundin“ und ist für sich genommen weder locker noch höflich – die Höflichkeit entscheidet sich erst am Satzende.":
    "“友だち” means “friend” and on its own is neither casual nor polite — the politeness is decided only by the sentence ending.",
  "„友だち“ bedeutet „Freund“ oder „Freundin“. Ob ein Satz mit „友だち“ locker oder höflich klingt, hängt vom Satzende ab: 今日、友だちに会う (locker, unter Freunden) oder 今日、友だちに会います (höflich, z. B. gegenüber einer Lehrkraft). Ein häufiger Anfängerfehler ist zu denken, „友だち“ selbst sei ein lockeres Wort – das Wort bleibt neutral, nur die Form ändert sich.":
    "“友だち” means “friend.” Whether a sentence with “友だち” sounds casual or polite depends on the ending: 今日、友だちに会う (casual, among friends) or 今日、友だちに会います (polite, e.g. toward a teacher). A common beginner mistake is thinking “友だち” itself is a casual word — the word stays neutral; only the form changes.",
  "„会う“ bedeutet „treffen“, höflich „会います“. Muster: [Person] + に + 会う/会います. „友だちに会う“ klingt unter Freunden ganz normal; „友だちに会います“ ist die sichere, höfliche Variante für weniger vertraute Situationen. Verwechsle „に“ nicht mit „と“ – das benutzt du eher bei „話す“.":
    "“会う” means “to meet,” politely “会います”. Pattern: [person] + に + 会う/会います. “友だちに会う” sounds perfectly normal among friends; “友だちに会います” is the safe, polite version for less familiar situations. Don't confuse “に” with “と” — you use that more with “話す”.",
  "„会う“ bedeutet „treffen“. Mit „に“ zeigst du, wen du triffst: „友だちに会う“ (locker) oder „友だちに会います“ (höflich).":
    "“会う” means “to meet.” With “に” you show who you meet: “友だちに会う” (casual) or “友だちに会います” (polite).",
  "„話す“ bedeutet „sprechen“, höflich „話します“. „友だちと話す“ klingt unter Freunden natürlich; für eine Lehrkraft oder eine unbekannte Person wählst du eher „先生と話します“. Die einfache Form „話す“ ist dabei nicht unhöflich – sie passt einfach besser zu einem lockeren Gespräch.":
    "“話す” means “to talk,” politely “話します”. “友だちと話す” sounds natural among friends; for a teacher or someone you don't know you'd choose “先生と話します”. The plain form “話す” isn't rude — it simply fits a casual conversation better.",
  "„好き“ bedeutet „mögen“ oder „gern haben“. Das Partikel „が“ zeigt, was du magst, egal ob locker oder höflich: „友だちが好き“ (locker) oder „友だちが好きです“ (höflich). Ein häufiger Fehler ist, „が“ hier durch „を“ zu ersetzen – das klingt falsch.":
    "“好き” means “to like.” The particle “が” shows what you like, whether casual or polite: “友だちが好き” (casual) or “友だちが好きです” (polite). A common mistake is replacing “が” with “を” here — that sounds wrong.",
  "„明日“ bedeutet „morgen“. Ob der Satz locker oder höflich klingt, entscheidet nicht „明日“, sondern das Verb am Ende: „明日、友だちに会う“ (locker) oder „明日、友だちに会います“ (höflich). Beide Sätze bedeuten dasselbe – nur der Ton unterscheidet sich.":
    "“明日” means “tomorrow.” Whether the sentence sounds casual or polite isn't decided by “明日” but by the verb at the end: “明日、友だちに会う” (casual) or “明日、友だちに会います” (polite). Both sentences mean the same thing — only the tone differs.",
  "„勉強する“ bedeutet „lernen“ oder „studieren“, höflich „勉強します“. Das Muster ist immer [Fach/Sprache] + を + 勉強します: 日本語を勉強します = Ich lerne Japanisch, 学校で勉強します = Ich lerne in der Schule. Anders als im Deutschen brauchst du für das Lernobjekt immer „を“ – nicht einfach nur das Wort direkt vor dem Verb.":
    "“勉強する” means “to study,” politely “勉強します”. The pattern is always [subject/language] + を + 勉強します: 日本語を勉強します = I study Japanese, 学校で勉強します = I study at school. Unlike in English, the thing you study always needs “を” — not just the word placed right before the verb.",
  "„行く“ heißt „gehen“, höflich „行きます“. Das Ziel bekommt immer „に“: ホテルに行きます = Ich gehe zum Hotel. Ein häufiger Fehler ist, hier „で“ statt „に“ zu benutzen – „で“ ist für das Verkehrsmittel reserviert. Eselsbrücke: „に“ zeigt wie ein Pfeil auf den Ort, wo du hinwillst.":
    "“行く” means “to go,” politely “行きます”. The destination always takes “に”: ホテルに行きます = I go to the hotel. A common mistake is using “で” instead of “に” here — “で” is reserved for the means of transport. Memory aid: “に” points like an arrow at the place you're heading.",
  "„ホテル“ kommt aus dem Englischen und wird genauso benutzt wie im Deutschen, deshalb ist es leicht zu merken. „ホテルに行きます“ heißt „Ich gehe zum Hotel“ – „に“ markiert hier das Ziel. Ein typischer Fehler ist, „で“ statt „に“ zu benutzen; „で“ ist für das Verkehrsmittel, nicht das Ziel. Merk dir das Paar: 電車で (womit) + ホテルに (wohin).":
    "“ホテル” comes from English and is used just like “hotel,” so it's easy to remember. “ホテルに行きます” means “I go to the hotel” — here “に” marks the destination. A typical mistake is using “で” instead of “に”; “で” is for the means of transport, not the destination. Remember the pair: 電車で (by what) + ホテルに (to where).",
  "„今日“ bedeutet „heute“, gesprochen „きょう“. Meistens steht es ganz am Satzanfang: 今日は学校に行きます = Heute gehe ich zur Schule, 今日、日本語を勉強します = Heute lerne ich Japanisch. Das „は“ nach „今日“ wird „wa“ ausgesprochen, nicht „ha“ – ein klassischer Stolperstein für Anfänger, den du dir am besten sofort einprägst.":
    "“今日” means “today,” pronounced “きょう”. It usually comes right at the start of the sentence: 今日は学校に行きます = Today I go to school, 今日、日本語を勉強します = Today I study Japanese. The “は” after “今日” is pronounced “wa,” not “ha” — a classic beginner pitfall that's best to lock in right away.",
  "„日本語“ bedeutet „Japanisch“ bzw. „die japanische Sprache“. Mit „日本語を勉強します“ sagst du „Ich lerne Japanisch“, mit „日本語が好きです“ sagst du „Ich mag Japanisch“. Verwechsle „日本“ (Japan, das Land) nicht mit „日本語“ (Japanisch, die Sprache) – das „語“ am Ende steht für „Sprache“ und taucht bei vielen Sprachnamen auf.":
    "“日本語” means “Japanese,” i.e. the Japanese language. With “日本語を勉強します” you say “I study Japanese”; with “日本語が好きです” you say “I like Japanese.” Don't confuse “日本” (Japan, the country) with “日本語” (Japanese, the language) — the “語” at the end means “language” and appears in many language names.",

  // ---------------------------------------------------------------------------
  // Final-challenge / combination long explanations.
  // ---------------------------------------------------------------------------
  "Café: „ください“ ist die höfliche Bestellung bei der Servicekraft – „A と B をください“ bestellt gleich zwei Dinge auf einmal, wie in „コーヒーとパンをください“. Schule: „学校で“ zeigt den Ort der Handlung, „日本語を“ zeigt, was du lernst – zusammen mit „今日は“ und „勉強します“ wird daraus ein vollständiger, höflicher Satz für die Lehrkraft. Freunde: Die einfache Form „会う“ ist unter engen Freunden ganz natürlich, nicht unhöflich – nur locker. Mit diesen drei Sätzen zeigst du, dass du Wörter und Ton aus deiner ganzen ersten Reise sicher kombinieren kannst.":
    "Café: “ください” is the polite way to order from staff — “A と B をください” orders two things at once, as in “コーヒーとパンをください”. School: “学校で” shows the place of action, “日本語を” shows what you study — together with “今日は” and “勉強します” it becomes a complete, polite sentence for the teacher. Friends: the plain form “会う” is perfectly natural among close friends, not rude — just casual. With these three sentences you show you can confidently combine the words and tone from your whole first journey.",
  "Diese Abschluss-Challenge verbindet Café, Schule und Freunde – deine ganze erste Reise in drei Sätzen.":
    "This final challenge brings café, school, and friends together — your whole first journey in three sentences.",
  "„と“ verbindet zwei Nomen wie „und“: コーヒーとパン. Mit „〜をください“ dahinter wird daraus eine höfliche Bestellung bei der Servicekraft: コーヒーとパンをください。 Das Muster funktioniert für jede Kombination, die du im Café gelernt hast, zum Beispiel auch 水とパンをください。 „ください“ ist dabei kein Ehrenwort, sondern einfach dein Standard-Bestellwort.":
    "“と” links two nouns like “and”: コーヒーとパン. Add “〜をください” and it becomes a polite order to the staff: コーヒーとパンをください。 The pattern works for any combination you learned at the café, for example 水とパンをください。 “ください” isn't a fancy honorific — it's simply your standard word for ordering.",
  "Café: „ください“ ist die höfliche Bestellung – „A と B をください“ bestellt zwei Dinge auf einmal.":
    "Café: “ください” is the polite way to order — “A と B をください” orders two things at once.",
  "Der Satz verbindet Zeit (今日は), Ort (学校で), Lerninhalt (日本語を) und Handlung (勉強します).":
    "The sentence combines time (今日は), place (学校で), study content (日本語を), and action (勉強します).",
  "Der Satz verbindet Zeit, Ort und Lerninhalt.": "The sentence combines time, place, and study content.",
  "Der Satz verbindet die Person, mit der du sprichst, und den passenden Ton.":
    "The sentence combines the person you're talking to with the fitting tone.",
  "„今日は友だちと話す“ passt zu einem engen Freund (A), „今日は先生と話します“ passt zu einer Lehrkraft (B). Gleicher Inhalt, unterschiedlicher Ton – je nachdem, mit wem du sprichst.":
    "“今日は友だちと話す” fits a close friend (A); “今日は先生と話します” fits a teacher (B). Same content, different tone — depending on who you're talking to.",
  "„今日は友だちに会う“ ist nicht falsch, klingt aber einer Lehrkraft gegenüber zu locker. Mit „今日は友だちに会います“ bleibst du höflich und trotzdem klar verständlich.":
    "“今日は友だちに会う” isn't wrong, but it sounds too casual toward a teacher. With “今日は友だちに会います” you stay polite while remaining perfectly clear.",
  "„明日は学校に行く“ und „明日は学校に行きます“ haben dieselbe Bedeutung: „Morgen gehe ich zur Schule“. Nur die Satzendung ändert sich: „行く“ ist die lockere Form für einen Freund, „行きます“ die höfliche Form für eine Lehrkraft. Der Rest des Satzes bleibt gleich.":
    "“明日は学校に行く” and “明日は学校に行きます” have the same meaning: “Tomorrow I go to school.” Only the ending changes: “行く” is the casual form for a friend, “行きます” the polite form for a teacher. The rest of the sentence stays the same.",
  "In Situation 1 (Freund) passt die lockere Form „好き“, in Situation 2 (fremde Person) die höfliche Form „好きです“. Das Partikel „が“ bleibt in beiden Fällen gleich – nur das Satzende zeigt den Unterschied im Ton.":
    "In situation 1 (friend) the casual form “好き” fits; in situation 2 (stranger) the polite form “好きです”. The particle “が” stays the same in both — only the ending shows the difference in tone.",
  "„友だちと話す“ passt zu einem Freund (Situation A), „先生と話します“ passt zu einer Lehrkraft oder Servicepersonal (Situation B). Beide Formen sind korrektes Japanisch – nur der Ton unterscheidet sich, nicht die Grammatik. Achte auf die Distraktoren: „が“ statt „と“ ändert die Bedeutung, und vertauschte Formen passen nicht mehr zur Situation.":
    "“友だちと話す” fits a friend (situation A); “先生と話します” fits a teacher or staff (situation B). Both forms are correct Japanese — only the tone differs, not the grammar. Watch the distractors: “が” instead of “と” changes the meaning, and swapped forms no longer fit the situation.",
  "„友だちに会う“ ist nicht unhöflich, klingt aber unter Freunden lockerer. Bei einer Lehrkraft oder einer fremden Person ist „会います“ die natürlichere Wahl.":
    "“友だちに会う” isn't rude, but it sounds more casual among friends. With a teacher or a stranger, “会います” is the more natural choice.",
  "„友だちと話します“ ist nicht falsch, klingt aber unter engen Freunden oft distanzierter. In einem lockeren Gespräch wählt man meist die einfache Form „話す“.":
    "“友だちと話します” isn't wrong, but among close friends it often sounds a bit distant. In a casual conversation you'd usually pick the plain form “話す”.",
  "Auf eine lockere Frage wie „Was machst du heute?“ antwortest du unter Freunden am natürlichsten mit der einfachen Form: „今日は友だちに会う“. Das Subjekt „ich“ sagt man im Japanischen meist nicht extra.":
    "To a casual question like “What are you doing today?” you answer most naturally among friends with the plain form: “今日は友だちに会う”. In Japanese, you usually don't say the subject “I” explicitly.",
  "„明日、友だちに会います“ ist grammatisch genauso richtig wie die lockere Form – nur der Ton ist höflicher und passt besser zu einer weniger vertrauten Person. Genau wie bei „先生と日本語を勉強します“ bleibst du mit „-masu“ auch gegenüber einer Lehrkraft sicher höflich. Die lockere Form ist dabei kein Fehler, nur weniger passend in dieser Situation.":
    "“明日、友だちに会います” is grammatically just as correct as the casual form — only the tone is more polite and fits someone you're less close to. Just as with “先生と日本語を勉強します,” “-masu” keeps you safely polite even toward a teacher. The casual form isn't a mistake here, just less fitting in this situation.",
  "„明日、友だちに会う“ ist die lockere Form für „Morgen treffe ich einen Freund“. Die einfache Form ist nicht unhöflich – sie passt einfach zu einer vertrauten Person wie einem engen Freund. Genauso bleibt „友だちが好き“ (ohne です) unter Freunden ganz natürlich.":
    "“明日、友だちに会う” is the casual form of “Tomorrow I meet a friend.” The plain form isn't rude — it simply fits someone close, like a good friend. In the same way, “友だちが好き” (without です) stays perfectly natural among friends.",
  "„明日、友だちに会う“ und „明日、友だちに会います“ heißen beide „Morgen treffe ich einen Freund“. Nur das Satzende ändert sich: „会う“ ist locker, „会います“ ist höflich. Genau das macht diese zwei Sätze zu einem Paar.":
    "“明日、友だちに会う” and “明日、友だちに会います” both mean “Tomorrow I meet a friend.” Only the ending changes: “会う” is casual, “会います” is polite. That's exactly what makes these two a pair.",
  "Zukunftspläne beschreibst du im Japanischen mit derselben Verbform wie die Gegenwart.":
    "In Japanese, you describe future plans with the same verb form as the present.",

  // ---------------------------------------------------------------------------
  // Speech-challenge captions carried in data (speechGerman-style) & extras.
  // ---------------------------------------------------------------------------
  "Der Satz verbindet Zeit, Ort und Lerninhalt zu einem vollständigen Satz.":
    "The sentence combines time, place, and study content into one complete sentence.",

  // ---------------------------------------------------------------------------
  // Memory hooks (memoryHookGerman) — vocab collection entries.
  // ---------------------------------------------------------------------------
  "コーヒー + をください = Einen Kaffee bitte.": "コーヒー + をください = A coffee, please.",
  "水をください ist einer der sichersten Bestellsätze für Anfänger.":
    "水をください is one of the safest ordering sentences for beginners.",
  "Mit と verbindest du zwei Dinge: コーヒーとパン.": "Use と to join two things: コーヒーとパン.",
  "Getränk + を + 飲む: 水を飲む.": "Drink + を + 飲む: 水を飲む.",
  "Vor 食べる steht das Essen häufig mit を: パンを食べる.":
    "Before 食べる the food often takes を: パンを食べる.",
  "駅はどこですか = Wo ist der Bahnhof? Das Muster passt für jeden Ort.":
    "駅はどこですか = Where is the station? The pattern fits any place.",
  "トイレはどこですか – am besten mit すみません davor.":
    "トイレはどこですか — best with すみません in front.",
  "Das Ziel bekommt に: 駅に行きます.": "The destination takes に: 駅に行きます.",
  "[Ort] + はどこですか funktioniert überall.": "[Place] + はどこですか works everywhere.",
  "すみません、 + Frage = die höfliche Eröffnung.": "すみません、 + question = the polite opener.",
  "右です = Es ist rechts. Kurz und vollständig.":
    "右です = It's on the right. Short and complete.",
  "左です = Es ist links. Immer als Paar mit 右 üben.":
    "左です = It's on the left. Always practice as a pair with 右.",
  "駅は近いです = Der Bahnhof ist nah.": "駅は近いです = The station is near.",
  "ホテルは遠いです – das Gegenteil von 近いです.": "ホテルは遠いです — the opposite of 近いです.",
  "先生に聞きます = Ich frage die Lehrkraft.": "先生に聞きます = I ask the teacher.",
  "学校に行きます (wohin) – 学校で勉強します (wo).":
    "学校に行きます (to where) — 学校で勉強します (where).",
  "日本語を勉強します = Ich lerne Japanisch.": "日本語を勉強します = I study Japanese.",
  "日本 = Japan, 日本語 = Japanisch. 語 steht für Sprache.":
    "日本 = Japan, 日本語 = Japanese. 語 stands for language.",
  "Das は nach 今日 sprichst du „wa“ aus: 今日は…": "The は after 今日 is pronounced “wa”: 今日は…",
  "友だちに会う (locker) – 友だちに会います (höflich).":
    "友だちに会う (casual) — 友だちに会います (polite).",
  "明日、友だちに会います – gleiche Verbform wie heute.":
    "明日、友だちに会います — same verb form as for today.",

  // ---------------------------------------------------------------------------
  // Usage-role lines (usageRoleGerman) — vocab collection entries.
  // ---------------------------------------------------------------------------
  "Du benutzt das Wort beim Bestellen oder wenn du über Getränke sprichst.":
    "You use this word when ordering or talking about drinks.",
  "水 brauchst du beim Bestellen und in vielen einfachen Alltagssätzen.":
    "You'll need 水 when ordering and in many simple everyday sentences.",
  "パン verwendest du beim Bestellen und wenn du über Essen sprichst.":
    "You use パン when ordering and when talking about food.",
  "飲む benutzt du für Wasser, Kaffee und andere Getränke.":
    "You use 飲む for water, coffee, and other drinks.",
  "食べる beschreibt, dass jemand etwas isst.": "食べる describes someone eating something.",
  "駅 brauchst du, wenn du nach dem Bahnhof fragst oder dein Ziel nennst.":
    "You'll need 駅 when asking for the station or naming your destination.",
  "ホテル benutzt du, wenn du dein Ziel nennst oder nach dem Weg fragst.":
    "You use ホテル when naming your destination or asking for directions.",
  "電車 brauchst du, wenn du sagst, womit du unterwegs bist.":
    "You'll need 電車 when saying what you're traveling by.",
  "トイレ brauchst du, um höflich nach der Toilette zu fragen.":
    "You'll need トイレ to politely ask where the toilet is.",
  "行く beschreibt, dass du irgendwohin gehst oder fährst.":
    "行く describes going somewhere.",
  "どこ benutzt du, um nach Orten zu fragen.": "You use どこ to ask about places.",
  "すみません sagst du, bevor du jemanden ansprichst – oder um dich zu entschuldigen.":
    "You say すみません before approaching someone — or to apologize.",
  "右 brauchst du, um Richtungen zu verstehen und selbst anzugeben.":
    "You'll need 右 to understand directions and give them yourself.",
  "左 brauchst du für Richtungen – beim Antworten und beim Zuhören.":
    "You'll need 左 for directions — both answering and listening.",
  "近い beschreibt, dass etwas nah ist – praktisch bei Wegen und Zielen.":
    "近い describes something being near — handy for routes and destinations.",
  "遠い beschreibt, dass etwas weit entfernt ist.": "遠い describes something being far away.",
  "学校 benutzt du, wenn du über Schule und Lernen sprichst.":
    "You use 学校 when talking about school and studying.",
  "先生 ist die Anrede für Lehrkräfte – und ein Wort, das du nie für dich selbst benutzt.":
    "先生 is the way to address teachers — and a word you never use for yourself.",
  "日本語 benutzt du, wenn du über die japanische Sprache sprichst.":
    "You use 日本語 when talking about the Japanese language.",
  "勉強する beschreibt, dass du etwas lernst oder studierst.":
    "勉強する describes studying something.",
  "今日 benutzt du, um über den heutigen Tag zu sprechen.":
    "You use 今日 to talk about today.",
  "友だち benutzt du, wenn du über Freundinnen und Freunde sprichst.":
    "You use 友だち when talking about friends.",
  "会う beschreibt, dass du jemanden triffst.": "会う describes meeting someone.",
  "話す beschreibt, dass du mit jemandem sprichst.": "話す describes talking with someone.",
  "明日 benutzt du für Pläne und alles, was morgen passiert.":
    "You use 明日 for plans and anything happening tomorrow.",
  "好き benutzt du, um zu sagen, was du magst.": "You use 好き to say what you like.",

  // ---------------------------------------------------------------------------
  // Dex descriptions (dexDescriptionGerman) — dry field-guide humor preserved.
  // ---------------------------------------------------------------------------
  "Wird am Morgen besonders häufig herbeigerufen. Im Café gehört diese Karte zu den zuverlässigsten Klassikern.":
    "Summoned especially often in the mornings. At the café, this card is one of the most reliable classics.",
  "Der stille Held jeder Reise. Taucht zuverlässig auf, wenn Kaffee, Hitze oder ein langer Tag ihren Tribut fordern.":
    "The quiet hero of every trip. Reliably shows up when coffee, heat, or a long day take their toll.",
  "Klein, praktisch und erstaunlich oft in der Nähe von Kaffee anzutreffen. Im Café bildet es schnell ein gutes Duo.":
    "Small, handy, and surprisingly often found near coffee. At the café it quickly makes a good duo.",
  "Der natürliche Gegner eines vollen Glases. Auch dieses Verb arbeitet besonders gern mit を zusammen.":
    "The natural nemesis of a full glass. This verb, too, loves working together with を.",
  "Dieses Verb wird aktiv, sobald etwas Essbares auf dem Tisch liegt. Sein bevorzugter Begleiter ist die Partikel を.":
    "This verb springs into action the moment something edible is on the table. Its favorite companion is the particle を.",
  "Der große Knotenpunkt jeder Reise. Wer diese Karte kennt, findet fast immer einen Weg nach Hause.":
    "The great hub of every journey. Know this card and you'll almost always find a way home.",
  "Ruht tagsüber unauffällig in der Stadt und wird am Abend zum wichtigsten Ziel müder Reisender.":
    "Rests quietly in the city by day and becomes the top destination of weary travelers by evening.",
  "Rollt pünktlich durchs ganze Land und nimmt jeden mit, der die richtige Partikel dabei hat.":
    "Rolls punctually across the whole country and takes along anyone carrying the right particle.",
  "Unscheinbar im Alltag, aber in dringenden Momenten die wertvollste Karte des ganzen Zukans.":
    "Unremarkable day to day, but in urgent moments the most valuable card in the whole Zukan.",
  "Ein rastloses Verb, das nie lange stehen bleibt. Wo ein Ziel auftaucht, ist es kurz danach zur Stelle.":
    "A restless verb that never stays put for long. Wherever a destination appears, it's there soon after.",
  "Das neugierigste Wort der Sammlung. Es stellt immer dieselbe Frage – und bekommt jedes Mal eine neue Antwort.":
    "The most curious word in the collection. It always asks the same question — and gets a new answer every time.",
  "Öffnet Gespräche, entschuldigt kleine Missgeschicke und holt freundlich Aufmerksamkeit. Kaum ein Wort ist vielseitiger.":
    "Opens conversations, apologizes for small mishaps, and kindly gets attention. Few words are more versatile.",
  "Zeigt zuverlässig in eine Richtung und wird bei Wegbeschreibungen ständig gesichtet. Reist fast immer gemeinsam mit 左.":
    "Reliably points one way and is spotted constantly in directions. Almost always travels together with 左.",
  "Der Zwilling von 右 – nur mit anderer Blickrichtung. Wer beide zusammen lernt, verwechselt sie deutlich seltener.":
    "The twin of 右 — just facing the other way. Learn the two together and you'll mix them up far less.",
  "Ein freundliches Adjektiv, das kurze Wege verspricht. Sein Gegenspieler 遠い ist übrigens nie weit entfernt.":
    "A friendly adjective that promises short walks. Its rival 遠い, by the way, is never far away.",
  "Klingt nach langen Wegen und müden Füßen. Taucht diese Karte auf, lohnt sich vielleicht doch der Zug.":
    "Sounds like long walks and tired feet. If this card turns up, maybe the train is worth it after all.",
  "Ein Ort voller Tafeln, Hefte und neuer Wörter. Besonders gut befreundet mit den Partikeln に und で.":
    "A place full of blackboards, notebooks, and new words. Especially good friends with the particles に and で.",
  "Ein respektvoller Titel, der Wissen weitergibt. Auch Ärztinnen und Ärzte hören in Japan auf diese Anrede.":
    "A respectful title for someone who passes on knowledge. In Japan, doctors answer to it too.",
  "Die Sprache selbst, festgehalten als Eintrag. Das 語 am Ende verrät: Hier geht es ums Sprechen, nicht ums Land.":
    "The language itself, captured as an entry. The 語 at the end gives it away: this is about speech, not the country.",
  "Ein fleißiges Verb, das dich durch den ganzen Zukan begleitet. Es arbeitet am liebsten mit を zusammen.":
    "A hard-working verb that keeps you company across the whole Zukan. It likes working with を best.",
  "Erscheint jeden Morgen frisch und stellt sich am liebsten an den Satzanfang. Kleiner Auftritt, großer Stolperstein.":
    "Shows up fresh every morning and likes to stand at the front of the sentence. Small role, big pitfall.",
  "Selbst weder locker noch höflich – der Ton kommt vom Satzende. Eine verlässliche Begleitung für viele weitere Wörter.":
    "Neither casual nor polite by itself — the tone comes from the sentence ending. A reliable companion for many more words.",
  "Wird immer dann aktiv, wenn zwei Menschen denselben Ort ansteuern. Personen merkt es sich mit der Partikel に.":
    "Springs into action whenever two people head for the same spot. It notes people with the particle に.",
  "Ein geselliges Verb, das ungern allein bleibt. Mit と holt es sich immer jemanden zum Reden dazu.":
    "A sociable verb that hates being alone. With と it always brings someone along to talk to.",
  "Immer einen Tag voraus und trotzdem nie zu früh dran. Für seine Pläne braucht es keine eigene Zukunftsform.":
    "Always a day ahead and yet never early. It needs no special future form for its plans.",
  "Der herzlichste Eintrag der Sammlung. Was ihm gefällt, markiert es treu mit der Partikel が.":
    "The warmest entry in the collection. Whatever it likes, it faithfully marks with the particle が.",

  // ---------------------------------------------------------------------------
  // Culture notes (japanNoteGerman) — facts and hedging preserved.
  // ---------------------------------------------------------------------------
  "Kaffee bekommst du in Japan nicht nur im Café: Viele Convenience Stores haben frische Kaffeemaschinen, und an Getränkeautomaten gibt es Kaffee in Dosen – im Winter oft sogar warm.":
    "You don't only get coffee at cafés in Japan: many convenience stores have fresh coffee machines, and vending machines sell canned coffee — often warm in winter.",
  "In vielen Restaurants in Japan bekommst du kostenlos Wasser oder Tee serviert, häufig schon beim Hinsetzen. Extra bestellen musst du es dann gar nicht – aber 水をください funktioniert überall.":
    "At many restaurants in Japan you're served water or tea for free, often as soon as you sit down. You don't need to order it separately — but 水をください works everywhere.",
  "パン kam im 16. Jahrhundert mit portugiesischen Händlern und Missionaren nach Japan – vom portugiesischen „pão“. Deshalb klingt es weder wie das englische „bread“ noch wie „Brot“.":
    "パン came to Japan in the 16th century with Portuguese traders and missionaries — from the Portuguese “pão.” That's why it sounds like neither the English “bread” nor the German “Brot.”",
  "Anders als im Deutschen „nimmt“ man Medizin im Japanischen nicht – man „trinkt“ sie: 薬を飲む („Medizin trinken“) sagt man auch bei Tabletten. 飲む deckt also mehr ab als das deutsche „trinken“.":
    "Unlike in English, in Japanese you don't “take” medicine — you “drink” it: 薬を飲む (“drink medicine”) is used even for tablets. So 飲む covers more ground than the English “drink.”",
  "Im Japanischen lässt man das Subjekt oft weg, wenn es aus dem Kontext klar ist: パンを食べます kann „ich esse“, „sie isst“ oder „wir essen“ bedeuten. Das Muster Essen + を + 食べる bleibt dabei immer gleich.":
    "In Japanese the subject is often left out when it's clear from context: パンを食べます can mean “I eat,” “she eats,” or “we eat.” The pattern food + を + 食べる stays the same throughout.",
  "Auf japanischen Bahnhofsschildern steht der Stationsname meist gleich mehrfach: in Kanji, in Hiragana und in lateinischen Buchstaben. So kannst du Stationsnamen oft auch ohne Kanji-Kenntnisse lesen.":
    "On Japanese station signs the station name usually appears several times over: in kanji, in hiragana, and in Latin letters. So you can often read station names even without knowing kanji.",
  "Neben dem ホテル gibt es in Japan das Ryokan (旅館): eine traditionelle Unterkunft mit Tatami-Böden und Futon-Betten. Auf Buchungsseiten begegnen dir häufig beide Wörter nebeneinander.":
    "Alongside the ホテル, Japan has the ryokan (旅館): a traditional inn with tatami floors and futon bedding. On booking sites you'll often see both words side by side.",
  "In Tokio und anderen Großstädten fahren die 電車 tagsüber in sehr kurzen Abständen. Ansagen und Anzeigen sind auf vielen Strecken zusätzlich auf Englisch – die Stationsmelodien bleiben trotzdem ein Erlebnis.":
    "In Tokyo and other big cities the 電車 run at very short intervals during the day. On many lines, announcements and displays are also in English — though the station jingles are still an experience.",
  "Öffentliche Toiletten sind in Japan häufig kostenlos und gut gepflegt – in Bahnhöfen, Kaufhäusern und Convenience Stores. Viele haben beheizte Sitze und ein Bedienfeld mit erstaunlich vielen Knöpfen.":
    "Public toilets in Japan are often free and well kept — in stations, department stores, and convenience stores. Many have heated seats and a control panel with a surprising number of buttons.",
  "行く deckt mehr ab als das deutsche „gehen“: Es heißt auch „fahren“ oder „fliegen“. Wie du ans Ziel kommst, sagt erst das Verkehrsmittel mit で – das Verb selbst bleibt einfach 行く.":
    "行く covers more than the English “go”: it also means “drive” or “fly.” How you get there is only shown by the means of transport with で — the verb itself stays simply 行く.",
  "In Geschäften und höflichen Durchsagen hörst du statt どこ manchmal die höflichere Form どちら. Verstehen reicht – für deine eigenen Fragen ist どこですか völlig in Ordnung.":
    "In shops and polite announcements you'll sometimes hear the more polite どちら instead of どこ. Understanding it is enough — for your own questions, どこですか is perfectly fine.",
  "すみません ist in Japan auch ein kleines Dankeschön: Wer jemanden bemüht hat, sagt oft すみません statt ありがとう. Und im Restaurant ruft man damit ganz normal das Personal – niemand empfindet das als unhöflich.":
    "すみません is also a small “thank you” in Japan: after troubling someone, people often say すみません instead of ありがとう. And in a restaurant it's the normal way to call staff over — no one finds that rude.",
  "Auf Rolltreppen stehen die Menschen in Tokio meist links, in Osaka dagegen oft rechts – ein bekannter regionaler Unterschied. Wer 右 und 左 lesen kann, versteht auch die Hinweisschilder dazu.":
    "On escalators people in Tokyo usually stand on the left, while in Osaka they often stand on the right — a well-known regional difference. If you can read 右 and 左, you'll understand the signs about it too.",
  "In Japan herrscht Linksverkehr: Autos fahren links, und auch auf Gehwegen und Treppen hält man sich oft links. Beim ersten Blick über die Straße lohnt es sich, daran zu denken.":
    "Japan drives on the left: cars keep left, and on sidewalks and stairs people often keep left too. Worth remembering the first time you glance across the street.",
  "In Wohnungsanzeigen taucht oft die Abkürzung 駅近 auf – „nah am Bahnhof“, aus 駅 und 近い zusammengesetzt. Nähe zur Station ist in Japan ein echtes Verkaufsargument.":
    "In apartment listings the abbreviation 駅近 often appears — “close to the station,” made from 駅 and 近い. Being near a station is a real selling point in Japan.",
  "Entfernungen werden in Japan gern in Gehminuten angegeben: 徒歩5分 („5 Minuten zu Fuß“) steht auf vielen Schildern und in Anzeigen. Ob etwas 遠い ist, misst man im Alltag eher in Minuten als in Kilometern.":
    "Distances in Japan are often given in walking minutes: 徒歩5分 (“5 minutes on foot”) appears on many signs and listings. Whether something is 遠い is judged in everyday life more by minutes than by kilometers.",
  "Das japanische Schuljahr beginnt im April – vielerorts genau zur Kirschblütenzeit. Einschulungsfotos unter blühenden Bäumen gehören für viele Familien fest dazu.":
    "The Japanese school year begins in April — in many places right at cherry-blossom season. First-day photos under blooming trees are a fixture for many families.",
  "An Namen wird 先生 direkt angehängt: Aus Herrn Tanaka wird 田中先生. Ein zusätzliches „Herr“ oder „Frau“ braucht es dabei nicht – die Anrede steckt schon im Titel.":
    "先生 is attached directly to a name: Mr. Tanaka becomes 田中先生. No extra “Mr.” or “Ms.” is needed — the honorific is already in the title.",
  "Japanisch mischt drei Schriften oft im selben Satz: Kanji, Hiragana und Katakana. 日本語 selbst besteht aus drei Kanji – und dein Zukan zeigt dir bei jedem Wort mehrere Schreibweisen nebeneinander.":
    "Japanese often mixes three scripts in the same sentence: kanji, hiragana, and katakana. 日本語 itself is made of three kanji — and your Zukan shows several spellings side by side for every word.",
  "勉強 schreibt sich mit den Kanji 勉 („sich anstrengen“) und 強 („stark“). Lernen ist im Japanischen also wörtlich eine kleine Kraftanstrengung – ein Bild, das viele Lernende sofort wiedererkennen.":
    "勉強 is written with the kanji 勉 (“to make an effort”) and 強 (“strong”). So studying in Japanese is literally a small feat of strength — an image many learners recognize at once.",
  "今日 hat zwei Lesungen: きょう („heute“) und こんにち. Die zweite steckt im bekannten Gruß こんにちは – in ihm verbirgt sich also wörtlich ein „dieser Tag“.":
    "今日 has two readings: きょう (“today”) and こんにち. The second is hidden in the familiar greeting こんにちは — which literally contains a “this day.”",
  "友だち siehst du auch als 友達 geschrieben – gleiche Bedeutung, gleiche Aussprache, nur ist das zweite Zeichen einmal Hiragana und einmal Kanji. Lehrbücher für Anfänger nutzen oft die Mischform mit だち.":
    "You'll also see 友だち written as 友達 — same meaning, same pronunciation, only the second character is once hiragana and once kanji. Beginner textbooks often use the mixed form with だち.",
  "Im Deutschen triffst du „jemanden“ – ein direktes Objekt. Im Japanischen begegnest du eher „zu jemandem“: 会う nimmt die Partikel に, nicht を. Dieser kleine Unterschied gehört zu den häufigsten Stolpersteinen.":
    "In English you meet “someone” — a direct object. In Japanese you rather meet “to someone”: 会う takes the particle に, not を. This small difference is one of the most common pitfalls.",
  "Das Kanji 話 aus 話す steckt auch in 電話 („Telefon“) – wörtlich etwa „Elektro-Sprechen“. Und das 電 davor kennst du schon aus 電車.":
    "The kanji 話 from 話す also appears in 電話 (“telephone”) — literally something like “electric talking.” And the 電 in front you already know from 電車.",
  "明日 kann あした oder あす gelesen werden – beides heißt „morgen“. あした ist im Gespräch üblich, あす hörst du eher in Nachrichten und offiziellen Durchsagen.":
    "明日 can be read あした or あす — both mean “tomorrow.” あした is common in conversation, while you'll hear あす more in the news and official announcements.",
  "Das deutsche „mögen“ ist ein Verb – 好き dagegen beschreibt einen Zustand, ungefähr „lieb/angenehm sein“. Genau deshalb steht das, was du magst, mit が und nicht mit を.":
    "The English “to like” is a verb — 好き, by contrast, describes a state, roughly “being dear/pleasant.” That's exactly why the thing you like takes が and not を.",

  // Remaining explanatory strings (review-stage detail tips, particle summaries).
  "Das Muster „〜はどこですか“ funktioniert für jeden Ort: トイレはどこですか, ホテルはどこですか. Noch höflicher wird die Frage mit „すみません“ davor: すみません、駅はどこですか。 Das Fragewort „どこ“ bleibt dabei immer gleich.":
    "The pattern “〜はどこですか” works for any place: トイレはどこですか, ホテルはどこですか. The question gets even more polite with “すみません” in front: すみません、駅はどこですか。 The question word “どこ” stays the same throughout.",
  "„に“ = Ziel (wohin), „で“ = Ort der Handlung (wo etwas passiert).":
    "“に” = destination (to where), “で” = place of action (where something happens).",
  "„食べる“ und „飲む“ sind das wichtigste Verb-Paar aus dem Café: パンを食べます (ich esse Brot), コーヒーを飲みます und 水を飲みます (ich trinke Kaffee/Wasser). Beide Verben stehen am Satzende, das Ding davor bekommt „を“.":
    "“食べる” and “飲む” are the most important verb pair from the café: パンを食べます (I eat bread), コーヒーを飲みます and 水を飲みます (I drink coffee/water). Both verbs come at the end of the sentence, and the thing before them takes “を”.",

  // Japanese-only pairing CHOICES (labels A:/B:/C: + Japanese sentences). Kept
  // identical in English — the Japanese is learning content and is never translated;
  // these identity entries exist so the coverage test can assert full, intentional
  // coverage rather than silently relying on the passthrough fallback.
  "A: 友だちと話す。 B: 先生と話します。": "A: 友だちと話す。 B: 先生と話します。",
  "A: 今日は友だちと話す。 B: 今日は先生と話します。": "A: 今日は友だちと話す。 B: 今日は先生と話します。",
  "A: 今日は友だちと話します。 B: 今日は先生と話す。": "A: 今日は友だちと話します。 B: 今日は先生と話す。",
  "A: 今日は友だちが話す。 B: 今日は先生が話します。": "A: 今日は友だちが話す。 B: 今日は先生が話します。",
  "A: 今日は友だちと話す。 B: 今日は友だちと話します。": "A: 今日は友だちと話す。 B: 今日は友だちと話します。",
  "A: 友だちが話す。 B: 先生が話します。": "A: 友だちが話す。 B: 先生が話します。",
  "A: 友だちと話します。 B: 先生と話す。": "A: 友だちと話します。 B: 先生と話す。",
  "A: 友だちと話す。 B: 友だちと話します。": "A: 友だちと話す。 B: 友だちと話します。",
  "A: コーヒーとパンをください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会う。":
    "A: コーヒーとパンをください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会う。",
  "A: コーヒーとパンをください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会います。":
    "A: コーヒーとパンをください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会います。",
  "A: コーヒーとパンにください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会う。":
    "A: コーヒーとパンにください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会う。",
  "A: コーヒーとパンをください。 B: 今日は学校で日本語を話します。 C: 明日、友だちに会う。":
    "A: コーヒーとパンをください。 B: 今日は学校で日本語を話します。 C: 明日、友だちに会う。",
};
