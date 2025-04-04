import Link from "next/link";
import { Button } from "./button";
import LoginButton from "./login-button";

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
	recurringTransactions: Transaction[];
	recentTransactions: Transaction[];
	isDemo?: boolean;
}

export default function Dashboard({
	totalBalance,
	predictions,
	recurringTransactions,
	recentTransactions,
	isDemo = false,
}: DashboardProps) {
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

			{/* 現在の総残高 */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-medium mb-2">現在の総残高</h2>
				<p className="text-3xl font-bold">¥{totalBalance.toLocaleString()}</p>
			</div>

			{/* 貯蓄予測 */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-medium mb-4">貯蓄予測</h2>
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
							{predictions.map((prediction) => {
								const periodLabels = {
									"1month": "1ヶ月後",
									"3months": "3ヶ月後",
									"6months": "6ヶ月後",
									"12months": "1年後",
								};
								const periodLabel =
									periodLabels[prediction.period as keyof typeof periodLabels];

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
										<td className="py-2">毎月{transaction.day_of_month}日</td>
										<td className="text-right py-2">
											¥{transaction.amount.toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-gray-500">定期的な収支はまだ登録されていません</p>
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
										<td className="py-2">{transaction.transaction_date}</td>
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
	);
}
