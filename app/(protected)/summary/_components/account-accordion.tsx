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
					textValue={account.name}
					title={
						<div className="flex justify-between items-center w-full">
							<span className="font-semibold">{account.name}</span>
							<div className="text-right">
								<div className="text-xs text-gray-600">収支</div>
								{(() => {
									// トランザクションの合計を計算
									const totalBalance = account.transactions.reduce(
										(total, transaction) => {
											return transaction.type === "income"
												? total + transaction.amount
												: total - transaction.amount;
										},
										0,
									);

									return (
										<div
											className={`${totalBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
										>
											¥{totalBalance.toLocaleString()}
										</div>
									);
								})()}
							</div>
						</div>
					}
				>
					{account.transactions.length > 0 ? (
						<table className="w-full border-collapse">
							<tbody>
								{(() => {
									// トランザクションを日付が古い順にソート
									const sortedTransactions = [...account.transactions].sort(
										(a, b) =>
											new Date(a.transaction_date).getTime() -
											new Date(b.transaction_date).getTime(),
									);

									// 基本残高から始めて、各トランザクション後の残高を計算
									const balanceHistory = sortedTransactions.reduce<
										Array<{
											transaction: (typeof sortedTransactions)[0];
											balance: number;
										}>
									>((history, transaction) => {
										// 前回の残高を取得、もしくは初期残高を使用
										const previousBalance =
											history.length > 0
												? history[history.length - 1].balance
												: account.balance;

										// 収入ならプラス、支出ならマイナス
										const newBalance =
											transaction.type === "income"
												? previousBalance + transaction.amount
												: previousBalance - transaction.amount;

										history.push({ transaction, balance: newBalance });
										return history;
									}, []);

									return balanceHistory.map(
										({ transaction, balance }, index, array) => (
											<tr key={transaction.id}>
												<td className="py-2 border-t border-gray-200 dark:border-gray-700">
													{format(
														new Date(transaction.transaction_date),
														"M/d",
														{
															locale: ja,
														},
													)}
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
													<div
														className={`text-xs mt-1 ${balance < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"} ${index === array.length - 1 ? "font-bold" : ""}`}
													>
														残高: ¥{balance.toLocaleString()}
													</div>
												</td>
											</tr>
										),
									);
								})()}
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
