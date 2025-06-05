import type { Account } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

/**
 * ユーザーの全口座を取得する
 */
export async function getUserAccounts(): Promise<Account[]> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("accounts")
		.select("*")
		.order("sort_order", { ascending: true });

	if (error) {
		console.error("Error fetching accounts:", error);
		throw new Error("口座情報の取得に失敗しました");
	}

	return data as Account[];
}

/**
 * 特定の口座を取得する
 */
export async function getAccountById(
	accountId: string,
): Promise<Account | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("accounts")
		.select("*")
		.eq("id", accountId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			// PGRST116はレコードが見つからない場合のエラーコード
			return null;
		}
		console.error("Error fetching account:", error);
		throw new Error("口座情報の取得に失敗しました");
	}

	return data as Account;
}

/**
 * 新しい口座を作成する
 */
export async function createAccount(
	name: string,
	initialBalance: number,
): Promise<Account> {
	const supabase = await createClient();

	// 現在のユーザーIDを取得
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	const { data, error } = await supabase
		.from("accounts")
		.insert([
			{
				name,
				current_balance: initialBalance,
				user_id: user.id, // ユーザーIDを設定
			},
		])
		.select()
		.single();

	if (error) {
		console.error("Error creating account:", error);
		throw new Error("口座の作成に失敗しました");
	}

	// 初期残高を月初残高として記録
	if (initialBalance !== 0) {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1;

		const { error: balanceError } = await supabase
			.from("monthly_account_balances")
			.insert({
				account_id: data.id,
				user_id: user.id,
				year: currentYear,
				month: currentMonth,
				balance: initialBalance,
			});

		if (balanceError) {
			console.error("Error recording initial balance:", balanceError);
			// 月初残高の記録に失敗しても口座作成は成功とする
		}
	}

	return data as Account;
}

/**
 * 口座情報を更新する
 */
export async function updateAccount(
	accountId: string,
	updates: { name?: string; current_balance?: number },
): Promise<Account> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("accounts")
		.update({
			...updates,
			updated_at: new Date().toISOString(),
		})
		.eq("id", accountId)
		.select()
		.single();

	if (error) {
		console.error("Error updating account:", error);
		throw new Error("口座情報の更新に失敗しました");
	}

	return data as Account;
}

/**
 * 口座を削除する
 */
export async function deleteAccount(accountId: string): Promise<void> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("accounts")
		.delete()
		.eq("id", accountId);

	if (error) {
		console.error("Error deleting account:", error);
		throw new Error("口座の削除に失敗しました");
	}
}

/**
 * 全口座の合計残高を取得する
 */
export async function getTotalBalance(): Promise<number> {
	const accounts = await getUserAccounts();

	return accounts.reduce(
		(total, account) => total + account.current_balance,
		0,
	);
}

/**
 * 口座の並び順を更新する
 */
export async function updateAccountOrder(
	accountId: string,
	sortOrder: number,
): Promise<void> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("accounts")
		.update({
			sort_order: sortOrder,
			updated_at: new Date().toISOString(),
		})
		.eq("id", accountId);

	if (error) {
		console.error("Error updating account order:", error);
		throw new Error("口座の並び順の更新に失敗しました");
	}
}
