import AccountPredictions from "@/components/predictions/account-predictions";
import AddTransactionButton from "@/components/transactions/add-transaction-button";
import TransactionList from "@/components/transactions/transaction-list";
import {} from "@/types";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@heroui/react";
import { redirect } from "next/navigation";

interface AccountPageProps {
	params: {
		id: string;
	};
}

export default async function AccountPage({ params }: AccountPageProps) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/sign-in");
	}

	const { data: account, error: accountError } = await supabase
		.from("accounts")
		.select("*")
		.eq("id", params.id)
		.eq("user_id", user.id)
		.single();

	if (accountError || !account) {
		redirect("/accounts");
	}

	const { data: transactions, error: transactionsError } = await supabase
		.from("transactions")
		.select("*")
		.eq("account_id", params.id)
		.order("date", { ascending: false });

	if (transactionsError) {
		console.error("Error fetching transactions:", transactionsError);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold">{account.name}</h1>
					<p
						className={`text-3xl font-bold mt-2 ${
							account.balance >= 0 ? "text-emerald-600" : "text-rose-600"
						}`}
					>
						¥{account.balance.toLocaleString()}
					</p>
				</div>
				<div className="mt-4 md:mt-0">
					<AddTransactionButton accountId={params.id} />
				</div>
			</div>

			<div className="mb-8">
				<h2 className="text-xl font-semibold mb-4">予測残高</h2>
				<AccountPredictions
					accountId={params.id}
					currentBalance={account.balance}
					transactions={(transactions as Transaction[]) || []}
				/>
			</div>

			<Card className="p-6">
				<h2 className="text-xl font-semibold mb-4">取引履歴</h2>
				{transactions && transactions.length > 0 ? (
					<TransactionList transactions={transactions as Transaction[]} />
				) : (
					<div className="text-center py-12">
						<p className="text-gray-500 mb-4">取引履歴がありません</p>
						<AddTransactionButton accountId={params.id} />
					</div>
				)}
			</Card>
		</div>
	);
}
