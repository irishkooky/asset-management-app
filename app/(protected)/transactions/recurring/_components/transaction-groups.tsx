"use client";
import type { RecurringTransaction } from "@/types/database";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { RefreshHandler } from "./refresh-handler";

interface AccountGroup {
	accountId: string;
	accountName: string;
	transactions: RecurringTransaction[];
}

interface TransactionGroupsProps {
	transactionGroups: AccountGroup[];
}

export const TransactionGroups = ({
	transactionGroups,
}: TransactionGroupsProps) => {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
			<Accordion defaultExpandedKeys={transactionGroups.map(group => group.accountId)}>
				{transactionGroups.map((group) => (
					<AccordionItem
						key={group.accountId}
						className="border-b last:border-b-0"
						title={
							<div className="flex justify-between items-center py-2 px-4">
								<span className="font-medium">{group.accountName}</span>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{group.transactions.length} 件の定期取引
								</span>
							</div>
						}
					>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="bg-gray-50 dark:bg-gray-700 border-b">
										<th className="text-left py-3 px-4">名前</th>
										<th className="text-left py-3 px-4">種別</th>
										<th className="text-left py-3 px-4">日付</th>
										<th className="text-right py-3 px-4">金額</th>
										<th className="text-right py-3 px-4">操作</th>
									</tr>
								</thead>
								<tbody>
									{group.transactions.map((transaction) => (
										<tr
											key={transaction.id}
											className="border-b last:border-b-0"
										>
											<td className="py-3 px-4">
												<div>
													<span>{transaction.name}</span>
													{transaction.description && (
														<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
															{transaction.description}
														</p>
													)}
												</div>
											</td>
											<td className="py-3 px-4">
												<span
													className={
														transaction.type === "income"
															? "text-green-600 dark:text-green-400"
															: "text-red-600 dark:text-red-400"
													}
												>
													{transaction.type === "income" ? "収入" : "支出"}
												</span>
											</td>
											<td className="py-3 px-4">
												毎月{transaction.day_of_month}日
											</td>
											<td className="text-right py-3 px-4">
												<span
													className={
														transaction.type === "income"
															? "text-green-600 dark:text-green-400"
															: "text-red-600 dark:text-red-400"
													}
												>
													{transaction.type === "income" ? "" : "-"}¥
													{transaction.amount.toLocaleString()}
												</span>
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
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
};
