"use client";
import type { AccountSummary } from "@/types/summary";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface AccountAccordionProps {
	accounts: AccountSummary[];
}

export const AccountAccordion = ({ accounts }: AccountAccordionProps) => {
	return (
		<Accordion variant="splitted" selectionMode="multiple" className="px-0">
			{accounts.map((account) => (
				<AccordionItem
					key={account.id}
					title={
						<div className="flex justify-between items-center w-full">
							<span className="font-semibold">{account.name}</span>
							<div className="text-right">
								<div className="text-xs text-gray-600">収支</div>
								<div
									className={`${account.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
								>
									¥{account.balance.toLocaleString()}
								</div>
							</div>
						</div>
					}
				>
					<div className="space-y-6">
						{account.transactions.length > 0 ? (
							<div className="mt-4">
								<div className="border rounded-lg overflow-hidden">
									<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
										<thead className="bg-gray-50 dark:bg-gray-800">
											<tr>
												<th
													scope="col"
													className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider"
												>
													日付
												</th>
												<th
													scope="col"
													className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider"
												>
													内容
												</th>
												<th
													scope="col"
													className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider"
												>
													金額
												</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
											{account.transactions.map((transaction) => (
												<tr key={transaction.id}>
													<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
														{format(
															new Date(transaction.transaction_date),
															"M/d",
															{ locale: ja },
														)}
													</td>
													<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
														<div className="flex items-center">
															<span>{transaction.name}</span>
															{transaction.description && (
																<span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
																	{transaction.description}
																</span>
															)}
														</div>
													</td>
													<td className="px-4 py-2 whitespace-nowrap text-sm text-right">
														<span
															className={`font-medium ${transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
														>
															{transaction.type === "income" ? "" : "-"}¥
															{Math.abs(transaction.amount).toLocaleString()}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
								この月のトランザクションはありません
							</div>
						)}
					</div>
				</AccordionItem>
			))}
		</Accordion>
	);
};
