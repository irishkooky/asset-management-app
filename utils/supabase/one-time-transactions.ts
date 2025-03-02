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
