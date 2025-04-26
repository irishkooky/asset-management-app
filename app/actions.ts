"use server";

import type {
	Account,
	OneTimeTransaction,
	RecurringTransaction,
} from "@/types/database";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signOutAction = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	return redirect("/");
};

export const signInWithGoogleAction = async () => {
	const supabase = await createClient();
	const headersList = await headers();
	const host = headersList.get("host") || "";
	const protocol = host.includes("localhost") ? "http" : "https";
	const origin = `${protocol}://${host}`;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${origin}/auth/callback?next=/summary`,
		},
	});

	if (error) {
		return encodedRedirect("error", "/", error.message);
	}

	if (data.url) {
		return redirect(data.url);
	}

	return encodedRedirect("error", "/", "Something went wrong");
};

/**
 * 月次収支サマリーデータを取得する
 */
export async function getMonthlySummary(year: number, month: number) {
	const supabase = await createClient();

	// 指定された月の開始日と終了日を計算
	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0); // 月の最終日

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
		.gte("transaction_date", startDate.toISOString().split("T")[0])
		.lte("transaction_date", endDate.toISOString().split("T")[0]);

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

	// 4. 月次サマリーデータを計算
	const summary = calculateMonthlySummary(
		accounts as Account[],
		oneTimeTransactions as OneTimeTransaction[],
		recurringTransactions as RecurringTransaction[],
		month,
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
) {
	// 口座ごとの収支データを初期化
	const accountSummaries = accounts.map((account) => ({
		id: account.id,
		name: account.name,
		income: 0,
		expense: 0,
		balance: account.current_balance,
	}));

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
		}
	}

	// 定期的な収支を集計（当月に該当するもののみ）
	for (const transaction of recurringTransactions) {
		// 当月の日付が定期的な収支の日付以上の場合のみ集計
		const accountSummary = accountMap.get(transaction.account_id);
		if (accountSummary) {
			if (transaction.type === "income") {
				accountSummary.income += transaction.amount;
			} else {
				accountSummary.expense += transaction.amount;
			}
		}
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
	};
}
