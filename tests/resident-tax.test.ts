import { afterEach, describe, expect, it, vi } from "vitest";
import {
	calculateActualPaymentMonth,
	getCurrentFiscalYear,
	getFiscalYearRange,
} from "@/utils/supabase/resident-tax";

// resident-tax.ts は Supabase サーバークライアントを import しているため、
// 純粋関数のテストでは next/headers に依存しないようモックする
vi.mock("@/utils/supabase/server", () => ({
	createClient: vi.fn(),
}));

/**
 * 特性評価テスト（characterization tests）:
 * 住民税の支払月・年度計算の現在の挙動を固定する。
 */
describe("calculateActualPaymentMonth", () => {
	it("returns the payment month as-is when billingDay is null", () => {
		expect(calculateActualPaymentMonth(6, null, 25)).toBe(6);
	});

	it("returns the payment month as-is when paymentDay is null", () => {
		expect(calculateActualPaymentMonth(6, 30, null)).toBe(6);
	});

	it("shifts to next month when billing day is on/after the tax payment day (30)", () => {
		expect(calculateActualPaymentMonth(1, 30, 25)).toBe(2);
		expect(calculateActualPaymentMonth(6, 30, 25)).toBe(7);
		expect(calculateActualPaymentMonth(8, 31, 25)).toBe(9);
		expect(calculateActualPaymentMonth(10, 30, 25)).toBe(11);
	});

	it("does not shift when billing day is before the tax payment day (30)", () => {
		expect(calculateActualPaymentMonth(6, 25, 10)).toBe(6);
		expect(calculateActualPaymentMonth(10, 15, 27)).toBe(10);
	});
});

describe("getFiscalYearRange", () => {
	it("returns June 1st through May 31st of the next year", () => {
		const { start, end } = getFiscalYearRange(2026);
		expect(start.getFullYear()).toBe(2026);
		expect(start.getMonth()).toBe(5); // 6月
		expect(start.getDate()).toBe(1);
		expect(end.getFullYear()).toBe(2027);
		expect(end.getMonth()).toBe(4); // 5月
		expect(end.getDate()).toBe(31);
	});
});

describe("getCurrentFiscalYear", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the current year from June onwards", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 1)); // 2026-06-01
		expect(getCurrentFiscalYear()).toBe(2026);
	});

	it("returns the previous year before June", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 4, 31)); // 2026-05-31
		expect(getCurrentFiscalYear()).toBe(2025);
	});
});
