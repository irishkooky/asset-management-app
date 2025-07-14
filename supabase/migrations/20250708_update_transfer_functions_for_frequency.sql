-- Update the create_recurring_transfer function to include frequency fields

-- Update the update_recurring_transfer_pair function to include frequency fields
CREATE OR REPLACE FUNCTION update_recurring_transfer_pair(
    p_transaction_id UUID,
    p_amount DECIMAL(12, 2),
    p_name TEXT DEFAULT NULL,
    p_day_of_month INTEGER DEFAULT NULL,
    p_frequency frequency_type DEFAULT NULL,
    p_month_of_year INTEGER DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction recurring_transactions;
    v_pair_transaction recurring_transactions;
    v_transfer_pair_id UUID;
BEGIN
    -- 元のトランザクションを取得
    SELECT * INTO v_transaction
    FROM recurring_transactions
    WHERE id = p_transaction_id;
    
    IF v_transaction IS NULL THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;
    
    -- 送金でない場合はエラー
    IF NOT v_transaction.is_transfer OR v_transaction.transfer_pair_id IS NULL THEN
        RAISE EXCEPTION 'Transaction is not a transfer';
    END IF;
    
    v_transfer_pair_id := v_transaction.transfer_pair_id;
    
    -- ペアのトランザクションを取得
    SELECT * INTO v_pair_transaction
    FROM recurring_transactions
    WHERE transfer_pair_id = v_transfer_pair_id
    AND id != p_transaction_id;
    
    IF v_pair_transaction IS NULL THEN
        RAISE EXCEPTION 'Transfer pair not found';
    END IF;
    
    -- 両方のトランザクションを更新
    UPDATE recurring_transactions
    SET 
        amount = COALESCE(p_amount, amount),
        name = COALESCE(p_name, name),
        day_of_month = COALESCE(p_day_of_month, day_of_month),
        frequency = COALESCE(p_frequency, frequency),
        month_of_year = COALESCE(p_month_of_year, month_of_year),
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE transfer_pair_id = v_transfer_pair_id;
    
    -- 更新後のデータを返す
    RETURN json_build_object(
        'success', true,
        'updated_count', 2,
        'transfer_pair_id', v_transfer_pair_id
    );
END;
$$;

-- Update the create_recurring_transfer function to include frequency fields

CREATE OR REPLACE FUNCTION create_recurring_transfer(
    p_user_id UUID,
    p_source_account_id UUID,
    p_destination_account_id UUID,
    p_name TEXT,
    p_amount DECIMAL(12, 2),
    p_default_amount DECIMAL(12, 2),
    p_day_of_month INTEGER,
    p_frequency frequency_type DEFAULT 'monthly',
    p_month_of_year INTEGER DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_transfer_pair_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer_pair_id UUID;
    v_source_transaction recurring_transactions;
    v_destination_transaction recurring_transactions;
BEGIN
    -- 送金ペアIDを生成（渡されない場合）
    IF p_transfer_pair_id IS NULL THEN
        v_transfer_pair_id := gen_random_uuid();
    ELSE
        v_transfer_pair_id := p_transfer_pair_id;
    END IF;

    -- 送金元口座から支出トランザクションを作成
    INSERT INTO recurring_transactions (
        user_id,
        account_id,
        amount,
        default_amount,
        type,
        name,
        description,
        day_of_month,
        frequency,
        month_of_year,
        is_transfer,
        destination_account_id,
        transfer_pair_id
    ) VALUES (
        p_user_id,
        p_source_account_id,
        p_amount,
        p_default_amount,
        'expense',
        p_name,
        p_description,
        p_day_of_month,
        p_frequency,
        p_month_of_year,
        TRUE,
        p_destination_account_id,
        v_transfer_pair_id
    )
    RETURNING * INTO v_source_transaction;

    -- 送金先口座に収入トランザクションを作成
    INSERT INTO recurring_transactions (
        user_id,
        account_id,
        amount,
        default_amount,
        type,
        name,
        description,
        day_of_month,
        frequency,
        month_of_year,
        is_transfer,
        destination_account_id,
        transfer_pair_id
    ) VALUES (
        p_user_id,
        p_destination_account_id,
        p_amount,
        p_default_amount,
        'income',
        p_name,
        p_description,
        p_day_of_month,
        p_frequency,
        p_month_of_year,
        TRUE,
        p_source_account_id, -- 收入側では送金元を destination_account_id に設定
        v_transfer_pair_id
    )
    RETURNING * INTO v_destination_transaction;

    -- 結果をJSONで返す
    RETURN json_build_object(
        'transfer_pair_id', v_transfer_pair_id,
        'source_transaction', row_to_json(v_source_transaction),
        'destination_transaction', row_to_json(v_destination_transaction)
    );
END;
$$;