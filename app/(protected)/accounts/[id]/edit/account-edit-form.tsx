"use client";

import { Button } from "../../../../../components/button";
import type { Account } from "@/types/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useEffect } from "react";
import { deleteAccountAction, updateAccountAction } from "../../actions";
interface AccountEditFormProps {
	account: Account;
}

export function AccountEditForm({ account }: AccountEditFormProps) {
	const router = useRouter();
	const initialState = { error: "", success: "" };
	const [updateState, updateFormAction] = useActionState(
		updateAccountAction,
		initialState,
	);
	const [deleteState, deleteFormAction] = useActionState(
		deleteAccountAction,
		initialState,
	);

	// 成功時にリダイレクト
	useEffect(() => {
		if (updateState.success || deleteState.success) {
			// 少し遅延させてメッセージを表示する時間を確保
			const timer = setTimeout(() => {
				router.push("/accounts");
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [updateState.success, deleteState.success, router]);

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">口座の編集</h1>
				<Button variant="outline" asChild>
					<Link href={`/accounts/${account.id}`}>戻る</Link>
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
					<input type="hidden" name="accountId" value={account.id} />

					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-medium">
							口座名
						</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							defaultValue={account.name}
							className="w-full p-2 border rounded-md"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="currentBalance" className="text-sm font-medium">
							現在の残高
						</label>
						<input
							id="currentBalance"
							name="currentBalance"
							type="number"
							step="0.01"
							defaultValue={account.current_balance}
							className="w-full p-2 border rounded-md"
						/>
					</div>

					<Button type="submit" className="w-full">
						更新する
					</Button>
				</form>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-medium mb-4">口座の削除</h2>

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
					この口座を削除すると、関連するすべての収支データも削除されます。この操作は元に戻せません。
				</p>

				<form action={deleteFormAction}>
					<input type="hidden" name="accountId" value={account.id} />
					<Button type="submit" variant="destructive" className="w-full">
						口座を削除する
					</Button>
				</form>
			</div>
		</div>
	);
}
