import { format } from "date-fns";
import { incrementMonth } from "@/app/(protected)/summary/balance-utils";
import type {
	Account,
	OneTimeTransaction,
	PredictionPeriod,
	RecurringTransaction,
	RecurringTransactionAmount,
	SavingsPrediction,
} from "@/types/database";
import { getTotalBalance, getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionsTotal } from "@/utils/supabase/one-time-transactions";
import { getMonthlyRecurringTotal } from "@/utils/supabase/recurring-transactions";
import { createClient } from "@/utils/supabase/server";

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

type PredictionSeedData = {
	accounts: Account[];
	recurringTransactions: RecurringTransaction[];
	oneTimeTransactions: OneTimeTransaction[];
	recurringAmounts: RecurringTransactionAmount[];
	currentMonthBalances: Record<string, number>;
};

// month は1-12。date-fns の new Date(year, month-1, day) で構築して format する
function fmtDate(year: number, month: number, day: number): string {
	return format(new Date(year, month - 1, day), "yyyy-MM-dd");
}

function getPredictionEndYearMonth(
	currentYear: number,
	currentMonth: number,
): { year: number; month: number } {
	let y = currentYear;
	let m = currentMonth;
	for (let i = 0; i < 12; i++) {
		({ year: y, month: m } = incrementMonth(y, m));
	}
	return { year: y, month: m };
}

async function fetchPredictionSeedData(
	accounts: Account[],
	currentYear: number,
	currentMonth: number,
): Promise<PredictionSeedData> {
	const supabase = await createClient();
	const end = getPredictionEndYearMonth(currentYear, currentMonth);

	// month-1 で月末日 (new Date(y, m, 0) は月末) → format
	const startDate = fmtDate(currentYear, currentMonth, 1);
	const endDate = format(new Date(end.year, end.month, 0), "yyyy-MM-dd");

	const [recurringTx, oneTimeTx, recurringAmounts, monthlyBal] =
		await Promise.all([
			supabase.from("recurring_transactions").select("*"),
			supabase
				.from("one_time_transactions")
				.select("*")
				.gte("transaction_date", startDate)
				.lte("transaction_date", endDate),
			supabase
				.from("recurring_transaction_amounts")
				.select("*")
				.gte("year", currentYear)
				.lte("year", end.year),
			supabase
				.from("monthly_account_balances")
				.select("account_id, balance")
				.eq("year", currentYear)
				.eq("month", currentMonth),
		]);

	const currentMonthBalances: Record<string, number> = {};
	for (const bal of monthlyBal.data ?? []) {
		currentMonthBalances[bal.account_id] = bal.balance;
	}

	return {
		accounts,
		recurringTransactions: recurringTx.data ?? [],
		oneTimeTransactions: oneTimeTx.data ?? [],
		recurringAmounts: recurringAmounts.data ?? [],
		currentMonthBalances,
	};
}

// "YEAR-MONTH" -> (txId -> amount) の2段 Map を1回だけ構築してキャッシュ
type CustomAmountsCache = Map<string, Map<string, number>>;

function buildCustomAmountsCache(
	recurringAmounts: RecurringTransactionAmount[],
): CustomAmountsCache {
	const cache: CustomAmountsCache = new Map();
	for (const ra of recurringAmounts) {
		const key = `${ra.year}-${ra.month}`;
		const monthMap = cache.get(key) ?? new Map<string, number>();
		monthMap.set(ra.recurring_transaction_id, ra.amount);
		cache.set(key, monthMap);
	}
	return cache;
}

function calcMonthlyChanges(
	seed: PredictionSeedData,
	customAmountsCache: CustomAmountsCache,
	year: number,
	month: number,
): Record<string, number> {
	const changes: Record<string, number> = {};
	for (const account of seed.accounts) {
		changes[account.id] = 0;
	}

	const customAmounts =
		customAmountsCache.get(`${year}-${month}`) ?? new Map<string, number>();

	for (const tx of seed.recurringTransactions) {
		if (!(tx.account_id in changes)) continue;
		const amount = customAmounts.get(tx.id) ?? tx.default_amount;
		changes[tx.account_id] += tx.type === "income" ? amount : -amount;
	}

	const monthStart = fmtDate(year, month, 1);
	const monthEnd = format(new Date(year, month, 0), "yyyy-MM-dd");

	for (const tx of seed.oneTimeTransactions) {
		if (tx.transaction_date < monthStart || tx.transaction_date > monthEnd)
			continue;
		if (!(tx.account_id in changes)) continue;
		changes[tx.account_id] += tx.type === "income" ? tx.amount : -tx.amount;
	}

	return changes;
}

function applyChanges(
	balances: Record<string, number>,
	changes: Record<string, number>,
): void {
	for (const id in changes) {
		balances[id] = (balances[id] ?? 0) + changes[id];
	}
}

function buildPredictions(
	seed: PredictionSeedData,
	currentYear: number,
	currentMonth: number,
): SavingsPrediction[] {
	const balances: Record<string, number> = {};
	for (const account of seed.accounts) {
		balances[account.id] =
			seed.currentMonthBalances[account.id] ?? account.current_balance;
	}

	const cache = buildCustomAmountsCache(seed.recurringAmounts);

	applyChanges(
		balances,
		calcMonthlyChanges(seed, cache, currentYear, currentMonth),
	);

	const predictions: SavingsPrediction[] = [];
	let { year, month } = incrementMonth(currentYear, currentMonth);

	for (let i = 1; i <= 12; i++) {
		applyChanges(balances, calcMonthlyChanges(seed, cache, year, month));

		const total = Object.values(balances).reduce((sum, b) => sum + b, 0);
		const date = fmtDate(year, month, 1);
		const period = (i === 1 ? "1month" : `${i}months`) as PredictionPeriod;

		predictions.push({ period, amount: total, date });

		({ year, month } = incrementMonth(year, month));
	}

	return predictions;
}

/**
 * 1か月ごとの貯蓄額を予測する（翌月から12ヶ月先まで）
 * 各月の月末見込残高を予測（4クエリ一括取得 → メモリ上で前方伝播計算）
 */
export async function getMonthlyPredictions(
	accounts?: Account[],
): Promise<SavingsPrediction[]> {
	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonth = today.getMonth() + 1;

	const resolvedAccounts = accounts ?? (await getUserAccounts());
	const seed = await fetchPredictionSeedData(
		resolvedAccounts,
		currentYear,
		currentMonth,
	);

	return buildPredictions(seed, currentYear, currentMonth);
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
