-- 住民税設定システムの追加

-- 1. recurring_transactionsテーブルにカード締め日・支払い日を追加
ALTER TABLE recurring_transactions 
ADD COLUMN billing_day INTEGER CHECK (billing_day BETWEEN 1 AND 31),
ADD COLUMN payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31);

-- 2. 住民税年度設定テーブル
CREATE TABLE resident_tax_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL, -- 2024, 2025など
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fiscal_year)
);

-- RLS有効化
ALTER TABLE resident_tax_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own resident tax settings" ON resident_tax_settings
  FOR ALL USING (auth.uid() = user_id);

-- 3. 住民税各期支払い設定テーブル
CREATE TABLE resident_tax_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_id UUID NOT NULL REFERENCES resident_tax_settings(id) ON DELETE CASCADE,
  period INTEGER NOT NULL CHECK (period IN (1, 2, 3, 4)), -- 1期〜4期
  amount DECIMAL(12, 2) NOT NULL,
  payment_month INTEGER NOT NULL CHECK (payment_month IN (6, 8, 10, 1)), -- 6月、8月、10月、1月
  target_recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL, -- 上乗せ先(NULLの場合は単体登録)
  created_recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL, -- 単体登録時に作成されたrecurring_transaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(setting_id, period)
);

-- RLS有効化
ALTER TABLE resident_tax_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own resident tax periods" ON resident_tax_periods
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM resident_tax_settings WHERE id = setting_id)
  );

-- 4. 住民税の種類を示すため、recurring_transactionsに住民税フラグを追加
ALTER TABLE recurring_transactions 
ADD COLUMN is_resident_tax BOOLEAN DEFAULT FALSE;

-- 住民税用のrecurring_transactionsは削除されないようにチェック制約を追加
-- (住民税期間から参照されている場合は削除不可)
CREATE OR REPLACE FUNCTION check_resident_tax_transaction_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- 削除しようとしているトランザクションが住民税期間から参照されているかチェック
  IF EXISTS (
    SELECT 1 FROM resident_tax_periods 
    WHERE created_recurring_transaction_id = OLD.id
  ) THEN
    RAISE EXCEPTION '住民税設定から参照されているため、この定期収支は削除できません。';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_resident_tax_transaction_deletion
  BEFORE DELETE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_resident_tax_transaction_deletion();

-- インデックス作成
CREATE INDEX idx_resident_tax_settings_user_id_fiscal_year ON resident_tax_settings(user_id, fiscal_year);
CREATE INDEX idx_resident_tax_periods_setting_id ON resident_tax_periods(setting_id);
CREATE INDEX idx_resident_tax_periods_target_transaction ON resident_tax_periods(target_recurring_transaction_id);
CREATE INDEX idx_recurring_transactions_is_resident_tax ON recurring_transactions(is_resident_tax) WHERE is_resident_tax = true;