"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Divider,
} from "@heroui/react";
import { useId, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface Prediction {
	period: string;
	date: string;
	amount: number;
}

interface DashboardProps {
	monthlyPredictions?: Prediction[];
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		value: number;
		payload: {
			name: string;
			fullName: string;
			date: string;
			amount: number;
		};
	}>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
	if (active && payload && payload[0]) {
		return (
			<Card className="shadow-xl border border-default-200">
				<CardBody className="p-3">
					<p className="text-sm font-medium text-default-600">
						{payload[0].payload.fullName}
					</p>
					<p className="text-lg font-bold text-primary">
						¥{payload[0].value.toLocaleString()}
					</p>
				</CardBody>
			</Card>
		);
	}
	return null;
};

export function Dashboard({ monthlyPredictions }: DashboardProps) {
	const [showAllMonths, setShowAllMonths] = useState(false);
	const gradientId = useId();

	// グラフ用のデータを準備
	const chartData = monthlyPredictions?.map((prediction) => {
		// 日付から月を取得
		const date = new Date(prediction.date);
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		const monthLabel = `${year}年${month}月`;

		return {
			name: `${month}月`,
			fullName: monthLabel,
			date: prediction.date,
			amount: prediction.amount,
		};
	});

	// 最新の予測値と成長率を計算
	const latestPrediction = monthlyPredictions?.[monthlyPredictions.length - 1];
	const currentAmount = monthlyPredictions?.[0]?.amount || 0;
	const growthAmount = latestPrediction
		? latestPrediction.amount - currentAmount
		: 0;
	const growthRate =
		currentAmount > 0 ? (growthAmount / currentAmount) * 100 : 0;

	// 金額のフォーマット
	const formatCurrency = (value: number) => {
		if (value >= 100000000) {
			return `¥${(value / 100000000).toFixed(1)}億`;
		}
		if (value >= 10000000) {
			return `¥${(value / 10000000).toFixed(1)}千万`;
		}
		if (value >= 10000) {
			return `¥${(value / 10000).toFixed(0)}万`;
		}
		return `¥${value.toLocaleString()}`;
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			<div className="space-y-8">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">ダッシュボード</h1>
					{latestPrediction && (
						<div className="text-right">
							<p className="text-sm text-default-500">12ヶ月後の予想</p>
							<p className="text-2xl font-bold text-primary">
								{formatCurrency(latestPrediction.amount)}
							</p>
							{growthRate > 0 && (
								<Chip color="success" size="sm" variant="flat">
									+{growthRate.toFixed(1)}%
								</Chip>
							)}
						</div>
					)}
				</div>

				{/* 貯蓄予測グラフ */}
				<Card>
					<CardHeader className="pb-0 pt-6 px-6">
						<h2 className="text-2xl font-bold">貯蓄予測グラフ</h2>
					</CardHeader>
					<Divider className="my-4" />
					<CardBody className="pt-0">
						<div className="h-[400px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={chartData}
									margin={{ top: 20, right: 10, left: -20, bottom: 30 }}
								>
									<defs>
										<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#006FEE" stopOpacity={0.8} />
											<stop
												offset="95%"
												stopColor="#006FEE"
												stopOpacity={0.05}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="#e5e7eb"
										opacity={0.5}
										vertical={false}
									/>
									<XAxis
										dataKey="name"
										tick={{ fontSize: 12, fontWeight: 500 }}
										stroke="#6b7280"
										axisLine={{ stroke: "#e5e7eb" }}
										tickLine={false}
										dy={10}
									/>
									<YAxis
										tickFormatter={formatCurrency}
										tick={{ fontSize: 11 }}
										stroke="#6b7280"
										axisLine={false}
										tickLine={false}
										width={80}
										dx={10}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Area
										type="monotone"
										dataKey="amount"
										stroke="#006FEE"
										fillOpacity={1}
										fill={`url(#${gradientId})`}
										strokeWidth={2.5}
										dot={{ fill: "#006FEE", strokeWidth: 2, r: 5 }}
										activeDot={{ r: 7, strokeWidth: 0 }}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardBody>
				</Card>

				{/* 月別予測詳細 */}
				<Card>
					<CardHeader className="pb-0 pt-6 px-6 flex justify-between items-center">
						<h2 className="text-2xl font-bold">月別予測詳細</h2>
						<p className="text-sm text-default-500">各月1日時点の予測残高</p>
					</CardHeader>
					<Divider className="my-4" />
					<CardBody className="pt-0">
						<div className="grid gap-3">
							{monthlyPredictions && monthlyPredictions.length > 0 ? (
								<>
									{/* 最初の6ヶ月分または全て表示 */}
									{monthlyPredictions
										.slice(0, showAllMonths ? undefined : 6)
										.map((prediction, index) => {
											const date = new Date(prediction.date);
											const month = date.getMonth() + 1;
											const year = date.getFullYear();
											const prevAmount =
												index > 0
													? monthlyPredictions[index - 1].amount
													: currentAmount;
											const monthlyIncrease = prediction.amount - prevAmount;

											return (
												<div
													key={prediction.period}
													className="flex justify-between items-center p-4 rounded-lg bg-default-50 dark:bg-default-100/50 hover:bg-default-100 dark:hover:bg-default-200/50 transition-colors"
												>
													<div className="flex items-center gap-3">
														<div className="text-center">
															<div className="text-2xl font-bold text-primary">
																{month}
															</div>
															<div className="text-xs text-default-500">月</div>
														</div>
														<div className="text-xs text-default-500">
															{year}年
														</div>
													</div>
													<div className="text-right">
														<div className="text-lg font-semibold">
															¥{prediction.amount.toLocaleString()}
														</div>
														<div className="text-xs text-default-500">
															{monthlyIncrease >= 0 ? "+" : ""}
															{formatCurrency(monthlyIncrease)}
														</div>
													</div>
												</div>
											);
										})}

									{/* もっと見る/閉じるボタン */}
									{monthlyPredictions.length > 6 && (
										<div className="mt-4 text-center">
											<Button
												variant="flat"
												color="primary"
												size="sm"
												startContent={
													showAllMonths ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													)
												}
												onPress={() => setShowAllMonths(!showAllMonths)}
											>
												{showAllMonths
													? "閉じる"
													: `さらに${monthlyPredictions.length - 6}ヶ月分を表示`}
											</Button>
										</div>
									)}
								</>
							) : (
								<div className="text-center text-default-500 py-8">
									予測データがありません
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
