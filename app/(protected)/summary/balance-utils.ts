import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate the previous year and month
 */
export function getPreviousYearMonth(
	year: number,
	month: number,
): { year: number; month: number } {
	if (month === 1) {
		return { year: year - 1, month: 12 };
	}
	return { year, month: month - 1 };
}

/**
 * Increment month handling year boundaries
 */
export function incrementMonth(
	year: number,
	month: number,
): { year: number; month: number } {
	if (month === 12) {
		return { year: year + 1, month: 1 };
	}
	return { year, month: month + 1 };
}

/**
 * Check if target date is current month
 */
export function isCurrentMonth(
	targetYear: number,
	targetMonth: number,
	currentDate: Date,
): boolean {
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1;
	return targetYear === currentYear && targetMonth === currentMonth;
}

/**
 * Fetch current account balances
 */
export async function fetchCurrentAccountBalances(
	supabase: SupabaseClient,
): Promise<Record<string, number>> {
	const { data: accounts } = await supabase
		.from("accounts")
		.select("id, current_balance")
		.order("sort_order", { ascending: true });

	if (!accounts) return {};

	const balances: Record<string, number> = {};
	for (const account of accounts) {
		const numericBalance = Number(account.current_balance);
		balances[account.id] = Number.isNaN(numericBalance) ? 0 : numericBalance;
	}
	return balances;
}

/**
 * Calculate monthly balance change from transactions
 */
export function calculateMonthlyBalanceChange(
	transactions: Array<{ type: "income" | "expense"; amount: number }>,
): number {
	return transactions.reduce((total, transaction) => {
		return transaction.type === "income"
			? total + transaction.amount
			: total - transaction.amount;
	}, 0);
}

/**
 * Convert array of balance records to map
 */
export function balanceArrayToMap(
	balances: Array<{ account_id: string; balance: number }>,
): Record<string, number> {
	const map: Record<string, number> = {};
	for (const balance of balances) {
		map[balance.account_id] = balance.balance;
	}
	return map;
}
