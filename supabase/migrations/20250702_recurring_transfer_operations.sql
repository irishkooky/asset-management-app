-- 定期送金のペアを更新するストアドプロシージャ
CREATE OR REPLACE FUNCTION update_recurring_transfer_pair(
    p_transaction_id UUID,
    p_amount DECIMAL(12, 2),
    p_name TEXT DEFAULT NULL,
    p_day_of_month INTEGER DEFAULT NULL,
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

-- 定期送金のペアを削除するストアドプロシージャ
CREATE OR REPLACE FUNCTION delete_recurring_transfer_pair(
    p_transaction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction recurring_transactions;
    v_transfer_pair_id UUID;
    v_deleted_count INTEGER;
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
    
    -- 両方のトランザクションを削除
    DELETE FROM recurring_transactions
    WHERE transfer_pair_id = v_transfer_pair_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- 結果を返す
    RETURN json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'transfer_pair_id', v_transfer_pair_id
    );
END;
$$;

-- 一時送金のペアを更新するストアドプロシージャ
CREATE OR REPLACE FUNCTION update_one_time_transfer_pair(
    p_transaction_id UUID,
    p_amount DECIMAL(12, 2),
    p_name TEXT DEFAULT NULL,
    p_transaction_date DATE DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction one_time_transactions;
    v_pair_transaction one_time_transactions;
    v_transfer_pair_id UUID;
BEGIN
    -- 元のトランザクションを取得
    SELECT * INTO v_transaction
    FROM one_time_transactions
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
    FROM one_time_transactions
    WHERE transfer_pair_id = v_transfer_pair_id
    AND id != p_transaction_id;
    
    IF v_pair_transaction IS NULL THEN
        RAISE EXCEPTION 'Transfer pair not found';
    END IF;
    
    -- 両方のトランザクションを更新
    UPDATE one_time_transactions
    SET 
        amount = COALESCE(p_amount, amount),
        name = COALESCE(p_name, name),
        transaction_date = COALESCE(p_transaction_date, transaction_date),
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

-- 一時送金のペアを削除するストアドプロシージャ
CREATE OR REPLACE FUNCTION delete_one_time_transfer_pair(
    p_transaction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction one_time_transactions;
    v_transfer_pair_id UUID;
    v_deleted_count INTEGER;
BEGIN
    -- 元のトランザクションを取得
    SELECT * INTO v_transaction
    FROM one_time_transactions
    WHERE id = p_transaction_id;
    
    IF v_transaction IS NULL THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;
    
    -- 送金でない場合はエラー
    IF NOT v_transaction.is_transfer OR v_transaction.transfer_pair_id IS NULL THEN
        RAISE EXCEPTION 'Transaction is not a transfer';
    END IF;
    
    v_transfer_pair_id := v_transaction.transfer_pair_id;
    
    -- 両方のトランザクションを削除
    DELETE FROM one_time_transactions
    WHERE transfer_pair_id = v_transfer_pair_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- 結果を返す
    RETURN json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'transfer_pair_id', v_transfer_pair_id
    );
END;
$$;