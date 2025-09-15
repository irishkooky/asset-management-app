"use server";

import { revalidatePath } from "next/cache";
import type { Account } from "@/types/database";
import { createClient } from "@/utils/supabase/server";
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
	_startMonth: number,
	endYear: number,
	_endMonth: number,
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
): Promise<{ data?: number; error?: string }> {
	if (!recurringTransactionId) {
		return { error: "取引IDが必要です" };
	}

	if (
		!year ||
		!month ||
		year < 2020 ||
		year > 2030 ||
		month < 1 ||
		month > 12
	) {
		return { error: "有効な年月を入力してください" };
	}

	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("recurring_transaction_amounts")
			.select("amount")
			.eq("recurring_transaction_id", recurringTransactionId)
			.eq("year", year)
			.eq("month", month)
			.single();

		if (error && error.code !== "PGRST116") {
			throw new Error(`月別金額の取得に失敗しました: ${error.message}`);
		}

		if (data) {
			return { data: data.amount };
		}

		const { data: recurringData, error: recurringError } = await supabase
			.from("recurring_transactions")
			.select("default_amount")
			.eq("id", recurringTransactionId)
			.single();

		if (recurringError) {
			throw new Error(
				`定期的な収支の取得に失敗しました: ${recurringError.message}`,
			);
		}

		return { data: recurringData?.default_amount || 0 };
	} catch (error) {
		console.error("Error getting amount for month:", error);
		return {
			error:
				error instanceof Error ? error.message : "月別金額の取得に失敗しました",
		};
	}
}

/**
 * 特定の月の金額を設定する
 */
export async function setAmountForMonth(
	recurringTransactionId: string,
	year: number,
	month: number,
	amount: number,
): Promise<{ success?: string; error?: string }> {
	if (!recurringTransactionId) {
		return { error: "取引IDが必要です" };
	}

	if (
		!year ||
		!month ||
		year < 2020 ||
		year > 2030 ||
		month < 1 ||
		month > 12
	) {
		return { error: "有効な年月を入力してください" };
	}

	try {
		const supabase = await createClient();

		const { data: transaction, error: transactionError } = await supabase
			.from("recurring_transactions")
			.select("is_transfer, transfer_pair_id")
			.eq("id", recurringTransactionId)
			.single();

		if (transactionError) {
			throw new Error(
				`取引情報の取得に失敗しました: ${transactionError.message}`,
			);
		}

		let pairTransactionId: string | null = null;
		if (transaction.is_transfer && transaction.transfer_pair_id) {
			const { data: pairTransaction, error: pairError } = await supabase
				.from("recurring_transactions")
				.select("id")
				.eq("transfer_pair_id", transaction.transfer_pair_id)
				.neq("id", recurringTransactionId)
				.single();

			if (pairError) {
				console.error("送金ペアの取得に失敗しました:", pairError);
			} else {
				pairTransactionId = pairTransaction.id;
			}
		}

		const transactionIds = [recurringTransactionId];
		if (pairTransactionId) {
			transactionIds.push(pairTransactionId);
		}

		for (const transactionId of transactionIds) {
			const { data, error } = await supabase
				.from("recurring_transaction_amounts")
				.select("id")
				.eq("recurring_transaction_id", transactionId)
				.eq("year", year)
				.eq("month", month)
				.single();

			if (error && error.code !== "PGRST116") {
				throw new Error(`月別金額の確認に失敗しました: ${error.message}`);
			}

			if (data) {
				const { error: updateError } = await supabase
					.from("recurring_transaction_amounts")
					.update({ amount, updated_at: new Date().toISOString() })
					.eq("id", data.id);

				if (updateError) {
					throw new Error(
						`月別金額の更新に失敗しました: ${updateError.message}`,
					);
				}
			} else {
				const { error: insertError } = await supabase
					.from("recurring_transaction_amounts")
					.insert({
						recurring_transaction_id: transactionId,
						year,
						month,
						amount,
					});

				if (insertError) {
					throw new Error(
						`月別金額の作成に失敗しました: ${insertError.message}`,
					);
				}
			}
		}

		revalidatePath("/transactions/recurring");
		return { success: "月別金額を設定しました" };
	} catch (error) {
		console.error("Error setting amount for month:", error);
		return {
			error:
				error instanceof Error ? error.message : "月別金額の設定に失敗しました",
		};
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
): Promise<{ success?: string; error?: string }> {
	if (!recurringTransactionId) {
		return { error: "取引IDが必要です" };
	}

	if (!startYear || !startMonth || !endYear || !endMonth) {
		return { error: "開始年月と終了年月が必要です" };
	}

	if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
		return { error: "開始年月は終了年月より前である必要があります" };
	}

	if (typeof amount !== "number" || Number.isNaN(amount)) {
		return { error: "有効な金額を入力してください" };
	}

	try {
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

		for (const { year, month } of months) {
			const result = await setAmountForMonth(
				recurringTransactionId,
				year,
				month,
				amount,
			);
			if (result.error) {
				throw new Error(result.error);
			}
		}

		return { success: `${months.length}ヶ月分の金額を設定しました` };
	} catch (error) {
		console.error("Error setting bulk amounts:", error);
		return {
			error:
				error instanceof Error ? error.message : "一括金額設定に失敗しました",
		};
	}
}

/**
 * デフォルト金額を更新する
 */
export async function updateDefaultAmount(
	recurringTransactionId: string,
	defaultAmount: number,
): Promise<{ success?: string; error?: string }> {
	if (!recurringTransactionId) {
		return { error: "取引IDが必要です" };
	}

	if (typeof defaultAmount !== "number" || Number.isNaN(defaultAmount)) {
		return { error: "有効な金額を入力してください" };
	}

	try {
		const supabase = await createClient();

		const { error } = await supabase
			.from("recurring_transactions")
			.update({
				default_amount: defaultAmount,
				amount: defaultAmount,
				updated_at: new Date().toISOString(),
			})
			.eq("id", recurringTransactionId);

		if (error) {
			throw new Error(`デフォルト金額の更新に失敗しました: ${error.message}`);
		}

		revalidatePath("/transactions/recurring");
		return { success: "デフォルト金額を更新しました" };
	} catch (error) {
		console.error("Error updating default amount:", error);
		return {
			error:
				error instanceof Error
					? error.message
					: "デフォルト金額の更新に失敗しました",
		};
	}
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
): Promise<{ data?: RecurringTransaction; error?: string }> {
	if (!transactionId) {
		return { error: "取引IDが必要です" };
	}

	try {
		const supabase = await createClient();

		const updateData = {
			...updates,
			amount: updates.default_amount,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from("recurring_transactions")
			.update(updateData)
			.eq("id", transactionId)
			.select()
			.single();

		if (error) {
			throw new Error(`定期的な収支の更新に失敗しました: ${error.message}`);
		}

		revalidatePath("/transactions/recurring");
		return { data: data as RecurringTransaction };
	} catch (error) {
		console.error("Error updating recurring transaction:", error);
		return {
			error:
				error instanceof Error
					? error.message
					: "定期的な収支の更新に失敗しました",
		};
	}
}

/**
 * 定期的な収支を削除する
 */
export async function deleteRecurringTransaction(
	transactionId: string,
): Promise<{ success?: string; error?: string }> {
	if (!transactionId) {
		return { error: "取引IDが必要です" };
	}

	try {
		const supabase = await createClient();

		const { error } = await supabase
			.from("recurring_transactions")
			.delete()
			.eq("id", transactionId);

		if (error) {
			throw new Error(`定期的な収支の削除に失敗しました: ${error.message}`);
		}

		revalidatePath("/transactions/recurring");
		return { success: "定期的な収支を削除しました" };
	} catch (error) {
		console.error("Error deleting recurring transaction:", error);
		return {
			error:
				error instanceof Error
					? error.message
					: "定期的な収支の削除に失敗しました",
		};
	}
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
