import { Button } from "@/components/button";
import { getAccountPredictions } from "@/utils/predictions";
import { getAccountById } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AccountDetailPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	// 口座データ取得
	const account = await getAccountById(params.id);
	if (!account) {
		notFound();
	}

	// 予測データ取得
	const predictions = await getAccountPredictions(account.id);

	// 定期的な収支データ取得
	const recurringTransactions = await getUserRecurringTransactions(account.id);

	// 最近の臨時収支を取得（過去1ヶ月）
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	const recentTransactions = await getUserOneTimeTransactions(
		account.id,
		oneMonthAgo,
		new Date(),
	);

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">{account.name}</h1>
				<div className="flex space-x-2">
					<Button variant="outline" asChild>
						<Link href="/accounts">戻る</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href={`/accounts/${account.id}/edit`}>編集</Link>
					</Button>
				</div>
			</div>

			{/* 口座残高 */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-medium mb-2">現在の残高</h2>
				<p className="text-3xl font-bold">
					¥{account.current_balance.toLocaleString()}
				</p>
				<p className="text-sm text-gray-500 mt-2">
					最終更新: {new Date(account.updated_at).toLocaleDateString()}
				</p>
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
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-medium">定期的な収支</h2>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/transactions/recurring/new?accountId=${account.id}`}>
							追加
						</Link>
					</Button>
				</div>

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
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-medium">最近の臨時収支</h2>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/transactions/one-time/new?accountId=${account.id}`}>
							追加
						</Link>
					</Button>
				</div>

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
