"use server";

import {
	createAccount,
	deleteAccount,
	updateAccount,
	updateAccountOrder,
} from "@/utils/supabase/accounts";

type ActionState = { error?: string; success?: string };

export async function createAccountAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const name = formData.get("name") as string;
	const initialBalance =
		Number.parseFloat(formData.get("initialBalance") as string) || 0;

	if (!name) {
		return { error: "口座名は必須です" };
	}

	try {
		await createAccount(name, initialBalance);
		return { success: "口座が正常に作成されました" };
	} catch (error) {
		console.error("Error creating account:", error);
		return { error: "口座の作成に失敗しました" };
	}
}

export async function updateAccountAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const accountId = formData.get("accountId") as string;
	const name = formData.get("name") as string;
	const currentBalance = Number.parseFloat(
		formData.get("currentBalance") as string,
	);

	if (!accountId) {
		return { error: "口座IDが見つかりません" };
	}

	if (!name) {
		return { error: "口座名は必須です" };
	}

	if (Number.isNaN(currentBalance)) {
		return { error: "残高は数値で入力してください" };
	}

	try {
		await updateAccount(accountId, { name, current_balance: currentBalance });
		return { success: "口座が正常に更新されました" };
	} catch (error) {
		console.error("Error updating account:", error);
		return { error: "口座の更新に失敗しました" };
	}
}

export async function deleteAccountAction(
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const accountId = formData.get("accountId") as string;

	if (!accountId) {
		return { error: "口座IDが見つかりません" };
	}

	try {
		await deleteAccount(accountId);
		return { success: "口座が正常に削除されました" };
	} catch (error) {
		console.error("Error deleting account:", error);
		return { error: "口座の削除に失敗しました" };
	}
}

export async function updateAccountOrderAction(
	accountId: string,
	sortOrder: number,
): Promise<ActionState> {
	if (!accountId) {
		return { error: "口座IDが見つかりません" };
	}

	try {
		await updateAccountOrder(accountId, sortOrder);
		return { success: "並び順が正常に更新されました" };
	} catch (error) {
		console.error("Error updating account order:", error);
		return { error: "並び順の更新に失敗しました" };
	}
}
