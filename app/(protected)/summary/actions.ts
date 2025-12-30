"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { format, setDate, setMonth, setYear } from "date-fns";
import { revalidatePath } from "next/cache";
import type {
	Account,
	OneTimeTransaction,
	RecurringTransaction,
	RecurringTransactionAmount,
} from "@/types/database";
import type { AccountSummary, Transaction } from "@/types/summary";
import { createClient } from "@/utils/supabase/server";
import {
	calculateMonthlyBalanceChange,
	fetchCurrentAccountBalances,
	getPreviousYearMonth,
	incrementMonth,
	isCurrentMonth,
} from "./balance-utils";

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
		.order("sort_order", { ascending: true });

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

type MonthlyBalanceMap = Record<string, number>;

function calculateAccountFinalBalance(
	account: AccountSummary,
	initialBalance: number,
): number {
	const sortedTransactions = [...account.transactions].sort(
		(a, b) =>
			new Date(a.transaction_date).getTime() -
			new Date(b.transaction_date).getTime(),
	);

	const startingBalance = Number(initialBalance);
	let finalBalance = Number.isNaN(startingBalance) ? 0 : startingBalance;
	for (const transaction of sortedTransactions) {
		finalBalance =
			transaction.type === "income"
				? finalBalance + transaction.amount
				: finalBalance - transaction.amount;
	}

	return finalBalance;
}

async function handleMonthlyBalances(
	supabase: SupabaseClient,
	currentYear: number,
	currentMonth: number,
	year: number,
	month: number,
): Promise<MonthlyBalanceMap> {
	const today = new Date();

	if (today.getDate() <= 3) {
		const { data: existingRecords } = await supabase
			.from("monthly_account_balances")
			.select("id")
			.eq("year", currentYear)
			.eq("month", currentMonth)
			.limit(1);

		if (!existingRecords || existingRecords.length === 0) {
			await recordMonthlyBalances(currentYear, currentMonth);
		}
	}

	let { data: monthlyBalances } = await supabase
		.from("monthly_account_balances")
		.select("*")
		.eq("year", year)
		.eq("month", month);

	if (!monthlyBalances || monthlyBalances.length === 0) {
		const carryoverResult = await carryoverMonthlyBalances(
			supabase,
			year,
			month,
		);
		if (carryoverResult.success) {
			const { data: newMonthlyBalances } = await supabase
				.from("monthly_account_balances")
				.select("*")
				.eq("year", year)
				.eq("month", month);
			monthlyBalances = newMonthlyBalances;
		}
	}

	const monthlyBalanceMap: MonthlyBalanceMap = {};
	if (monthlyBalances) {
		for (const balance of monthlyBalances) {
			const numericBalance = Number(balance.balance);
			monthlyBalanceMap[balance.account_id] = Number.isNaN(numericBalance)
				? 0
				: numericBalance;
		}
	}

	return monthlyBalanceMap;
}

type MonthlySummaryResult = Awaited<ReturnType<typeof getMonthlySummary>>;

export type MonthlySummaryData = {
	summary: MonthlySummaryResult;
	monthlyBalanceMap: MonthlyBalanceMap;
	previousMonthBalances?: Record<string, number>;
	totalEndOfMonthBalance: number;
	generatedAt: Date;
};

export async function getMonthlySummaryData(
	year: number,
	month: number,
): Promise<MonthlySummaryData> {
	const now = new Date();
	const supabase = await createClient();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	const monthlyBalanceMap = await handleMonthlyBalances(
		supabase,
		currentYear,
		currentMonth,
		year,
		month,
	);

	const summary = await getMonthlySummary(year, month);

	const selectedDate = new Date(year, month - 1, 1);
	const currentYearMonth = new Date(currentYear, currentMonth - 1, 1);
	const isSelectedDateAfterCurrent = selectedDate > currentYearMonth;

	const previousMonthBalances = isSelectedDateAfterCurrent
		? await calculatePreviousMonthBalances(supabase, now, year, month)
		: undefined;

	const totalEndOfMonthBalance = summary.accounts.reduce((total, account) => {
		let initialBalance = account.balance;
		const prevBalance = previousMonthBalances?.[account.id];

		if (monthlyBalanceMap[account.id] !== undefined) {
			initialBalance = monthlyBalanceMap[account.id];
		} else if (isSelectedDateAfterCurrent && prevBalance !== undefined) {
			initialBalance = prevBalance;
		}

		const finalBalance = calculateAccountFinalBalance(account, initialBalance);
		return total + finalBalance;
	}, 0);

	return {
		summary,
		monthlyBalanceMap,
		previousMonthBalances,
		totalEndOfMonthBalance,
		generatedAt: now,
	};
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

		const numericBalance = Number(account.current_balance);
		return {
			id: account.id,
			name: account.name,
			income: 0,
			expense: 0,
			balance: Number.isNaN(numericBalance) ? 0 : numericBalance,
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
				source: "one-time",
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
				source: "recurring",
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

/**
 * 一時的な収支の金額を更新するアクション
 */
export async function updateOneTimeTransactionAmount(
	transactionId: string,
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

	// トランザクションの日付を取得
	const { data: transaction, error: transactionError } = await supabase
		.from("one_time_transactions")
		.select("transaction_date")
		.eq("id", transactionId)
		.eq("user_id", user.id)
		.single();

	if (transactionError) {
		console.error("一時的な収支の取得に失敗しました:", transactionError);
		throw new Error("一時的な収支の取得に失敗しました");
	}

	// トランザクションを更新
	const { error } = await supabase
		.from("one_time_transactions")
		.update({ amount })
		.eq("id", transactionId)
		.eq("user_id", user.id);

	if (error) {
		console.error("一時的な収支の更新に失敗しました:", error);
		throw new Error("一時的な収支の更新に失敗しました");
	}

	// 取引の年月を計算して、その月以降の月初残高キャッシュを無効化
	if (transaction?.transaction_date) {
		const transactionDate = new Date(transaction.transaction_date);
		const transactionYear = transactionDate.getFullYear();
		const transactionMonth = transactionDate.getMonth() + 1;
		await invalidateFutureMonthlyBalances(
			supabase,
			transactionYear,
			transactionMonth,
		);
	}

	// キャッシュをクリア
	revalidatePath("/summary");
}

/**
 * 指定された月の前月末残高を計算する
 * 年をまたぐ場合も正しく処理する
 */
export async function calculatePreviousMonthBalances(
	supabase: SupabaseClient,
	currentDate: Date,
	targetYear: number,
	targetMonth: number,
): Promise<Record<string, number>> {
	const { year: prevYear, month: prevMonth } = getPreviousYearMonth(
		targetYear,
		targetMonth,
	);

	// 前月の月初残高データを取得
	const monthlyBalances = await fetchMonthlyBalances(
		supabase,
		prevYear,
		prevMonth,
	);

	// 月初残高データがある場合は前月末残高を計算
	if (monthlyBalances.length > 0) {
		return await calculateEndBalancesFromMonthlyData(
			monthlyBalances,
			prevYear,
			prevMonth,
		);
	}

	// 月初残高データがない場合は遡って計算
	return await calculateEndOfMonthBalances(
		supabase,
		prevYear,
		prevMonth,
		currentDate,
	);
}

/**
 * 指定月の月初残高データを取得
 */
async function fetchMonthlyBalances(
	supabase: SupabaseClient,
	year: number,
	month: number,
): Promise<Array<{ account_id: string; balance: number }>> {
	const { data } = await supabase
		.from("monthly_account_balances")
		.select("account_id, balance")
		.eq("year", year)
		.eq("month", month);

	return data || [];
}

/**
 * 月初残高データから月末残高を計算
 */
async function calculateEndBalancesFromMonthlyData(
	monthlyBalances: Array<{ account_id: string; balance: number }>,
	year: number,
	month: number,
): Promise<Record<string, number>> {
	const endBalances: Record<string, number> = {};
	const monthSummary = await getMonthlySummary(year, month);

	for (const balance of monthlyBalances) {
		const account = monthSummary.accounts.find(
			(a) => a.id === balance.account_id,
		);

		const baseBalance = Number(balance.balance);
		const numericBalance = Number.isNaN(baseBalance) ? 0 : baseBalance;

		if (!account) {
			endBalances[balance.account_id] = numericBalance;
			continue;
		}

		const monthlyChange = calculateMonthlyBalanceChange(account.transactions);
		endBalances[balance.account_id] = numericBalance + monthlyChange;
	}

	return endBalances;
}

/**
 * 指定された月の月末残高を計算する
 * 月初残高データがない場合の補完処理
 */
async function calculateEndOfMonthBalances(
	supabase: SupabaseClient,
	targetYear: number,
	targetMonth: number,
	currentDate: Date,
): Promise<Record<string, number>> {
	// 現在月の場合は現在残高を使用
	if (isCurrentMonth(targetYear, targetMonth, currentDate)) {
		return await fetchCurrentAccountBalances(supabase);
	}

	// 過去の月の場合、最も近い月初残高データから計算
	const nearestBalances = await findNearestMonthlyBalances(
		supabase,
		targetYear,
		targetMonth,
		currentDate,
	);

	if (!nearestBalances) {
		// 月初残高データが全く存在しない場合は現在残高を使用
		return await fetchCurrentAccountBalances(supabase);
	}

	// 最も近い月から対象月までの残高を計算
	return await calculateBalancesFromNearestData(
		nearestBalances,
		targetYear,
		targetMonth,
	);
}

/**
 * 最も近い月初残高データから対象月までの残高を計算
 */
async function calculateBalancesFromNearestData(
	nearestBalances: {
		year: number;
		month: number;
		balances: Record<string, number>;
	},
	targetYear: number,
	targetMonth: number,
): Promise<Record<string, number>> {
	const endBalances: Record<string, number> = {};

	for (const [accountId, baseBalance] of Object.entries(
		nearestBalances.balances,
	)) {
		const finalBalance = await calculateAccountBalanceToTarget(
			accountId,
			baseBalance,
			nearestBalances.year,
			nearestBalances.month,
			targetYear,
			targetMonth,
		);
		endBalances[accountId] = finalBalance;
	}

	return endBalances;
}

/**
 * 特定の口座について基準月から対象月までの残高を計算
 */
async function calculateAccountBalanceToTarget(
	accountId: string,
	startBalance: number,
	startYear: number,
	startMonth: number,
	targetYear: number,
	targetMonth: number,
): Promise<number> {
	let balance = startBalance;
	let { year: calcYear, month: calcMonth } = incrementMonth(
		startYear,
		startMonth,
	);

	while (
		calcYear < targetYear ||
		(calcYear === targetYear && calcMonth <= targetMonth)
	) {
		const monthlyChange = await getAccountMonthlyChange(
			accountId,
			calcYear,
			calcMonth,
		);
		balance += monthlyChange;

		const next = incrementMonth(calcYear, calcMonth);
		calcYear = next.year;
		calcMonth = next.month;
	}

	return balance;
}

/**
 * 特定の口座の月次収支を取得
 */
async function getAccountMonthlyChange(
	accountId: string,
	year: number,
	month: number,
): Promise<number> {
	const monthSummary = await getMonthlySummary(year, month);
	const account = monthSummary.accounts.find((a) => a.id === accountId);

	if (!account) return 0;

	return calculateMonthlyBalanceChange(account.transactions);
}

/**
 * 指定された月に最も近い月初残高データを見つける
 */
async function findNearestMonthlyBalances(
	supabase: SupabaseClient,
	targetYear: number,
	targetMonth: number,
	_currentDate: Date,
): Promise<{
	year: number;
	month: number;
	balances: Record<string, number>;
} | null> {
	// 対象月より前の月初残高データを検索
	const monthlyBalances = await fetchPreviousMonthlyBalances(
		supabase,
		targetYear,
		targetMonth,
	);

	if (!monthlyBalances || monthlyBalances.length === 0) {
		return null;
	}

	// 最も新しい年月のデータを抽出
	return extractLatestMonthData(monthlyBalances);
}

/**
 * 対象月より前の月初残高データを取得
 */
async function fetchPreviousMonthlyBalances(
	supabase: SupabaseClient,
	targetYear: number,
	targetMonth: number,
): Promise<Array<{
	year: number;
	month: number;
	account_id: string;
	balance: number;
}> | null> {
	const { data } = await supabase
		.from("monthly_account_balances")
		.select("year, month, account_id, balance")
		.or(
			`year.lt.${targetYear},and(year.eq.${targetYear},month.lt.${targetMonth})`,
		)
		.order("year", { ascending: false })
		.order("month", { ascending: false })
		.limit(100);

	return data;
}

/**
 * 月初残高データから最新月のデータを抽出
 */
function extractLatestMonthData(
	monthlyBalances: Array<{
		year: number;
		month: number;
		account_id: string;
		balance: number;
	}>,
): {
	year: number;
	month: number;
	balances: Record<string, number>;
} {
	const latestYear = monthlyBalances[0].year;
	const latestMonth = monthlyBalances[0].month;

	// 最新月のデータのみフィルタリング
	const latestBalances = monthlyBalances.filter(
		(b) => b.year === latestYear && b.month === latestMonth,
	);

	// 口座IDをキーとしたマップに変換
	const balances: Record<string, number> = {};
	for (const balance of latestBalances) {
		balances[balance.account_id] = balance.balance;
	}

	return {
		year: latestYear,
		month: latestMonth,
		balances,
	};
}

/**
 * 月初残高を自動で繰り越す
 * 前月末残高を今月の月初残高として記録
 */
export async function carryoverMonthlyBalances(
	supabase: SupabaseClient,
	year: number,
	month: number,
): Promise<{ success: boolean; error?: string }> {
	// ユーザー認証の確認
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "認証に失敗しました" };
	}

	// 既存の月初残高データをチェック
	const existingRecords = await checkExistingMonthlyBalances(
		supabase,
		year,
		month,
	);
	if (existingRecords) {
		return { success: true };
	}

	// 前月末残高を計算して記録
	try {
		await recordPreviousMonthBalances(supabase, user.id, year, month);
		return { success: true };
	} catch (error) {
		console.error("月初残高の繰り越し中にエラーが発生しました:", error);
		return {
			success: false,
			error: "月初残高の繰り越し中にエラーが発生しました",
		};
	}
}

/**
 * 既存の月初残高データが存在するかチェック
 */
async function checkExistingMonthlyBalances(
	supabase: SupabaseClient,
	year: number,
	month: number,
): Promise<boolean> {
	const { data } = await supabase
		.from("monthly_account_balances")
		.select("id")
		.eq("year", year)
		.eq("month", month)
		.limit(1);

	return data !== null && data.length > 0;
}

/**
 * 前月末残高を今月の月初残高として記録
 */
async function recordPreviousMonthBalances(
	supabase: SupabaseClient,
	userId: string,
	year: number,
	month: number,
): Promise<void> {
	const currentDate = new Date();
	const previousMonthBalances = await calculatePreviousMonthBalances(
		supabase,
		currentDate,
		year,
		month,
	);

	const records = Object.entries(previousMonthBalances).map(
		([accountId, balance]) => ({
			account_id: accountId,
			user_id: userId,
			year,
			month,
			balance,
		}),
	);

	if (records.length === 0) return;

	const { error } = await supabase
		.from("monthly_account_balances")
		.insert(records);

	if (error) throw error;
}

/**
 * 指定した年月より後の月初残高キャッシュを無効化（削除）する
 * 金額変更時に、その月以降のキャッシュを削除して再計算を促す
 */
export async function invalidateFutureMonthlyBalances(
	supabase: SupabaseClient,
	year: number,
	month: number,
): Promise<void> {
	// ユーザーIDを取得
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// 指定した年月より後のレコードを削除
	// 条件: year > 指定年 OR (year = 指定年 AND month > 指定月)
	const { error } = await supabase
		.from("monthly_account_balances")
		.delete()
		.eq("user_id", user.id)
		.or(`year.gt.${year},and(year.eq.${year},month.gt.${month})`);

	if (error) {
		console.error("月初残高キャッシュの無効化に失敗しました:", error);
		throw new Error("月初残高キャッシュの無効化に失敗しました");
	}
}
