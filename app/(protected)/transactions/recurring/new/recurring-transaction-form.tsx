"use client";

import { createRecurringTransactionAction } from "@/app/(protected)/transactions/actions";
import { Button } from "@/app/_components/button";
import type { Account } from "@/types/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useEffect, useState } from "react";

interface RecurringTransactionFormProps {
	accounts?: Account[];
	defaultAccountId?: string;
}

export function RecurringTransactionForm({
	accounts = [],
	defaultAccountId,
}: RecurringTransactionFormProps) {
	const router = useRouter();
	const initialState = { error: "", success: "" };
	const [state, formAction] = useActionState(
		createRecurringTransactionAction,
		initialState,
	);

	// URLからaccountIdを取得
	const [accountId, setAccountId] = useState(defaultAccountId || "");

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
			// 少し遅延させてメッセージを表示する時間を確保
			const timer = setTimeout(() => {
				router.push("/transactions/recurring");
			}, 1000);
			return () => clearTimeout(timer);
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
						<label htmlFor="accountId" className="text-sm font-medium">
							口座
						</label>
						<select
							id="accountId"
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
						<label htmlFor="name" className="text-sm font-medium">
							名前
						</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							className="w-full p-2 border rounded-md"
							placeholder="例: 給料"
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
							className="w-full p-2 border rounded-md"
							placeholder="0"
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
									defaultChecked
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
									className="mr-2"
								/>
								<label htmlFor="type-expense">支出</label>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="dayOfMonth" className="text-sm font-medium">
							日付（毎月）
						</label>
						<input
							id="dayOfMonth"
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
						<label htmlFor="description" className="text-sm font-medium">
							説明（任意）
						</label>
						<textarea
							id="description"
							name="description"
							className="w-full p-2 border rounded-md"
							rows={3}
							placeholder="説明を入力してください"
						/>
					</div>

					<Button type="submit" className="w-full">
						登録する
					</Button>
				</form>
			</div>
		</div>
	);
}
