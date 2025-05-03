import type { RecurringTransaction, TransactionType } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

/**
 * ユーザーの全定期的な収支を取得する
 */
export async function getUserRecurringTransactions(
	accountId?: string,
): Promise<RecurringTransaction[]> {
	const supabase = await createClient();

	let query = supabase
		.from("recurring_transactions")
		.select("*")
		.order("day_of_month");

	if (accountId) {
		query = query.eq("account_id", accountId);
	}

	const { data, error } = await query;

	if (error) {
		console.error("Error fetching recurring transactions:", error);
		throw new Error("定期的な収支情報の取得に失敗しました");
	}

	return data as RecurringTransaction[];
}

/**
 * 特定の定期的な収支を取得する
 */
export async function getRecurringTransactionById(
	transactionId: string,
): Promise<RecurringTransaction | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("recurring_transactions")
		.select("*")
		.eq("id", transactionId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			// PGRST116はレコードが見つからない場合のエラーコード
			return null;
		}
		console.error("Error fetching recurring transaction:", error);
		throw new Error("定期的な収支情報の取得に失敗しました");
	}

	return data as RecurringTransaction;
}

/**
 * 新しい定期的な収支を作成する
 */
export async function createRecurringTransaction(
	accountId: string,
	name: string,
	amount: number,
	type: TransactionType,
	dayOfMonth: number,
	description?: string,
): Promise<RecurringTransaction> {
	const supabase = await createClient();

	// 現在のユーザーIDを取得
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	// 日付が正しく保存されるように明示的に整数値として扱う
	const day = Number.parseInt(String(dayOfMonth), 10);

	if (Number.isNaN(day) || day < 1 || day > 31) {
		throw new Error("日付は1から31の間で入力してください");
	}

	const { data, error } = await supabase
		.from("recurring_transactions")
		.insert([
			{
				account_id: accountId,
				name,
				amount,
				type,
				day_of_month: day, // 明示的に整数値として保存
				description: description || null,
				user_id: user.id, // ユーザーIDを設定
			},
		])
		.select()
		.single();

	if (error) {
		console.error("Error creating recurring transaction:", error);
		throw new Error("定期的な収支の作成に失敗しました");
	}

	return data as RecurringTransaction;
}

/**
 * 定期的な収支情報を更新する
 */
export async function updateRecurringTransaction(
	transactionId: string,
	updates: {
		name?: string;
		amount?: number;
		type?: TransactionType;
		day_of_month?: number;
		description?: string | null;
	},
): Promise<RecurringTransaction> {
	const supabase = await createClient();

	// 日付が指定されている場合は、正しく処理されるよう明示的に整数値として扱う
	const processedUpdates = { ...updates };
	if (typeof updates.day_of_month !== 'undefined') {
		const day = Number.parseInt(String(updates.day_of_month), 10);
		if (Number.isNaN(day) || day < 1 || day > 31) {
			throw new Error("日付は1から31の間で入力してください");
		}
		processedUpdates.day_of_month = day;
	}

	const { data, error } = await supabase
		.from("recurring_transactions")
		.update({
			...processedUpdates,
			updated_at: new Date().toISOString(),
		})
		.eq("id", transactionId)
		.select()
		.single();

	if (error) {
		console.error("Error updating recurring transaction:", error);
		throw new Error("定期的な収支情報の更新に失敗しました");
	}

	return data as RecurringTransaction;
}

/**
 * 定期的な収支を削除する
 */
export async function deleteRecurringTransaction(
	transactionId: string,
): Promise<void> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("recurring_transactions")
		.delete()
		.eq("id", transactionId);

	if (error) {
		console.error("Error deleting recurring transaction:", error);
		throw new Error("定期的な収支の削除に失敗しました");
	}
}

/**
 * 月間の定期的な収支の合計を計算する
 */
export async function getMonthlyRecurringTotal(
	accountId?: string,
): Promise<{ income: number; expense: number }> {
	const transactions = await getUserRecurringTransactions(accountId);

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
