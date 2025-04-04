import { Button } from "../../../../components/button";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import Link from "next/link";

export default async function OneTimeTransactionsPage() {
	// 臨時収支データ取得（過去3ヶ月と将来のデータ）
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
	const transactions = await getUserOneTimeTransactions(
		undefined,
		threeMonthsAgo,
	);

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">臨時収支</h1>
				<Button asChild>
					<Link href="/transactions/one-time/new">新規追加</Link>
				</Button>
			</div>

			{transactions.length > 0 ? (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="bg-gray-50 dark:bg-gray-700 border-b">
									<th className="text-left py-3 px-4">名前</th>
									<th className="text-left py-3 px-4">種別</th>
									<th className="text-left py-3 px-4">口座</th>
									<th className="text-left py-3 px-4">日付</th>
									<th className="text-right py-3 px-4">金額</th>
									<th className="text-right py-3 px-4">操作</th>
								</tr>
							</thead>
							<tbody>
								{transactions.map((transaction) => (
									<tr key={transaction.id} className="border-b">
										<td className="py-3 px-4">{transaction.name}</td>
										<td className="py-3 px-4">
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
										<td className="py-3 px-4">
											{/* 口座名は後で実装 */}
											<Link
												href={`/accounts/${transaction.account_id}`}
												className="text-blue-600 hover:underline"
											>
												口座詳細
											</Link>
										</td>
										<td className="py-3 px-4">
											{transaction.transaction_date}
										</td>
										<td className="text-right py-3 px-4">
											¥{transaction.amount.toLocaleString()}
										</td>
										<td className="text-right py-3 px-4">
											<div className="flex justify-end space-x-2">
												<Button variant="outline" size="sm" asChild>
													<Link
														href={`/transactions/one-time/${transaction.id}/edit`}
													>
														編集
													</Link>
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			) : (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
					<p className="text-lg mb-4">臨時収支はまだ登録されていません</p>
					<Button asChild>
						<Link href="/transactions/one-time/new">
							最初の臨時収支を追加する
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
