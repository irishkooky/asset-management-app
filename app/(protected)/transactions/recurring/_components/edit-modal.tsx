"use client";

import { Input } from "@heroui/input";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/modal";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import {
	deleteRecurringTransaction,
	getUserAccountsServerAction,
	updateRecurringTransaction,
} from "../actions";
import type { RecurringTransaction } from "../types";
import { MonthlyAmountEditor } from "./monthly-amount-editor";

type EditModalProps = {
	isOpen: boolean;
	onClose: () => void;
	recurringTransaction: RecurringTransaction | null;
	onUpdate: () => void;
};

type Account = {
	id: string;
	name: string;
	current_balance: number;
};

export const EditModal = ({
	isOpen,
	onClose,
	recurringTransaction,
	onUpdate,
}: EditModalProps) => {
	const [name, setName] = useState<string>(recurringTransaction?.name || "");
	const [description, setDescription] = useState<string>(
		recurringTransaction?.description || "",
	);
	const [amount, setAmount] = useState<number>(
		recurringTransaction?.default_amount || 0,
	);
	const [dayOfMonth, setDayOfMonth] = useState<number>(
		recurringTransaction?.day_of_month || 1,
	);
	const [accountId, setAccountId] = useState<string>(
		recurringTransaction?.account_id || "",
	);
	const [type, setType] = useState<"income" | "expense">(
		recurringTransaction?.type || "expense",
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [showMonthlyEditor, setShowMonthlyEditor] = useState<boolean>(false);
	const [accounts, setAccounts] = useState<Account[]>([]);

	// 口座一覧を取得
	useEffect(() => {
		const fetchAccounts = async (): Promise<void> => {
			try {
				const accountsData = await getUserAccountsServerAction();
				setAccounts(accountsData);
			} catch (err) {
				console.error("口座一覧の取得に失敗しました", err);
				setError("口座一覧の取得に失敗しました");
			}
		};

		if (isOpen) {
			fetchAccounts();
		}
	}, [isOpen]);

	const handleSubmit = async (): Promise<void> => {
		if (!recurringTransaction) return;

		try {
			setLoading(true);

			// サーバーアクションを使用して更新
			await updateRecurringTransaction(recurringTransaction.id, {
				name,
				description,
				default_amount: amount,
				day_of_month: dayOfMonth,
				account_id: accountId || null,
				type,
			});

			onUpdate();
			onClose();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "不明なエラー";
			setError(`エラーが発生しました: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	// 削除処理の追加
	const handleDelete = async (): Promise<void> => {
		if (!recurringTransaction) return;

		if (!window.confirm("本当に削除しますか？この操作は元に戻せません。"))
			return;

		try {
			setLoading(true);
			await deleteRecurringTransaction(recurringTransaction.id);
			onUpdate();
			onClose();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "不明なエラー";
			setError(`削除に失敗しました: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	if (!recurringTransaction) return <></>;

	if (!isOpen) return <></>;

	if (showMonthlyEditor) {
		return (
			<Modal
				isOpen
				onClose={() => setShowMonthlyEditor(false)}
				scrollBehavior="inside"
				placement="center"
				backdrop="blur"
			>
				<ModalContent>
					<MonthlyAmountEditor
						recurringTransaction={recurringTransaction}
						onClose={() => setShowMonthlyEditor(false)}
						onUpdate={() => {
							onUpdate();
							setShowMonthlyEditor(false);
						}}
					/>
				</ModalContent>
			</Modal>
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			scrollBehavior="inside"
			placement="center"
			backdrop="blur"
		>
			<ModalContent className="max-w-md">
				<ModalHeader className="border-b pb-4">
					<h2 className="text-xl font-bold">定期的な収支の編集</h2>
				</ModalHeader>
				<ModalBody className="py-6">
					<div className="space-y-5">
						<div>
							<div className="mb-2 text-sm font-medium">名前</div>
							<Input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="名前を入力"
								className="w-full"
							/>
						</div>

						<div>
							<div className="mb-2 text-sm font-medium">説明</div>
							<Input
								type="text"
								value={description || ""}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="説明を入力（任意）"
								className="w-full"
							/>
						</div>

						<div>
							<div className="mb-2 text-sm font-medium">デフォルト金額</div>
							<Input
								type="number"
								value={amount.toString()}
								onChange={(e) => setAmount(Number(e.target.value))}
								min="0"
								step="100"
								placeholder="金額を入力"
								className="w-full"
							/>
						</div>

						<div>
							<div className="mb-2 text-sm font-medium">口座</div>
							<select
								value={accountId}
								onChange={(e) => setAccountId(e.target.value)}
								className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent"
							>
								<option value="">口座を選択</option>
								{accounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<div className="mb-2 text-sm font-medium">種別</div>
							<select
								value={type}
								onChange={(e) =>
									setType(e.target.value as "income" | "expense")
								}
								className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent"
							>
								<option value="income">収入</option>
								<option value="expense">支出</option>
							</select>
						</div>

						<div>
							<div className="mb-2 text-sm font-medium">毎月の日付</div>
							<Input
								type="number"
								min="1"
								max="31"
								value={dayOfMonth.toString()}
								onChange={(e) => setDayOfMonth(Number(e.target.value))}
								placeholder="日付を入力"
								className="w-full"
							/>
						</div>

						<Button
							variant="default"
							onClick={() => setShowMonthlyEditor(true)}
							className="w-full py-2 mt-2"
						>
							月ごとの金額を設定
						</Button>
					</div>

					{error && (
						<div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 flex items-center">
							<IconAlertCircle size={16} className="mr-2 flex-shrink-0" />
							<span>{error}</span>
						</div>
					)}
				</ModalBody>

				<ModalFooter className="flex justify-between border-t pt-4">
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
					>
						削除
					</Button>

					<div className="flex space-x-2">
						<Button variant="outline" onClick={onClose} disabled={loading}>
							キャンセル
						</Button>
						<Button variant="default" onClick={handleSubmit} disabled={loading}>
							{loading ? (
								<span className="flex items-center justify-center">
									<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
									処理中...
								</span>
							) : (
								"保存"
							)}
						</Button>
					</div>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default EditModal;
