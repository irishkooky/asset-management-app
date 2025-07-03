"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { Button } from "@/components/button";
import type { Account } from "@/types/database";
import { createRecurringTransactionAction } from "./actions";

interface RecurringTransactionFormProps {
	accounts?: Account[];
	defaultAccountId?: string;
}

export function RecurringTransactionForm({
	accounts = [],
	defaultAccountId,
}: RecurringTransactionFormProps) {
	const router = useRouter();
	const accountFormId = useId();
	const nameId = useId();
	const amountId = useId();
	const typeIncomeId = useId();
	const typeExpenseId = useId();
	const dayOfMonthId = useId();
	const descriptionId = useId();
	const isTransferCheckboxId = useId();
	const destinationAccountId = useId();
	const initialState = { error: "", success: "" };
	const [state, formAction] = useActionState(
		createRecurringTransactionAction,
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
			router.push("/transactions/recurring");
		}
	}, [state.success, router]);

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">新規定期的な収支の追加</h1>
				<Button variant="outline" asChild>
					<Link href="/transactions/recurring">戻る</Link>
				</Button>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				{state.error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{state.error}
					</div>
				)}

				{state.success && (
					<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
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
						<label htmlFor={nameId} className="text-sm font-medium">
							名前
						</label>
						<input
							id={nameId}
							name="name"
							type="text"
							required
							className="w-full p-2 border rounded-md"
							placeholder="例: 給料"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor={amountId} className="text-sm font-medium">
							金額
						</label>
						<input
							id={amountId}
							name="amount"
							type="number"
							step="1"
							required
							className="w-full p-2 border rounded-md"
							placeholder="0"
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
						<label htmlFor={dayOfMonthId} className="text-sm font-medium">
							日付（毎月）
						</label>
						<input
							id={dayOfMonthId}
							name="dayOfMonth"
							type="number"
							min="1"
							max="31"
							required
							className="w-full p-2 border rounded-md"
							placeholder="例: 25"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor={descriptionId} className="text-sm font-medium">
							説明（任意）
						</label>
						<textarea
							id={descriptionId}
							name="description"
							className="w-full p-2 border rounded-md"
							rows={3}
							placeholder="説明を入力してください"
						/>
					</div>

					<Button type="submit" className="w-full">
						{isTransfer ? "送金を作成" : "登録する"}
					</Button>
				</form>
			</div>
		</div>
	);
}
