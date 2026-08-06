# 全体リファクタリング計画

作成日: 2026-06-10
対象: asset-management-app(Next.js 15 / React 19 / Supabase / TypeScript, 全68ファイル・約9,900行)

## 現状調査で確認した問題点(根拠付き)

| # | 問題 | 根拠 |
|---|------|------|
| 1 | テストがほぼ存在しない | `tests/sanity.test.ts` の1ファイルのみ。`utils/predictions.ts`(190行)や `summary/balance-utils.ts` 等の金額計算ロジックが無防備 |
| 2 | 巨大ファイル | `app/(protected)/summary/actions.ts` 914行、`summary/_components/account-accordion.tsx` 810行(useState 9個)。CLAUDE.md の「関数20行以内」ルールに大きく違反 |
| 3 | データ層の大量重複 | `createOneTimeTransfer` と `createRecurringTransfer` がほぼ同一。`utils/supabase/*.ts` 全ファイルで `createClient` → `getUser` → エラーチェック → `console.error` → `throw` のボイラープレートが繰り返されている(`createClient` 呼び出し計60箇所超) |
| 4 | Supabase クライアントが型付けされていない | クエリ結果を `accounts as Account[]` のように手動キャスト。`createServerClient<Database>` ジェネリクスが未使用 |
| 5 | バリデーション欠如 | valibot は `utils/validators/recurring-transaction.ts` の1箇所のみ。他の Server Actions は FormData を無検証で処理 |
| 6 | console 文 81箇所 | エラーハンドリングが `console.error` + 日本語メッセージ throw / 戻り値オブジェクトの混在で一貫性なし |
| 7 | 命名・配置の不統一 | `transactions/one-time/` は `action.ts`(単数)、他は `actions.ts`。`components/dashboard.tsx` はページ専用なのに共有 components に配置。`transactions/recurring/types/` のみルート内 types ディレクトリ |
| 8 | 依存関係のリスク | `@supabase/ssr` と `@supabase/supabase-js` がバージョン `"latest"` 指定(再現性のないビルド) |
| 9 | 未使用コード未計測 | knip は設定済みだが node_modules 未インストールで未実行。CI にも未組込み |

## 基本方針

- **振る舞いを変えないリファクタリングと機能変更を絶対に混ぜない**(1 PR = 1 関心事)
- 各フェーズは独立してマージ可能。フェーズ内も小さい PR に分割
- 各 PR のマージ条件: `pnpm typecheck && pnpm check && pnpm test && pnpm build` が全て成功
- ブランチ命名: `refactor/<phase>-<topic>`(例: `refactor/p2-data-access-layer`)

---

## Phase 0: セーフティネット構築(最優先・他の前提)

**目的**: 「壊していないこと」を機械的に証明できる状態を作る。これなしに以降のフェーズは着手しない。

1. `pnpm install` を実行し、`pnpm typecheck / check / test / build / knip` のベースラインを記録する
2. `@supabase/ssr` / `@supabase/supabase-js` の `"latest"` を実バージョンに固定する
3. **特性評価テスト(characterization tests)** を追加する。現在の挙動をそのまま固定するテストで、正しさの判断はしない:
   - `utils/predictions.ts`(貯蓄予測 — 直近のバグ修正対象であり最重要)
   - `app/(protected)/summary/balance-utils.ts`(月次残高計算)
   - `summary/actions.ts` 内の純粋計算部分(`calculateAccountFinalBalance` 等)— テスト可能にするため計算関数のみ `summary/_lib/` へ抽出(機械的移動のみ)
   - `utils/supabase/resident-tax.ts` の純粋関数(`calculateActualPaymentMonth`, `getFiscalYearRange`)
4. GitHub Actions で `typecheck + check + test + build + knip:ci` を PR ごとに実行する CI を追加

**完了条件**: 金額計算ロジックにテストがあり、CI が全 PR をゲートする。

## Phase 1: デッドコード除去とハイジーン(低リスク・即効)

**目的**: 以降のフェーズで触るコード量自体を減らす。

1. `pnpm knip` の結果に基づき未使用 export・未使用ファイル・未使用依存を削除(1 コミット = 1 カテゴリ)
2. `console.*` 81箇所を整理: デバッグ残骸は削除、必要なエラー記録は Phase 2 で導入する共通エラーハンドラに集約する前提でマーキング
3. 命名統一: `transactions/one-time/**/action.ts` → `actions.ts`、`transactions/recurring/types/index.ts` の配置見直し
4. `components/dashboard.tsx` → `app/(protected)/dashboard/_components/` へ移動(CLAUDE.md のページ専用コンポーネント規約に合わせる)

**完了条件**: knip がクリーン(または例外が `knip.json` に明示)、ファイル配置が CLAUDE.md の規約と一致。

## Phase 2: データアクセス層の再構築(本丸その1)

**目的**: `utils/supabase/*.ts` 約1,650行の重複を解消し、型安全にする。

1. **型付きクライアント**: `createClient()` を `createServerClient<Database>` 化し、`as Account[]` 等の手動キャストを全廃(Supabase 公式推奨パターン)。`supabase gen types` を pnpm script 化して `types/database.ts` の鮮度を保つ
2. **共通ヘルパー導入**(`utils/supabase/_shared.ts` 等):
   - `requireUser(supabase)` — 認証チェックの共通化(現在5ファイルに同一コードが散在)
   - クエリエラー処理の統一ラッパー — `console.error` + throw のボイラープレート排除
3. **送金処理の統合**: `createOneTimeTransfer` / `createRecurringTransfer` を共通バリデーション(同一口座チェック、transferPairId 生成)+ RPC 呼び出しの薄い関数に統合
4. **CRUD パターンの整理**: one-time / recurring / resident-tax の get/create/update/delete を共通パターンに揃える(過度な抽象化はしない — 同じ形に「揃える」のが目的)

**分割**: 1 PR = 1 ファイル(accounts → one-time → recurring → resident-tax → processed)の順で段階的に。

**完了条件**: 手動型キャストゼロ、認証・エラー処理が単一実装、重複した transfer ロジックの解消。

## Phase 3: Server Actions の再設計(本丸その2)

**目的**: `summary/actions.ts`(914行)を筆頭に、Actions を「検証 → 委譲 → 再検証」の薄い層にする。

1. **summary/actions.ts の分割**:
   - 純粋計算 → `summary/_lib/calculations.ts`(Phase 0 で一部抽出済み)
   - データ取得 → Phase 2 の DAL(`utils/supabase/`)へ
   - Server Action は orchestration のみ(各関数20行以内に収まるはず)
2. **バリデーションの全面導入**: 全 Server Action の入口に valibot スキーマを配置(Next.js 公式推奨の `safeParse` → early return パターン)。スキーマは `utils/validators/` に集約
3. **戻り値の統一**: `type ActionResult<T> = { success: true; data: T } | { success: false; error: string; fieldErrors?: ... }` を定義し、throw とオブジェクト返却の混在を解消。クライアント側は `useActionState` で受ける
4. `revalidatePath` の呼び出し箇所(11箇所)を棚卸しし、過剰・不足を是正

**分割**: summary → recurring → one-time → resident-tax → accounts の順(大きい順)。

**完了条件**: 全 Action が「valibot 検証 → DAL 呼び出し → revalidate」の3段構成、戻り値型統一、914行ファイルの解体。

## Phase 4: コンポーネント分割と UI 層整理

**目的**: 巨大クライアントコンポーネントの解体とフォーム重複の解消。

1. **account-accordion.tsx(810行・useState 9個)の分割**: 表示用サブコンポーネント抽出 + 状態ロジックをカスタムフック(`useAccountBalanceEditor` 等)へ。`useActionState` 移行で手動 pending/error state を削減
2. **フォームの共通化**: one-time / recurring / resident-tax の各フォーム(計約930行)で重複する金額入力・口座選択・送金切替 UI を共有フィールドコンポーネント化
3. `resident-tax-form.tsx`(399行)、`edit-modal.tsx`(281行)、`monthly-amount-editor.tsx`(218行)を同パターンで分割
4. Server/Client 境界の見直し: `"use client"` が本当に必要な葉コンポーネントまで境界を下げる

**完了条件**: 200行超のコンポーネントゼロ、フォーム重複の解消。

## Phase 5: 品質基準の定着(仕上げ)

1. Phase 0 の特性評価テストを仕様テストに昇格させ、DAL・Action・フックのテストを追加(目安: 計算ロジック100%、Action 主要パス)
2. CLAUDE.md ルール(early return / ネスト2段 / 20行 / else-after-return 禁止)への残存違反を一掃
3. Biome ルール強化(`noConsole` 等)と knip の CI ゲート化(`--no-exit-code` を外す)で再発防止
4. CLAUDE.md の「migration in progress」記述を完了状態に更新

---

## 実施順序とリスク管理

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
(必須前提)  (低リスク)   (中リスク)   (中リスク)   (低〜中)    (仕上げ)
```

- Phase 2 と 3 は依存関係があるため順守。Phase 4 は Phase 3 完了後が安全(Action の戻り値型にフォームが依存するため)
- 金額計算(predictions / balance-utils / summary)を触る PR は必ず特性評価テストの green を確認してからレビューに出す
- 途中で機能要望が割り込んだ場合も、リファクタリング PR と機能 PR は分離する
