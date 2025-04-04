import type { TransactionType } from "@/types/database";
import {
	deleteOneTimeTransaction,
	updateOneTimeTransaction,
} from "@/utils/supabase/one-time-transactions";

type ActionState = { error?: string; success?: string };

export async function deleteOneTimeTransactionAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const transactionId = formData.get("transactionId") as string;

	if (!transactionId) {
		return { error: "トランザクションIDが見つかりません" };
	}

	try {
		await deleteOneTimeTransaction(transactionId);
		return { success: "臨時収支が正常に削除されました" };
	} catch (error) {
		console.error("Error deleting one-time transaction:", error);
		return { error: "臨時収支の削除に失敗しました" };
	}
}

export async function updateOneTimeTransactionAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const transactionId = formData.get("transactionId") as string;
	const name = formData.get("name") as string;
	const amount = Number.parseFloat(formData.get("amount") as string);
	const type = formData.get("type") as TransactionType;
	const transactionDate = new Date(formData.get("transactionDate") as string);
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

	if (Number.isNaN(transactionDate.getTime())) {
		return { error: "有効な日付を入力してください" };
	}

	try {
		await updateOneTimeTransaction(transactionId, {
			name,
			amount,
			type,
			transaction_date: transactionDate,
			description: description || null,
		});
		return { success: "臨時収支が正常に更新されました" };
	} catch (error) {
		console.error("Error updating one-time transaction:", error);
		return { error: "臨時収支の更新に失敗しました" };
	}
}
