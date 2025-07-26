"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import type { Account } from "@/types/database";
import { createOneTimeTransactionAction } from "./action";

interface OneTimeTransactionFormProps {
	accounts?: Account[];
	defaultAccountId?: string;
}

export function OneTimeTransactionForm({
	accounts = [],
	defaultAccountId,
}: OneTimeTransactionFormProps) {
	const router = useRouter();
	const accountFormId = useId();
	const nameId = useId();
	const amountId = useId();
	const typeIncomeId = useId();
	const typeExpenseId = useId();
	const transactionDateId = useId();
	const descriptionId = useId();
	const isTransferCheckboxId = useId();
	const destinationAccountId = useId();
	const initialState = { error: "", success: "" };
	const [state, formAction] = useActionState(
		createOneTimeTransactionAction,
		initialState,
	);

	// URLからaccountIdを取得
	const [accountId, setAccountId] = useState(defaultAccountId || "");
	const [isTransfer, setIsTransfer] = useState(false);
	const [destinationAccount, setDestinationAccount] = useState("");

	useEffect(() => {
		// URLからクエリパラメータを取得
		const params = new URLSearchParams(window.location.search);
		const urlAccountId = params.get("accountId");
		if (urlAccountId) {
			setAccountId(urlAccountId);
		}
	}, []);

	// 成功時にリダイレクト
	useEffect(() => {
		if (state.success) {
			// メッセージを少し表示してからリダイレクト
			router.push("/transactions/one-time");
		}
	}, [state.success, router]);

	// 今日の日付をデフォルト値として設定
	const today = new Date().toISOString().split("T")[0];

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">新規臨時収支の追加</h1>
				<Button variant="bordered" as={Link} href="/transactions/one-time">
					戻る
				</Button>
			</div>

			<Card>
				<CardBody className="p-6">
					{state.error && (
						<div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4">
							{state.error}
						</div>
					)}

					{state.success && (
						<div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded mb-4">
							{state.success}
						</div>
					)}

					<form action={formAction} className="space-y-6">
						<div className="space-y-2">
							<label htmlFor={accountFormId} className="text-sm font-medium">
								{isTransfer ? "送金元口座" : "口座"}
							</label>
							<select
								id={accountFormId}
								name="accountId"
								required
								value={accountId}
								onChange={(e) => setAccountId(e.target.value)}
								className="w-full p-2 border rounded-md"
							>
								<option value="">口座を選択してください</option>
								{accounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center">
								<input
									id={isTransferCheckboxId}
									type="checkbox"
									name="isTransfer"
									value="true"
									checked={isTransfer}
									onChange={(e) => setIsTransfer(e.target.checked)}
									className="mr-2"
								/>
								<label
									htmlFor={isTransferCheckboxId}
									className="text-sm font-medium"
								>
									口座間送金
								</label>
							</div>
							{isTransfer && (
								<p className="text-sm text-gray-600">
									送金先口座に同じ金額が収入として自動記録されます
								</p>
							)}
						</div>

						{isTransfer && (
							<div className="space-y-2">
								<label
									htmlFor={destinationAccountId}
									className="text-sm font-medium"
								>
									送金先口座
								</label>
								<select
									id={destinationAccountId}
									name="destinationAccountId"
									required={isTransfer}
									value={destinationAccount}
									onChange={(e) => setDestinationAccount(e.target.value)}
									className="w-full p-2 border rounded-md"
								>
									<option value="">送金先口座を選択してください</option>
									{accounts
										.filter((account) => account.id !== accountId)
										.map((account) => (
											<option key={account.id} value={account.id}>
												{account.name}
											</option>
										))}
								</select>
							</div>
						)}

						<div className="space-y-2">
							<Input
								id={nameId}
								name="name"
								type="text"
								label="名前"
								isRequired
								placeholder="例: 旅行費用"
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
								placeholder="0"
								className="w-full"
							/>
						</div>

						{!isTransfer && (
							<div className="space-y-2">
								<p className="text-sm font-medium">種別</p>
								<div className="flex space-x-4">
									<div className="flex items-center">
										<input
											id={typeIncomeId}
											type="radio"
											name="type"
											value="income"
											defaultChecked
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
											className="mr-2"
										/>
										<label htmlFor={typeExpenseId}>支出</label>
									</div>
								</div>
							</div>
						)}

						{isTransfer && <input type="hidden" name="type" value="expense" />}

						<div className="space-y-2">
							<Input
								id={transactionDateId}
								name="transactionDate"
								type="date"
								label="日付"
								isRequired
								defaultValue={today}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Textarea
								id={descriptionId}
								name="description"
								label="説明（任意）"
								placeholder="説明を入力してください"
								rows={3}
								className="w-full"
							/>
						</div>

						<Button type="submit" color="primary" className="w-full">
							{isTransfer ? "送金を作成" : "登録する"}
						</Button>
					</form>
				</CardBody>
			</Card>
		</div>
	);
}
