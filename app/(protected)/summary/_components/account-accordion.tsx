"use client";

import type { AccountSummary } from "@/types/summary";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface AccountAccordionProps {
	accounts: AccountSummary[];
	previousMonthBalances?: Record<string, number>;
	currentDate: Date;
	selectedYear: number;
	selectedMonth: number;
	monthlyBalanceMap?: Record<string, number>;
}

export const AccountAccordion = ({
	accounts,
	previousMonthBalances,
	currentDate,
	selectedYear,
	selectedMonth,
	monthlyBalanceMap,
}: AccountAccordionProps) => {
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
								{/* 月初残高の計算と表示 */}
								{(() => {
									// 選択した年月が現在の年月より後か判定
									const selectedDate = new Date(
										selectedYear,
										selectedMonth - 1,
										1,
									);
									const currentYearMonth = new Date(
										currentDate.getFullYear(),
										currentDate.getMonth(),
										1,
									);
									const isSelectedDateAfterCurrent =
										selectedDate > currentYearMonth;

									// 初期残高を決定
									// 優先順位: 1. 月初残高テーブルの値, 2. 前月計算値, 3. 現在の口座残高
									let initialBalanceValue = account.balance; // デフォルト値

									// 月初残高テーブルにデータがあればそれを使用
									if (
										monthlyBalanceMap &&
										monthlyBalanceMap[account.id] !== undefined
									) {
										initialBalanceValue = monthlyBalanceMap[account.id];
									}
									// 月初残高テーブルにデータがなく、選択月が現在より後の場合は前月計算値を使用
									else if (
										isSelectedDateAfterCurrent &&
										previousMonthBalances &&
										previousMonthBalances[account.id] !== undefined
									) {
										initialBalanceValue = previousMonthBalances[account.id];
									}

									// 月初日を表示するための文字列
									const monthStartDateStr = `${selectedMonth}/1`;

									return (
										<tr>
											<td className="py-2 border-t border-gray-200 dark:border-gray-700">
												{monthStartDateStr}
											</td>
											<td className="py-2 border-t border-gray-200 dark:border-gray-700">
												<div className="flex items-center">
													<span className="font-medium">月初残高</span>
												</div>
											</td>
											<td className="py-2 border-t border-gray-200 dark:border-gray-700 text-right">
												<div
													className={`font-medium ${initialBalanceValue < 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
												>
													¥{initialBalanceValue.toLocaleString()}
												</div>
											</td>
										</tr>
									);
								})()}
								{(() => {
									// トランザクションを日付が古い順にソート
									const sortedTransactions = [...account.transactions].sort(
										(a, b) =>
											new Date(a.transaction_date).getTime() -
											new Date(b.transaction_date).getTime(),
									);

									// 初期残高を計算（優先順位: 月初残高テーブル > 前月計算値 > 現在残高）
									let initialBalance = account.balance; // デフォルト値

									// 月初残高テーブルにデータがあればそれを優先的に使用
									if (
										monthlyBalanceMap &&
										monthlyBalanceMap[account.id] !== undefined
									) {
										initialBalance = monthlyBalanceMap[account.id];
									}
									// 月初残高テーブルにデータがなく、将来月の場合は前月計算値を使用
									else if (
										previousMonthBalances &&
										previousMonthBalances[account.id] !== undefined &&
										new Date(selectedYear, selectedMonth - 1, 1) >
											new Date(
												currentDate.getFullYear(),
												currentDate.getMonth(),
												1,
											)
									) {
										initialBalance = previousMonthBalances[account.id];
									}

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
												: initialBalance;

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
