import { Button } from "@/components/button";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import type { RecurringTransaction } from "@/types/database";
import Link from "next/link";
import { TransactionGroups } from "./_components/transaction-groups";

// 定期取引ページのインターフェース
interface TransactionsByAccount {
	accountId: string;
	accountName: string;
	transactions: RecurringTransaction[];
}

export default async function RecurringTransactionsPage() {
	// 口座情報の取得
	const accounts = await getUserAccounts();

	// 定期的な収支データ取得
	const transactions = await getUserRecurringTransactions();

	// 口座ごとにトランザクションをグループ化
	const transactionsByAccount: TransactionsByAccount[] = [];

	// 口座IDごとにグループ化
	for (const account of accounts) {
		const accountTransactions = transactions.filter(
			(transaction) => transaction.account_id === account.id
		);

		if (accountTransactions.length > 0) {
			transactionsByAccount.push({
				accountId: account.id,
				accountName: account.name,
				transactions: accountTransactions,
			});
		}
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">定期的な収支</h1>
				<Button asChild>
					<Link href="/transactions/recurring/new">新規追加</Link>
				</Button>
			</div>

			{transactions.length > 0 ? (
				<TransactionGroups transactionGroups={transactionsByAccount} />
			) : (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
					<p className="text-lg mb-4">定期的な収支はまだ登録されていません</p>
					<Button asChild>
						<Link href="/transactions/recurring/new">
							最初の定期的な収支を追加する
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
