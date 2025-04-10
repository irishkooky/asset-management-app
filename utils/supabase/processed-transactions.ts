import type {
	OneTimeTransaction,
	RecurringTransaction,
} from "@/types/database";
import { createClient } from "@/utils/supabase/server";

/**
 * 取引が処理済みかどうかを確認する
 */
export async function isTransactionProcessed(
	transactionId: string,
	accountId: string,
): Promise<boolean> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("processed_transactions")
		.select("id")
		.eq("transaction_id", transactionId)
		.eq("account_id", accountId)
		.single();

	if (error && error.code !== "PGRST116") {
		console.error("Error checking processed transaction:", error);
		throw new Error("処理済み取引の確認に失敗しました");
	}

	return !!data;
}

/**
 * 取引を処理済みとしてマークする
 */
export async function markTransactionAsProcessed(
	transactionId: string,
	transactionType: "one_time" | "recurring",
	accountId: string,
): Promise<void> {
	const supabase = await createClient();

	const { error } = await supabase.from("processed_transactions").insert([
		{
			transaction_id: transactionId,
			transaction_type: transactionType,
			account_id: accountId,
		},
	]);

	if (error) {
		console.error("Error marking transaction as processed:", error);
		throw new Error("取引の処理状態の更新に失敗しました");
	}
}

/**
 * 複数の取引を処理済みとしてマークする
 */
export async function markTransactionsAsProcessed(
	transactions: (OneTimeTransaction | RecurringTransaction)[],
	transactionType: "one_time" | "recurring",
	accountId: string,
): Promise<void> {
	if (transactions.length === 0) return;

	const supabase = await createClient();

	const records = transactions.map((tx) => ({
		transaction_id: tx.id,
		transaction_type: transactionType,
		account_id: accountId,
	}));

	const { error } = await supabase
		.from("processed_transactions")
		.insert(records);

	if (error) {
		console.error("Error marking transactions as processed:", error);
		throw new Error("取引の処理状態の更新に失敗しました");
	}
}

/**
 * 未処理の臨時収支を取得する
 */
export async function getUnprocessedOneTimeTransactions(
	accountId: string,
	endDate: Date,
): Promise<OneTimeTransaction[]> {
	const supabase = await createClient();

	// まず、すべての臨時収支を取得
	const { data: allTransactions, error: fetchError } = await supabase
		.from("one_time_transactions")
		.select("*")
		.eq("account_id", accountId)
		.lte("transaction_date", endDate.toISOString().split("T")[0])
		.order("transaction_date", { ascending: false });

	if (fetchError) {
		console.error("Error fetching one-time transactions:", fetchError);
		throw new Error("臨時収支情報の取得に失敗しました");
	}

	if (!allTransactions || allTransactions.length === 0) {
		return [];
	}

	// 処理済みの取引IDを取得
	const { data: processedData, error: processedError } = await supabase
		.from("processed_transactions")
		.select("transaction_id")
		.eq("account_id", accountId)
		.eq("transaction_type", "one_time")
		.in(
			"transaction_id",
			allTransactions.map((tx) => tx.id),
		);

	if (processedError) {
		console.error("Error fetching processed transactions:", processedError);
		throw new Error("処理済み取引情報の取得に失敗しました");
	}

	// 処理済みの取引IDをセットに変換
	const processedIds = new Set(
		processedData?.map((item) => item.transaction_id) || [],
	);

	// 未処理の取引のみをフィルタリング
	return allTransactions.filter(
		(tx) => !processedIds.has(tx.id),
	) as OneTimeTransaction[];
}

/**
 * 未処理の定期的な収支を取得する
 */
export async function getUnprocessedRecurringTransactions(
	accountId: string,
	currentDay: number,
): Promise<RecurringTransaction[]> {
	const supabase = await createClient();

	// まず、すべての定期的な収支を取得
	const { data: allTransactions, error: fetchError } = await supabase
		.from("recurring_transactions")
		.select("*")
		.eq("account_id", accountId)
		.lte("day_of_month", currentDay)
		.order("day_of_month");

	if (fetchError) {
		console.error("Error fetching recurring transactions:", fetchError);
		throw new Error("定期的な収支情報の取得に失敗しました");
	}

	if (!allTransactions || allTransactions.length === 0) {
		return [];
	}

	// 処理済みの取引IDを取得
	const { data: processedData, error: processedError } = await supabase
		.from("processed_transactions")
		.select("transaction_id")
		.eq("account_id", accountId)
		.eq("transaction_type", "recurring")
		.in(
			"transaction_id",
			allTransactions.map((tx) => tx.id),
		);

	if (processedError) {
		console.error("Error fetching processed transactions:", processedError);
		throw new Error("処理済み取引情報の取得に失敗しました");
	}

	// 処理済みの取引IDをセットに変換
	const processedIds = new Set(
		processedData?.map((item) => item.transaction_id) || [],
	);

	// 未処理の取引のみをフィルタリング
	return allTransactions.filter(
		(tx) => !processedIds.has(tx.id),
	) as RecurringTransaction[];
}
