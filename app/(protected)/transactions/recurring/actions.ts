"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Account } from "@/types/database";
import type {
	MonthlyAmount,
	RecurringTransaction,
	RecurringTransactionAmount,
} from "./types";

/**
 * 定期的な収支データを取得する
 */
export async function getRecurringTransactions(): Promise<
	RecurringTransaction[]
> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("recurring_transactions")
		.select("*")
		.order("day_of_month", { ascending: true });

	if (error)
		throw new Error(`定期的な収支の取得に失敗しました: ${error.message}`);
	return data || [];
}

/**
 * 特定の定期的な収支の月別金額を取得する
 */
export async function getMonthlyAmounts(
	recurringTransactionId: string,
	startYear: number,
	startMonth: number,
	endYear: number,
	endMonth: number,
): Promise<MonthlyAmount[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("recurring_transaction_amounts")
		.select("*")
		.eq("recurring_transaction_id", recurringTransactionId)
		.gte("year", startYear)
		.lte("year", endYear)
		.order("year", { ascending: true })
		.order("month", { ascending: true });

	if (error) throw new Error(`月別金額の取得に失敗しました: ${error.message}`);

	// 結果をMonthlyAmount形式に変換
	return (data || []).map((item: RecurringTransactionAmount) => ({
		year: item.year,
		month: item.month,
		amount: item.amount,
	}));
}

/**
 * 特定の月の金額を取得（設定されていない場合はデフォルト金額を返す）
 */
export async function getAmountForMonth(
	recurringTransactionId: string,
	year: number,
	month: number,
): Promise<number> {
	const supabase = await createClient();

	// 特定の月の金額を検索
	const { data, error } = await supabase
		.from("recurring_transaction_amounts")
		.select("amount")
		.eq("recurring_transaction_id", recurringTransactionId)
		.eq("year", year)
		.eq("month", month)
		.single();

	if (error && error.code !== "PGRST116") {
		// PGRST116: 結果が見つからない
		throw new Error(`月別金額の取得に失敗しました: ${error.message}`);
	}

	// 特定の月の金額が見つかった場合はそれを返す
	if (data) return data.amount;

	// 見つからない場合はデフォルト金額を返す
	const { data: recurringData, error: recurringError } = await supabase
		.from("recurring_transactions")
		.select("default_amount")
		.eq("id", recurringTransactionId)
		.single();

	if (recurringError)
		throw new Error(
			`定期的な収支の取得に失敗しました: ${recurringError.message}`,
		);
	return recurringData?.default_amount || 0;
}

/**
 * 特定の月の金額を設定する
 */
export async function setAmountForMonth(
	recurringTransactionId: string,
	year: number,
	month: number,
	amount: number,
): Promise<void> {
	const supabase = await createClient();

	// すでに設定されているか確認
	const { data, error } = await supabase
		.from("recurring_transaction_amounts")
		.select("id")
		.eq("recurring_transaction_id", recurringTransactionId)
		.eq("year", year)
		.eq("month", month)
		.single();

	if (error && error.code !== "PGRST116") {
		throw new Error(`月別金額の確認に失敗しました: ${error.message}`);
	}

	if (data) {
		// 既存のレコードを更新
		const { error: updateError } = await supabase
			.from("recurring_transaction_amounts")
			.update({ amount, updated_at: new Date().toISOString() })
			.eq("id", data.id);

		if (updateError)
			throw new Error(`月別金額の更新に失敗しました: ${updateError.message}`);
	} else {
		// 新しいレコードを作成
		const { error: insertError } = await supabase
			.from("recurring_transaction_amounts")
			.insert({
				recurring_transaction_id: recurringTransactionId,
				year,
				month,
				amount,
			});

		if (insertError)
			throw new Error(`月別金額の作成に失敗しました: ${insertError.message}`);
	}
}

/**
 * 期間内の月々の金額を一括設定する
 */
export async function setBulkAmounts(
	recurringTransactionId: string,
	startYear: number,
	startMonth: number,
	endYear: number,
	endMonth: number,
	amount: number,
): Promise<void> {
	// 指定期間の全ての年月の組み合わせを生成
	const months: { year: number; month: number }[] = [];
	let currentYear = startYear;
	let currentMonth = startMonth;

	while (
		currentYear < endYear ||
		(currentYear === endYear && currentMonth <= endMonth)
	) {
		months.push({ year: currentYear, month: currentMonth });

		currentMonth++;
		if (currentMonth > 12) {
			currentMonth = 1;
			currentYear++;
		}
	}

	// 各月ごとに金額を設定
	for (const { year, month } of months) {
		await setAmountForMonth(recurringTransactionId, year, month, amount);
	}
}

/**
 * デフォルト金額を更新する
 */
export async function updateDefaultAmount(
	recurringTransactionId: string,
	defaultAmount: number,
): Promise<void> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("recurring_transactions")
		.update({
			default_amount: defaultAmount,
			amount: defaultAmount, // 互換性のために両方更新
			updated_at: new Date().toISOString(),
		})
		.eq("id", recurringTransactionId);

	if (error)
		throw new Error(`デフォルト金額の更新に失敗しました: ${error.message}`);
}

/**
 * 定期的な収支を更新する
 */
export async function updateRecurringTransaction(
	transactionId: string,
	updates: {
		name?: string;
		description?: string | null;
		default_amount?: number;
		day_of_month?: number;
		account_id?: string | null;
		type?: "income" | "expense";
	},
): Promise<RecurringTransaction> {
	const supabase = await createClient();

	// amount フィールドも同時に更新（互換性のため）
	const updateData = {
		...updates,
		amount: updates.default_amount, // 互換性のために両方更新
		updated_at: new Date().toISOString(),
	};

	const { data, error } = await supabase
		.from("recurring_transactions")
		.update(updateData)
		.eq("id", transactionId)
		.select()
		.single();

	if (error)
		throw new Error(`定期的な収支の更新に失敗しました: ${error.message}`);
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
		throw new Error(`定期的な収支の削除に失敗しました: ${error.message}`);
	}

	// キャッシュを再検証
	revalidatePath("/transactions/recurring");
}

/**
 * ユーザーの口座一覧を取得する
 */
export async function getUserAccountsServerAction(): Promise<Account[]> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("accounts")
		.select("*")
		.order("name");

	if (error) {
		console.error("Error fetching accounts:", error);
		throw new Error("口座情報の取得に失敗しました");
	}

	return data as Account[];
}
