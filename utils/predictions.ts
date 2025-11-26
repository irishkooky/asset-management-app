import type {
	PredictionPeriod,
	RecurringTransaction,
	SavingsPrediction,
} from "@/types/database";
import { getTotalBalance, getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionsTotal } from "@/utils/supabase/one-time-transactions";
import {
	getMonthlyRecurringTotal,
	getUserRecurringTransactions,
} from "@/utils/supabase/recurring-transactions";

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
 * 指定した年月に取引が発生するかを判定する
 */
function isTransactionInMonth(
	transaction: RecurringTransaction,
	_year: number,
	month: number,
): boolean {
	switch (transaction.frequency) {
		case "monthly":
			// 毎月発生
			return true;
		case "quarterly":
			// 四半期: month_of_year を基準として3ヶ月ごとに発生
			// 例: month_of_year=1 なら 1, 4, 7, 10月に発生
			// 例: month_of_year=3 なら 3, 6, 9, 12月に発生
			if (transaction.month_of_year === null) return false;
			return (month - transaction.month_of_year) % 3 === 0;
		case "yearly":
			// 年次: month_of_year の月にのみ発生
			if (transaction.month_of_year === null) return false;
			return month === transaction.month_of_year;
		default:
			return false;
	}
}

/**
 * 指定した期間内に発生する定期取引の収支を計算する
 * 今日から対象日までの各月を走査して、発生する取引を合計する
 */
function calculateRecurringTransactionsForPeriod(
	transactions: RecurringTransaction[],
	startDate: Date,
	endDate: Date,
): number {
	let total = 0;

	const startYear = startDate.getFullYear();
	const startMonth = startDate.getMonth() + 1; // 1-12
	const startDay = startDate.getDate();

	const endYear = endDate.getFullYear();
	const endMonth = endDate.getMonth() + 1; // 1-12
	// 月初1日を対象とするので、その月の取引は含まない（前月末までの計算）

	// 開始月から終了月の前月まで走査
	let currentYear = startYear;
	let currentMonth = startMonth;

	while (
		currentYear < endYear ||
		(currentYear === endYear && currentMonth < endMonth)
	) {
		const isFirstMonth = currentYear === startYear && currentMonth === startMonth;

		for (const tx of transactions) {
			// この月に取引が発生するか判定
			if (!isTransactionInMonth(tx, currentYear, currentMonth)) {
				continue;
			}

			// 開始月の場合、今日より前の取引日はスキップ
			if (isFirstMonth && tx.day_of_month < startDay) {
				continue;
			}

			// 収支を加算
			if (tx.type === "income") {
				total += tx.amount;
			} else {
				total -= tx.amount;
			}
		}

		// 次の月へ
		currentMonth++;
		if (currentMonth > 12) {
			currentMonth = 1;
			currentYear++;
		}
	}

	return total;
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
 * 各月の1日時点での残高を予測
 */
export async function getMonthlyPredictions(): Promise<SavingsPrediction[]> {
	const today = new Date();
	const currentMonth = today.getMonth();
	const currentYear = today.getFullYear();

	// 現在の総残高を取得
	const currentBalance = await getTotalBalance();

	// 全定期取引を取得
	const allRecurringTransactions = await getUserRecurringTransactions();

	// 翌月から12ヶ月先までの予測を計算
	const predictions = await Promise.all(
		Array.from({ length: 12 }, (_, i) => i + 1).map(async (monthOffset) => {
			// 各月の1日を取得
			const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);

			// 今日から対象月初までの定期収支を計算（頻度を考慮）
			const recurringNet = calculateRecurringTransactionsForPeriod(
				allRecurringTransactions,
				today,
				targetDate,
			);

			// 予測期間内の臨時収支を取得
			const oneTimeTransactions = await getOneTimeTransactionsTotal(
				today,
				targetDate,
			);
			const oneTimeNet =
				oneTimeTransactions.income - oneTimeTransactions.expense;

			// 将来の貯蓄額を計算
			const predictedAmount = currentBalance + recurringNet + oneTimeNet;

			// 期間を文字列に変換（例: "1month", "2months"）
			const periodStr =
				monthOffset === 1
					? "1month"
					: (`${monthOffset}months` as PredictionPeriod);

			return {
				period: periodStr,
				amount: predictedAmount,
				date: targetDate.toISOString().split("T")[0],
			};
		}),
	);

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
