import type {
	FrequencyType,
	RecurringTransaction,
	TransactionType,
} from "@/types/database";
import { createClient } from "@/utils/supabase/server";
import { validateCreateTransaction } from "@/utils/validators/recurring-transaction";

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
 * 月間の定期的な収支の合計を計算する
 * ※注意: 頻度(frequency)を考慮していないため、getRecurringTotalForMonthの使用を推奨
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
