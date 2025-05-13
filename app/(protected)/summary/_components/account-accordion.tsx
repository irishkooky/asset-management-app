"use client";

import type { AccountSummary } from "@/types/summary";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { IconPencil } from "@tabler/icons-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useCallback, useState } from "react";
import { setAmountForMonth } from "../../transactions/recurring/actions";
import { updateInitialBalance } from "../actions";

interface AccountAccordionProps {
	accounts: AccountSummary[];
	previousMonthBalances?: Record<string, number>;
	currentDate: Date;
	selectedYear: number;
	selectedMonth: number;
	monthlyBalanceMap?: Record<string, number>;
}

// サーバーアクションをラップしたクライアント側の関数
const updateTransactionAmount = async (
	transactionId: string,
	year: number,
	month: number,
	amount: number,
): Promise<void> => {
	try {
		await setAmountForMonth(transactionId, year, month, amount);
	} catch (error) {
		console.error("金額の更新に失敗しました:", error);
		alert("金額の更新に失敗しました");
	}
};

export const AccountAccordion = ({
	accounts,
	previousMonthBalances,
	currentDate,
	selectedYear,
	selectedMonth,
	monthlyBalanceMap,
}: AccountAccordionProps) => {
	// 編集中のトランザクションを管理するstate
	const [editingTransactionId, setEditingTransactionId] = useState<
		string | null
	>(null);
	const [editingAmount, setEditingAmount] = useState<string>("");

	// 編集中の月初残高を管理するstate
	const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
	const [editingInitialBalance, setEditingInitialBalance] =
		useState<string>("");

	// 金額編集モードを開始
	const startEditing = useCallback(
		(transaction: { id: string; amount: number }) => {
			setEditingTransactionId(transaction.id);
			setEditingAmount(String(Math.abs(transaction.amount)));
		},
		[],
	);

	// 月初残高編集モードを開始
	const startEditingInitialBalance = useCallback(
		(accountId: string, initialBalance: number | undefined) => {
			setEditingAccountId(accountId);
			setEditingInitialBalance(
				initialBalance !== undefined ? String(initialBalance) : "",
			);
		},
		[],
	);

	// 金額編集モードを終了
	const cancelEditing = useCallback(() => {
		setEditingTransactionId(null);
		setEditingAmount("");
	}, []);

	// 月初残高編集モードを終了
	const cancelEditingInitialBalance = useCallback(() => {
		setEditingAccountId(null);
		setEditingInitialBalance("");
	}, []);

	// 金額を保存
	const saveAmount = useCallback(
		async (
			transaction: { id: string; type: string },
			year: number,
			month: number,
		) => {
			if (!editingAmount) return cancelEditing();

			const amount = Number.parseInt(editingAmount, 10);
			if (Number.isNaN(amount) || amount < 0) {
				alert("有効な金額を入力してください");
				return;
			}

			// 収入か支出かに応じた金額（支出の場合は負の値）
			const finalAmount = transaction.type === "income" ? amount : -amount;

			// カスタム金額を保存
			await updateTransactionAmount(transaction.id, year, month, finalAmount);

			// 編集モード終了
			cancelEditing();

			// 更新を反映するためにページをリロード
			window.location.reload();
		},
		[editingAmount, cancelEditing],
	);

	// 月初残高を保存
	const saveInitialBalance = useCallback(
		async (accountId: string, year: number, month: number) => {
			if (!editingInitialBalance) return cancelEditingInitialBalance();

			const amount = Number.parseInt(editingInitialBalance, 10);
			if (Number.isNaN(amount)) {
				alert("有効な金額を入力してください");
				return;
			}

			try {
				// サーバーアクションを呼び出して月初残高を保存
				await updateInitialBalance(accountId, year, month, amount);

				// 編集モード終了
				cancelEditingInitialBalance();

				// 更新を反映するためにページをリロード
				window.location.reload();
			} catch (error) {
				console.error("月初残高の更新に失敗しました:", error);
				alert("月初残高の更新に失敗しました");
			}
		},
		[editingInitialBalance, cancelEditingInitialBalance],
	);

	// Enterキーで保存、Escキーでキャンセル
	const handleKeyDown = useCallback(
		(
			e: React.KeyboardEvent,
			transaction: { id: string; type: string },
			year: number,
			month: number,
		) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void saveAmount(transaction, year, month);
			} else if (e.key === "Escape") {
				e.preventDefault();
				cancelEditing();
			}
		},
		[saveAmount, cancelEditing],
	);

	// 月初残高のキーボードイベント処理
	const handleInitialBalanceKeyDown = useCallback(
		(
			e: React.KeyboardEvent,
			accountId: string,
			year: number,
			month: number,
		) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void saveInitialBalance(accountId, year, month);
			} else if (e.key === "Escape") {
				e.preventDefault();
				cancelEditingInitialBalance();
			}
		},
		[saveInitialBalance, cancelEditingInitialBalance],
	);

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
									// 優先順位: 1. 月初残高テーブルの値, 2. 前月計算値
									let initialBalanceValue: number | undefined;

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
												{editingAccountId === account.id ? (
													<div className="flex justify-end items-center">
														<span className="mr-3">¥</span>
														<Input
															size="sm"
															type="number"
															value={editingInitialBalance}
															className="w-24 font-medium"
															onChange={(e) =>
																setEditingInitialBalance(e.target.value)
															}
															onKeyDown={(e) =>
																handleInitialBalanceKeyDown(
																	e,
																	account.id,
																	selectedYear,
																	selectedMonth,
																)
															}
															autoFocus
														/>
														<div className="flex ml-2">
															<Button
																size="sm"
																variant="light"
																className="mr-1"
																onPress={() => {
																	saveInitialBalance(
																		account.id,
																		selectedYear,
																		selectedMonth,
																	).catch((error) => {
																		console.error("保存に失敗しました:", error);
																	});
																}}
															>
																保存
															</Button>
															<Button
																size="sm"
																variant="light"
																onPress={() => cancelEditingInitialBalance()}
															>
																キャンセル
															</Button>
														</div>
													</div>
												) : (
													<div
														className={`font-medium ${initialBalanceValue !== undefined && initialBalanceValue < 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
													>
														{initialBalanceValue === undefined
															? "？？？"
															: `¥${initialBalanceValue.toLocaleString()}`}
													</div>
												)}
											</td>
											<td className="py-2 border-t border-gray-200 dark:border-gray-700 pl-2 w-10">
												{!(
													selectedYear > currentDate.getFullYear() ||
													(selectedYear === currentDate.getFullYear() &&
														selectedMonth > currentDate.getMonth() + 1)
												) && (
													<Button
														isIconOnly
														size="sm"
														variant="light"
														radius="sm"
														aria-label="月初残高操作"
														onPress={() =>
															startEditingInitialBalance(
																account.id,
																initialBalanceValue,
															)
														}
													>
														<IconPencil size={16} />
													</Button>
												)}
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
													{editingTransactionId === transaction.id ? (
														<div className="flex justify-end items-center">
															<span
																className={`mr-3 ${transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
															>
																{transaction.type === "income" ? "" : "-"}¥
															</span>
															<Input
																size="sm"
																type="number"
																value={editingAmount}
																min={0}
																className="w-24 font-medium"
																onChange={(e) =>
																	setEditingAmount(e.target.value)
																}
																onKeyDown={(e) =>
																	handleKeyDown(
																		e,
																		transaction,
																		selectedYear,
																		selectedMonth,
																	)
																}
																autoFocus
																onBlur={() => cancelEditing()}
															/>
															<div className="flex ml-2">
																<Button
																	size="sm"
																	variant="light"
																	className="mr-1"
																	onPress={() =>
																		void saveAmount(
																			transaction,
																			selectedYear,
																			selectedMonth,
																		)
																	}
																>
																	保存
																</Button>
																<Button
																	size="sm"
																	variant="light"
																	onPress={() => cancelEditing()}
																>
																	キャンセル
																</Button>
															</div>
														</div>
													) : (
														<>
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
														</>
													)}
												</td>
												<td className="py-2 border-t border-gray-200 dark:border-gray-700 pl-2 w-10">
													<Button
														isIconOnly
														size="sm"
														variant="light"
														radius="sm"
														aria-label="トランザクション操作"
														onPress={() => startEditing(transaction)}
													>
														<IconPencil size={16} />
													</Button>
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
