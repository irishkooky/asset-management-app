"use client";
import { Accordion, AccordionItem } from "@heroui/accordion";
import Link from "next/link";
import { Button } from "@/components/button";
import type { RecurringTransaction } from "@/types/database";
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
		<div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
			<Accordion
				defaultExpandedKeys={transactionGroups.map((group) => group.accountId)}
			>
				{transactionGroups.map((group) => (
					<AccordionItem
						key={group.accountId}
						className="border-b last:border-b-0"
						textValue={`${group.accountName} - ${group.transactions.length}件の定期取引`}
						title={
							<div className="flex justify-between items-center py-2 px-4">
								<span className="font-medium">{group.accountName}</span>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{group.transactions.length} 件の定期取引
								</span>
							</div>
						}
					>
						<div>
							{/* シンプルなリスト形式レイアウト */}
							<div className="px-4 pb-4">
								<ul className="divide-y divide-gray-100 dark:divide-gray-700">
									{group.transactions.map((transaction) => (
										<li
											key={transaction.id}
											className="py-3 flex items-center justify-between"
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium truncate">
														{transaction.name}
													</p>
													{transaction.is_transfer && (
														<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
															送金
														</span>
													)}
												</div>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													毎月{transaction.day_of_month}日
													{transaction.is_transfer &&
														transaction.destination_account_id && (
															<span className="ml-1">
																（送金先: {(() => {
																	const destAccount = transactionGroups.find(
																		(g) =>
																			g.transactions.some(
																				(t) =>
																					t.account_id ===
																						transaction.destination_account_id &&
																					t.transfer_pair_id ===
																						transaction.transfer_pair_id &&
																					t.type === "income",
																			),
																	);
																	return destAccount?.accountName || "不明";
																})()}）
															</span>
														)}
												</p>
											</div>
											<div className="flex items-center">
												<span
													className={`text-sm font-medium ${
														transaction.type === "income"
															? "text-green-600 dark:text-green-400"
															: "text-red-600 dark:text-red-400"
													}`}
												>
													{transaction.type === "income" ? "" : "-"}¥
													{transaction.amount.toLocaleString()}
												</span>
												<div className="ml-4">
													<RefreshHandler transaction={transaction} />
												</div>
											</div>
										</li>
									))}
								</ul>
								<div className="mt-4">
									<Button
										size="sm"
										variant="outline"
										className="w-full"
										asChild
									>
										<Link
											href={`/transactions/recurring/new?accountId=${group.accountId}`}
										>
											この口座の定期収支を追加
										</Link>
									</Button>
								</div>
							</div>
						</div>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
};
