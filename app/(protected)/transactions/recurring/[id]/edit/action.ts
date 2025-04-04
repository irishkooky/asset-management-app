"use server";

import type { TransactionType } from "@/types/database";
import {
	deleteRecurringTransaction,
	updateRecurringTransaction,
} from "@/utils/supabase/recurring-transactions";

type ActionState = { error?: string; success?: string };

export async function updateRecurringTransactionAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const transactionId = formData.get("transactionId") as string;
	const name = formData.get("name") as string;
	const amount = Number.parseFloat(formData.get("amount") as string);
	const type = formData.get("type") as TransactionType;
	const dayOfMonth = Number.parseInt(formData.get("dayOfMonth") as string, 10);
	const description = formData.get("description") as string;

	if (!transactionId) {
		return { error: "トランザクションIDが見つかりません" };
	}

	if (!name) {
		return { error: "名前は必須です" };
	}

	if (Number.isNaN(amount) || amount <= 0) {
		return { error: "金額は正の数値で入力してください" };
	}

	if (type !== "income" && type !== "expense") {
		return { error: "種別は収入または支出を選択してください" };
	}

	if (Number.isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
		return { error: "日付は1から31の間で入力してください" };
	}

	try {
		await updateRecurringTransaction(transactionId, {
			name,
			amount,
			type,
			day_of_month: dayOfMonth,
			description: description || null,
		});
		return { success: "定期的な収支が正常に更新されました" };
	} catch (error) {
		console.error("Error updating recurring transaction:", error);
		return { error: "定期的な収支の更新に失敗しました" };
	}
}

export async function deleteRecurringTransactionAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const transactionId = formData.get("transactionId") as string;

	if (!transactionId) {
		return { error: "トランザクションIDが見つかりません" };
	}

	try {
		await deleteRecurringTransaction(transactionId);
		return { success: "定期的な収支が正常に削除されました" };
	} catch (error) {
		console.error("Error deleting recurring transaction:", error);
		return { error: "定期的な収支の削除に失敗しました" };
	}
}
