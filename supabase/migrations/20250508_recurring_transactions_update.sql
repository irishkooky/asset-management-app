-- 1. recurring_transactionsテーブルに新しいカラムを追加
ALTER TABLE recurring_transactions 
  ADD COLUMN default_amount DECIMAL(12, 2);

-- 2. 既存のamountデータをdefault_amountにコピー
UPDATE recurring_transactions 
  SET default_amount = amount;

-- 3. default_amountにNOT NULL制約を追加
ALTER TABLE recurring_transactions 
  ALTER COLUMN default_amount SET NOT NULL;

-- 4. 月ごとの金額を保存するテーブルを作成
CREATE TABLE recurring_transaction_amounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (recurring_transaction_id, year, month)
);

-- 5. RLSポリシーの設定
ALTER TABLE recurring_transaction_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own recurring transaction amounts" ON recurring_transaction_amounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recurring_transactions
      WHERE recurring_transactions.id = recurring_transaction_amounts.recurring_transaction_id
      AND recurring_transactions.user_id = auth.uid()
    )
  );

-- 6. インデックスの作成（パフォーマンス向上のため）
CREATE INDEX idx_recurring_transaction_amounts_recurring_tx_id ON recurring_transaction_amounts(recurring_transaction_id);
CREATE INDEX idx_recurring_transaction_amounts_year_month ON recurring_transaction_amounts(year, month);

-- 注: この時点ではamountカラムは削除せず、アプリケーションの移行が完了するまで残しておきます
