"use server";

import type { TransactionType } from "@/types/database";
import {
	createOneTimeTransaction,
	createOneTimeTransfer,
} from "@/utils/supabase/one-time-transactions";

type ActionState = { error?: string; success?: string };

// 臨時収支のアクション
export async function createOneTimeTransactionAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const accountId = formData.get("accountId") as string;
	const destinationAccountId = formData.get("destinationAccountId") as string;
	const isTransfer = formData.get("isTransfer") === "true";
	const name = formData.get("name") as string;
	const amount = Number.parseFloat(formData.get("amount") as string);
	const type = formData.get("type") as TransactionType;
	const transactionDate = new Date(formData.get("transactionDate") as string);
	const description = formData.get("description") as string;

	if (!accountId) {
		return { error: "口座を選択してください" };
	}

	if (!name) {
		return { error: "名前は必須です" };
	}

	if (Number.isNaN(amount) || amount <= 0) {
		return { error: "金額は正の数値で入力してください" };
	}

	if (!isTransfer && type !== "income" && type !== "expense") {
		return { error: "種別は収入または支出を選択してください" };
	}

	if (Number.isNaN(transactionDate.getTime())) {
		return { error: "有効な日付を入力してください" };
	}

	// 送金の場合の追加バリデーション
	if (isTransfer) {
		if (!destinationAccountId) {
			return { error: "送金先口座を選択してください" };
		}
		if (accountId === destinationAccountId) {
			return { error: "送金元と送金先は異なる口座である必要があります" };
		}
	}

	try {
		if (isTransfer) {
			await createOneTimeTransfer(
				accountId,
				destinationAccountId,
				name,
				amount,
				transactionDate,
				description,
			);
			return { success: "口座間送金が正常に作成されました" };
		}
		await createOneTimeTransaction(
			accountId,
			name,
			amount,
			type,
			transactionDate,
			description,
		);
		return { success: "臨時収支が正常に作成されました" };
	} catch (error) {
		console.error("Error creating one-time transaction:", error);
		return { error: "取引の作成に失敗しました" };
	}
}
