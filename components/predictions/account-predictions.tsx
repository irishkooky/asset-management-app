"use client";

import type { PredictionPeriod, Transaction } from "@/types";
import { Card } from "@heroui/react";
import { addMonths, format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";

interface AccountPredictionsProps {
	accountId: string;
	currentBalance: number;
	transactions: Transaction[];
}

const PREDICTION_PERIODS: {
	label: string;
	value: PredictionPeriod;
	months: number;
}[] = [
	{ label: "1ヶ月後", value: "1month", months: 1 },
	{ label: "3ヶ月後", value: "3months", months: 3 },
	{ label: "6ヶ月後", value: "6months", months: 6 },
	{ label: "1年後", value: "1year", months: 12 },
];

export default function AccountPredictions({
	accountId,
	currentBalance,
	transactions,
}: AccountPredictionsProps) {
	const calculatePrediction = (months: number): number => {
		let prediction = currentBalance;
		const today = new Date();
		const endDate = addMonths(today, months);

		// 定期的な取引の計算
		const regularTransactions = transactions.filter(
			(t) => t.type === "regular",
		);
		for (const transaction of regularTransactions) {
			const transactionDate = new Date(transaction.date);
			let currentDate = new Date(today);

			while (currentDate <= endDate) {
				if (isSameDay(currentDate, transactionDate)) {
					prediction +=
						transaction.transaction_type === "income"
							? transaction.amount
							: -transaction.amount;
				}
				currentDate = addMonths(currentDate, 1);
			}
		}

		// 臨時の取引の計算
		const temporaryTransactions = transactions.filter(
			(t) =>
				t.type === "temporary" &&
				new Date(t.date) > today &&
				new Date(t.date) <= endDate,
		);

		for (const transaction of temporaryTransactions) {
			prediction +=
				transaction.transaction_type === "income"
					? transaction.amount
					: -transaction.amount;
		}

		return prediction;
	};

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{PREDICTION_PERIODS.map(({ label, value, months }) => {
				const prediction = calculatePrediction(months);
				const date = format(addMonths(new Date(), months), "yyyy年M月d日", {
					locale: ja,
				});
				const difference = prediction - currentBalance;

				return (
					<Card key={value} className="p-4">
						<div className="flex flex-col">
							<h3 className="text-sm font-semibold text-gray-500">{label}</h3>
							<p className="text-xs text-gray-400">{date}</p>
							<p
								className={`text-xl font-bold mt-2 ${
									prediction >= currentBalance
										? "text-emerald-600"
										: "text-rose-600"
								}`}
							>
								¥{prediction.toLocaleString()}
							</p>
							<p
								className={`text-sm ${
									difference >= 0 ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								{difference >= 0 ? "+" : ""}¥{difference.toLocaleString()}
							</p>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
