import type { Account } from "@/types";
import { Card } from "@heroui/react";
import Link from "next/link";

interface AccountListProps {
	accounts: Account[];
}

export default function AccountList({ accounts }: AccountListProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{accounts.map((account) => (
				<Link
					key={account.id}
					href={`/accounts/${account.id}`}
					className="block transition-transform hover:scale-105"
				>
					<Card className="p-4">
						<div className="flex flex-col">
							<h3 className="text-lg font-semibold mb-2">{account.name}</h3>
							<p
								className={`text-2xl font-bold ${
									account.balance >= 0 ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								¥{account.balance.toLocaleString()}
							</p>
							<p className="text-sm text-gray-500 mt-2">
								作成日:{" "}
								{new Date(account.created_at).toLocaleDateString("ja-JP")}
							</p>
						</div>
					</Card>
				</Link>
			))}
		</div>
	);
}
