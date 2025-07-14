import type {
	FrequencyType,
	RecurringTransaction,
	TransactionType,
} from "@/types/database";
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
	frequency: FrequencyType,
	monthOfYear?: number,
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
		frequency,
		monthOfYear,
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
				frequency: validatedData.frequency,
				month_of_year: validatedData.monthOfYear || null,
				description: validatedData.description || null,
				user_id: user.id, // ユーザーIDを設定
				is_transfer: false,
				destination_account_id: null,
				transfer_pair_id: null,
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
 * 口座間送金を作成する（定期取引）
 */
export async function createRecurringTransfer(
	sourceAccountId: string,
	destinationAccountId: string,
	name: string,
	amount: number,
	defaultAmount: number,
	dayOfMonth: number,
	frequency: FrequencyType,
	monthOfYear?: number,
	description?: string,
): Promise<{
	sourceTransaction: RecurringTransaction;
	destinationTransaction: RecurringTransaction;
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
	const { data, error } = await supabase.rpc("create_recurring_transfer", {
		p_user_id: user.id,
		p_source_account_id: sourceAccountId,
		p_destination_account_id: destinationAccountId,
		p_name: name,
		p_amount: amount,
		p_default_amount: defaultAmount,
		p_day_of_month: dayOfMonth,
		p_frequency: frequency,
		p_month_of_year: monthOfYear || null,
		p_description: description || null,
		p_transfer_pair_id: transferPairId,
	});

	if (error) {
		console.error("Error creating recurring transfer:", error);
		throw new Error("定期送金の作成に失敗しました");
	}

	if (!data) {
		throw new Error("定期送金データの作成に失敗しました");
	}

	const sourceTransaction = data.source_transaction as RecurringTransaction;
	const destinationTransaction =
		data.destination_transaction as RecurringTransaction;

	return { sourceTransaction, destinationTransaction };
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
		frequency?: FrequencyType;
		monthOfYear?: number | string;
		description?: string | null;
	},
): Promise<RecurringTransaction> {
	const supabase = await createClient();

	// まずトランザクションを取得して送金かどうか確認
	const { data: transaction, error: fetchError } = await supabase
		.from("recurring_transactions")
		.select("*")
		.eq("id", transactionId)
		.single();

	if (fetchError || !transaction) {
		console.error("Error fetching recurring transaction:", fetchError);
		throw new Error("定期的な収支情報の取得に失敗しました");
	}

	// 送金の場合は特別な処理
	if (transaction.is_transfer) {
		// Valibotを使用して入力値をバリデーション
		const validatedData = validateUpdateTransaction(updates);

		// ストアドプロシージャを使用してペアも更新
		const { error } = await supabase.rpc("update_recurring_transfer_pair", {
			p_transaction_id: transactionId,
			p_amount: validatedData.amount,
			p_name: validatedData.name,
			p_day_of_month: validatedData.dayOfMonth,
			p_frequency: validatedData.frequency,
			p_month_of_year: validatedData.monthOfYear,
			p_description: validatedData.description,
		});

		if (error) {
			console.error("Error updating recurring transfer pair:", error);
			throw new Error("定期送金の更新に失敗しました");
		}

		// 更新後のデータを取得して返す
		const { data: updatedTransaction, error: fetchError } = await supabase
			.from("recurring_transactions")
			.select("*")
			.eq("id", transactionId)
			.single();

		if (fetchError || !updatedTransaction) {
			throw new Error("更新後の定期送金情報の取得に失敗しました");
		}

		return updatedTransaction as RecurringTransaction;
	}

	// 通常の取引の場合は従来通りの処理
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

	if (validatedData.frequency !== undefined) {
		dbUpdates.frequency = validatedData.frequency;
	}

	if (validatedData.monthOfYear !== undefined) {
		dbUpdates.month_of_year = validatedData.monthOfYear;
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

	// まずトランザクションを取得して送金かどうか確認
	const { data: transaction, error: fetchError } = await supabase
		.from("recurring_transactions")
		.select("*")
		.eq("id", transactionId)
		.single();

	if (fetchError || !transaction) {
		console.error("Error fetching recurring transaction:", fetchError);
		throw new Error("定期的な収支情報の取得に失敗しました");
	}

	// 送金の場合は特別な処理
	if (transaction.is_transfer) {
		// ストアドプロシージャを使用してペアも削除
		const { error } = await supabase.rpc("delete_recurring_transfer_pair", {
			p_transaction_id: transactionId,
		});

		if (error) {
			console.error("Error deleting recurring transfer pair:", error);
			throw new Error("定期送金の削除に失敗しました");
		}

		return;
	}

	// 通常の取引の場合は従来通りの処理
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
