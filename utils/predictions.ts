import type { PredictionPeriod, SavingsPrediction } from "@/types/database";
import { getTotalBalance, getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionsTotal } from "@/utils/supabase/one-time-transactions";
import {
	getMonthlyRecurringTotal,
	getRecurringTotalForMonth,
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

	// 翌月から12ヶ月先までの予測を計算
	const predictions: SavingsPrediction[] = [];
	let accumulatedRecurringNet = 0;

	for (let monthOffset = 1; monthOffset <= 12; monthOffset++) {
		// 対象月の1日を取得
		const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);

		// 前月の定期収支を取得（対象月の1日時点の残高なので、前月までの取引が反映される）
		// monthOffset=1の場合、今月(currentMonth+1)の定期収支が反映される
		const recurringMonth =
			monthOffset === 1
				? { year: currentYear, month: currentMonth + 1 }
				: {
						year: new Date(
							currentYear,
							currentMonth + monthOffset - 1,
							1,
						).getFullYear(),
						month:
							new Date(
								currentYear,
								currentMonth + monthOffset - 1,
								1,
							).getMonth() + 1,
					};

		// 頻度とカスタム金額を考慮した定期収支を取得
		const recurringTotal = await getRecurringTotalForMonth(
			recurringMonth.year,
			recurringMonth.month,
		);
		const recurringNet = recurringTotal.income - recurringTotal.expense;
		accumulatedRecurringNet += recurringNet;

		// 予測期間内の臨時収支を取得（今日から対象月の1日まで）
		const oneTimeTransactions = await getOneTimeTransactionsTotal(
			today,
			targetDate,
		);
		const oneTimeNet = oneTimeTransactions.income - oneTimeTransactions.expense;

		// 将来の貯蓄額を計算
		const predictedAmount =
			currentBalance + accumulatedRecurringNet + oneTimeNet;

		// 期間を文字列に変換（例: "1month", "2months"）
		const periodStr =
			monthOffset === 1
				? "1month"
				: (`${monthOffset}months` as PredictionPeriod);

		predictions.push({
			period: periodStr,
			amount: predictedAmount,
			date: targetDate.toISOString().split("T")[0],
		});
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
