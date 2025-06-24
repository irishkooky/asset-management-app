"use server";

import type { TransactionType } from "@/types/database";
import {
	createOneTimeTransaction,
	createOneTimeTransfer,
} from "@/utils/supabase/one-time-transactions";
import {
	safeValidateCreateOneTimeTransaction,
	safeValidateCreateOneTimeTransfer,
} from "@/utils/validators/one-time-transaction";

type ActionState = { error?: string; success?: string };

// 臨時収支のアクション
export async function createOneTimeTransactionAction(
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
		transactionDate: new Date(formData.get("transactionDate") as string),
		description: formData.get("description") as string,
	};

	// 入力データのバリデーション
	if (isTransfer) {
		const validation = safeValidateCreateOneTimeTransfer({
			sourceAccountId: rawData.accountId,
			destinationAccountId: rawData.destinationAccountId,
			name: rawData.name,
			amount: rawData.amount,
			transactionDate: rawData.transactionDate,
			description: rawData.description,
		});

		if (!validation.success) {
			const firstError = validation.issues?.[0];
			return { error: firstError?.message || "入力データが無効です" };
		}
	} else {
		const validation = safeValidateCreateOneTimeTransaction({
			accountId: rawData.accountId,
			name: rawData.name,
			amount: rawData.amount,
			type: rawData.type,
			transactionDate: rawData.transactionDate,
			description: rawData.description,
		});

		if (!validation.success) {
			const firstError = validation.issues?.[0];
			return { error: firstError?.message || "入力データが無効です" };
		}
	}

	try {
		if (isTransfer) {
			await createOneTimeTransfer(
				rawData.accountId,
				rawData.destinationAccountId,
				rawData.name,
				rawData.amount,
				rawData.transactionDate,
				rawData.description,
			);
			return { success: "口座間送金が正常に作成されました" };
		}
		await createOneTimeTransaction(
			rawData.accountId,
			rawData.name,
			rawData.amount,
			rawData.type,
			rawData.transactionDate,
			rawData.description,
		);
		return { success: "臨時収支が正常に作成されました" };
	} catch (error) {
		console.error("Error creating one-time transaction:", error);
		if (error instanceof Error) {
			return { error: error.message };
		}
		return { error: "取引の作成に失敗しました" };
	}
}
