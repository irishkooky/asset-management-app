import { Button } from "@/components/button";
import type { RecurringTransaction } from "@/types/database";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import Link from "next/link";
import { Suspense } from "react";
import { TransactionGroups } from "./_components/transaction-groups";

// 定期取引ページのインターフェース
interface TransactionsByAccount {
	accountId: string;
	accountName: string;
	transactions: RecurringTransaction[];
}

// データを取得して口座ごとにグループ化する関数
interface TransactionGroupsResult {
	transactionsByAccount: TransactionsByAccount[];
	transactions: RecurringTransaction[];
}

async function getTransactionGroups(): Promise<TransactionGroupsResult> {
	// 口座情報と定期的な収支データを並行して取得
	const [accounts, transactions] = await Promise.all([
		getUserAccounts(),
		getUserRecurringTransactions(),
	]);

	// 口座ごとにトランザクションをグループ化
	const transactionsByAccount: TransactionsByAccount[] = [];

	// 口座IDごとにグループ化
	for (const account of accounts) {
		const accountTransactions = transactions.filter(
			(transaction) => transaction.account_id === account.id,
		);

		if (accountTransactions.length > 0) {
			transactionsByAccount.push({
				accountId: account.id,
				accountName: account.name,
				transactions: accountTransactions,
			});
		}
	}

	return { transactionsByAccount, transactions };
}

export default async function RecurringTransactionsPage() {
	// データ取得
	const { transactionsByAccount, transactions } = await getTransactionGroups();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">定期的な収支</h1>
				<Button asChild>
					<Link href="/transactions/recurring/new">新規追加</Link>
				</Button>
			</div>

			{transactions.length > 0 ? (
				<Suspense
					fallback={
						<div className="border-t border-gray-100 dark:border-gray-800 pt-4">
							<div className="animate-pulse space-y-3">
								<div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
								<div className="space-y-2">
									{Array.from({ length: 4 }).map((_, i) => (
										<div
											key={`skeleton-item-${i}-${Date.now()}`}
											className="h-4 bg-gray-100 dark:bg-gray-800 rounded"
										/>
									))}
								</div>
							</div>
						</div>
					}
				>
					<TransactionGroups transactionGroups={transactionsByAccount} />
				</Suspense>
			) : (
				<div className="border-t border-gray-100 dark:border-gray-800 py-8 text-center">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						定期的な収支はまだ登録されていません
					</p>
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
