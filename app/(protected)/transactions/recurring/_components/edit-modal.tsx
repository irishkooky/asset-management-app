"use client";

import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/modal";
import { Radio, RadioGroup } from "@heroui/radio";
import { Select, SelectItem } from "@heroui/select";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
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
						<Input
							label="名前"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="名前を入力"
							isRequired
						/>

						<Textarea
							label="説明（任意）"
							value={description || ""}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="説明を入力"
							minRows={2}
						/>

						<Input
							label="デフォルト金額"
							type="number"
							value={amount.toString()}
							onChange={(e) => setAmount(Number(e.target.value))}
							placeholder="金額を入力"
							startContent={
								<div className="pointer-events-none flex items-center">
									<span className="text-default-400 text-small">¥</span>
								</div>
							}
						/>

						<Select
							label="口座"
							placeholder="口座を選択"
							selectedKeys={accountId ? [accountId] : []}
							onSelectionChange={(keys) => {
								const selected = Array.from(keys)[0];
								setAccountId(selected ? String(selected) : "");
							}}
						>
							{accounts.map((account) => (
								<SelectItem key={account.id}>{account.name}</SelectItem>
							))}
						</Select>

						<RadioGroup
							label="種別"
							value={type}
							onValueChange={(value) => setType(value as "income" | "expense")}
							orientation="horizontal"
						>
							<Radio value="income">収入</Radio>
							<Radio value="expense">支出</Radio>
						</RadioGroup>

						<Input
							label="毎月の日付"
							type="number"
							min="1"
							max="31"
							value={dayOfMonth.toString()}
							onChange={(e) => setDayOfMonth(Number(e.target.value))}
							placeholder="日付を入力"
						/>

						<Button
							color="secondary"
							variant="flat"
							onClick={() => setShowMonthlyEditor(true)}
							className="w-full"
						>
							月ごとの金額を設定
						</Button>
					</div>

					{error && (
						<div className="mt-4 p-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-800">
							<div className="flex items-center">
								<IconAlertCircle size={16} className="mr-2 flex-shrink-0" />
								<span className="text-sm">{error}</span>
							</div>
						</div>
					)}
				</ModalBody>

				<ModalFooter className="flex justify-between border-t pt-4">
					<Button
						color="danger"
						variant="flat"
						onClick={handleDelete}
						isDisabled={loading}
					>
						削除
					</Button>

					<div className="flex gap-2">
						<Button variant="bordered" onClick={onClose} isDisabled={loading}>
							キャンセル
						</Button>
						<Button
							color="primary"
							onClick={handleSubmit}
							isDisabled={loading}
							isLoading={loading}
						>
							保存
						</Button>
					</div>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default EditModal;
