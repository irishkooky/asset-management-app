import type { Transaction } from "@/types";
import { Card } from "@heroui/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TransactionListProps {
	transactions: Transaction[];
}

export default function TransactionList({
	transactions,
}: TransactionListProps) {
	return (
		<div className="space-y-4">
			{transactions.map((transaction) => (
				<Card
					key={transaction.id}
					className="p-4 hover:bg-gray-50 transition-colors"
				>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-semibold">{transaction.description}</p>
							<div className="flex items-center gap-2 text-sm text-gray-500">
								<span>
									{format(new Date(transaction.date), "M月d日", { locale: ja })}
								</span>
								<span>•</span>
								<span className="px-2 py-1 rounded-full bg-gray-100 text-xs">
									{transaction.type === "regular" ? "定期" : "臨時"}
								</span>
							</div>
						</div>
						<div className="text-right">
							<p
								className={`text-lg font-bold ${
									transaction.transaction_type === "income"
										? "text-emerald-600"
										: "text-rose-600"
								}`}
							>
								{transaction.transaction_type === "income" ? "+" : "-"}¥
								{transaction.amount.toLocaleString()}
							</p>
							<p className="text-xs text-gray-500">
								{format(new Date(transaction.created_at), "yyyy/MM/dd HH:mm", {
									locale: ja,
								})}
							</p>
						</div>
					</div>
				</Card>
			))}
		</div>
	);
}
