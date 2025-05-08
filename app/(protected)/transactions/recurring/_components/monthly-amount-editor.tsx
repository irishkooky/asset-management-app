"use client";

import { useEffect, useState } from "react";
import {
	getAmountForMonth,
	getMonthlyAmounts,
	setAmountForMonth,
	setBulkAmounts,
} from "../actions";
import type { MonthlyAmount, RecurringTransaction } from "../types";

type MonthlyAmountEditorProps = {
	recurringTransaction: RecurringTransaction;
	onClose: () => void;
	onUpdate: () => void;
};

export const MonthlyAmountEditor = ({
	recurringTransaction,
	onClose,
	onUpdate,
}: MonthlyAmountEditorProps) => {
	const [loading, setLoading] = useState<boolean>(true);
	const [monthlyAmounts, setMonthlyAmounts] = useState<MonthlyAmount[]>([]);
	const [selectedYear, setSelectedYear] = useState<number>(
		new Date().getFullYear(),
	);
	const [bulkAmount, setBulkAmount] = useState<number>(
		recurringTransaction.default_amount,
	);
	const [error, setError] = useState<string>("");

	// 現在の年の月別金額を取得
	useEffect(() => {
		const fetchAmounts = async (): Promise<void> => {
			try {
				setLoading(true);
				const amounts = await getMonthlyAmounts(
					recurringTransaction.id,
					selectedYear,
					1,
					selectedYear,
					12,
				);

				// 月ごとの金額がない場合はデフォルト金額で埋める
				const fullMonths: MonthlyAmount[] = [];
				for (let month = 1; month <= 12; month++) {
					const existingAmount = amounts.find(
						(a: MonthlyAmount) => a.month === month,
					);
					if (existingAmount) {
						fullMonths.push(existingAmount);
					} else {
						const amount = await getAmountForMonth(
							recurringTransaction.id,
							selectedYear,
							month,
						);
						fullMonths.push({
							year: selectedYear,
							month,
							amount,
						});
					}
				}

				setMonthlyAmounts(fullMonths);
			} catch (err) {
				setError("金額の取得中にエラーが発生しました");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchAmounts();
	}, [recurringTransaction.id, selectedYear]);

	// 特定の月の金額を更新
	const handleMonthAmountChange = async (
		month: number,
		newAmount: number,
	): Promise<void> => {
		try {
			await setAmountForMonth(
				recurringTransaction.id,
				selectedYear,
				month,
				newAmount,
			);

			// 状態を更新
			setMonthlyAmounts((prev) =>
				prev.map((item) =>
					item.month === month ? { ...item, amount: newAmount } : item,
				),
			);
		} catch (err) {
			setError("金額の更新中にエラーが発生しました");
			console.error(err);
		}
	};

	// 一括で金額を更新
	const handleBulkUpdate = async (): Promise<void> => {
		try {
			await setBulkAmounts(
				recurringTransaction.id,
				selectedYear,
				1,
				selectedYear,
				12,
				bulkAmount,
			);

			// 状態を更新して全ての月に同じ金額を設定
			setMonthlyAmounts((prev) =>
				prev.map((item) => ({ ...item, amount: bulkAmount })),
			);

			onUpdate();
		} catch (err) {
			setError("一括更新中にエラーが発生しました");
			console.error(err);
		}
	};

	const getMonthName = (month: number): string => {
		return `${month}月`;
	};

	return (
		<div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
			<h2 className="text-xl font-bold mb-4">
				{recurringTransaction.name} - 月別金額設定
			</h2>

			<div className="mb-6">
				<div className="flex items-center space-x-4 mb-4">
					<select
						value={selectedYear}
						onChange={(e) => setSelectedYear(Number(e.target.value))}
						className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
					>
						{Array.from(
							{ length: 5 },
							(_, i) => new Date().getFullYear() - 2 + i,
						).map((year) => (
							<option key={year} value={year}>
								{year}年
							</option>
						))}
					</select>

					<div className="flex-1" />

					<div className="flex items-center space-x-2">
						<input
							type="number"
							value={bulkAmount}
							onChange={(e) => setBulkAmount(Number(e.target.value))}
							className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-32"
						/>
						<button
							type="button"
							onClick={handleBulkUpdate}
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
						>
							一括設定
						</button>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="text-center py-8">読み込み中...</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{monthlyAmounts.map((item) => (
						<div key={item.month} className="bg-gray-700 p-4 rounded">
							<div className="flex items-center justify-between">
								<span className="font-medium">{getMonthName(item.month)}</span>
								<input
									type="number"
									value={item.amount}
									onChange={(e) =>
										handleMonthAmountChange(item.month, Number(e.target.value))
									}
									className="bg-gray-800 border border-gray-600 rounded px-3 py-1 w-32 text-right"
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{error && <div className="mt-4 text-red-500">{error}</div>}

			<div className="mt-6 flex justify-end space-x-4">
				<button
					type="button"
					onClick={onClose}
					className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
				>
					閉じる
				</button>
				<button
					type="button"
					onClick={onUpdate}
					className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
				>
					完了
				</button>
			</div>
		</div>
	);
};
