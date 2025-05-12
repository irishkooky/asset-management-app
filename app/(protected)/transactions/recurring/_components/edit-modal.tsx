"use client";

import { useState } from "react";
import { updateRecurringTransaction } from "../actions";
import type { RecurringTransaction } from "../types";
import { MonthlyAmountEditor } from "./monthly-amount-editor";

type EditModalProps = {
	isOpen: boolean;
	onClose: () => void;
	recurringTransaction: RecurringTransaction | null;
	onUpdate: () => void;
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

	if (!recurringTransaction) return <></>;

	if (!isOpen) return <></>;

	if (showMonthlyEditor) {
		return (
			<div className="relative z-50">
				<div className="fixed inset-0 bg-black/70" aria-hidden="true" />
				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4">
						<div
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
						>
							<MonthlyAmountEditor
								recurringTransaction={recurringTransaction}
								onClose={() => setShowMonthlyEditor(false)}
								onUpdate={() => {
									onUpdate();
									setShowMonthlyEditor(false);
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative z-50">
			{/* オーバーレイ背景 */}
			<div className="fixed inset-0 bg-black/70" />

			{/* 閉じるためのアクセシブルなボタン */}
			<button
				className="sr-only"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				aria-label="閉じる"
				type="button"
			>
				閉じる
			</button>
			<div className="fixed inset-0 overflow-y-auto">
				{/* モーダル全体のクリックイベントをキャプチャするための透明なオーバーレイ */}
				<button
					className="fixed inset-0 w-full h-full bg-transparent"
					onClick={onClose}
					onKeyDown={(e) => e.key === "Escape" && onClose()}
					aria-label="閉じる"
					type="button"
				/>
				<div className="flex min-h-full items-center justify-center p-4">
					<div
						className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative z-10"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<h2 className="text-xl font-bold mb-4">定期的な収支の編集</h2>

						<div className="space-y-4">
							<div className="mb-4">
								<label className="block text-sm font-medium mb-1">
									名前
									<input
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mt-1"
										placeholder="名前を入力"
									/>
								</label>
							</div>

							<div className="mb-4">
								<label className="block text-sm font-medium mb-1">
									説明
									<textarea
										value={description || ""}
										onChange={(e) => setDescription(e.target.value)}
										className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mt-1"
										rows={3}
										placeholder="説明を入力（任意）"
									/>
								</label>
							</div>

							<div className="mb-4">
								<label className="block text-sm font-medium mb-1">
									デフォルト金額
									<input
										type="number"
										value={amount}
										onChange={(e) => setAmount(Number(e.target.value))}
										className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mt-1"
										min="0"
										step="100"
										placeholder="金額を入力"
									/>
								</label>
							</div>

							<div className="mb-4">
								<label className="block text-sm font-medium mb-1">
									種別
									<select
										value={type}
										onChange={(e) =>
											setType(e.target.value as "income" | "expense")
										}
										className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mt-1"
									>
										<option value="income">収入</option>
										<option value="expense">支出</option>
									</select>
								</label>
							</div>

							<div className="mb-4">
								<label className="block text-sm font-medium mb-1">
									毎月の日付
									<input
										type="number"
										min="1"
										max="31"
										value={dayOfMonth}
										onChange={(e) => setDayOfMonth(Number(e.target.value))}
										className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mt-1"
										placeholder="日付を入力"
									/>
								</label>
							</div>

							<div className="mt-6">
								<button
									type="button"
									onClick={() => setShowMonthlyEditor(true)}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-medium transition duration-200 ease-in-out"
								>
									月ごとの金額を設定
								</button>
							</div>
						</div>

						{error && (
							<div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400">
								{error}
							</div>
						)}

						<div className="mt-6 flex justify-end space-x-4">
							<button
								type="button"
								onClick={onClose}
								className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded transition duration-200 ease-in-out"
								disabled={loading}
							>
								キャンセル
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-medium transition duration-200 ease-in-out"
								disabled={loading}
							>
								{loading ? (
									<span className="flex items-center justify-center">
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<title>ローディングインジケーター</title>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										保存中...
									</span>
								) : (
									"保存"
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
