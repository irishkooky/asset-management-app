import { describe, expect, it } from "vitest";
import {
	calculateAccountFinalBalance,
	calculateMonthlySummary,
} from "@/app/(protected)/summary/_lib/calculations";
import type {
	Account,
	OneTimeTransaction,
	RecurringTransaction,
	RecurringTransactionAmount,
} from "@/types/database";
import type { AccountSummary } from "@/types/summary";

/**
 * 特性評価テスト（characterization tests）:
 * summary/actions.ts から _lib/calculations.ts へ機械的に移動した
 * 純粋計算ロジックの現在の挙動を固定する。
 */

function makeAccount(overrides: Partial<Account> = {}): Account {
	return {
		id: "acc-1",
		user_id: "user-1",
		name: "テスト口座",
		current_balance: 10000,
		sort_order: 1,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

function makeOneTime(
	overrides: Partial<OneTimeTransaction> = {},
): OneTimeTransaction {
	return {
		id: "ot-1",
		user_id: "user-1",
		account_id: "acc-1",
		amount: 1000,
		type: "income",
		name: "臨時収入",
		description: null,
		transaction_date: "2026-06-15",
		is_transfer: false,
		destination_account_id: null,
		transfer_pair_id: null,
		created_at: "2026-06-01T00:00:00Z",
		updated_at: "2026-06-01T00:00:00Z",
		...overrides,
	};
}

function makeRecurring(
	overrides: Partial<RecurringTransaction> = {},
): RecurringTransaction {
	return {
		id: "rt-1",
		user_id: "user-1",
		account_id: "acc-1",
		amount: 3000,
		default_amount: 3000,
		type: "expense",
		name: "定期支出",
		description: null,
		day_of_month: 10,
		frequency: "monthly",
		month_of_year: null,
		day_of_year: null,
		is_transfer: false,
		destination_account_id: null,
		transfer_pair_id: null,
		billing_day: null,
		payment_day: null,
		is_resident_tax: false,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

describe("calculateAccountFinalBalance", () => {
	const baseSummary: AccountSummary = {
		id: "acc-1",
		name: "テスト口座",
		income: 0,
		expense: 0,
		balance: 0,
		transactions: [],
	};

	it("returns initial balance when there are no transactions", () => {
		expect(calculateAccountFinalBalance(baseSummary, 5000)).toBe(5000);
	});

	it("adds income and subtracts expense from initial balance", () => {
		const summary: AccountSummary = {
			...baseSummary,
			transactions: [
				{
					id: "t-1",
					name: "給与",
					amount: 1000,
					type: "income",
					transaction_date: "2026-06-05",
					source: "recurring",
				},
				{
					id: "t-2",
					name: "家賃",
					amount: 400,
					type: "expense",
					transaction_date: "2026-06-10",
					source: "recurring",
				},
			],
		};
		expect(calculateAccountFinalBalance(summary, 5000)).toBe(5600);
	});
});

describe("calculateMonthlySummary", () => {
	it("returns zero totals for accounts without transactions", () => {
		const result = calculateMonthlySummary(
			[makeAccount()],
			[],
			[],
			6,
			2026,
			[],
		);

		expect(result.totalIncome).toBe(0);
		expect(result.totalExpense).toBe(0);
		expect(result.totalBalance).toBe(10000);
		expect(result.netBalance).toBe(0);
		expect(result.accounts).toHaveLength(1);
		expect(result.accounts[0].transactions).toEqual([]);
	});

	it("aggregates one-time transactions into the matching account", () => {
		const result = calculateMonthlySummary(
			[makeAccount()],
			[
				makeOneTime({ id: "ot-1", amount: 2000, type: "income" }),
				makeOneTime({ id: "ot-2", amount: 500, type: "expense" }),
			],
			[],
			6,
			2026,
			[],
		);

		expect(result.totalIncome).toBe(2000);
		expect(result.totalExpense).toBe(500);
		expect(result.netBalance).toBe(1500);
		expect(result.accounts[0].transactions).toHaveLength(2);
		expect(result.accounts[0].transactions[0].source).toBe("one-time");
	});

	it("ignores transactions whose account_id has no matching account", () => {
		const result = calculateMonthlySummary(
			[makeAccount()],
			[makeOneTime({ account_id: "unknown-account" })],
			[],
			6,
			2026,
			[],
		);

		expect(result.totalIncome).toBe(0);
		expect(result.accounts[0].transactions).toEqual([]);
	});

	it("uses default_amount for recurring transactions without custom amount", () => {
		const result = calculateMonthlySummary(
			[makeAccount()],
			[],
			[makeRecurring({ default_amount: 3000, type: "expense" })],
			6,
			2026,
			[],
		);

		expect(result.totalExpense).toBe(3000);
		const transaction = result.accounts[0].transactions[0];
		expect(transaction.source).toBe("recurring");
		expect(transaction.transaction_date).toBe("2026-06-10");
	});

	it("prefers custom monthly amount over default_amount", () => {
		const customAmount: RecurringTransactionAmount = {
			id: "ra-1",
			recurring_transaction_id: "rt-1",
			year: 2026,
			month: 6,
			amount: 9999,
			created_at: "2026-06-01T00:00:00Z",
			updated_at: "2026-06-01T00:00:00Z",
		};
		const result = calculateMonthlySummary(
			[makeAccount()],
			[],
			[makeRecurring({ id: "rt-1", default_amount: 3000 })],
			6,
			2026,
			[customAmount],
		);

		expect(result.totalExpense).toBe(9999);
		expect(result.accounts[0].transactions[0].amount).toBe(9999);
	});

	it("sorts each account's transactions by date ascending", () => {
		const result = calculateMonthlySummary(
			[makeAccount()],
			[
				makeOneTime({ id: "ot-late", transaction_date: "2026-06-25" }),
				makeOneTime({ id: "ot-early", transaction_date: "2026-06-01" }),
			],
			[makeRecurring({ id: "rt-mid", day_of_month: 10 })],
			6,
			2026,
			[],
		);

		const dates = result.accounts[0].transactions.map(
			(transaction) => transaction.transaction_date,
		);
		expect(dates).toEqual(["2026-06-01", "2026-06-10", "2026-06-25"]);
	});

	it("sums balances across multiple accounts", () => {
		const result = calculateMonthlySummary(
			[
				makeAccount({ id: "acc-1", current_balance: 10000 }),
				makeAccount({ id: "acc-2", current_balance: 2500 }),
			],
			[],
			[],
			6,
			2026,
			[],
		);

		expect(result.totalBalance).toBe(12500);
	});
});
