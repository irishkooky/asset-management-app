"use client";

import { Button } from "../../../../../../shared-components/button";
import type { Account, OneTimeTransaction } from "@/types/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useEffect } from "react";
import {
	deleteOneTimeTransactionAction,
	updateOneTimeTransactionAction,
} from "../../../actions";

interface OneTimeTransactionEditFormProps {
	transaction: OneTimeTransaction;
	accounts: Account[];
}

export function OneTimeTransactionEditForm({
	transaction,
	accounts,
}: OneTimeTransactionEditFormProps) {
	const router = useRouter();
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
			// 少し遅延させてメッセージを表示する時間を確保
			const timer = setTimeout(() => {
				router.push("/transactions/one-time");
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [updateState.success, deleteState.success, router]);

	// 日付をYYYY-MM-DD形式に変換
	const formattedDate = transaction.transaction_date.split("T")[0];

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">臨時収支の編集</h1>
				<Button variant="outline" asChild>
					<Link href="/transactions/one-time">戻る</Link>
				</Button>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				{updateState.error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{updateState.error}
					</div>
				)}

				{updateState.success && (
					<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
						{updateState.success}
					</div>
				)}

				<form action={updateFormAction} className="space-y-6">
					<input type="hidden" name="transactionId" value={transaction.id} />

					<div className="space-y-2">
						<label htmlFor="accountId" className="text-sm font-medium">
							口座
						</label>
						<select
							id="accountId"
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
						<label htmlFor="name" className="text-sm font-medium">
							名前
						</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							defaultValue={transaction.name}
							className="w-full p-2 border rounded-md"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="amount" className="text-sm font-medium">
							金額
						</label>
						<input
							id="amount"
							name="amount"
							type="number"
							step="0.01"
							required
							defaultValue={transaction.amount}
							className="w-full p-2 border rounded-md"
						/>
					</div>

					<div className="space-y-2">
						<p className="text-sm font-medium">種別</p>
						<div className="flex space-x-4">
							<div className="flex items-center">
								<input
									id="type-income"
									type="radio"
									name="type"
									value="income"
									defaultChecked={transaction.type === "income"}
									className="mr-2"
								/>
								<label htmlFor="type-income">収入</label>
							</div>
							<div className="flex items-center">
								<input
									id="type-expense"
									type="radio"
									name="type"
									value="expense"
									defaultChecked={transaction.type === "expense"}
									className="mr-2"
								/>
								<label htmlFor="type-expense">支出</label>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="transactionDate" className="text-sm font-medium">
							日付
						</label>
						<input
							id="transactionDate"
							name="transactionDate"
							type="date"
							required
							defaultValue={formattedDate}
							className="w-full p-2 border rounded-md"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="description" className="text-sm font-medium">
							説明（任意）
						</label>
						<textarea
							id="description"
							name="description"
							className="w-full p-2 border rounded-md"
							rows={3}
							defaultValue={transaction.description || ""}
						/>
					</div>

					<Button type="submit" className="w-full">
						更新する
					</Button>
				</form>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-medium mb-4">臨時収支の削除</h2>

				{deleteState.error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{deleteState.error}
					</div>
				)}

				{deleteState.success && (
					<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
						{deleteState.success}
					</div>
				)}

				<p className="text-gray-600 dark:text-gray-400 mb-4">
					この臨時収支を削除します。この操作は元に戻せません。
				</p>

				<form action={deleteFormAction}>
					<input type="hidden" name="transactionId" value={transaction.id} />
					<Button type="submit" variant="destructive" className="w-full">
						削除する
					</Button>
				</form>
			</div>
		</div>
	);
}
