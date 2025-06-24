"use server";

import type { TransactionType } from "@/types/database";
import {
	createRecurringTransaction,
	createRecurringTransfer,
} from "@/utils/supabase/recurring-transactions";
import {
	safeValidateCreateTransaction,
	safeValidateCreateTransfer,
} from "@/utils/validators/recurring-transaction";

type ActionState = { error?: string; success?: string };

// 定期的な収支のアクション
export async function createRecurringTransactionAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const isTransfer = formData.get("isTransfer") === "true";
	const rawData = {
		accountId: formData.get("accountId") as string,
		destinationAccountId: formData.get("destinationAccountId") as string,
		name: formData.get("name") as string,
		amount: Number.parseFloat(formData.get("amount") as string),
		type: formData.get("type") as TransactionType,
		dayOfMonth: formData.get("dayOfMonth") as string,
		description: formData.get("description") as string,
	};
	// default_amountはamountと同じ値で初期化
	const defaultAmount = rawData.amount;

	// 入力データのバリデーション
	if (isTransfer) {
		const validation = safeValidateCreateTransfer({
			sourceAccountId: rawData.accountId,
			destinationAccountId: rawData.destinationAccountId,
			name: rawData.name,
			amount: rawData.amount,
			defaultAmount: defaultAmount,
			dayOfMonth: rawData.dayOfMonth,
			description: rawData.description,
		});

		if (!validation.success) {
			const firstError = validation.issues?.[0];
			return { error: firstError?.message || "入力データが無効です" };
		}
	} else {
		const validation = safeValidateCreateTransaction({
			accountId: rawData.accountId,
			name: rawData.name,
			amount: rawData.amount,
			defaultAmount: defaultAmount,
			type: rawData.type,
			dayOfMonth: rawData.dayOfMonth,
			description: rawData.description,
		});

		if (!validation.success) {
			const firstError = validation.issues?.[0];
			return { error: firstError?.message || "入力データが無効です" };
		}
	}

	try {
		if (isTransfer) {
			await createRecurringTransfer(
				rawData.accountId,
				rawData.destinationAccountId,
				rawData.name,
				rawData.amount,
				defaultAmount,
				Number.parseInt(rawData.dayOfMonth, 10),
				rawData.description,
			);
			return { success: "定期送金が正常に作成されました" };
		}
		await createRecurringTransaction(
			rawData.accountId,
			rawData.name,
			rawData.amount,
			defaultAmount,
			rawData.type,
			rawData.dayOfMonth,
			rawData.description,
		);
		return { success: "定期的な収支が正常に作成されました" };
	} catch (error) {
		console.error("Error creating recurring transaction:", error);
		if (error instanceof Error) {
			return { error: error.message };
		}
		return { error: "定期的な収支の作成に失敗しました" };
	}
}
