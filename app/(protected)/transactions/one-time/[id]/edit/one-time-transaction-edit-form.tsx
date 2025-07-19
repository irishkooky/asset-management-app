"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId } from "react";
import type { Account, OneTimeTransaction } from "@/types/database";
import {
	deleteOneTimeTransactionAction,
	updateOneTimeTransactionAction,
} from "./action";

interface OneTimeTransactionEditFormProps {
	transaction: OneTimeTransaction;
	accounts: Account[];
}

export function OneTimeTransactionEditForm({
	transaction,
	accounts,
}: OneTimeTransactionEditFormProps) {
	const router = useRouter();
	const accountId = useId();
	const nameId = useId();
	const amountId = useId();
	const typeIncomeId = useId();
	const typeExpenseId = useId();
	const transactionDateId = useId();
	const descriptionId = useId();
	const initialState = { error: "", success: "" };
	const [updateState, updateFormAction] = useActionState(
		updateOneTimeTransactionAction,
		initialState,
	);
	const [deleteState, deleteFormAction] = useActionState(
		deleteOneTimeTransactionAction,
		initialState,
	);

	// 成功時にリダイレクト
	useEffect(() => {
		if (updateState.success || deleteState.success) {
			// メッセージを少し表示してからリダイレクト
			router.push("/transactions/one-time");
		}
	}, [updateState.success, deleteState.success, router]);

	// 日付をYYYY-MM-DD形式に変換
	const formattedDate = transaction.transaction_date.split("T")[0];

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">臨時収支の編集</h1>
				<Button variant="bordered" as={Link} href="/transactions/one-time">
					戻る
				</Button>
			</div>

			<Card>
				<CardBody className="p-6">
					{updateState.error && (
						<div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4">
							{updateState.error}
						</div>
					)}

					{updateState.success && (
						<div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded mb-4">
							{updateState.success}
						</div>
					)}

					<form action={updateFormAction} className="space-y-6">
						<input type="hidden" name="transactionId" value={transaction.id} />

						<div className="space-y-2">
							<label htmlFor={accountId} className="text-sm font-medium">
								口座
							</label>
							<select
								id={accountId}
								name="accountId"
								required
								defaultValue={transaction.account_id}
								className="w-full p-2 border rounded-md"
								disabled // 口座の変更は許可しない
							>
								{accounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Input
								id={nameId}
								name="name"
								type="text"
								label="名前"
								isRequired
								defaultValue={transaction.name}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Input
								id={amountId}
								name="amount"
								type="number"
								step="1"
								label="金額"
								isRequired
								defaultValue={transaction.amount.toString()}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">種別</p>
							<div className="flex space-x-4">
								<div className="flex items-center">
									<input
										id={typeIncomeId}
										type="radio"
										name="type"
										value="income"
										defaultChecked={transaction.type === "income"}
										className="mr-2"
									/>
									<label htmlFor={typeIncomeId}>収入</label>
								</div>
								<div className="flex items-center">
									<input
										id={typeExpenseId}
										type="radio"
										name="type"
										value="expense"
										defaultChecked={transaction.type === "expense"}
										className="mr-2"
									/>
									<label htmlFor={typeExpenseId}>支出</label>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Input
								id={transactionDateId}
								name="transactionDate"
								type="date"
								label="日付"
								isRequired
								defaultValue={formattedDate}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Textarea
								id={descriptionId}
								name="description"
								label="説明（任意）"
								rows={3}
								defaultValue={transaction.description || ""}
								className="w-full"
							/>
						</div>

						<Button type="submit" color="primary" className="w-full">
							更新する
						</Button>
					</form>
				</CardBody>
			</Card>

			<Card>
				<CardBody className="p-6">
					<h2 className="text-lg font-medium mb-4">臨時収支の削除</h2>

					{deleteState.error && (
						<div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4">
							{deleteState.error}
						</div>
					)}

					{deleteState.success && (
						<div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded mb-4">
							{deleteState.success}
						</div>
					)}

					<p className="text-gray-600 dark:text-gray-400 mb-4">
						この臨時収支を削除します。この操作は元に戻せません。
					</p>

					<form action={deleteFormAction}>
						<input type="hidden" name="transactionId" value={transaction.id} />
						<Button type="submit" color="danger" className="w-full">
							削除する
						</Button>
					</form>
				</CardBody>
			</Card>
		</div>
	);
}
