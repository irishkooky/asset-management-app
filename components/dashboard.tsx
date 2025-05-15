"use client";

interface Prediction {
	period: string;
	date: string;
	amount: number;
}

interface DashboardProps {
	totalBalance: number;
	monthlyPredictions?: Prediction[];
}

export function Dashboard({
	totalBalance,
	monthlyPredictions,
}: DashboardProps) {
	return (
		<div className="space-y-8">
			<div className="w-full">
				{/* 貯蓄予想コンテンツ */}
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
										{monthlyPredictions?.map((prediction) => {
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
									{monthlyPredictions?.map((prediction) => {
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
											...(monthlyPredictions?.map((p) => p.amount) ?? []),
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
			</div>
		</div>
	);
}
