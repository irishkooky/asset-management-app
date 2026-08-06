import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMonthlySummaryData } from "@/app/(protected)/summary/actions";
import {
	getMonthlyPredictions,
	predictAccountSavings,
	predictTotalSavings,
} from "@/utils/predictions";
import { getTotalBalance, getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionsTotal } from "@/utils/supabase/one-time-transactions";
import { getMonthlyRecurringTotal } from "@/utils/supabase/recurring-transactions";

vi.mock("@/utils/supabase/accounts", () => ({
	getTotalBalance: vi.fn(),
	getUserAccounts: vi.fn(),
}));
vi.mock("@/utils/supabase/one-time-transactions", () => ({
	getOneTimeTransactionsTotal: vi.fn(),
}));
vi.mock("@/utils/supabase/recurring-transactions", () => ({
	getMonthlyRecurringTotal: vi.fn(),
}));
vi.mock("@/app/(protected)/summary/actions", () => ({
	getMonthlySummaryData: vi.fn(),
}));

/**
 * 特性評価テスト（characterization tests）:
 * 貯蓄予測（utils/predictions.ts）の計算ロジックの現在の挙動を固定する。
 * DB アクセスはすべてモックし、計算式のみを検証する。
 */
describe("predictions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15, 12)); // 2026-06-15
		vi.mocked(getMonthlyRecurringTotal).mockResolvedValue({
			income: 500,
			expense: 200,
		});
		vi.mocked(getOneTimeTransactionsTotal).mockResolvedValue({
			income: 100,
			expense: 50,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("predictAccountSavings", () => {
		beforeEach(() => {
			vi.mocked(getUserAccounts).mockResolvedValue([
				{
					id: "acc-1",
					user_id: "user-1",
					name: "テスト口座",
					current_balance: 10000,
					sort_order: 1,
					created_at: "2026-01-01T00:00:00Z",
					updated_at: "2026-01-01T00:00:00Z",
				},
			]);
		});

		it("throws when the account does not exist", async () => {
			await expect(
				predictAccountSavings("missing-account", "1month"),
			).rejects.toThrow("指定された口座が見つかりません");
		});

		it("predicts balance as current + monthlyNet * months + oneTimeNet", async () => {
			// 10000 + (500 - 200) * 3 + (100 - 50) = 10950
			const prediction = await predictAccountSavings("acc-1", "3months");

			expect(prediction.period).toBe("3months");
			expect(prediction.amount).toBe(10950);
		});

		it("uses 12 months for the 12months period", async () => {
			// 10000 + 300 * 12 + 50 = 13650
			const prediction = await predictAccountSavings("acc-1", "12months");

			expect(prediction.amount).toBe(13650);
		});
	});

	describe("predictTotalSavings", () => {
		it("predicts total balance across all accounts", async () => {
			vi.mocked(getTotalBalance).mockResolvedValue(50000);

			// 50000 + (500 - 200) * 1 + (100 - 50) = 50350
			const prediction = await predictTotalSavings("1month");

			expect(prediction.period).toBe("1month");
			expect(prediction.amount).toBe(50350);
		});
	});

	describe("getMonthlyPredictions", () => {
		it("returns 12 monthly predictions using end-of-month balances", async () => {
			vi.mocked(getMonthlySummaryData).mockImplementation(
				async (year, month) => {
					return {
						totalEndOfMonthBalance: year * 100 + month,
					} as Awaited<ReturnType<typeof getMonthlySummaryData>>;
				},
			);

			const predictions = await getMonthlyPredictions();

			expect(predictions).toHaveLength(12);
			// 2026-06 の翌月（2026-07）から開始する
			expect(predictions[0].period).toBe("1month");
			expect(predictions[0].amount).toBe(2026 * 100 + 7);
			// 2027-06 まで（12ヶ月後）
			expect(predictions[11].period).toBe("12months");
			expect(predictions[11].amount).toBe(2027 * 100 + 6);
		});
	});
});
