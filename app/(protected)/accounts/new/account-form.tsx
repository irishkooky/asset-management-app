"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId } from "react";
import { Button } from "@/components/button";
import { createAccountAction } from "../actions";

export function AccountForm() {
	const router = useRouter();
	const nameId = useId();
	const initialBalanceId = useId();
	const initialState = { error: "", success: "" };
	const [state, formAction] = useActionState(createAccountAction, initialState);

	// 成功時にリダイレクト
	useEffect(() => {
		if (state.success) {
			// メッセージを少し表示してからリダイレクト
			router.push("/accounts");
		}
	}, [state.success, router]);

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">新規口座の追加</h1>
				<Button variant="outline" asChild>
					<Link href="/accounts">戻る</Link>
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
						<label htmlFor={nameId} className="text-sm font-medium">
							口座名
						</label>
						<input
							id={nameId}
							name="name"
							type="text"
							required
							className="w-full p-2 border rounded-md"
							placeholder="例: 普通預金"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor={initialBalanceId} className="text-sm font-medium">
							初期残高
						</label>
						<input
							id={initialBalanceId}
							name="initialBalance"
							type="number"
							step="1"
							className="w-full p-2 border rounded-md"
							placeholder="0"
						/>
					</div>

					<Button type="submit" className="w-full">
						口座を作成
					</Button>
				</form>
			</div>
		</div>
	);
}
