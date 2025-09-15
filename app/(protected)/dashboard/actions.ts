import { revalidatePath } from "next/cache";
import { getUserAccounts, updateAccount } from "@/utils/supabase/accounts";
import {
	getUnprocessedOneTimeTransactions,
	getUnprocessedRecurringTransactions,
	markTransactionsAsProcessed,
} from "@/utils/supabase/processed-transactions";
export const updateAccountBalancesAction = async (): Promise<{
	success?: string;
	error?: string;
}> => {
	try {
		const today = new Date();
		today.setDate(today.getDate() + 1);
		today.setHours(0, 0, 0, 0);

		const accounts = await getUserAccounts();

		for (const account of accounts) {
			const unprocessedOneTimeTransactions =
				await getUnprocessedOneTimeTransactions(account.id, today);

			const currentDay = today.getDate();
			const unprocessedRecurringTransactions =
				await getUnprocessedRecurringTransactions(account.id, currentDay);

			const oneTimeTotal = unprocessedOneTimeTransactions.reduce(
				(sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
				0,
			);

			const recurringTotal = unprocessedRecurringTransactions.reduce(
				(sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
				0,
			);

			const balanceChange = oneTimeTotal + recurringTotal;

			if (balanceChange !== 0) {
				await updateAccount(account.id, {
					current_balance: account.current_balance + balanceChange,
				});

				if (unprocessedOneTimeTransactions.length > 0) {
					await markTransactionsAsProcessed(
						unprocessedOneTimeTransactions,
						"one_time",
						account.id,
					);
				}

				if (unprocessedRecurringTransactions.length > 0) {
					await markTransactionsAsProcessed(
						unprocessedRecurringTransactions,
						"recurring",
						account.id,
					);
				}
			}
		}

		revalidatePath("/dashboard");
		return { success: "口座残高を更新しました" };
	} catch (error) {
		console.error("Error updating account balances:", error);
		return {
			error:
				error instanceof Error ? error.message : "口座残高の更新に失敗しました",
		};
	}
};
