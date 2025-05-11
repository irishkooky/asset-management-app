import { Button } from "@/components/button";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import Link from "next/link";
import { RefreshHandler } from "./_components/refresh-handler";

export default async function RecurringTransactionsPage() {
	// 定期的な収支データ取得
	const transactions = await getUserRecurringTransactions();

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">定期的な収支</h1>
				<Button asChild>
					<Link href="/transactions/recurring/new">新規追加</Link>
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
											毎月{transaction.day_of_month}日
										</td>
										<td className="text-right py-3 px-4">
											¥{transaction.amount.toLocaleString()}
										</td>
										<td className="text-right py-3 px-4">
											<div className="flex justify-end space-x-2">
												<RefreshHandler transaction={transaction} />
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
					<p className="text-lg mb-4">定期的な収支はまだ登録されていません</p>
					<Button asChild>
						<Link href="/transactions/recurring/new">
							最初の定期的な収支を追加する
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
