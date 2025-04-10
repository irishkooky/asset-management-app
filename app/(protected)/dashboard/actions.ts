import { getUserAccounts, updateAccount } from "@/utils/supabase/accounts";
import {
	getUnprocessedOneTimeTransactions,
	getUnprocessedRecurringTransactions,
	markTransactionsAsProcessed,
} from "@/utils/supabase/processed-transactions";

export const updateAccountBalancesAction = async () => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// 口座処理
		const accounts = await getUserAccounts();

		for (const account of accounts) {
			// 未処理の臨時収支を取得
			const unprocessedOneTimeTransactions =
				await getUnprocessedOneTimeTransactions(account.id, today);

			// 未処理の定期的な収支を取得
			const currentDay = today.getDate();
			const unprocessedRecurringTransactions =
				await getUnprocessedRecurringTransactions(account.id, currentDay);

			// 残高変更を計算
			const oneTimeTotal = unprocessedOneTimeTransactions.reduce(
				(sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
				0,
			);

			const recurringTotal = unprocessedRecurringTransactions.reduce(
				(sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
				0,
			);

			const balanceChange = oneTimeTotal + recurringTotal;

			// 残高変更がある場合のみ更新
			if (balanceChange !== 0) {
				await updateAccount(account.id, {
					current_balance: account.current_balance + balanceChange,
				});

				// 処理した臨時収支を処理済みとしてマーク
				if (unprocessedOneTimeTransactions.length > 0) {
					await markTransactionsAsProcessed(
						unprocessedOneTimeTransactions,
						"one_time",
						account.id,
					);
				}

				// 処理した定期的な収支を処理済みとしてマーク
				if (unprocessedRecurringTransactions.length > 0) {
					await markTransactionsAsProcessed(
						unprocessedRecurringTransactions,
						"recurring",
						account.id,
					);
				}
			}
		}

		return { success: true, message: "口座残高を更新しました" };
	} catch (error) {
		console.error("Error updating account balances:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "口座残高の更新に失敗しました",
		};
	}
};
