-- 一時的取引の送金を作成するストアドプロシージャ
CREATE OR REPLACE FUNCTION create_one_time_transfer(
    p_user_id UUID,
    p_source_account_id UUID,
    p_destination_account_id UUID,
    p_name TEXT,
    p_amount DECIMAL(12, 2),
    p_transaction_date DATE,
    p_description TEXT DEFAULT NULL,
    p_transfer_pair_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer_pair_id UUID;
    v_source_transaction one_time_transactions;
    v_destination_transaction one_time_transactions;
BEGIN
    -- 送金ペアIDを生成（渡されない場合）
    IF p_transfer_pair_id IS NULL THEN
        v_transfer_pair_id := gen_random_uuid();
    ELSE
        v_transfer_pair_id := p_transfer_pair_id;
    END IF;

    -- 送金元口座から支出トランザクションを作成
    INSERT INTO one_time_transactions (
        user_id,
        account_id,
        amount,
        type,
        name,
        description,
        transaction_date,
        is_transfer,
        destination_account_id,
        transfer_pair_id
    ) VALUES (
        p_user_id,
        p_source_account_id,
        p_amount,
        'expense',
        p_name,
        p_description,
        p_transaction_date,
        TRUE,
        p_destination_account_id,
        v_transfer_pair_id
    )
    RETURNING * INTO v_source_transaction;

    -- 送金先口座に収入トランザクションを作成
    INSERT INTO one_time_transactions (
        user_id,
        account_id,
        amount,
        type,
        name,
        description,
        transaction_date,
        is_transfer,
        destination_account_id,
        transfer_pair_id
    ) VALUES (
        p_user_id,
        p_destination_account_id,
        p_amount,
        'income',
        p_name,
        p_description,
        p_transaction_date,
        TRUE,
        p_source_account_id, -- 収入側では送金元を destination_account_id に設定
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

-- 定期取引の送金を作成するストアドプロシージャ
CREATE OR REPLACE FUNCTION create_recurring_transfer(
    p_user_id UUID,
    p_source_account_id UUID,
    p_destination_account_id UUID,
    p_name TEXT,
    p_amount DECIMAL(12, 2),
    p_default_amount DECIMAL(12, 2),
    p_day_of_month INTEGER,
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
        TRUE,
        p_source_account_id, -- 収入側では送金元を destination_account_id に設定
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