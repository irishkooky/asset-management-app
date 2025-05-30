-- accounts テーブルに sort_order カラムを追加
ALTER TABLE accounts ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 既存のレコードに対して更新日時順で並べた時のインデックスを sort_order に設定する
-- これにより既存データにも連番の sort_order が設定される
WITH indexed_accounts AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS row_num
  FROM accounts
)
UPDATE accounts
SET sort_order = indexed_accounts.row_num
FROM indexed_accounts
WHERE accounts.id = indexed_accounts.id;

COMMENT ON COLUMN accounts.sort_order IS 'ユーザーが設定した口座の表示順序';
