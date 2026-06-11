# 完全リファクタリング計画 (Phased Refactoring Plan)

本ドキュメントは、長年蓄積した技術的負債を **フェーズ分割** で段階的に解消するための実行計画である。各フェーズは独立した PR として完結でき、`pnpm typecheck` / `pnpm check` / `pnpm test` が常にグリーンであることを完了条件とする。

> ツール注記: 本計画策定時に Context7 MCP は本セッションに接続されていなかったため、最新ライブラリ仕様は WebSearch（Next.js 公式 / Supabase 公式）で代替確認した。実装時に Context7 が利用可能なら、各フェーズ着手前に対象ライブラリの最新ドキュメントを取得して差分を確認すること。

---

## 0. 現状の負債サマリ (Why)

調査で確認された主要な負債（すべて実コードで確認済み）:

| カテゴリ | 実態 | 重大度 |
|---|---|---|
| Supabase クライアントが未ジェネリクス化 | `createServerClient(...)` のため `as Account` 等の手動キャストが **67 箇所** | 高（根本原因） |
| バリデーション層の不統一 | Valibot は設定・CLAUDE.md 記載済みだが **10 中 1 ファイルでしか使用されず**、残りは `formData.get() as string` のアドホック検証（**32 箇所**） | 高 |
| 巨大ファイル | `summary/actions.ts` が **914 行 / 21 関数**（データ取得・計算・永続化が混在）、`account-accordion.tsx` が **810 行** | 高 |
| ボイラープレート重複 | 全 action で `auth.getUser` / `try-catch` / `console.error`（**73 箇所**）/ 日本語エラー文字列 / `ActionState` 型を都度再定義 | 高 |
| DB アクセス層の重複 | `accounts` / `recurring` / `one-time` / `resident-tax` でほぼ同一の CRUD・転送ロジック | 高 |
| 重複した集計ロジック | `calculateMonthlySummary()` が `app/actions.ts` と `summary/actions.ts` に二重実装 | 高 |
| 型の二重定義 | `types/database.ts` の `RecurringTransaction` を `transactions/recurring/types/index.ts` が不完全コピー | 中 |
| UI ライブラリ混在 | HeroUI Button（41 ファイル）と自作 `components/button.tsx`（13 ファイル）が併存 | 中 |
| フォーム重複 | 6 つのフォームが同一構造（`useActionState`＋エラー/成功表示 div）をコピペ | 中 |
| utils 分散 | `utils/utils.ts` / `lib/utils.ts` / `utils/predictions.ts` / `summary/balance-utils.ts` に日付・残高計算が散在重複 | 中 |
| 設定/ルールの乱立 | `.windsurfrules` `.clinerules` `.roomodes` `.cursor/rules/*.mdc`(6) `.serena/` `AGENTS.md` `.agent/PLANS.md` が `CLAUDE.md` と重複 | 低 |
| テスト | `tests/sanity.test.ts` の 1 本のみ（実質ゼロ） | 致命的 |
| 命名不統一 | `action.ts` と `actions.ts` が混在 | 低 |

### 設計方針（全フェーズ共通の指針）
1. **根本原因から潰す** — 型キャストやボイラープレートは「症状」。`Database` ジェネリクスと共通ヘルパで発生源を断つ。
2. **抽出 → 置換 → 削除** の順。新しい共通基盤を先に用意し、呼び出し側を移行し、最後に旧コードを消す。
3. **常にグリーン** — 各 PR で `typecheck` / `check` / `test` が通る状態を維持。大規模 PR を避け小さく刻む。
4. **CLAUDE.md 準拠** — early return / 2 段ネストまで / 20 行関数 / 単一責務 を移行後コードで満たす。
5. **振る舞いを変えない** — 純粋なリファクタリング。機能変更は別 PR に分離。

### 依存関係（フェーズ順序の根拠）
```
Phase 0 (基盤) ─┬─> Phase 1 (DB層: 型付き client) ──> Phase 2 (Actions共通化)
                │                                         │
                └─> Phase 3 (Validation) ────────────────┘──> Phase 4 (Forms/UI)
                                                              │
Phase 5 (ビジネスロジック分離) <── Phase 1,2 ─────────────────┘
Phase 6 (型統一) <── Phase 1
Phase 7 (テスト) は Phase 1〜6 の各成果物に随伴して追加
Phase 8 (デッドコード除去/最終化) は最後
```

---

## Phase 0 — 基盤・セーフティネット整備

**目的**: リファクタリング中に回帰を検知できる安全網を先に作る。ここではプロダクトコードを極力変更しない。

**作業**:
1. **CI でガードを有効化**: `.github/workflows/ci.yml` に `pnpm typecheck` / `pnpm check` / `pnpm test` / `pnpm knip:ci` が走ることを確認・追加。リファクタの各 PR がこれらで検証される状態にする。
2. **Supabase 型生成スクリプトの整備**: `package.json` に `gen:types` を追加。
   ```jsonc
   "gen:types": "supabase gen types typescript --project-id <id> --schema public > types/database.gen.ts"
   ```
   現在の手書き `types/database.ts` を「生成物 + 派生型」に分離する準備（実置換は Phase 6）。
3. **設定ファイルの棚卸し（重複削減）**:
   - `CLAUDE.md` / `AGENTS.md` を唯一の正とし、`.windsurfrules` `.clinerules` `.roomodes` は削除するか「`CLAUDE.md` を参照」の 1 行スタブにする。
   - `.cursor/rules/*.mdc`（DB/Next.js ルール 6 本）は内容が今も有効なものだけ残し、`CLAUDE.md` と重複する記述を排除。
   - `.serena/memories/*` `.agent/PLANS.md` `docs/monthly-summary-plan.md` の要否を確認し、不要なら削除。
4. **テスト基盤の確認**: `vitest.config.ts` の `jsdom` / path alias が動くことを確認し、最初のユーティリティテスト 1 本を追加して土台を固める。

**完了条件**: CI で 4 コマンドが緑。設定ファイル数が削減され、AI 用ルールの正本が 1 つに統一されている。

**リスク**: 低。`supabase gen types` には接続情報が必要なため、生成は手元/CI シークレットで実行し、生成物のみコミット。

---

## Phase 1 — データアクセス層: 型付きクライアントと共通ヘルパ

**目的**: 67 箇所の手動キャストと、DB 関数ごとの定型ボイラープレートを根絶する。

**対象**: `utils/supabase/server.ts`, `client.ts`, `accounts.ts`, `one-time-transactions.ts`, `recurring-transactions.ts`, `processed-transactions.ts`, `resident-tax.ts`

**作業**:
1. **クライアントをジェネリクス化**:
   ```ts
   // utils/supabase/server.ts
   import type { Database } from "@/types/database";
   return createServerClient<Database>(supabaseUrl, supabaseKey, { /* ... */ });
   ```
   `client.ts` も `createBrowserClient<Database>` に。これで `.from("accounts").select()` の戻り値が型付けされ、`as Account` が **不要** になる。
2. **共通ヘルパを新設** `utils/supabase/helpers.ts`:
   ```ts
   export async function requireUser(supabase: SupabaseClient<Database>) {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("ユーザーが認証されていません");
     return user;
   }

   export function unwrap<T>(result: { data: T | null; error: PostgrestError | null }, msg: string): T {
     if (result.error) {
       console.error(msg, result.error);
       throw new Error(msg);
     }
     return result.data as T; // 型付きclientにより実質キャスト不要化
   }
   ```
   各 CRUD 関数を `requireUser` / `unwrap` 経由に置換し、20 行以内・単一責務に収める。
3. **手動キャストの一掃**: `as Account` `as RecurringTransaction[]` 等を削除。残るのは生成型で表現できない箇所のみ。
4. **転送(transfer)ロジックの共通化**: `createOneTimeTransfer` と `createRecurringTransfer`、および update/delete の transfer-pair 処理（`one-time-transactions.ts:121-176` と `recurring-transactions.ts:135-196` ほか）の共通部分を `utils/supabase/transfers.ts` に抽出。

**完了条件**: `grep "as Account\|as Recurring\|as OneTime"` が 0 件。各 DB 関数が 20 行以内。`typecheck` 緑。

**リスク**: 中。型付け後に今まで隠れていた型不整合が露出する可能性 → Phase 7 のユニットテストと併走して検証。

---

## Phase 2 — Server Actions の統一

**目的**: action ごとに重複する `ActionState` 定義・auth チェック・try/catch・`console.error` を 1 箇所に集約し、命名を統一する。

**対象**: `app/(protected)/**/{action,actions}.ts`, `app/actions.ts`, `app/(protected)/dashboard/actions.ts`

**作業**:
1. **共通 ActionState と結果ヘルパ** `lib/action-result.ts`:
   ```ts
   export type ActionState = { error?: string; success?: string };
   export const ok = (success: string): ActionState => ({ success });
   export const fail = (error: string): ActionState => ({ error });
   ```
2. **アクションラッパで auth + エラー処理を共通化**:
   ```ts
   export function action<T>(fn: (fd: FormData) => Promise<ActionState>) {
     return async (_prev: ActionState, fd: FormData): Promise<ActionState> => {
       try { return await fn(fd); }
       catch (e) { console.error(e); return fail("処理に失敗しました"); }
     };
   }
   ```
   各 action 本体は「入力 → バリデーション(Phase 3) → DB 呼び出し → `ok()`」だけに縮小。
3. **ファイル命名統一**: 単数形 `action.ts` を **`actions.ts`** に統一改名し、import を更新（`one-time/new/action.ts`, `one-time/[id]/edit/action.ts`）。
4. **`revalidatePath` の方針統一**: 変更系 action の末尾で必ず `revalidatePath` → 必要時 `redirect`（redirect は最後の文）を徹底。現状 5 箇所しかないため漏れを補完。
5. **重複 action の解消準備**: `app/actions.ts` の `getMonthlySummary` / `calculateMonthlySummary` はレガシー版。Phase 5 で正本へ統合するため、ここで「重複」マークを付け呼び出し元を洗い出す。

**完了条件**: `ActionState` 定義が `lib/action-result.ts` の 1 箇所のみ。`action.ts`（単数）が消滅。各 action が 20 行以内。

**リスク**: 中（改名による import 漏れ）→ `typecheck` と `knip` で検出。

---

## Phase 3 — バリデーション層の統一 (Valibot 全面適用)

**目的**: CLAUDE.md が謳う「Server Actions with Valibot validation」を実体化し、アドホックな `formData.get() as string` 検証（32 箇所）を撲滅する。

**対象**: `utils/validators/`（新設スキーマ群）, 全 action

**作業**:
1. **エンティティ別スキーマを `utils/validators/` に集約**: 既存 `recurring-transaction.ts` に加え、`account.ts` / `one-time-transaction.ts` / `resident-tax.ts` を新設。
2. **FormData → スキーマ変換ヘルパ** `utils/validators/parse-form.ts`:
   ```ts
   export function parseForm<T>(schema: BaseSchema<unknown, T, ...>, fd: FormData) {
     const raw = Object.fromEntries(fd.entries());
     const result = safeParse(schema, coerce(raw)); // number 等は事前 coerce
     if (!result.success) return { error: firstIssueMessage(result.issues) };
     return { data: result.output };
   }
   ```
   action 側は `parseForm(accountSchema, fd)` を呼び、`error` があれば `fail()` を返すだけにする。
3. **`parse`/`safeParse` 二重実装の解消**: `recurring-transaction.ts:125-214` の `validate*` と `safeValidate*` を `safeParse` ベースに一本化（throw 版は削除）。Next.js のベストプラクティス上、想定内の検証失敗は **throw せず構造化エラーを返す**。
4. **エラーメッセージの一元管理**: 日本語メッセージをスキーマに集約し、action からハードコード文字列を排除。

**完了条件**: action 内の `formData.get(... ) as string` が 0 件。全フォーム入力が Valibot スキーマを通る。`knip` で未使用バリデータが出ない。

**リスク**: 中（数値・boolean の coerce 漏れ）→ Phase 7 でスキーマ単体テストを必須化。

---

## Phase 4 — フォーム & UI コンポーネントの共通化

**目的**: 6 つのフォームのコピペ構造と、Button 実装の二重化を解消する。

**対象**: `components/`, 各 `*-form.tsx`（accounts / one-time / recurring / resident-tax）

**作業**:
1. **Button 実装の一本化**: HeroUI（41 ファイル）と自作 `components/button.tsx`（13 ファイル）のどちらかに統一する。推奨は **HeroUI に寄せて自作 button を削除**（依存削減）。逆に自作で統一する場合は HeroUI Button 利用箇所を置換。決定後、片方を完全撤去。
2. **共通フォーム部品を `components/form/` に抽出**:
   - `FormMessage`（現状 6 ファイルにコピペされている赤/緑の error/success div を 1 コンポーネント化）。
   - `useFormRedirect`（`useActionState` + `useEffect` で成功時 redirect する定型フック）。
   - `AmountInput` / `AccountSelect` / `TransferFields` など繰り返し現れる入力群を再利用部品化。
3. **各フォームをスリム化**: 上記部品＋Phase 3 のスキーマで、`resident-tax-form.tsx`(399行) や `recurring-transaction-form.tsx`(274行) の重複・長大ハンドラを 20 行関数群へ分解。
4. **`account-accordion.tsx`(810行) の分割**: 表示・編集・残高計算の責務を子コンポーネントへ抽出（純粋な分割に留め、振る舞いは不変）。

**完了条件**: error/success 表示が `FormMessage` の 1 実装のみ。Button が 1 系統のみ（`knip` で旧 Button が未使用検出）。各フォームコンポーネントが大幅減量。

**リスク**: 中（UI 回帰）→ 主要画面を手動確認（`/run` か `pnpm dev`）。可能ならコンポーネントテストを追加。

---

## Phase 5 — ビジネスロジックの分離・重複排除

**目的**: `summary/actions.ts`(914行/21関数) を責務ごとに分割し、二重実装された集計・日付・残高ロジックを単一化する。

**対象**: `app/(protected)/summary/actions.ts`, `app/actions.ts`, `summary/balance-utils.ts`, `utils/predictions.ts`, `dashboard/actions.ts`

**作業**:
1. **`summary/actions.ts` を層に分解**:
   - `summary/_lib/balances.ts`（残高計算: `calculateEndOfMonthBalances`, `findNearestMonthlyBalances` 等の純関数群）
   - `summary/_lib/summary-calc.ts`（`calculateMonthlySummary` の純関数）
   - `summary/actions.ts` には「Server Action のエントリポイント（取得→純関数呼び出し→返却）」だけ残す。
2. **`calculateMonthlySummary` の重複統合**: `app/actions.ts:102-226` と `summary/actions.ts:233-373` の二重実装を、`summary/_lib/summary-calc.ts` の 1 実装へ統合。レガシーな `app/actions.ts` 版と `getMonthlySummary` 重複を削除。
3. **日付ユーティリティの統合**: `getPreviousYearMonth` / `incrementMonth`（balance-utils）と `predictions.ts` の重複を `utils/date.ts` に集約。`date-fns` が既に依存にあるため可能な箇所は置換。
4. **残高変化計算の共通化**: `calculateMonthlyBalanceChange`（balance-utils）と `dashboard/actions.ts:29-40` のインライン `reduce` を共通関数化。
5. **utils 配置の整理**: `utils/utils.ts`(`encodedRedirect`) と `lib/utils.ts`(`cn`) の配置方針を統一（`lib/` 配下に集約推奨）。

**完了条件**: `summary/actions.ts` が大幅減（目安 300 行未満）。`calculateMonthlySummary` が 1 実装のみ。日付/残高ヘルパが単一モジュール。`knip` で重複・未使用関数が出ない。

**リスク**: 高（金額計算の回帰は致命的）→ **Phase 7 のテストを本フェーズの前提条件**とする（後述）。リファクタ前に現挙動のスナップショット的テストを書いてから分割する。

---

## Phase 6 — 型定義の単一化

**目的**: DB スキーマを唯一の真実とし、手書き重複型と未使用型を排除する。

**対象**: `types/database.ts`, `types/summary.ts`, `types/next.ts`, `transactions/recurring/types/index.ts`

**作業**:
1. **生成型へ移行**: Phase 0 の `database.gen.ts` を基に、`types/database.ts` は「生成型からの派生エイリアス（`Account = Tables<'accounts'>` 等）」に書き換え。
2. **重複型の削除**: `transactions/recurring/types/index.ts` の不完全 `RecurringTransaction`（`is_transfer` 等が欠落）を削除し、`types/database.ts` の正本に統一。
3. **未使用型の除去**: `TransferPair`（`database.ts:73-76`、転送は RPC 経由のため未使用）など `knip` 検出分を削除。`RecurringTransactionWithResidentTax` の使用実態を確認し、不要なら削除。

**完了条件**: `RecurringTransaction` の定義が 1 箇所のみ。`knip` で未使用 export 型が 0。`typecheck` 緑。

**リスク**: 中（生成型と手書き型の差分露出）→ `typecheck` で機械的に検出可能。

---

## Phase 7 — テスト整備（全フェーズに随伴）

**目的**: 純粋ロジックを中心にユニットテストを整備し、以降の変更を守る。Phase 5 の分割は本テストが前提。

**作業（優先度順）**:
1. **バリデータ**（Phase 3 成果物）: 各 Valibot スキーマの正常系/異常系。最も費用対効果が高い。
2. **純粋計算**（Phase 5 成果物）: `summary-calc` / `balances` / `date` / 残高変化計算。既知の入出力で固定（リファクタ前に現挙動を捕獲してから分割）。
3. **DB ヘルパ**（Phase 1）: `requireUser` / `unwrap` を Supabase クライアントのモックで検証。
4. **Server Actions**: 代表 action の成功/失敗/未認証パス。
5. **共通コンポーネント**（Phase 4）: `FormMessage` 等のレンダリングテスト（`@testing-library/react` は導入済み）。

**完了条件**: `pnpm test` で純粋ロジックの主要分岐がカバーされ、CI で必須。`tests/sanity.test.ts` は実テスト群に置換/拡張。

---

## Phase 8 — デッドコード除去と最終仕上げ

**目的**: 移行で残った旧コードを撤去し、全体を CLAUDE.md スタイルへ最終整合。

**作業**:
1. `pnpm knip` をクリーンにする: 未使用 export / 依存 / ファイルを削除（`getTotalBalance`・旧 Button・`predictions.ts` 等の使用実態を確定し処理）。
2. 未使用 npm 依存の削除（HeroUI/Radix のどちらかへ統一した結果不要になったもの等）。
3. 命名・ディレクトリの最終統一（`_components` / `actions.ts` 規約の徹底、`utils/` と `lib/` の役割確定）。
4. `CLAUDE.md` の記述を実態に合わせて更新（バリデーション・型生成・テスト方針）。
5. 全体で `typecheck` / `check` / `test` / `knip` がグリーンであることを最終確認。

**完了条件**: `knip` がゼロ警告。4 コマンド全緑。CLAUDE.md と実コードが一致。

---

## 進め方とマイルストーン管理

- **1 フェーズ = 複数の小 PR**。「共通基盤の追加」と「呼び出し側の移行」と「旧コード削除」は別コミット/別 PR に分け、レビュー容易性と回帰追跡性を確保する。
- **各 PR の受け入れ条件**: `pnpm typecheck && pnpm check && pnpm test`（+ 該当時 `pnpm knip`）が緑。振る舞い不変。
- **順序の厳守**: Phase 1（型付き client）と Phase 7（テスト）の土台を最優先。これらが無いと Phase 5 の金額計算分割が危険。
- **計測**: 開始時に `行数 / as キャスト数 / console.error 数 / formData.get 数 / knip 警告数 / テスト数` を記録し、各フェーズ完了でメトリクスの改善を可視化する。

### 期待される定量的成果（目安）
| 指標 | 現状 | 目標 |
|---|---|---|
| `as` キャスト | 67 | ~0（生成型由来の最小限のみ） |
| アドホック `formData.get` 検証 | 32 | 0（全て Valibot 経由） |
| `summary/actions.ts` 行数 | 914 | < 300 |
| `ActionState` 定義箇所 | 3+ | 1 |
| Button 実装系統 | 2 | 1 |
| テストファイル | 1 | 純粋ロジック主要分岐をカバー |
| `knip` 警告 | 未計測 | 0 |
