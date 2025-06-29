-- 口座間送金機能のためのカラム追加
-- one_time_transactions テーブルに送金関連カラムを追加
ALTER TABLE one_time_transactions 
ADD COLUMN is_transfer BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN destination_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN transfer_pair_id UUID;

-- recurring_transactions テーブルに送金関連カラムを追加
ALTER TABLE recurring_transactions 
ADD COLUMN is_transfer BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN destination_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN transfer_pair_id UUID;

-- 送金ペアの整合性を保つための制約を追加
-- 送金の場合、destination_account_id は必須
ALTER TABLE one_time_transactions 
ADD CONSTRAINT check_transfer_destination 
CHECK (
  (is_transfer = TRUE AND destination_account_id IS NOT NULL) OR
  (is_transfer = FALSE AND destination_account_id IS NULL)
);

ALTER TABLE recurring_transactions 
ADD CONSTRAINT check_transfer_destination 
CHECK (
  (is_transfer = TRUE AND destination_account_id IS NOT NULL) OR
  (is_transfer = FALSE AND destination_account_id IS NULL)
);

-- 送金の場合、送金元と送金先の口座は異なる必要がある
ALTER TABLE one_time_transactions 
ADD CONSTRAINT check_different_accounts 
CHECK (
  (is_transfer = FALSE) OR 
  (is_transfer = TRUE AND account_id != destination_account_id)
);

ALTER TABLE recurring_transactions 
ADD CONSTRAINT check_different_accounts 
CHECK (
  (is_transfer = FALSE) OR 
  (is_transfer = TRUE AND account_id != destination_account_id)
);

-- 送金ペアID用のインデックスを追加（パフォーマンス向上のため）
CREATE INDEX idx_one_time_transactions_transfer_pair ON one_time_transactions(transfer_pair_id);
CREATE INDEX idx_recurring_transactions_transfer_pair ON recurring_transactions(transfer_pair_id);

-- 送金先口座ID用のインデックスを追加
CREATE INDEX idx_one_time_transactions_destination_account ON one_time_transactions(destination_account_id);
CREATE INDEX idx_recurring_transactions_destination_account ON recurring_transactions(destination_account_id);