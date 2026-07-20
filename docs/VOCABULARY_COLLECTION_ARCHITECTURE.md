# Vocabulary Collection Architecture

Stand: 2026-07-19 · 対象: `/vocabulary`(Kotoba-Zukan)の階層コレクション構造

## Purpose

Kotoba-Zukanを Area 2 / Area 3、および同一カテゴリへの章追加(Caféへ「追加注文」「飲み物の種類」「支払い」等)へ拡張しても破綻しない階層モデルにする。表示レイヤーのみの変更で、学習データ・進捗・Auth・Supabase・XP・Quest解放には一切触れない。

階層:

```
Area                    … 大きな学習ブロック(area1 = Erste Schritte in Japan)
└─ Kategorie            … cafe / reise / schule / freunde
   └─ Kapitel (Chapter) … カテゴリ内の1まとまり(拡張の単位)
      └─ Entry          … 1単語(vocab id)
```

## Area

`VocabularyCollectionArea`(`src/types/vocabularyCollection.ts`)。`id`(`CollectionAreaId`)/ `order` / `titleGerman` / `subtitleGerman`。現在は `area1` のみ。将来は `CollectionAreaId` に `"area2"` 等を足し、`vocabularyCollectionAreas` に追記する。

## Category

既存の `CategoryId`(cafe/reise/schule/freunde)をそのまま使う。カテゴリ自体は独立データを持たず、表示は `VocabularyCategoryCollectionData`(タイトル・アイコン)、進捗は章の集約(下記)で表す。**カテゴリは永続的な完成状態を持たない**。

## Chapter

`VocabularyCollectionChapter`。`id` / `areaId` / `categoryId` / `order`(カテゴリ内順) / `titleGerman` / `subtitleGerman` / `entryIds[]`。

`entryIds` が **章メンバーシップと章内順序の唯一の真実源**。各 Entry の `chapterId` / `areaId` / `entryOrder` はモジュール読み込み時に章から導出してマージされるため、二重管理による不整合が起きない(未割当の語があれば読み込み時に例外で早期失敗)。

## Entry

`VocabularyCollectionEntry`。表示メタデータ(`collectionNumber` / `dexDescriptionGerman` / `usageRoleGerman` / `memoryHookGerman`)+ 階層フィールド(`areaId` / `chapterId` / `entryOrder`)。キーは vocab id。

## Stable Collection Numbers

`collectionNumber` は 1〜26 の**安定した図鑑番号**。一度割り当てたら語を追加しても変更しない。用途は UI の図鑑番号表示(`#001`)のみ。**並び替えキーには使わない**(将来、番号順と学習順が乖離しても表示順は階層で決まる)。

## Display Order

並び順は必ず次の優先度:

1. `area.order`
2. カテゴリ順(`COLLECTION_CATEGORY_ORDER` = cafe → reise → schule → freunde)
3. `chapter.order`
4. `entry.entryOrder`
5. (同点時のみ)`collectionNumber`

純関数 `sortCollectionEntries(entryIds)` が実装。入力順に依存せず決定的。Area 1 では結果が 1〜26 と一致するため既存表示と完全後方互換。

## Completion Rules

判定は純関数(`getChapterProgress` / `getAreaProgress` / `buildCategoryCollectionView`)。いずれも `isDiscovered(vocabId)` 述語を受け取り、localStorage も hidden テキストも直接読まない(述語はページ側で `getCardStatus` から導出。`getCardStatus` は id/categoryId のみ参照)。

### Chapter Completion

`chapterCompleted` = その章の `entryIds` が全て discovered(= 非hidden)。`total` は**今存在する語のみ**をカウントする。

### Area Completion

`areaCompleted` = そのエリアで**現在公開されている全章**が完了。未実装の将来章は `total` にも章数にも含めない。

## Why Categories Never Become Permanently Complete

同じカテゴリへ今後新しい章が追加されるため、「カテゴリ全体を永久に完成扱いする」判定(`categoryCompleted`)は**廃止**した。カテゴリについて表示できるのは:

- discovered word count(`discoveredWords`)
- available chapter count(`availableChapters` — 今存在する章数)
- completed chapter count(`completedChapters`)
- 各章の進捗(`chapters[]`)

UI のカテゴリパネルは、旧「Komplett」スタンプ(カテゴリ永続完成の含意)を廃し、**現在章**(最初の未完了章、全完了なら最終章)を「Kapitel 1 von 1: Erste Bestellung」形式で表示、章単位の progress bar と章完了時のみの「Kapitel abgeschlossen」スタンプ、常時フッター「Weitere Kapitel folgen.」で構成する。カテゴリの語数は「N Wörter entdeckt」と**分母なし**で表示し、カテゴリ全体の progress bar は表示しない(最終総数が未確定のため)。将来カテゴリに2章目が加わると現在章がその章に切り替わり、スタンプは自動的に消える。

同様に、ページ上部の総合表示はエリアスコープ(「X / Y Einträge in Area 1 entdeckt」)で、全図鑑パーセント表現は使わない。カード一覧は Area → Kategorie → Kapitel の章セクションでグループ表示され(検索中はフラット)、各カードには「Café · Kapitel 1」の階層文脈が付く。Home からの導線は単一の Zukan 入口カード(分母なしの discovered count)に統合されている。

## Current Area 1 Structure

| Chapter id | Kategorie | Titel | entryIds(entryOrder順) | collectionNumber |
|---|---|---|---|---|
| area1-cafe-01 | cafe | Erste Bestellung | coffee, water, bread, drink, eat | 1–5 |
| area1-reise-01 | reise | Orientierung unterwegs | station, hotel, train, toilet, go, where, excuseMe, right, left, near, far | 6–16 |
| area1-schule-01 | schule | Lernen und Sprache | school, teacher, japaneseLanguage, study, today | 17–21 |
| area1-freunde-01 | freunde | Erste Gespräche | friend, meet, talk, tomorrow, like | 22–26 |

entryOrder は Main Quest のカード登録順(questData の `collectedCardIds`)= vocabData 順に一致(クイズ設問順とは別)。

## Future Expansion

- **同カテゴリへ章追加**: 新 `VocabularyCollectionChapter`(例 `area1-cafe-02`「Bezahlen & Extras」)を追記し、新語に content エントリ + 章の `entryIds` を足すだけ。既存 `collectionNumber` は不変、新語は 27, 28, … を採番。カテゴリの「Kapitel geschafft」は自動的に外れる。
- **Area 2 追加**: `CollectionAreaId` に `"area2"` を足し、`vocabularyCollectionAreas` と該当章を追記。並び順は `area.order` で自動的に Area 1 の後ろへ。
- 進捗・sort・view の純関数は無変更で新章/新エリアに対応。

## Backward Compatibility

- 26枚のカード・`collectionNumber`(#001–#026)・表示順(1–26)は不変。
- hidden privacy(getter 非アクセス)・検索・category filter・Sprachstil filter・dialog・発音・Karte üben・Register比較・progress・known/weak は不変。
- 新しい localStorage 値を追加しない。Auth / Supabase / SQL / RLS / Entitlement は無変更。

## Non-goals

大規模UI刷新・文化メモ追加・Area 2実装・Stripe・AI・XP/Level/Quest変更・新認証方式。今回はデータモデルと最小限のパネル文言(Komplett → Kapitel geschafft)のみ。
