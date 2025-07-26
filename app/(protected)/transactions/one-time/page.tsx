import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import Link from "next/link";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";

export default async function OneTimeTransactionsPage() {
	// 臨時収支データ取得（過去3ヶ月と将来のデータ）
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
	const [transactions, accounts] = await Promise.all([
		getUserOneTimeTransactions(undefined, threeMonthsAgo),
		getUserAccounts(),
	]);

	// 口座IDから口座名を取得するヘルパー関数
	const getAccountName = (accountId: string) => {
		const account = accounts.find((acc) => acc.id === accountId);
		return account?.name || "不明な口座";
	};

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">臨時収支</h1>
				<Button color="primary" as={Link} href="/transactions/one-time/new">
					新規追加
				</Button>
			</div>

			{transactions.length > 0 ? (
				<Card>
					<CardBody className="p-0">
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="bg-gray-50 dark:bg-gray-800">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											名前
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											種別
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											口座
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											日付
										</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											金額
										</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											操作
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
									{transactions.map((transaction) => (
										<tr key={transaction.id}>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													{transaction.is_transfer && (
														<span className="text-blue-600 text-sm">⟷</span>
													)}
													<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
														{transaction.name}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Chip
													color={
														transaction.is_transfer
															? "primary"
															: transaction.type === "income"
																? "success"
																: "danger"
													}
													variant="flat"
													size="sm"
												>
													{transaction.is_transfer
														? "送金"
														: transaction.type === "income"
															? "収入"
															: "支出"}
												</Chip>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm">
													<div className="font-medium text-gray-900 dark:text-gray-100">
														{getAccountName(transaction.account_id)}
													</div>
													{transaction.is_transfer &&
														transaction.destination_account_id && (
															<div className="text-gray-500 text-xs">
																→{" "}
																{getAccountName(
																	transaction.destination_account_id,
																)}
															</div>
														)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
												{transaction.transaction_date}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
												¥{transaction.amount.toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<Button
													variant="bordered"
													size="sm"
													as={Link}
													href={`/transactions/one-time/${transaction.id}/edit`}
												>
													編集
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardBody>
				</Card>
			) : (
				<Card>
					<CardBody className="text-center py-8">
						<p className="text-lg mb-4">臨時収支はまだ登録されていません</p>
						<Button color="primary" as={Link} href="/transactions/one-time/new">
							最初の臨時収支を追加する
						</Button>
					</CardBody>
				</Card>
			)}
		</div>
	);
}
