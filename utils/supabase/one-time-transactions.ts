import type { OneTimeTransaction, TransactionType } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

/**
 * ユーザーの全臨時収支を取得する
 */
export async function getUserOneTimeTransactions(
	accountId?: string,
	startDate?: Date,
	endDate?: Date,
): Promise<OneTimeTransaction[]> {
	const supabase = await createClient();

	let query = supabase
		.from("one_time_transactions")
		.select("*")
		.order("transaction_date", { ascending: false });

	if (accountId) {
		query = query.eq("account_id", accountId);
	}

	if (startDate) {
		query = query.gte(
			"transaction_date",
			startDate.toISOString().split("T")[0],
		);
	}

	if (endDate) {
		query = query.lte("transaction_date", endDate.toISOString().split("T")[0]);
	}

	const { data, error } = await query;

	if (error) {
		console.error("Error fetching one-time transactions:", error);
		throw new Error("臨時収支情報の取得に失敗しました");
	}

	return data as OneTimeTransaction[];
}

/**
 * 特定の臨時収支を取得する
 */
export async function getOneTimeTransactionById(
	transactionId: string,
): Promise<OneTimeTransaction | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("one_time_transactions")
		.select("*")
		.eq("id", transactionId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			// PGRST116はレコードが見つからない場合のエラーコード
			return null;
		}
		console.error("Error fetching one-time transaction:", error);
		throw new Error("臨時収支情報の取得に失敗しました");
	}

	return data as OneTimeTransaction;
}

/**
 * 新しい臨時収支を作成する
 */
export async function createOneTimeTransaction(
	accountId: string,
	name: string,
	amount: number,
	type: TransactionType,
	transactionDate: Date,
	description?: string,
): Promise<OneTimeTransaction> {
	const supabase = await createClient();

	// 現在のユーザーIDを取得
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	const { data, error } = await supabase
		.from("one_time_transactions")
		.insert([
			{
				account_id: accountId,
				name,
				amount,
				type,
				transaction_date: transactionDate.toISOString().split("T")[0],
				description: description || null,
				user_id: user.id, // ユーザーIDを設定
				is_transfer: false,
				destination_account_id: null,
				transfer_pair_id: null,
			},
		])
		.select()
		.single();

	if (error) {
		console.error("Error creating one-time transaction:", error);
		throw new Error("臨時収支の作成に失敗しました");
	}

	return data as OneTimeTransaction;
}

/**
 * 口座間送金を作成する（一時的取引）
 */
export async function createOneTimeTransfer(
	sourceAccountId: string,
	destinationAccountId: string,
	name: string,
	amount: number,
	transactionDate: Date,
	description?: string,
): Promise<{
	sourceTransaction: OneTimeTransaction;
	destinationTransaction: OneTimeTransaction;
}> {
	const supabase = await createClient();

	// 現在のユーザーIDを取得
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	// 送金元と送金先が同じ口座でないことを確認
	if (sourceAccountId === destinationAccountId) {
		throw new Error("送金元と送金先は異なる口座である必要があります");
	}

	// 送金ペアIDを生成
	const transferPairId = crypto.randomUUID();

	// トランザクションを使用して両方の取引を同時に作成
	const { data, error } = await supabase.rpc("create_one_time_transfer", {
		p_user_id: user.id,
		p_source_account_id: sourceAccountId,
		p_destination_account_id: destinationAccountId,
		p_name: name,
		p_amount: amount,
		p_transaction_date: transactionDate.toISOString().split("T")[0],
		p_description: description || null,
		p_transfer_pair_id: transferPairId,
	});

	if (error) {
		console.error("Error creating one-time transfer:", error);
		throw new Error("口座間送金の作成に失敗しました");
	}

	if (!data) {
		throw new Error("送金データの作成に失敗しました");
	}

	const sourceTransaction = data.source_transaction as OneTimeTransaction;
	const destinationTransaction =
		data.destination_transaction as OneTimeTransaction;

	return { sourceTransaction, destinationTransaction };
}

/**
 * 臨時収支情報を更新する
 */
export async function updateOneTimeTransaction(
	transactionId: string,
	updates: {
		name?: string;
		amount?: number;
		type?: TransactionType;
		transaction_date?: Date | string;
		description?: string | null;
	},
): Promise<OneTimeTransaction> {
	const supabase = await createClient();

	// まずトランザクションを取得して送金かどうか確認
	const { data: transaction, error: fetchError } = await supabase
		.from("one_time_transactions")
		.select("*")
		.eq("id", transactionId)
		.single();

	if (fetchError || !transaction) {
		console.error("Error fetching one-time transaction:", fetchError);
		throw new Error("臨時収支情報の取得に失敗しました");
	}

	// 送金の場合は特別な処理
	if (transaction.is_transfer) {
		// 日付形式を変換
		let transactionDate: string | undefined;
		if (updates.transaction_date) {
			if (updates.transaction_date instanceof Date) {
				transactionDate = updates.transaction_date.toISOString().split("T")[0];
			} else {
				transactionDate = updates.transaction_date;
			}
		}

		// ストアドプロシージャを使用してペアも更新
		const { error } = await supabase.rpc("update_one_time_transfer_pair", {
			p_transaction_id: transactionId,
			p_amount: updates.amount,
			p_name: updates.name,
			p_transaction_date: transactionDate,
			p_description: updates.description,
		});

		if (error) {
			console.error("Error updating one-time transfer pair:", error);
			throw new Error("一時送金の更新に失敗しました");
		}

		// 更新後のデータを取得して返す
		const { data: updatedTransaction, error: fetchError } = await supabase
			.from("one_time_transactions")
			.select("*")
			.eq("id", transactionId)
			.single();

		if (fetchError || !updatedTransaction) {
			throw new Error("更新後の一時送金情報の取得に失敗しました");
		}

		return updatedTransaction as OneTimeTransaction;
	}

	// 通常の取引の場合は従来通りの処理
	const updatedData = { ...updates };

	// 日付形式を変換
	if (updates.transaction_date) {
		if (updates.transaction_date instanceof Date) {
			updatedData.transaction_date = updates.transaction_date
				.toISOString()
				.split("T")[0];
		} else {
			// 既に文字列形式の場合はそのまま使用
			updatedData.transaction_date = updates.transaction_date;
		}
	}

	const { data, error } = await supabase
		.from("one_time_transactions")
		.update({
			...updatedData,
			updated_at: new Date().toISOString(),
		})
		.eq("id", transactionId)
		.select()
		.single();

	if (error) {
		console.error("Error updating one-time transaction:", error);
		throw new Error("臨時収支情報の更新に失敗しました");
	}

	return data as OneTimeTransaction;
}

/**
 * 臨時収支を削除する
 */
export async function deleteOneTimeTransaction(
	transactionId: string,
): Promise<void> {
	const supabase = await createClient();

	// まずトランザクションを取得して送金かどうか確認
	const { data: transaction, error: fetchError } = await supabase
		.from("one_time_transactions")
		.select("*")
		.eq("id", transactionId)
		.single();

	if (fetchError || !transaction) {
		console.error("Error fetching one-time transaction:", fetchError);
		throw new Error("臨時収支情報の取得に失敗しました");
	}

	// 送金の場合は特別な処理
	if (transaction.is_transfer) {
		// ストアドプロシージャを使用してペアも削除
		const { error } = await supabase.rpc("delete_one_time_transfer_pair", {
			p_transaction_id: transactionId,
		});

		if (error) {
			console.error("Error deleting one-time transfer pair:", error);
			throw new Error("一時送金の削除に失敗しました");
		}

		return;
	}

	// 通常の取引の場合は従来通りの処理
	const { error } = await supabase
		.from("one_time_transactions")
		.delete()
		.eq("id", transactionId);

	if (error) {
		console.error("Error deleting one-time transaction:", error);
		throw new Error("臨時収支の削除に失敗しました");
	}
}

/**
 * 指定期間内の臨時収支の合計を計算する
 */
export async function getOneTimeTransactionsTotal(
	startDate: Date,
	endDate: Date,
	accountId?: string,
): Promise<{ income: number; expense: number }> {
	const transactions = await getUserOneTimeTransactions(
		accountId,
		startDate,
		endDate,
	);

	return transactions.reduce(
		(totals, transaction) => {
			if (transaction.type === "income") {
				totals.income += transaction.amount;
			} else {
				totals.expense += transaction.amount;
			}
			return totals;
		},
		{ income: 0, expense: 0 },
	);
}
