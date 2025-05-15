import type { RecurringTransaction, TransactionType } from "@/types/database";
import { createClient } from "@/utils/supabase/server";
import {
	validateCreateTransaction,
	validateUpdateTransaction,
} from "@/utils/validators/recurring-transaction";

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
	defaultAmount: number,
	type: TransactionType,
	dayOfMonth: number | string,
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

	// Valibotを使用して入力値をバリデーション
	const validatedData = validateCreateTransaction({
		accountId,
		name,
		amount,
		defaultAmount,
		type,
		dayOfMonth,
		description,
	});

	const { data, error } = await supabase
		.from("recurring_transactions")
		.insert([
			{
				account_id: validatedData.accountId,
				name: validatedData.name,
				amount: validatedData.amount,
				default_amount: validatedData.defaultAmount,
				type: validatedData.type,
				day_of_month: validatedData.dayOfMonth, // バリデーション済みの整数値
				description: validatedData.description || null,
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
		dayOfMonth?: number | string;
		description?: string | null;
	},
): Promise<RecurringTransaction> {
	const supabase = await createClient();

	// Valibotを使用して入力値をバリデーション
	const validatedData = validateUpdateTransaction(updates);

	// DBカラム名に合わせてキーを変換
	const dbUpdates: Record<string, unknown> = {};

	if (validatedData.name !== undefined) {
		dbUpdates.name = validatedData.name;
	}

	if (validatedData.amount !== undefined) {
		dbUpdates.amount = validatedData.amount;
	}

	if (validatedData.type !== undefined) {
		dbUpdates.type = validatedData.type;
	}

	if (validatedData.dayOfMonth !== undefined) {
		dbUpdates.day_of_month = validatedData.dayOfMonth;
	}

	if (validatedData.description !== undefined) {
		dbUpdates.description = validatedData.description;
	}

	const { data, error } = await supabase
		.from("recurring_transactions")
		.update({
			...dbUpdates,
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
