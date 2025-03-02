# 収入・支出予測アプリ開発計画（シンプル版）

## 1. データベース設計

Supabaseを使用して以下のテーブルを設計します：

### accounts（口座テーブル）
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSポリシー（Row Level Security）
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);
```

### recurring_transactions（定期的な収支テーブル）
```sql
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  description TEXT,
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSポリシー
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own recurring transactions" ON recurring_transactions
  FOR ALL USING (auth.uid() = user_id);
```

### one_time_transactions（臨時収支テーブル）
```sql
CREATE TABLE one_time_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSポリシー
ALTER TABLE one_time_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own one-time transactions" ON one_time_transactions
  FOR ALL USING (auth.uid() = user_id);
```

## 2. アプリケーション構造

### ページ構成
```
/app
  /dashboard - メインダッシュボード（予測表示）
  /accounts - 口座管理
    /[id] - 個別口座詳細
  /transactions
    /recurring - 定期的な収支管理
    /one-time - 臨時収支管理
```

### コンポーネント設計

#### 共通コンポーネント
- `AccountSelector` - 口座選択コンポーネント
- `TransactionForm` - 収支入力フォーム
- `TransactionList` - 収支リスト表示
- `SavingsPredictionTable` - 貯蓄予測テーブル
- `AccountBalanceCard` - 口座残高カード

#### ページ固有コンポーネント
- `DashboardSummary` - ダッシュボード概要
- `AccountForm` - 口座作成・編集フォーム
- `RecurringTransactionForm` - 定期的な収支フォーム
- `OneTimeTransactionForm` - 臨時収支フォーム

## 3. 予測アルゴリズム設計

貯蓄額予測のアルゴリズムは以下のステップで実装します：

1. 現在の口座残高を取得
2. 定期的な収支を月ごとに計算
   - 収入の合計 - 支出の合計 = 月間純増減額
3. 臨時収支を該当月に加算・減算
4. 1ヶ月後、3ヶ月後、半年後、1年後の残高を計算
   - 現在残高 + (月間純増減額 × 月数) + 該当月の臨時収支合計

```typescript
// 予測計算関数の擬似コード
function calculateFutureSavings(
  currentBalance: number,
  recurringTransactions: RecurringTransaction[],
  oneTimeTransactions: OneTimeTransaction[],
  months: number
): number {
  // 月間の純増減額を計算
  const monthlyNet = recurringTransactions.reduce((total, transaction) => {
    return transaction.type === 'income'
      ? total + transaction.amount
      : total - transaction.amount;
  }, 0);

  // 予測期間内の臨時収支を計算
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + months);

  const oneTimeNet = oneTimeTransactions
    .filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= today && transactionDate <= endDate;
    })
    .reduce((total, transaction) => {
      return transaction.type === 'income'
        ? total + transaction.amount
        : total - transaction.amount;
    }, 0);

  // 将来の貯蓄額を計算
  return currentBalance + (monthlyNet * months) + oneTimeNet;
}
```

## 4. UI/UX設計（シンプル版）

モバイルファーストのアプローチで、以下のシンプルなUI/UX設計を行います：

### ダッシュボード
- 上部に現在の総残高を表示
- 予測期間（1ヶ月後、3ヶ月後、半年後、1年後）の貯蓄額をシンプルなテーブルで表示
- 最近の収支をリスト表示

### 口座管理
- 口座一覧をシンプルなリスト形式で表示
- 各口座の現在残高と予測残高を表示
- 口座の追加・編集・削除機能

### 収支管理
- タブで定期的な収支と臨時収支を切り替え
- 収支リストをシンプルなテーブル形式で表示
- 基本的な並べ替え機能
- 収支の追加・編集・削除機能

## 5. 実装計画

### フェーズ1: 基本機能実装
1. データベーステーブルの作成
2. 口座管理機能の実装
3. 定期的な収支管理機能の実装
4. 臨時収支管理機能の実装
5. 基本的な予測計算機能の実装

### フェーズ2: UI/UX改善
1. シンプルなダッシュボードの実装
2. モバイル対応の改善
3. 基本的な並べ替え機能の実装

### フェーズ3: 追加機能（オプション）
1. カテゴリ別の収支分析（シンプルな形式）
2. 基本的なデータのエクスポート機能

## 6. 技術的な考慮事項

### パフォーマンス最適化
- サーバーコンポーネントとクライアントコンポーネントの適切な使い分け
- 必要最小限のクライアントサイド処理

### セキュリティ
- Supabase RLSを活用したデータアクセス制御
- 入力値のバリデーション

### テスト戦略
- 基本的なユニットテスト
- 主要機能のE2Eテスト

## 7. 開発スケジュール

### 週1: 基盤構築
- データベース設計と作成
- 認証機能の確認と調整
- 基本的なページレイアウトの作成

### 週2: 口座・収支管理機能
- 口座管理機能の実装
- 定期的な収支管理機能の実装
- 臨時収支管理機能の実装

### 週3: 予測機能と基本UI
- 予測アルゴリズムの実装
- シンプルなダッシュボードの実装
- 基本的なリスト表示の実装

### 週4: 最終調整
- モバイル対応の改善
- バグ修正と最終調整

## 8. 必要なライブラリ

- `@heroui/react` - UIコンポーネント（既に導入済み）
- `date-fns` - 日付操作
- `zod` - データバリデーション
- `react-hook-form` - フォーム管理