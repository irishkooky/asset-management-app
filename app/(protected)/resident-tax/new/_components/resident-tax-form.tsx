"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/button";
import type { RecurringTransaction, ResidentTaxPeriod } from "@/types/database";
import { createResidentTaxSetting } from "@/utils/supabase/resident-tax";

interface ResidentTaxFormProps {
	recurringTransactions: RecurringTransaction[];
	defaultFiscalYear: number;
}

const PERIODS: { period: ResidentTaxPeriod; month: number; label: string }[] = [
	{ period: 1, month: 6, label: "第1期 (6月)" },
	{ period: 2, month: 8, label: "第2期 (8月)" },
	{ period: 3, month: 10, label: "第3期 (10月)" },
	{ period: 4, month: 1, label: "第4期 (1月)" },
];

export function ResidentTaxForm({
	recurringTransactions,
	defaultFiscalYear,
}: ResidentTaxFormProps) {
	const router = useRouter();
	const fiscalYearId = useId();
	const totalAmountId = useId();
	const [loading, setLoading] = useState(false);
	const [fiscalYear, setFiscalYear] = useState(defaultFiscalYear);
	const [totalAmount, setTotalAmount] = useState<number>(0);
	const [amountInputMode, setAmountInputMode] = useState<
		"total" | "individual"
	>("total");

	const [periodSettings, setPeriodSettings] = useState<
		Record<
			ResidentTaxPeriod,
			{
				amount: number;
				paymentMode: "addon" | "standalone";
				targetTransactionId: string | null;
			}
		>
	>({
		1: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
		2: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
		3: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
		4: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
	});

	const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const amount = Number(e.target.value);
		setTotalAmount(amount);

		if (amountInputMode === "total" && amount > 0) {
			const perPeriod = Math.floor(amount / 4);
			const remainder = amount % 4;

			setPeriodSettings((prev) => ({
				1: { ...prev[1], amount: perPeriod + (remainder > 0 ? 1 : 0) },
				2: { ...prev[2], amount: perPeriod + (remainder > 1 ? 1 : 0) },
				3: { ...prev[3], amount: perPeriod + (remainder > 2 ? 1 : 0) },
				4: { ...prev[4], amount: perPeriod },
			}));
		}
	};

	const handlePeriodAmountChange = (
		period: ResidentTaxPeriod,
		amount: number,
	) => {
		setPeriodSettings((prev) => ({
			...prev,
			[period]: { ...prev[period], amount },
		}));

		if (amountInputMode === "individual") {
			const total = Object.values({
				...periodSettings,
				[period]: { ...periodSettings[period], amount },
			}).reduce((sum, setting) => sum + setting.amount, 0);
			setTotalAmount(total);
		}
	};

	const handlePaymentModeChange = (
		period: ResidentTaxPeriod,
		mode: "addon" | "standalone",
	) => {
		setPeriodSettings((prev) => ({
			...prev,
			[period]: {
				...prev[period],
				paymentMode: mode,
				targetTransactionId:
					mode === "standalone" ? null : prev[period].targetTransactionId,
			},
		}));
	};

	const handleTargetTransactionChange = (
		period: ResidentTaxPeriod,
		transactionId: string,
	) => {
		setPeriodSettings((prev) => ({
			...prev,
			[period]: { ...prev[period], targetTransactionId: transactionId || null },
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!totalAmount || totalAmount <= 0) {
			alert("総額を入力してください");
			return;
		}

		setLoading(true);

		try {
			const periodAmounts: Record<ResidentTaxPeriod, number> = {
				1: periodSettings[1].amount,
				2: periodSettings[2].amount,
				3: periodSettings[3].amount,
				4: periodSettings[4].amount,
			};

			const targetTransactionIds: Record<ResidentTaxPeriod, string | null> = {
				1:
					periodSettings[1].paymentMode === "addon"
						? periodSettings[1].targetTransactionId
						: null,
				2:
					periodSettings[2].paymentMode === "addon"
						? periodSettings[2].targetTransactionId
						: null,
				3:
					periodSettings[3].paymentMode === "addon"
						? periodSettings[3].targetTransactionId
						: null,
				4:
					periodSettings[4].paymentMode === "addon"
						? periodSettings[4].targetTransactionId
						: null,
			};

			await createResidentTaxSetting(
				fiscalYear,
				totalAmount,
				periodAmounts,
				targetTransactionIds,
			);

			router.push("/resident-tax");
		} catch (error) {
			console.error("住民税設定の作成に失敗しました:", error);
			alert(
				`エラー: ${error instanceof Error ? error.message : "不明なエラーが発生しました"}`,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* 基本設定 */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">基本設定</h3>

					<div className="space-y-2">
						<label htmlFor={fiscalYearId} className="block text-sm font-medium">
							年度
						</label>
						<input
							id={fiscalYearId}
							type="number"
							value={fiscalYear}
							onChange={(e) => setFiscalYear(Number(e.target.value))}
							min={2020}
							max={2030}
							required
							className="w-full p-2 border rounded-md"
						/>
						<p className="text-xs text-gray-600 dark:text-gray-400">
							{fiscalYear}年6月〜{fiscalYear + 1}年5月
						</p>
					</div>

					<div className="space-y-2">
						<span className="block text-sm font-medium">金額入力方式</span>
						<div className="flex space-x-4">
							<label className="flex items-center">
								<input
									type="radio"
									value="total"
									checked={amountInputMode === "total"}
									onChange={(e) =>
										setAmountInputMode(e.target.value as "total")
									}
									className="mr-2"
								/>
								年間総額から4等分
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="individual"
									checked={amountInputMode === "individual"}
									onChange={(e) =>
										setAmountInputMode(e.target.value as "individual")
									}
									className="mr-2"
								/>
								各期個別入力
							</label>
						</div>
					</div>

					{amountInputMode === "total" && (
						<div className="space-y-2">
							<label
								htmlFor={totalAmountId}
								className="block text-sm font-medium"
							>
								年間総額
							</label>
							<input
								id={totalAmountId}
								type="number"
								value={totalAmount || ""}
								onChange={handleTotalAmountChange}
								placeholder="例: 120000"
								min={0}
								required
								className="w-full p-2 border rounded-md"
							/>
						</div>
					)}
				</div>

				{/* 各期の設定 */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">各期の設定</h3>

					{PERIODS.map(({ period, label }) => (
						<div key={period} className="border rounded-lg p-4 space-y-4">
							<h4 className="font-medium">{label}</h4>

							{amountInputMode === "individual" && (
								<div className="space-y-2">
									<label
										htmlFor={`amount-${period}`}
										className="block text-sm font-medium"
									>
										支払い金額
									</label>
									<input
										id={`amount-${period}`}
										type="number"
										value={periodSettings[period].amount || ""}
										onChange={(e) =>
											handlePeriodAmountChange(period, Number(e.target.value))
										}
										placeholder="例: 30000"
										min={0}
										required
										className="w-full p-2 border rounded-md"
									/>
								</div>
							)}

							{amountInputMode === "total" && (
								<div className="space-y-2">
									<span className="block text-sm font-medium">
										支払い金額（自動計算）
									</span>
									<div className="text-lg font-semibold">
										{periodSettings[period].amount.toLocaleString()}円
									</div>
								</div>
							)}

							<div className="space-y-2">
								<span className="block text-sm font-medium">支払い方法</span>
								<div className="flex space-x-4">
									<label className="flex items-center">
										<input
											type="radio"
											value="standalone"
											checked={
												periodSettings[period].paymentMode === "standalone"
											}
											onChange={(e) =>
												handlePaymentModeChange(
													period,
													e.target.value as "standalone",
												)
											}
											className="mr-2"
										/>
										単体で登録
									</label>
									<label className="flex items-center">
										<input
											type="radio"
											value="addon"
											checked={periodSettings[period].paymentMode === "addon"}
											onChange={(e) =>
												handlePaymentModeChange(
													period,
													e.target.value as "addon",
												)
											}
											className="mr-2"
										/>
										定期収支に上乗せ
									</label>
								</div>
							</div>

							{periodSettings[period].paymentMode === "addon" && (
								<div className="space-y-2">
									<label
										htmlFor={`target-${period}`}
										className="block text-sm font-medium"
									>
										上乗せ先の定期収支
									</label>
									<select
										id={`target-${period}`}
										value={periodSettings[period].targetTransactionId || ""}
										onChange={(e) =>
											handleTargetTransactionChange(period, e.target.value)
										}
										className="w-full p-2 border rounded-md"
										required
									>
										<option value="">定期収支を選択</option>
										{recurringTransactions.map((transaction) => (
											<option key={transaction.id} value={transaction.id}>
												{transaction.name} (
												{transaction.amount.toLocaleString()}円)
											</option>
										))}
									</select>
								</div>
							)}
						</div>
					))}
				</div>

				{/* 確認 */}
				{totalAmount > 0 && (
					<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
						<h4 className="font-medium mb-2">設定内容の確認</h4>
						<div className="text-sm space-y-1">
							<div>年度: {fiscalYear}年度</div>
							<div>総額: {totalAmount.toLocaleString()}円</div>
							<div className="mt-2">
								{PERIODS.map(({ period, label }) => (
									<div key={period} className="flex justify-between">
										<span>{label}:</span>
										<span>
											{periodSettings[period].amount.toLocaleString()}円
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				<div className="flex space-x-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
						disabled={loading}
					>
						キャンセル
					</Button>
					<Button type="submit" disabled={loading || !totalAmount}>
						{loading ? "作成中..." : "住民税設定を作成"}
					</Button>
				</div>
			</form>
		</div>
	);
}
