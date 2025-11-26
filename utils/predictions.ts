import type { PredictionPeriod, SavingsPrediction } from "@/types/database";
import { getMonthlySummary } from "@/app/(protected)/summary/actions";
import {
	calculateMonthlyBalanceChange,
	incrementMonth,
} from "@/app/(protected)/summary/balance-utils";
import { getTotalBalance, getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionsTotal } from "@/utils/supabase/one-time-transactions";
import { getMonthlyRecurringTotal } from "@/utils/supabase/recurring-transactions";

/**
 * 指定した月数後の日付を取得する
 */
function getFutureDate(months: number): Date {
	const date = new Date();
	date.setMonth(date.getMonth() + months);
	return date;
}

/**
 * 予測期間の月数を取得する
 */
function getMonthsFromPeriod(period: PredictionPeriod): number {
	switch (period) {
		case "1month":
			return 1;
		case "3months":
			return 3;
		case "6months":
			return 6;
		case "12months":
			return 12;
		default:
			return 1;
	}
}

/**
 * 特定の口座の将来の貯蓄額を予測する
 */
export async function predictAccountSavings(
	accountId: string,
	period: PredictionPeriod,
): Promise<SavingsPrediction> {
	const account = (await getUserAccounts()).find((acc) => acc.id === accountId);

	if (!account) {
		throw new Error("指定された口座が見つかりません");
	}

	const months = getMonthsFromPeriod(period);
	const futureDate = getFutureDate(months);

	// 月間の定期的な収支を取得
	const monthlyRecurring = await getMonthlyRecurringTotal(accountId);
	const monthlyNet = monthlyRecurring.income - monthlyRecurring.expense;

	// 予測期間内の臨時収支を取得
	const today = new Date();
	const oneTimeTransactions = await getOneTimeTransactionsTotal(
		today,
		futureDate,
		accountId,
	);
	const oneTimeNet = oneTimeTransactions.income - oneTimeTransactions.expense;

	// 将来の貯蓄額を計算
	const predictedAmount =
		account.current_balance + monthlyNet * months + oneTimeNet;

	return {
		period,
		amount: predictedAmount,
		date: futureDate.toISOString().split("T")[0],
	};
}

/**
 * 全口座の将来の貯蓄額を予測する
 */
export async function predictTotalSavings(
	period: PredictionPeriod,
): Promise<SavingsPrediction> {
	const months = getMonthsFromPeriod(period);
	const futureDate = getFutureDate(months);

	// 現在の総残高を取得
	const currentBalance = await getTotalBalance();

	// 月間の定期的な収支を取得
	const monthlyRecurring = await getMonthlyRecurringTotal();
	const monthlyNet = monthlyRecurring.income - monthlyRecurring.expense;

	// 予測期間内の臨時収支を取得
	const today = new Date();
	const oneTimeTransactions = await getOneTimeTransactionsTotal(
		today,
		futureDate,
	);
	const oneTimeNet = oneTimeTransactions.income - oneTimeTransactions.expense;

	// 将来の貯蓄額を計算
	const predictedAmount = currentBalance + monthlyNet * months + oneTimeNet;

	return {
		period,
		amount: predictedAmount,
		date: futureDate.toISOString().split("T")[0],
	};
}

/**
 * 全ての予測期間に対する貯蓄額を予測する
 */
export async function getAllPredictions(): Promise<SavingsPrediction[]> {
	const periods: PredictionPeriod[] = [
		"1month",
		"3months",
		"6months",
		"12months",
	];

	const predictions = await Promise.all(
		periods.map((period) => predictTotalSavings(period)),
	);

	return predictions;
}

/**
 * 1か月ごとの貯蓄額を予測する（翌月から12ヶ月先まで）
 * 各月の月末見込残高を予測（月次収支と同じ計算ロジックを使用）
 */
export async function getMonthlyPredictions(): Promise<SavingsPrediction[]> {
	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonth = today.getMonth() + 1; // 1-12

	// 現在の総残高を取得（今月の月初残高として使用）
	const currentBalance = await getTotalBalance();

	// 今月の月次サマリーを取得して今月末残高を計算
	const currentMonthSummary = await getMonthlySummary(currentYear, currentMonth);
	const currentMonthChange = currentMonthSummary.accounts.reduce(
		(total, account) => {
			return total + calculateMonthlyBalanceChange(account.transactions);
		},
		0,
	);

	// 今月末残高
	let runningBalance = currentBalance + currentMonthChange;

	const predictions: SavingsPrediction[] = [];

	// 翌月から12ヶ月先までの予測を計算
	let { year: targetYear, month: targetMonth } = incrementMonth(
		currentYear,
		currentMonth,
	);

	for (let i = 1; i <= 12; i++) {
		// 対象月の月次サマリーを取得
		const monthlySummary = await getMonthlySummary(targetYear, targetMonth);

		// 対象月の収支を計算
		const monthlyChange = monthlySummary.accounts.reduce((total, account) => {
			return total + calculateMonthlyBalanceChange(account.transactions);
		}, 0);

		// 月末残高を計算（前月末残高 + 当月収支）
		runningBalance = runningBalance + monthlyChange;

		// 対象月の1日を作成（予測日付として使用）
		const targetDate = new Date(targetYear, targetMonth - 1, 1);

		// 期間を文字列に変換
		const periodStr =
			i === 1 ? "1month" : (`${i}months` as PredictionPeriod);

		predictions.push({
			period: periodStr,
			amount: runningBalance,
			date: targetDate.toISOString().split("T")[0],
		});

		// 次の月へ
		const next = incrementMonth(targetYear, targetMonth);
		targetYear = next.year;
		targetMonth = next.month;
	}

	return predictions;
}

/**
 * 特定の口座の全ての予測期間に対する貯蓄額を予測する
 */
export async function getAccountPredictions(
	accountId: string,
): Promise<SavingsPrediction[]> {
	const periods: PredictionPeriod[] = [
		"1month",
		"3months",
		"6months",
		"12months",
	];

	const predictions = await Promise.all(
		periods.map((period) => predictAccountSavings(accountId, period)),
	);

	return predictions;
}
