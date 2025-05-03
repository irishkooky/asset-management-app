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
					{account.transactions.length > 0 ? (
						<table className="w-full border-collapse">
							<tbody>
								{account.transactions.map((transaction) => (
									<tr key={transaction.id}>
										<td className="py-2 border-t border-gray-200 dark:border-gray-700">
											{format(new Date(transaction.transaction_date), "M/d", {
												locale: ja,
											})}
										</td>
										<td className="py-2 border-t border-gray-200 dark:border-gray-700">
											<div className="flex items-center">
												<span>{transaction.name}</span>
												{transaction.description && (
													<span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
														{transaction.description}
													</span>
												)}
											</div>
										</td>
										<td className="py-2 border-t border-gray-200 dark:border-gray-700 text-right">
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
					) : (
						<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
							この月のトランザクションはありません
						</div>
					)}
				</AccordionItem>
			))}
		</Accordion>
	);
};
