"use server";

import type { TransactionType } from "@/types/database";
import {
	createRecurringTransaction,
	createRecurringTransfer,
} from "@/utils/supabase/recurring-transactions";

type ActionState = { error?: string; success?: string };

// 定期的な収支のアクション
export async function createRecurringTransactionAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const accountId = formData.get("accountId") as string;
	const destinationAccountId = formData.get("destinationAccountId") as string;
	const isTransfer = formData.get("isTransfer") === "true";
	const name = formData.get("name") as string;
	const amount = Number.parseFloat(formData.get("amount") as string);
	const type = formData.get("type") as TransactionType;
	const dayOfMonth = Number.parseInt(formData.get("dayOfMonth") as string, 10);
	const description = formData.get("description") as string;
	// default_amountはamountと同じ値で初期化
	const defaultAmount = amount;

	if (!accountId) {
		return { error: "口座を選択してください" };
	}

	if (!name) {
		return { error: "名前は必須です" };
	}

	if (Number.isNaN(amount)) {
		return { error: "金額は数値で入力してください" };
	}

	if (!isTransfer && type !== "income" && type !== "expense") {
		return { error: "種別は収入または支出を選択してください" };
	}

	if (Number.isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
		return { error: "日付は1から31の間で入力してください" };
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
			await createRecurringTransfer(
				accountId,
				destinationAccountId,
				name,
				amount,
				defaultAmount,
				dayOfMonth,
				description,
			);
			return { success: "定期送金が正常に作成されました" };
		}
		await createRecurringTransaction(
			accountId,
			name,
			amount,
			defaultAmount,
			type,
			dayOfMonth,
			description,
		);
		return { success: "定期的な収支が正常に作成されました" };
	} catch (error) {
		console.error("Error creating recurring transaction:", error);
		return { error: "定期的な収支の作成に失敗しました" };
	}
}
