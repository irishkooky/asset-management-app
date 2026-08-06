import { describe, expect, it } from "vitest";
import {
	balanceArrayToMap,
	calculateMonthlyBalanceChange,
	getPreviousYearMonth,
	incrementMonth,
	isCurrentMonth,
} from "@/app/(protected)/summary/balance-utils";

/**
 * 特性評価テスト（characterization tests）:
 * リファクタリング前の現在の挙動をそのまま固定する。
 */
describe("getPreviousYearMonth", () => {
	it("returns previous month within the same year", () => {
		expect(getPreviousYearMonth(2026, 6)).toEqual({ year: 2026, month: 5 });
	});

	it("returns December of previous year when month is January", () => {
		expect(getPreviousYearMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
	});
});

describe("incrementMonth", () => {
	it("returns next month within the same year", () => {
		expect(incrementMonth(2026, 6)).toEqual({ year: 2026, month: 7 });
	});

	it("returns January of next year when month is December", () => {
		expect(incrementMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
	});
});

describe("isCurrentMonth", () => {
	it("returns true when target matches the given current date", () => {
		expect(isCurrentMonth(2026, 6, new Date(2026, 5, 15))).toBe(true);
	});

	it("returns false when month differs", () => {
		expect(isCurrentMonth(2026, 7, new Date(2026, 5, 15))).toBe(false);
	});

	it("returns false when year differs", () => {
		expect(isCurrentMonth(2025, 6, new Date(2026, 5, 15))).toBe(false);
	});
});

describe("calculateMonthlyBalanceChange", () => {
	it("returns 0 for empty transactions", () => {
		expect(calculateMonthlyBalanceChange([])).toBe(0);
	});

	it("adds income and subtracts expense", () => {
		const transactions = [
			{ type: "income" as const, amount: 1000 },
			{ type: "expense" as const, amount: 300 },
			{ type: "income" as const, amount: 50 },
		];
		expect(calculateMonthlyBalanceChange(transactions)).toBe(750);
	});

	it("can return a negative total", () => {
		const transactions = [
			{ type: "income" as const, amount: 100 },
			{ type: "expense" as const, amount: 500 },
		];
		expect(calculateMonthlyBalanceChange(transactions)).toBe(-400);
	});
});

describe("balanceArrayToMap", () => {
	it("converts records to a map keyed by account_id", () => {
		const balances = [
			{ account_id: "acc-1", balance: 10000 },
			{ account_id: "acc-2", balance: -500 },
		];
		expect(balanceArrayToMap(balances)).toEqual({
			"acc-1": 10000,
			"acc-2": -500,
		});
	});

	it("keeps the last record when account_id duplicates", () => {
		const balances = [
			{ account_id: "acc-1", balance: 100 },
			{ account_id: "acc-1", balance: 200 },
		];
		expect(balanceArrayToMap(balances)).toEqual({ "acc-1": 200 });
	});
});
