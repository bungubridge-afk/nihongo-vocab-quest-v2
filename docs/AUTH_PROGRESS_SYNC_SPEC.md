# Auth Progress Sync Spec

進捗の保存先・移行・競合解決の正式仕様。実装: `src/lib/progress/*`, `src/components/providers/ProgressProvider.tsx`。

## Canonical type

`AppProgress`(progressTypes.ts)が唯一の正規形:
profile / xp / collectedCardIds / completedCategories / unlockedCategories / knownWords / weakWords。
初期値は `createInitialProgress()` = DB triggerの初期JSON = 空localStorage時の挙動、の三者が一致する(自動検証済み)。levelは保存せず常にXPから導出。

## Anonymous mode

- backend: レガシーlocalStorageキー(`nvq_profile`, `nvq_xp`, `nvq_collected_cards`, `nvq_completed_categories`, `nvq_unlocked_categories`, `nvq_known_words`, `nvq_weak_words`)。
- 既存ユーザーのキーを移動・改名・削除しない。Supabase未設定でも完全に動作。
- 書き込みは即時・同期的。ネットワークなし。

## Authenticated mode

- backend: `nvq_user_progress_cache_v1:<user-id>`(単一JSON blob)。
- 書き込みはまずキャッシュへ即時 → 600msデバウンスで `save_user_progress` RPCへ。
- UI(全ページ)は `src/lib/storage.ts` の同一APIを使い続け、保存先を知らない。
- ProgressProviderが `(backendId, dataEpoch)` keyで子を再マウントし、ページの「マウント時に一度読む」ロジックを無変更で活かす。

## Initial migration(初回ログイン)

判定材料: remoteの `revision`(0 = クライアントが一度も保存していない初期行)、匿名進捗の有無(`hasMeaningfulProgress`)、匿名進捗のimport済みマーク(`nvq_anonymous_progress_meta_v1`)。

| ケース | remote | local(匿名) | 動作 |
|---|---|---|---|
| A | revision 0(初期) | 進捗あり・未claim | 匿名進捗を自動import → RPC保存 → 匿名側を「このuserがimport済み」とマーク |
| B | 進捗あり | 初期 | remoteを読み込むだけ |
| C | 進捗あり | 進捗あり・未claim | **remote優先で表示**。自動上書きしない。Accountに「Lokalen Fortschritt importieren」を表示 |
| — | 任意 | 進捗あり・**別ユーザーがclaim済み** | importしない(自動・手動とも)。誤帰属防止 |

- 同じ移行は繰り返さない: importが成功した時点でmetaに `importedIntoUserId` を記録。以後どのアカウントでも自動importは発生しない。
- remote行が存在しない(trigger失敗)場合はrevision 0の初期行と同様に扱い、RPCの自己修復INSERTで作成される。

## Remote precedence / manual import (Case C)

- 手動import = `mergeProgress(anonymous, current)` を保存(非破壊)。確認ダイアログあり。
- merge規則:
  - `xp = max(local, remote)`
  - `collectedCardIds / completedCategories / unlockedCategories = union`
  - `profile = remote優先`(remoteがnullならlocal)
  - **known/weak競合**: どちらかでweakなら**weak優先**(=「üben」に残る安全側)。`weak = union(weakL, weakR)`、`known = union(knownL, knownR) − weak`。1語が両リストに同時に入ることはない。

## Conflict handling / revision

- 保存はRPC `save_user_progress(p_progress, p_expected_revision, p_schema_version)`:
  - 一致 → `revision + 1` で更新、`saved = true`
  - 不一致 → 更新せず `saved = false` + 現在のremote行を返す(無言のlast-write-winsは構造的に不可能)
- `saved = false` を受けたクライアント:
  1. `merged = mergeProgress(local, remote)`
  2. `merged == remote` なら remoteを採用して synced
  3. 違いがあれば remoteのrevisionで**一度だけ**再保存
  4. それも競合したら remoteを採用し **status = error**(Synchronisierung fehlgeschlagen + Erneut versuchen)

## Account separation

- キャッシュ・同期状態はすべて `:<user-id>` でネームスペース。
- backend切替はProgressProviderの再マウントで反映され、別ユーザーのXP・カード・known/weakが画面に残ることはない(fakeクライアントでA→B→A切替を自動検証済み)。
- user IDはstorageキーの内部にのみ存在し、DOM・URL・consoleへは出さない。

## Cache

- ログイン中の表示は常にuser cache(remote採用時はサービスがsilent writeで更新し、dataEpochを+1してページに再読させる)。
- サインアウト時、**全変更が同期済みならキャッシュと同期状態を削除**(共有端末対策)。未同期の変更が残る場合は削除せず保持し、次回同じユーザーのログイン時に `dirty` としてmerge&pushする。

## Retry

- 保存失敗(ネットワーク等)→ status = error、dirty維持。
- `window: online` イベントで自動再試行。
- Accountの「Jetzt synchronisieren / Erneut versuchen」で手動再試行。dirtyがなければremoteの再フェッチ。

## Sign out

1. デバウンスをキャンセルし、dirtyなら最後のflushを試行(セッションが有効なうちに)。
2. 匿名backendへ切替(匿名進捗はログイン中も一切触っていないので、ログイン前の状態がそのまま戻る)。
3. 同期済みならuser cache削除。
4. auth側の `signOut()` 実行。

## Sync states(UI表記)

| status | 表示 |
|---|---|
| local | Nur auf diesem Gerät |
| syncing | Wird synchronisiert … |
| synced | Synchronisiert(+ Zuletzt: <日時>) |
| error | Synchronisierung fehlgeschlagen(+ Erneut versuchen) |

toastは出さない。学習操作はremote保存の成否に関係なく常に成功扱い。

## Failure states まとめ

| 状況 | 挙動 |
|---|---|
| Supabase未設定 | 恒久的にanonymous mode。UIは案内のみ |
| ログイン直後のfetch失敗 | キャッシュを表示、status=error、再試行可能 |
| 保存失敗 | ローカルは確定済み、dirty保持、online/手動で再試行 |
| revision競合 | merge → 再保存 → 不能ならremote維持+error |
| 破損JSON(local/remote) | `sanitizeProgress` がフィールド単位で初期値へ。クラッシュしない。"cafe"は常にunlocked |
| trigger未実行 | RPCが初回保存でINSERT(自己修復) |
