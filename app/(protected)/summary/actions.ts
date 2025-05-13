"use server";

import type {
	Account,
	OneTimeTransaction,
	RecurringTransaction,
	RecurringTransactionAmount,
} from "@/types/database";
import type { AccountSummary, Transaction } from "@/types/summary";
import { createClient } from "@/utils/supabase/server";
import { format, setDate, setMonth, setYear } from "date-fns";
import { revalidatePath } from "next/cache";

/**
 * 月次収支サマリーデータを取得する
 */
export async function getMonthlySummary(year: number, month: number) {
	const supabase = await createClient();

	// 指定された月の開始日と終了日を計算
	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0); // 月の最終日
	const formattedStartDate = format(startDate, "yyyy-MM-dd");
	const formattedEndDate = format(endDate, "yyyy-MM-dd");

	// 1. アカウント情報を取得
	const { data: accounts, error: accountsError } = await supabase
		.from("accounts")
		.select("*")
		.order("name");

	if (accountsError) {
		console.error("Error fetching accounts:", accountsError);
		throw new Error("口座情報の取得に失敗しました");
	}

	// 2. 指定月の臨時収支を取得
	const { data: oneTimeTransactions, error: oneTimeError } = await supabase
		.from("one_time_transactions")
		.select("*")
		.gte("transaction_date", formattedStartDate)
		.lte("transaction_date", formattedEndDate);

	if (oneTimeError) {
		console.error("Error fetching one-time transactions:", oneTimeError);
		throw new Error("臨時収支情報の取得に失敗しました");
	}

	// 3. 定期的な収支を取得
	const { data: recurringTransactions, error: recurringError } = await supabase
		.from("recurring_transactions")
		.select("*");

	if (recurringError) {
		console.error("Error fetching recurring transactions:", recurringError);
		throw new Error("定期的な収支情報の取得に失敗しました");
	}

	// 4. 特定の年月の定期取引金額を取得
	const { data: recurringAmounts, error: recurringAmountsError } =
		await supabase
			.from("recurring_transaction_amounts")
			.select("*")
			.eq("year", year)
			.eq("month", month);

	if (recurringAmountsError) {
		console.error("Error fetching recurring amounts:", recurringAmountsError);
		throw new Error("定期的な収支の月別金額の取得に失敗しました");
	}

	// 5. 月次サマリーデータを計算
	const summary = calculateMonthlySummary(
		accounts as Account[],
		oneTimeTransactions as OneTimeTransaction[],
		recurringTransactions as RecurringTransaction[],
		month,
		year,
		recurringAmounts as RecurringTransactionAmount[],
	);

	return summary;
}

/**
 * 月次収支サマリーデータを計算する
 */
function calculateMonthlySummary(
	accounts: Account[],
	oneTimeTransactions: OneTimeTransaction[],
	recurringTransactions: RecurringTransaction[],
	month: number,
	year: number,
	recurringAmounts: RecurringTransactionAmount[],
) {
	// 口座IDごとのトランザクション配列を作成
	const accountTransactions = new Map<string, Transaction[]>();

	// 口座ごとの収支データを初期化
	const accountSummaries: AccountSummary[] = accounts.map((account) => {
		// トランザクション配列を初期化
		accountTransactions.set(account.id, []);

		return {
			id: account.id,
			name: account.name,
			income: 0,
			expense: 0,
			balance: account.current_balance,
			transactions: [] as Transaction[],
		};
	});

	// 口座IDをキーとしたマップを作成（高速アクセス用）
	const accountMap = new Map(
		accountSummaries.map((summary) => [summary.id, summary]),
	);

	// 臨時収支を集計
	for (const transaction of oneTimeTransactions) {
		const accountSummary = accountMap.get(transaction.account_id);
		if (accountSummary) {
			if (transaction.type === "income") {
				accountSummary.income += transaction.amount;
			} else {
				accountSummary.expense += transaction.amount;
			}

			// トランザクションリストに追加
			accountSummary.transactions.push({
				id: transaction.id,
				name: transaction.name,
				amount: transaction.amount,
				type: transaction.type,
				transaction_date: transaction.transaction_date,
				description: transaction.description || undefined,
			});
		}
	}

	// 定期取引のカスタム金額をマップとして保持
	const recurringAmountsMap = new Map<string, number>();
	for (const amount of recurringAmounts) {
		recurringAmountsMap.set(amount.recurring_transaction_id, amount.amount);
	}

	// 定期的な収支を集計（当月に該当するもののみ）
	for (const transaction of recurringTransactions) {
		// 当月の該当する日付をdate-fnsを使用して作成
		const baseDate = new Date();
		const transactionDate = setDate(
			setMonth(setYear(baseDate, year), month - 1),
			transaction.day_of_month,
		);
		// タイムゾーンの影響を受けないようにdate-fnsのformat関数を使用
		const formattedTransactionDate = format(transactionDate, "yyyy-MM-dd");

		// 当月の日付が定期的な収支の日付以上の場合のみ集計
		const accountSummary = accountMap.get(transaction.account_id);
		if (accountSummary) {
			// 特定の年月のカスタム金額があればそれを使用し、なければデフォルト金額を使用
			const customAmount = recurringAmountsMap.get(transaction.id);
			const transactionAmount =
				customAmount !== undefined ? customAmount : transaction.default_amount;

			if (transaction.type === "income") {
				accountSummary.income += transactionAmount;
			} else {
				accountSummary.expense += transactionAmount;
			}

			// トランザクションリストに追加
			accountSummary.transactions.push({
				id: transaction.id,
				name: transaction.name,
				amount: transactionAmount,
				type: transaction.type,
				transaction_date: formattedTransactionDate,
				description: transaction.description || undefined,
			});
		}
	}

	// 各口座のトランザクションを日付順にソート
	for (const account of accountSummaries) {
		account.transactions.sort((a, b) => {
			return (
				new Date(a.transaction_date).getTime() -
				new Date(b.transaction_date).getTime()
			);
		});
	}

	// 全体の合計を計算
	const totalIncome = accountSummaries.reduce(
		(sum, account) => sum + account.income,
		0,
	);
	const totalExpense = accountSummaries.reduce(
		(sum, account) => sum + account.expense,
		0,
	);
	const totalBalance = accountSummaries.reduce(
		(sum, account) => sum + account.balance,
		0,
	);
	const netBalance = totalIncome - totalExpense;

	return {
		totalIncome,
		totalExpense,
		totalBalance,
		netBalance,
		accounts: accountSummaries,
	} as {
		totalIncome: number;
		totalExpense: number;
		totalBalance: number;
		netBalance: number;
		accounts: AccountSummary[];
	};
}

/**
 * 月初残高を記録する
 * 新しい月が開始した時に各口座の残高を保存する
 */
export async function recordMonthlyBalances(
	year: number,
	month: number,
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// ユーザー認証の確認
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: "認証に失敗しました" };
		}

		// ユーザーのすべての口座を取得
		const { data: accounts, error: accountsError } = await supabase
			.from("accounts")
			.select("id, current_balance")
			.eq("user_id", user.id);

		if (accountsError) {
			console.error("口座情報の取得に失敗しました:", accountsError);
			return { success: false, error: "口座情報の取得に失敗しました" };
		}

		// 各口座について月初残高を記録
		for (const account of accounts) {
			// 既存のレコードを確認
			const { data: existingRecord } = await supabase
				.from("monthly_account_balances")
				.select("id")
				.eq("account_id", account.id)
				.eq("year", year)
				.eq("month", month)
				.maybeSingle();

			if (existingRecord) {
				// 既存レコードの更新
				await supabase
					.from("monthly_account_balances")
					.update({
						balance: account.current_balance,
						updated_at: new Date().toISOString(),
					})
					.eq("id", existingRecord.id);
			} else {
				// 新規レコードの挿入
				await supabase.from("monthly_account_balances").insert({
					account_id: account.id,
					user_id: user.id,
					year,
					month,
					balance: account.current_balance,
				});
			}
		}

		return { success: true };
	} catch (error) {
		console.error("月初残高の記録中にエラーが発生しました:", error);
		return {
			success: false,
			error: "月初残高の記録中にエラーが発生しました",
		};
	}
}

/**
 * 指定アカウントの月初残高を更新または追加するアクション
 */
export async function updateInitialBalance(
	accountId: string,
	year: number,
	month: number,
	amount: number,
): Promise<void> {
	const supabase = await createClient();

	// ユーザーIDを取得
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// 既存のレコードを確認
	const { data: existingBalance } = await supabase
		.from("monthly_account_balances")
		.select("id")
		.eq("account_id", accountId)
		.eq("year", year)
		.eq("month", month)
		.eq("user_id", user.id)
		.single();

	if (existingBalance) {
		// 更新
		await supabase
			.from("monthly_account_balances")
			.update({ balance: amount })
			.eq("id", existingBalance.id);
	} else {
		// 新規作成
		await supabase.from("monthly_account_balances").insert({
			account_id: accountId,
			year,
			month,
			balance: amount,
			user_id: user.id,
		});
	}

	// キャッシュをクリア
	revalidatePath("/summary");
}
