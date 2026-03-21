import { calculateMonthlyBalanceChange } from "@/app/(protected)/summary/balance-utils";
import type { Account } from "@/types/database";
import { getUserAccounts, updateAccount } from "@/utils/supabase/accounts";
import {
	getUnprocessedOneTimeTransactions,
	getUnprocessedRecurringTransactions,
	markTransactionsAsProcessed,
} from "@/utils/supabase/processed-transactions";

async function processAccountBalance(
	account: Account,
	today: Date,
): Promise<Account> {
	const currentDay = today.getDate();
	const [unprocessedOneTimeTx, unprocessedRecurringTx] = await Promise.all([
		getUnprocessedOneTimeTransactions(account.id, today),
		getUnprocessedRecurringTransactions(account.id, currentDay),
	]);

	const balanceChange =
		calculateMonthlyBalanceChange(unprocessedOneTimeTx) +
		calculateMonthlyBalanceChange(unprocessedRecurringTx);

	if (balanceChange === 0) return account;

	const updated = await updateAccount(account.id, {
		current_balance: account.current_balance + balanceChange,
	});

	if (unprocessedOneTimeTx.length > 0) {
		await markTransactionsAsProcessed(
			unprocessedOneTimeTx,
			"one_time",
			account.id,
		);
	}
	if (unprocessedRecurringTx.length > 0) {
		await markTransactionsAsProcessed(
			unprocessedRecurringTx,
			"recurring",
			account.id,
		);
	}

	return updated;
}

/**
 * 全口座の残高を未処理取引で更新し、更新後のアカウント一覧を返す
 */
export async function updateAccountBalancesAction(): Promise<Account[]> {
	// 今日の日付を取得し、翌日の0時0分0秒に設定（今日の取引も含めるため）
	const today = new Date();
	today.setDate(today.getDate() + 1);
	today.setHours(0, 0, 0, 0);

	const accounts = await getUserAccounts();

	return Promise.all(
		accounts.map((account) => processAccountBalance(account, today)),
	);
}
