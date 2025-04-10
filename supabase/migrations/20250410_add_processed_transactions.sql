-- 処理済み取引を記録するための新しいテーブル
CREATE TABLE processed_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('one_time', 'recurring')),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_id, account_id)
);

-- RLSポリシー
ALTER TABLE processed_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own processed transactions" ON processed_transactions
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM accounts WHERE id = account_id
  ));