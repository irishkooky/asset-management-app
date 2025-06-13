"use client";

import type { AccountSummary } from "@/types/summary";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/modal";
import { IconPencil, IconPlus } from "@tabler/icons-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { setAmountForMonth } from "../../transactions/recurring/actions";
import {
	updateInitialBalance,
	updateOneTimeTransactionAmount,
} from "../actions";

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

// トランザクション編集モーダルコンポーネント
const TransactionEditModal = ({
	isOpen,
	onClose,
	transaction,
	editingAmount,
	setEditingAmount,
	onSave,
}: {
	isOpen: boolean;
	onClose: () => void;
	transaction: {
		id: string;
		amount: number;
		type: string;
		name: string;
		transaction_date?: string;
		description?: string;
		source: "recurring" | "one-time";
	} | null;
	editingAmount: string;
	setEditingAmount: (value: string) => void;
	onSave: () => void;
}) => {
	// 日付をフォーマット
	const formattedDate = transaction?.transaction_date
		? format(new Date(transaction.transaction_date), "yyyy年M月d日", {
				locale: ja,
			})
		: "";

	return (
		<Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
			<ModalContent className="dark:bg-gray-900">
				<ModalHeader className="border-b border-gray-200 dark:border-gray-700">
					金額を編集
				</ModalHeader>
				<ModalBody>
					{transaction && (
						<div className="space-y-4">
							{/* トランザクション情報 */}
							<div className="space-y-2">
								<div className="flex items-center">
									<span className="text-sm text-gray-500 dark:text-gray-400 w-20">
										日付:
									</span>
									<span className="font-medium">{formattedDate}</span>
								</div>
								<div className="flex items-center">
									<span className="text-sm text-gray-500 dark:text-gray-400 w-20">
										名称:
									</span>
									<span className="font-medium">{transaction.name}</span>
								</div>
								{transaction.description && (
									<div className="flex items-center">
										<span className="text-sm text-gray-500 dark:text-gray-400 w-20">
											詳細:
										</span>
										<span className="text-sm text-gray-600 dark:text-gray-300">
											{transaction.description}
										</span>
									</div>
								)}
							</div>

							{/* 金額入力 */}
							<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
								<div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
									金額:
								</div>
								<div className="relative">
									{transaction.type !== "income" && (
										<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
											<span className="text-red-600 dark:text-red-400 font-medium">
												-
											</span>
										</div>
									)}
									<Input
										size="lg"
										type="number"
										value={editingAmount}
										min={0}
										className={`w-full font-medium text-right text-lg ${transaction.type === "income" ? "pl-10" : "pl-12"}`}
										onChange={(e) => setEditingAmount(e.target.value)}
										autoFocus
									/>
								</div>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button variant="light" onPress={onClose}>
						キャンセル
					</Button>
					<Button color="primary" onPress={onSave}>
						保存
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

// 月初残高編集モーダルコンポーネント
const InitialBalanceEditModal = ({
	isOpen,
	onClose,
	editingInitialBalance,
	setEditingInitialBalance,
	onSave,
}: {
	isOpen: boolean;
	onClose: () => void;
	editingInitialBalance: string;
	setEditingInitialBalance: (value: string) => void;
	onSave: () => void;
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
			<ModalContent className="dark:bg-gray-900">
				<ModalHeader className="border-b border-gray-200 dark:border-gray-700">
					月初残高を編集
				</ModalHeader>
				<ModalBody>
					<div className="space-y-4">
						<div className="text-sm text-gray-500 dark:text-gray-400">
							月初残高は、月の最初の日に口座に記録されている残高です。
						</div>
						<div className="pt-2">
							<div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
								残高:
							</div>
							<div className="relative">
								<Input
									size="lg"
									type="number"
									value={editingInitialBalance}
									className="w-full font-medium text-right text-lg pl-10"
									onChange={(e) => setEditingInitialBalance(e.target.value)}
									autoFocus
								/>
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant="light" onPress={onClose}>
						キャンセル
					</Button>
					<Button color="primary" onPress={onSave}>
						保存
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

// 収支追加モーダルコンポーネント
const AddTransactionModal = ({
	isOpen,
	onClose,
	accountId,
}: {
	isOpen: boolean;
	onClose: () => void;
	accountId: string;
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
			<ModalContent className="dark:bg-gray-900">
				<ModalHeader className="border-b border-gray-200 dark:border-gray-700">
					収支を追加
				</ModalHeader>
				<ModalBody>
					<div className="space-y-4 py-2">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							追加する収支のタイプを選択してください
						</p>
						<div className="grid grid-cols-1 gap-3">
							<Button
								as={Link}
								href={`/transactions/recurring/new?accountId=${accountId}`}
								className="h-16 justify-start px-4"
								variant="bordered"
								color="primary"
								onPress={onClose}
							>
								<div className="flex flex-col items-start">
									<span className="text-md font-medium">定期的な収支</span>
									<span className="text-xs text-gray-500 dark:text-gray-400">
										毎月自動的に発生する収支
									</span>
								</div>
							</Button>
							<Button
								as={Link}
								href={`/transactions/one-time/new?accountId=${accountId}`}
								className="h-16 justify-start px-4"
								variant="bordered"
								color="primary"
								onPress={onClose}
							>
								<div className="flex flex-col items-start">
									<span className="text-md font-medium">臨時収支</span>
									<span className="text-xs text-gray-500 dark:text-gray-400">
										一度限りの収支
									</span>
								</div>
							</Button>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant="light" onPress={onClose}>
						キャンセル
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export const AccountAccordion = ({
	accounts,
	previousMonthBalances,
	currentDate,
	selectedYear,
	selectedMonth,
	monthlyBalanceMap,
}: AccountAccordionProps) => {
	const router = useRouter();
	const [editingAmount, setEditingAmount] = useState<string>("");
	const [editingInitialBalance, setEditingInitialBalance] =
		useState<string>("");

	// モーダル状態の管理
	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
	const [isInitialBalanceModalOpen, setIsInitialBalanceModalOpen] =
		useState(false);
	const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
		useState(false);
	const [selectedAccountId, setSelectedAccountId] = useState<string>("");

	// 編集中のトランザクションと口座情報
	const [modalTransaction, setModalTransaction] = useState<{
		id: string;
		amount: number;
		type: string;
		name: string;
		transaction_date?: string;
		description?: string;
		source: "recurring" | "one-time";
	} | null>(null);
	const [modalAccount, setModalAccount] = useState<{
		id: string;
		initialBalance?: number;
	} | null>(null);

	// トランザクション編集モーダルを開く
	const openTransactionModal = useCallback(
		(transaction: {
			id: string;
			amount: number;
			type: string;
			name: string;
			source: "recurring" | "one-time";
		}) => {
			setModalTransaction(transaction);
			setEditingAmount(String(Math.abs(transaction.amount)));
			setIsTransactionModalOpen(true);
		},
		[],
	);

	// 月初残高編集モーダルを開く
	const openInitialBalanceModal = useCallback(
		(accountId: string, initialBalance: number | undefined) => {
			setModalAccount({ id: accountId, initialBalance });
			setEditingInitialBalance(
				initialBalance !== undefined ? String(initialBalance) : "",
			);
			setIsInitialBalanceModalOpen(true);
		},
		[],
	);

	// 収支追加モーダルを開く
	const openAddTransactionModal = useCallback((accountId: string) => {
		setSelectedAccountId(accountId);
		setIsAddTransactionModalOpen(true);
	}, []);

	// トランザクション編集モーダルを閉じる
	const closeTransactionModal = useCallback(() => {
		setIsTransactionModalOpen(false);
		setModalTransaction(null);
		setEditingAmount("");
	}, []);

	// 月初残高編集モーダルを閉じる
	const closeInitialBalanceModal = useCallback(() => {
		setIsInitialBalanceModalOpen(false);
		setModalAccount(null);
		setEditingInitialBalance("");
	}, []);

	// 収支追加モーダルを閉じる
	const closeAddTransactionModal = useCallback(() => {
		setIsAddTransactionModalOpen(false);
	}, []);

	// 月初残高編集モードを開始
	const startEditingInitialBalance = useCallback(
		(accountId: string, initialBalance: number | undefined) => {
			openInitialBalanceModal(accountId, initialBalance);
		},
		[openInitialBalanceModal],
	);

	// 金額を保存
	const saveAmount = useCallback(
		async (
			transaction: {
				id: string;
				type: string;
				source: "recurring" | "one-time";
			},
			year: number,
			month: number,
		) => {
			if (!editingAmount) return closeTransactionModal();

			const amount = Number.parseInt(editingAmount, 10);
			if (Number.isNaN(amount) || amount < 0) {
				alert("有効な金額を入力してください");
				return;
			}

			try {
				// トランザクションのソースに応じて適切なアクションを呼び出す
				if (transaction.source === "recurring") {
					await updateTransactionAmount(transaction.id, year, month, amount);
				} else {
					await updateOneTimeTransactionAmount(transaction.id, amount);
				}

				// モーダルを閉じる
				closeTransactionModal();

				// 更新を反映するためにページを再描画
				router.refresh();
			} catch (error) {
				console.error("金額の更新に失敗しました:", error);
				alert("金額の更新に失敗しました");
			}
		},
		[editingAmount, closeTransactionModal, router],
	);

	// 月初残高を保存
	const saveInitialBalance = useCallback(
		async (accountId: string, year: number, month: number) => {
			if (!editingInitialBalance) return closeInitialBalanceModal();

			const amount = Number.parseInt(editingInitialBalance, 10);
			if (Number.isNaN(amount)) {
				alert("有効な金額を入力してください");
				return;
			}

			try {
				// サーバーアクションを呼び出して月初残高を保存
				await updateInitialBalance(accountId, year, month, amount);

				// モーダルを閉じる
				closeInitialBalanceModal();

				// 更新を反映するためにページを再描画
				router.refresh();
			} catch (error) {
				console.error("月初残高の更新に失敗しました:", error);
				alert("月初残高の更新に失敗しました");
			}
		},
		[editingInitialBalance, closeInitialBalanceModal, router],
	);

	// モーダルの保存処理を行うハンドラ関数
	const handleSaveTransaction = useCallback(() => {
		if (modalTransaction) {
			void saveAmount(modalTransaction, selectedYear, selectedMonth);
		}
	}, [modalTransaction, saveAmount, selectedYear, selectedMonth]);

	const handleSaveInitialBalance = useCallback(() => {
		if (modalAccount) {
			void saveInitialBalance(modalAccount.id, selectedYear, selectedMonth);
		}
	}, [modalAccount, saveInitialBalance, selectedYear, selectedMonth]);

	return (
		<>
			<Accordion
				variant="splitted"
				selectionMode="multiple"
				className="px-0 [&>*]:px-2"
			>
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
												{totalBalance.toLocaleString()}
											</div>
										);
									})()}
								</div>
							</div>
						}
					>
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
												<div
													className={`font-medium ${initialBalanceValue !== undefined && initialBalanceValue < 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
												>
													{initialBalanceValue === undefined ? (
														<Button
															size="sm"
															variant="light"
															color="primary"
															startContent={<IconPlus size={14} />}
															onPress={() =>
																startEditingInitialBalance(
																	account.id,
																	initialBalanceValue,
																)
															}
															className="px-2 py-1 h-7"
														>
															残高を入力
														</Button>
													) : (
														`${initialBalanceValue.toLocaleString()}`
													)}
												</div>
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
															openInitialBalanceModal(
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
													<>
														<span
															className={`font-medium ${transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
														>
															{transaction.type === "income" ? "" : "-"}
															{Math.abs(transaction.amount).toLocaleString()}
														</span>
														<div
															className={`text-xs mt-1 ${balance < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"} ${index === array.length - 1 ? "font-bold" : ""}`}
														>
															残高: ¥{balance.toLocaleString()}
														</div>
													</>
												</td>
												<td className="py-2 border-t border-gray-200 dark:border-gray-700 pl-2 w-10">
													<Button
														isIconOnly
														size="sm"
														variant="light"
														radius="sm"
														aria-label="トランザクション操作"
														onPress={() => openTransactionModal(transaction)}
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

						{/* 収支追加ボタン */}
						<div className="border-t border-gray-200 dark:border-gray-700 pt-2">
							<Button
								variant="light"
								startContent={<IconPlus size={16} />}
								className="w-full justify-center"
								size="sm"
								onPress={() => openAddTransactionModal(account.id)}
							>
								この口座の収支を追加
							</Button>
						</div>
					</AccordionItem>
				))}
			</Accordion>

			{/* トランザクション編集モーダル */}
			<TransactionEditModal
				isOpen={isTransactionModalOpen}
				onClose={closeTransactionModal}
				transaction={modalTransaction}
				editingAmount={editingAmount}
				setEditingAmount={setEditingAmount}
				onSave={handleSaveTransaction}
			/>

			{/* 月初残高編集モーダル */}
			<InitialBalanceEditModal
				isOpen={isInitialBalanceModalOpen}
				onClose={closeInitialBalanceModal}
				editingInitialBalance={editingInitialBalance}
				setEditingInitialBalance={setEditingInitialBalance}
				onSave={handleSaveInitialBalance}
			/>

			{/* 収支追加モーダル */}
			<AddTransactionModal
				isOpen={isAddTransactionModalOpen}
				onClose={closeAddTransactionModal}
				accountId={selectedAccountId}
			/>
		</>
	);
};
