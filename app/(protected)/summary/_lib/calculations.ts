import { format, setDate, setMonth, setYear } from "date-fns";
import type {
	Account,
	OneTimeTransaction,
	RecurringTransaction,
	RecurringTransactionAmount,
} from "@/types/database";
import type { AccountSummary, Transaction } from "@/types/summary";

export function calculateAccountFinalBalance(
	account: AccountSummary,
	initialBalance: number,
): number {
	const sortedTransactions = [...account.transactions].sort(
		(a, b) =>
			new Date(a.transaction_date).getTime() -
			new Date(b.transaction_date).getTime(),
	);

	let finalBalance = initialBalance;
	for (const transaction of sortedTransactions) {
		finalBalance =
			transaction.type === "income"
				? finalBalance + transaction.amount
				: finalBalance - transaction.amount;
	}

	return finalBalance;
}

export function calculateMonthlySummary(
	accounts: Account[],
	oneTimeTransactions: OneTimeTransaction[],
	recurringTransactions: RecurringTransaction[],
	month: number,
	year: number,
	recurringAmounts: RecurringTransactionAmount[],
) {
	// 口座IDごとのトランザクション配列を作成
	const accountTransactions = new Map<string, Transaction[]>();

	// 口座ごとの収支データを初期化
	const accountSummaries: AccountSummary[] = accounts.map((account) => {
		// トランザクション配列を初期化
		accountTransactions.set(account.id, []);

		return {
			id: account.id,
			name: account.name,
			income: 0,
			expense: 0,
			balance: account.current_balance,
			transactions: [] as Transaction[],
		};
	});

	// 口座IDをキーとしたマップを作成（高速アクセス用）
	const accountMap = new Map(
		accountSummaries.map((summary) => [summary.id, summary]),
	);

	// 臨時収支を集計
	for (const transaction of oneTimeTransactions) {
		const accountSummary = accountMap.get(transaction.account_id);
		if (accountSummary) {
			if (transaction.type === "income") {
				accountSummary.income += transaction.amount;
			} else {
				accountSummary.expense += transaction.amount;
			}

			// トランザクションリストに追加
			accountSummary.transactions.push({
				id: transaction.id,
				name: transaction.name,
				amount: transaction.amount,
				type: transaction.type,
				transaction_date: transaction.transaction_date,
				description: transaction.description || undefined,
				source: "one-time",
			});
		}
	}

	// 定期取引のカスタム金額をマップとして保持
	const recurringAmountsMap = new Map<string, number>();
	for (const amount of recurringAmounts) {
		recurringAmountsMap.set(amount.recurring_transaction_id, amount.amount);
	}

	// 定期的な収支を集計（当月に該当するもののみ）
	for (const transaction of recurringTransactions) {
		// 当月の該当する日付をdate-fnsを使用して作成
		const baseDate = new Date();
		const transactionDate = setDate(
			setMonth(setYear(baseDate, year), month - 1),
			transaction.day_of_month,
		);
		// タイムゾーンの影響を受けないようにdate-fnsのformat関数を使用
		const formattedTransactionDate = format(transactionDate, "yyyy-MM-dd");

		// 当月の日付が定期的な収支の日付以上の場合のみ集計
		const accountSummary = accountMap.get(transaction.account_id);
		if (accountSummary) {
			// 特定の年月のカスタム金額があればそれを使用し、なければデフォルト金額を使用
			const customAmount = recurringAmountsMap.get(transaction.id);
			const transactionAmount =
				customAmount !== undefined ? customAmount : transaction.default_amount;

			if (transaction.type === "income") {
				accountSummary.income += transactionAmount;
			} else {
				accountSummary.expense += transactionAmount;
			}

			// トランザクションリストに追加
			accountSummary.transactions.push({
				id: transaction.id,
				name: transaction.name,
				amount: transactionAmount,
				type: transaction.type,
				transaction_date: formattedTransactionDate,
				description: transaction.description || undefined,
				source: "recurring",
			});
		}
	}

	// 各口座のトランザクションを日付順にソート
	for (const account of accountSummaries) {
		account.transactions.sort((a, b) => {
			return (
				new Date(a.transaction_date).getTime() -
				new Date(b.transaction_date).getTime()
			);
		});
	}

	// 全体の合計を計算
	const totalIncome = accountSummaries.reduce(
		(sum, account) => sum + account.income,
		0,
	);
	const totalExpense = accountSummaries.reduce(
		(sum, account) => sum + account.expense,
		0,
	);
	const totalBalance = accountSummaries.reduce(
		(sum, account) => sum + account.balance,
		0,
	);
	const netBalance = totalIncome - totalExpense;

	return {
		totalIncome,
		totalExpense,
		totalBalance,
		netBalance,
		accounts: accountSummaries,
	} as {
		totalIncome: number;
		totalExpense: number;
		totalBalance: number;
		netBalance: number;
		accounts: AccountSummary[];
	};
}
