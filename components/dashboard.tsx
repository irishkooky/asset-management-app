"use client";

import {
	Card,
	CardBody,
	CardHeader,
	Divider,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/react";
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
	totalBalance: number;
	monthlyPredictions?: Prediction[];
}

export function Dashboard({
	totalBalance,
	monthlyPredictions,
}: DashboardProps) {
	// グラフ用のデータを準備
	const chartData = monthlyPredictions?.map((prediction) => {
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

		return {
			name: periodLabel,
			date: prediction.date,
			amount: prediction.amount,
		};
	});

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

	// Tooltipのカスタマイズ
	interface CustomTooltipProps {
		active?: boolean;
		payload?: Array<{
			value: number;
			payload: {
				name: string;
				date: string;
				amount: number;
			};
		}>;
	}

	const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
		if (active && payload && payload[0]) {
			return (
				<Card className="shadow-lg">
					<CardBody className="p-3">
						<p className="text-sm font-medium">{payload[0].payload.name}</p>
						<p className="text-xs text-default-500">
							{payload[0].payload.date}
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

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			<div className="space-y-8">
				<h1 className="text-3xl font-bold">ダッシュボード</h1>

				{/* 現在の総残高 */}
				<Card className="bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800">
					<CardBody className="p-8">
						<h2 className="text-xl font-medium mb-4 text-default-700 dark:text-default-300">
							現在の総残高
						</h2>
						<p className="text-5xl font-bold text-primary">
							¥{totalBalance.toLocaleString()}
						</p>
					</CardBody>
				</Card>

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
									margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
								>
									<defs>
										<linearGradient
											id="colorAmount"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop offset="5%" stopColor="#006FEE" stopOpacity={0.8} />
											<stop offset="95%" stopColor="#006FEE" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis
										dataKey="name"
										tick={{ fontSize: 12 }}
										stroke="#6b7280"
									/>
									<YAxis
										tickFormatter={formatCurrency}
										tick={{ fontSize: 12 }}
										stroke="#6b7280"
									/>
									<Tooltip content={<CustomTooltip />} />
									<Area
										type="monotone"
										dataKey="amount"
										stroke="#006FEE"
										fillOpacity={1}
										fill="url(#colorAmount)"
										strokeWidth={3}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardBody>
				</Card>

				{/* 貯蓄予測テーブル */}
				<Card>
					<CardHeader className="pb-0 pt-6 px-6">
						<h2 className="text-2xl font-bold">月別予測詳細</h2>
					</CardHeader>
					<Divider className="my-4" />
					<CardBody className="pt-0">
						<Table aria-label="貯蓄予測テーブル">
							<TableHeader>
								<TableColumn>期間</TableColumn>
								<TableColumn>予測日</TableColumn>
								<TableColumn align="end">予測残高</TableColumn>
							</TableHeader>
							<TableBody>
								{monthlyPredictions && monthlyPredictions.length > 0 ? (
									monthlyPredictions.map((prediction) => {
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

										return (
											<TableRow key={prediction.period}>
												<TableCell className="font-medium">
													{periodLabel}
												</TableCell>
												<TableCell>{prediction.date}</TableCell>
												<TableCell className="text-right font-semibold">
													¥{prediction.amount.toLocaleString()}
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={3}
											className="text-center text-default-500"
										>
											予測データがありません
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
