# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド一覧

### 開発
```bash
pnpm dev          # Next.js開発サーバーを起動 (http://localhost:3010)
```

### セットアップ
Supabase接続用の環境変数が必要です：
- `.env.example`を`.env.local`にコピーしてSupabaseの認証情報を入力
- または`npx vercel link`と`npx vercel pull`でVercelから同期

### コード品質
```bash
pnpm lint         # Biomeリンターを自動修正付きで実行
pnpm format       # Biomeフォーマッターを実行
pnpm check        # lintとformatを両方実行
pnpm typecheck    # TypeScriptの型チェックを実行
```

**重要**: コード変更後は必ず`pnpm check`と`pnpm typecheck`を実行して、コード品質と型安全性を確保してください。

### テスト
```bash
pnpm test         # Vitestテストを一度実行
pnpm test:watch   # ウォッチモードでテストを実行
```

テストファイルは`**/*.test.{ts,tsx}`のパターンに従い、jsdom環境でVitestを使用します。

### ビルド＆本番環境
```bash
pnpm build        # 本番用ビルド
pnpm start        # 本番サーバーを起動
```

### 未使用コードの検出
```bash
pnpm knip         # 未使用のエクスポートと依存関係をチェック
```

## アーキテクチャ概要

Next.js 15 App Routerを使用したアプリケーションで、以下のアーキテクチャを採用しています：

### 技術スタック
- **フロントエンド**: Next.js 15、React 19、TypeScript、Server Components
- **データベース**: Supabase（RLS付きPostgreSQL）
- **スタイリング**: TailwindCSS + HeroUIコンポーネント
- **フォーム**: Valibot検証付きServer Actions
- **状態管理**: Reactフック、グローバル状態管理なし
- **コード品質**: Biome（リント/フォーマット）、strict TypeScript

### 主要パターン

1. **認証フロー**
   - ミドルウェア（`middleware.ts`）が`/(protected)`配下のルートを保護
   - パブリックルート: `/`、`/demo`、`/auth/*`
   - 未認証ユーザーはランディングページへリダイレクト
   - Cookieベースのセッションでsupabaseクライアント経由の認証

2. **Server ComponentsとActions**
   - ページはデフォルトでServer Components
   - フォーム送信はServer Actions（`actions.ts`ファイル）を使用
   - クライアント側のインタラクティビティは`"use client"`ディレクティブで追加
   - Server Actionsは型付きレスポンスを返す: `{ error?: string; success?: string }`

3. **データベースアクセス**
   - `/utils/supabase/`内のユーティリティ関数がすべてのDB操作を処理
   - サーバー側: `/utils/supabase/server.ts`の`createClient()`を使用
   - クライアント側: `/utils/supabase/client.ts`の`createClient()`を使用
   - すべての操作はRow Level Security（RLS）を遵守

4. **型安全性**
   - `/types/database.ts`に生成されたデータベース型
   - 厳格なTypeScript設定
   - `/utils/validators/`にValibotスキーマでランタイム検証
   - エラーハンドリング付きの安全なパース

5. **フォーム検証パターン**
   ```typescript
   // utils/validators/recurring-transaction.tsの例
   const schema = v.object({
     field: v.pipe(v.string(), v.minLength(1)),
     amount: v.pipe(v.string(), v.transform(Number)),
   });
   
   const result = v.safeParse(schema, data);
   if (!result.success) {
     // 検証エラーの処理
   }
   ```

### プロジェクト構造

- `app/(protected)/` - 認証が必要なルート
  - `accounts/` - 銀行口座管理（ドラッグ＆ドロップソート付きCRUD）
  - `dashboard/` - 12ヶ月先までの財務予測を表示するメインダッシュボード
  - `summary/` - 月次財務サマリー
  - `transactions/` - 取引管理
    - `one-time/` - 単発取引
    - `recurring/` - 月次定期取引
  - `_components/` - ページ固有のコンポーネント

- `components/` - 共有UIコンポーネント
- `utils/` - ユーティリティ関数
  - `supabase/` - データベース操作ユーティリティ
  - `validators/` - Valibot検証スキーマ
- `supabase/migrations/` - データベーススキーママイグレーション

### データベーススキーマ

- `accounts` - 残高とソート順を持つユーザーの銀行口座
- `recurring_transactions` - 月次定期収入/支出
- `one_time_transactions` - 単発取引
- `processed_transactions` - 処理済み定期取引の追跡
- `monthly_account_balances` - 履歴データ用の月次残高スナップショット

すべてのテーブルは認証されたユーザーにスコープされたRow Level Security（RLS）を使用しています。

### 開発ガイドライン

1. **コンポーネントの構成**
   - ページ固有のコンポーネントは`_components/`ディレクトリに配置
   - 共有コンポーネントはルートの`components/`ディレクトリに配置
   - Server Actionsは各ルート内の`actions.ts`ファイルに配置

2. **エラーハンドリング**
   - Server Actionsは常にerror/successステートを返す
   - わかりやすいエラーメッセージ付きのtry-catchブロックを使用
   - クライアントコンポーネントはユーザーフレンドリーなエラーメッセージを表示

3. **日本語UI**
   - アプリケーションはすべてのユーザー向けコンテンツで日本語を使用
   - 既存の日本語翻訳との一貫性を保つ

4. **コードスタイル**
   - タブインデント（Biomeで強制）
   - 文字列にはダブルクォート
   - インポートの自動整理
   - 未使用のインポートは禁止