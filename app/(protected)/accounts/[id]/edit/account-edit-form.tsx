"use client";

import {
	deleteAccountAction,
	updateAccountAction,
} from "@/app/(protected)/accounts/actions";
import { Button } from "@/components/ui/button";
import type { Account } from "@/types/database";
import Link from "next/link";
import { useActionState } from "react";

interface AccountEditFormProps {
	account: Account;
}

export function AccountEditForm({ account }: AccountEditFormProps) {
	const initialState = { error: "", success: "" };
	const [updateState, updateFormAction] = useActionState(
		updateAccountAction,
		initialState,
	);
	const [deleteState, deleteFormAction] = useActionState(
		deleteAccountAction,
		initialState,
	);

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
