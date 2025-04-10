"use client";

import { Button } from "@/components/button";
import { LoginButton } from "@/components/login-button";
import Link from "next/link";
import { useState } from "react";
import { UpdateBalancesButton } from "../app/_components/update-balances-button";

interface Prediction {
	period: string;
	date: string;
	amount: number;
}

interface Transaction {
	id: string;
	name: string;
	type: "income" | "expense";
	amount: number;
	day_of_month?: number;
	transaction_date?: string;
}

interface DashboardProps {
	totalBalance: number;
	predictions: Prediction[];
	monthlyPredictions: Prediction[];
	recurringTransactions: Transaction[];
	recentTransactions: Transaction[];
	isDemo?: boolean;
}

export default function Dashboard({
	totalBalance,
	predictions,
	monthlyPredictions,
	recurringTransactions,
	recentTransactions,
	isDemo = false,
}: DashboardProps) {
	const [activeTab, setActiveTab] = useState<"overview" | "savings-prediction">(
		"overview",
	);

	return (
		<div className="space-y-8">
			{/* デモモード通知 */}
			{isDemo && (
				<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h3 className="font-medium text-blue-800 dark:text-blue-300">
								デモモード
							</h3>
							<p className="text-sm text-blue-700 dark:text-blue-400">
								これはデモデータです。実際のデータを管理するにはログインしてください。
							</p>
						</div>
						<div className="flex gap-2">
							<LoginButton size="sm" className="whitespace-nowrap">
								ログインする
							</LoginButton>
							<Button
								asChild
								size="sm"
								variant="outline"
								className="whitespace-nowrap"
							>
								<Link href="/">ホームに戻る</Link>
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* タブナビゲーション */}
			<div className="w-full">
				{/* タブヘッダー */}
				<div className="grid w-full grid-cols-2 mb-4 border-b">
					<button
						type="button"
						onClick={() => setActiveTab("overview")}
						className={`py-2 text-center font-medium transition-colors ${
							activeTab === "overview"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						概要
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("savings-prediction")}
						className={`py-2 text-center font-medium transition-colors ${
							activeTab === "savings-prediction"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						貯蓄予想
					</button>
				</div>

				{/* 概要タブコンテンツ */}
				{activeTab === "overview" && (
					<div className="space-y-8">
						{/* 現在の総残高 */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<div className="flex justify-between items-start">
								<div>
									<h2 className="text-lg font-medium mb-2">現在の総残高</h2>
									<p className="text-3xl font-bold">
										¥{totalBalance.toLocaleString()}
									</p>
								</div>
								{!isDemo && <UpdateBalancesButton />}
							</div>
						</div>

						{/* 定期的な収支 */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-lg font-medium mb-4">定期的な収支</h2>
							{recurringTransactions.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b">
												<th className="text-left py-2">名前</th>
												<th className="text-left py-2">種別</th>
												<th className="text-left py-2">日付</th>
												<th className="text-right py-2">金額</th>
											</tr>
										</thead>
										<tbody>
											{recurringTransactions.map((transaction) => (
												<tr key={transaction.id} className="border-b">
													<td className="py-2">{transaction.name}</td>
													<td className="py-2">
														<span
															className={
																transaction.type === "income"
																	? "text-green-600"
																	: "text-red-600"
															}
														>
															{transaction.type === "income" ? "収入" : "支出"}
														</span>
													</td>
													<td className="py-2">
														毎月{transaction.day_of_month}日
													</td>
													<td className="text-right py-2">
														¥{transaction.amount.toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<p className="text-gray-500">
									定期的な収支はまだ登録されていません
								</p>
							)}
						</div>

						{/* 最近の臨時収支 */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-lg font-medium mb-4">最近の臨時収支</h2>
							{recentTransactions.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b">
												<th className="text-left py-2">名前</th>
												<th className="text-left py-2">種別</th>
												<th className="text-left py-2">日付</th>
												<th className="text-right py-2">金額</th>
											</tr>
										</thead>
										<tbody>
											{recentTransactions.map((transaction) => (
												<tr key={transaction.id} className="border-b">
													<td className="py-2">{transaction.name}</td>
													<td className="py-2">
														<span
															className={
																transaction.type === "income"
																	? "text-green-600"
																	: "text-red-600"
															}
														>
															{transaction.type === "income" ? "収入" : "支出"}
														</span>
													</td>
													<td className="py-2">
														{transaction.transaction_date}
													</td>
													<td className="text-right py-2">
														¥{transaction.amount.toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<p className="text-gray-500">最近の臨時収支はありません</p>
							)}
						</div>
					</div>
				)}

				{/* 貯蓄予想タブコンテンツ */}
				{activeTab === "savings-prediction" && (
					<div className="space-y-8">
						{/* 現在の総残高 */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<div className="flex justify-between items-start">
								<div>
									<h2 className="text-lg font-medium mb-2">現在の総残高</h2>
									<p className="text-3xl font-bold">
										¥{totalBalance.toLocaleString()}
									</p>
								</div>
								{!isDemo && <UpdateBalancesButton />}
							</div>
						</div>

						{/* 貯蓄予測 */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-lg font-medium mb-4">
								貯蓄予測（1か月ごと）
							</h2>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b">
											<th className="text-left py-2">期間</th>
											<th className="text-left py-2">予測日</th>
											<th className="text-right py-2">予測残高</th>
										</tr>
									</thead>
									<tbody>
										{monthlyPredictions.map((prediction) => {
											// 期間ラベルを生成（例: "1month" -> "1ヶ月後", "2months" -> "2ヶ月後"）
											let periodLabel = "1ヶ月後";
											if (prediction.period === "1month") {
												periodLabel = "1ヶ月後";
											} else {
												const match = prediction.period.match(/^(\d+)months$/);
												if (match?.[1]) {
													periodLabel = `${match[1]}ヶ月後`;
												}
											}

											return (
												<tr key={prediction.period} className="border-b">
													<td className="py-2">{periodLabel}</td>
													<td className="py-2">{prediction.date}</td>
													<td className="text-right py-2">
														¥{prediction.amount.toLocaleString()}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>

						{/* 貯蓄予測グラフ */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-lg font-medium mb-4">
								貯蓄予測グラフ（1か月ごと）
							</h2>
							<div className="h-64 flex items-center justify-center">
								<div className="flex h-full w-full items-end justify-between gap-1 overflow-x-auto px-2">
									{monthlyPredictions.map((prediction) => {
										// 期間ラベルを生成
										let periodLabel = "1ヶ月後";
										if (prediction.period === "1month") {
											periodLabel = "1ヶ月後";
										} else {
											const match = prediction.period.match(/^(\d+)months$/);
											if (match?.[1]) {
												periodLabel = `${match[1]}ヶ月後`;
											}
										}

										// 最大値を基準にした相対的な高さを計算
										const maxAmount = Math.max(
											...monthlyPredictions.map((p) => p.amount),
										);
										const heightPercentage =
											(prediction.amount / maxAmount) * 100;

										return (
											<div
												key={prediction.period}
												className="flex flex-col items-center"
											>
												<div
													className="w-12 bg-blue-500 rounded-t-md"
													style={{ height: `${heightPercentage}%` }}
												>
													<div className="h-full w-full flex items-center justify-center text-white font-medium text-xs">
														{prediction.amount >= 10000000
															? `${(prediction.amount / 10000000).toFixed(1)}千万`
															: prediction.amount >= 10000
																? `${(prediction.amount / 10000).toFixed(0)}万`
																: prediction.amount.toLocaleString()}
													</div>
												</div>
												<div className="mt-2 text-xs text-center">
													{periodLabel}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
