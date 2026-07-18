# Auth / DB / Sync QA Report

実施日: 2026-07-18 · 対象: 有料版基盤(Supabase Auth + DB + 進捗同期 + Entitlement)
環境: Next.js 16.2.10 / React 19.2.4 / Node 24.18.0 / Windows 11

**最終判定: Code Complete — Supabase Live Verification Pending**(実Supabaseプロジェクト未接続のため、実環境QA(Phase 29)は未実施。ローカルでの代替検証は完了)

## Files created

```
.env.example
supabase/migrations/20260718000001_paid_foundation.sql
src/proxy.ts
src/lib/supabase/config.ts / client.ts / server.ts / proxy.ts
src/lib/progress/progressTypes.ts / localProgressRepository.ts /
                 supabaseProgressRepository.ts / progressStore.ts / progressSyncService.ts
src/lib/auth/redirect.ts / validation.ts / server.ts
src/lib/entitlements/getEntitlements.ts / access.ts / server.ts
src/types/auth.ts / database.ts / entitlement.ts
src/hooks/useAuth.ts
src/components/providers/AuthProvider.tsx / EntitlementProvider.tsx /
                          ProgressProvider.tsx / AppProviders.tsx
src/components/auth/AuthFormField.tsx / AuthNotConfigured.tsx / SaveProgressHint.tsx
src/components/ui/AppHeader.tsx
src/app/login/page.tsx / signup/page.tsx / forgot-password/page.tsx /
        reset-password/page.tsx / auth/callback/route.ts / account/page.tsx
docs/PAID_FOUNDATION_ARCHITECTURE.md / SUPABASE_SETUP_JA.md /
     AUTH_PROGRESS_SYNC_SPEC.md / ENTITLEMENT_SPEC.md / AUTH_DB_QA.md
```

## Files changed

- `package.json` / `package-lock.json` — `@supabase/supabase-js@2.110.7`, `@supabase/ssr@0.12.3` 追加
- `.gitignore` — `!.env.example` 追加
- `src/lib/storage.ts` — 同一公開APIのままprogressStoreへ委譲するfacade化(+ `clearProfile()` 追加)
- `src/app/page.tsx` — 直接の `localStorage.removeItem` を `clearProfile()` へ(1箇所)
- `src/app/lesson/page.tsx` — Result(初回クリア)カードに `<SaveProgressHint />` を1行追加
- `src/app/layout.tsx` — `<AppProviders>` + `<AppHeader>` を追加

既存のQuest/XP/Level/Unlockロジック・questData・levelSystem・quizBuilderは無変更。βテスト資料(docs/MOBILE_*)は残置。

## Auth

- 公式 @supabase/ssr(getAll/setAll)。deprecated auth-helpers不使用。独自JWTなし。
- Next.js 16の `middleware.ts` 非推奨に対応し `src/proxy.ts`(named export `proxy`)を採用。ビルド出力に「ƒ Proxy (Middleware)」として認識されることを確認。matcherで静的アセットを除外。
- セッションはcookieベース。localStorageへの独自トークン保存なし。

## Database / RLS / Trigger

- 3テーブル + CHECK制約 + `(user_id, product_key)` 一意制約 + updated_at trigger + `handle_new_user` trigger(security definer, `set search_path = ''`, ON CONFLICT DO NOTHING で冪等)。
- `save_user_progress` RPCは **security invoker**(RLSが適用される)+ revision条件付きUPDATE + 行欠損時の自己修復INSERT。
- user_entitlements: SELECT own のみ。書込みポリシー無し+ `revoke insert, update, delete ... from anon, authenticated` の二重防御。
- trigger失敗時の影響: `handle_new_user` がraiseするとsignup自体が失敗する。本migrationのINSERTは制約違反を起こし得ない構成(PK+デフォルトのみ)だが、万一行が無いユーザーもRPCの自己修復で復旧する。
- **実DBへの適用・実RLS挙動は未検証(Live Verification Pending)。**

## Progress / Migration / Sync / Account separation(自動検証)

Node上で実アプリモジュール(ローダー経由でTS直接実行)+ fake Supabaseクライアント(RPC意味論を再現)により **106チェック全PASS**:

- 初期progress(= DB trigger初期値と一致)/ serialize往復 / corrupt JSON(null・非JSON・型違い・負のxp・不正カテゴリ)でクラッシュせず初期値へ / "cafe"常時unlock
- merge規則(xp=max, union, profile=remote優先, weak優先で矛盾なし)
- ケースA(remote初期+local進捗→自動import+claim記録+再import防止)
- ケースB(remote進捗→remote読込・remote無変更)
- ケースC(両方進捗→remote優先表示、自動上書きなし、手動importでmerge保存+claim)
- debounce(連続書込みが1回の保存に集約、revision +1のみ)
- revision競合(他端末カード保持+ローカルカード保持でmerge再保存、revision前進、synced)
- 保存失敗(ローカル確定・status=error・再試行で成功)
- fetch失敗(キャッシュ表示・error・クラッシュなし)
- アカウント分離(A→B→A切替でXP/カード混在なし、匿名キー分離、facadeの切替)
- Entitlement 17ケース(active/trialing/lifetime/expired/revoked/past_due/canceled±ends_at/starts_at未来/不正日付/未知product/空)
- redirect sanitize 10ケース(外部URL/protocol-relative/バックスラッシュ/javascript:/改行/非文字列)
- フォーム検証(メール形式・8文字・確認一致・空白拒否)
- env未設定/設定済み/不正URLの `isSupabaseConfigured()` 3状態

検証スクリプトは実行後に削除済み(仕様どおり)。

## Security

- service role key: ソース内参照ゼロ(grep確認)。.env.exampleにも不記載。クライアントバンドル内の一致はsupabase-js自身のキー形式判定コードのみで、値の混入なし。
- 公開env: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` の2つだけ。
- open redirect: `sanitizeInternalRedirect` を login/signup/callback全経路に適用。`/auth/callback?next=https://evil.example` が `/login?error=callback` に落ちることをブラウザで実証。
- 生エラー非表示: Supabaseエラーはコード→固定ドイツ語文へマップ。email enumeration抑止(login失敗は同一文言、signupの既存メールは中立の成功画面、forgot-passwordは常に中立文言)。
- token/emailをconsole・DOM data属性へ出さない。user IDはlocalStorageキー内部のみ。
- 不正JSON耐性は上記自動検証でカバー。
- クライアントからのentitlement書込みは RLS + REVOKE + TS型(`Insert: never`)の三層で不可。

## Mobile(ブラウザ実測)

dev server + ダミーenv(フォーム表示のため)で計測。`scrollWidth <= innerWidth` で横スクロールなしを確認:

| 幅 | /login | /signup | /forgot-password | Home |
|---|---|---|---|---|
| 320 | ✔(長文メール+エラー表示状態でも) | ✔ | ✔ | ✔ |
| 360 / 375 / 390 / 430 | ✔ | — | — | 375で/lessonも✔ |
| 768 / 1280 | ✔(レイアウト確認) | ✔ | ✔ | ✔ |

- 入力44px、ヘッダーリンク44px、送信ボタン45px(実測)。
- Header崩れなし(320pxでブランド+Anmeldenが1行に収まる)。

## Accessibility(ブラウザ実測)

- label紐付け、`autocomplete=email/current-password/new-password`、`aria-describedby`(hint+error連結)、`aria-invalid`、`role=alert`、エラー時に最初の不正フィールドへfocus移動 — /loginで実測確認(`focusedId: "login-email"` 等)。
- 送信中はボタン+全fieldがdisabled、「Wird angemeldet …」表示で二重送信防止。
- QuestMapのreduced motion対応・lang=de・focus-visibleは既存実装を無変更で維持。

## Build / Lint

- `npm.cmd run build`: **成功(0エラー)** — Supabase未設定状態。全14ルート生成(/login /signup /forgot-password /reset-password /auth/callback /account 含む)+ Proxy。
- `npm.cmd run lint`: **0エラー・0警告**。

## Browser QA(回帰、devサーバー実測)

- Supabase未設定: Home/Onboarding/Lesson(Reise出題・正誤フィードバック)/Vocabulary(???プライバシー維持)/Review/Practice(coffee)すべて動作、既存匿名進捗(XP50/カード5/Café完了)維持、consoleエラー0、hydrationエラー0。認証ページは「Die Kontofunktion ist in dieser Umgebung nicht konfiguriert.」を表示、ヘッダーにログイン導線を出さない。
- ダミーenv設定時: ヘッダー「Anmelden」表示、/loginフォーム+ドイツ語検証、/signup検証(不一致エラー)、/account→`/login?next=%2Faccount` リダイレクト、/reset-password(セッションなし)→「Link abgelaufen」ビュー、callbackのopen redirect遮断。
- 「Lernplan anpassen」→Onboarding再実行→完了→XP/カード維持(clearProfile経路の回帰確認)。
- Home自動スクロール: 本変更前(git stash baseline)と本変更後で同一挙動であることを実測比較し、**回帰なし**を確認(この検証ブラウザ環境では基準コードでも自動スクロールが観測されず、実装は無変更のため実機挙動に影響しない)。
- Feedback表示・横スクロールなし(375px)。

## Supabase live QA — **未実施(Pending)**

実Supabaseプロジェクト・環境変数が未提供のため、Phase 29(A〜G: 実signupメール、callback、trigger実成立、実RLS、cross-device、実entitlement付与)は未実施。代替として上記の自動検証+fakeクライアント検証+SQLレビューを実施済み。実施手順は docs/SUPABASE_SETUP_JA.md(手順13〜16がそのままQA手順)。

## Remaining issues

1. Supabase実環境検証が未実施(上記)。
2. 認証エラーコードのマッピングはSupabase現行コードに基づく。将来のsupabase-js更新でコードが変わった場合も汎用文言へフォールバックするため安全だが、文言の精度は落ちる。
3. 複数端末リアルタイム同期は対象外(revision+mergeで消失防止のみ)。
4. 標準メール送信はレート制限が厳しいため、本番前に独自SMTP設定が必要(SETUP手順に記載)。

## Final verdict

**Code Complete / Supabase Live Verification Pending。**
既存無料Area 1への回帰なし・未ログイン利用可・Auth未設定build可・build/lintクリーン・自動検証106/106 PASS。
