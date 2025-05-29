"use client";
import type { RecurringTransaction } from "@/types/database";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { RefreshHandler } from "./refresh-handler";

interface AccountGroup {
	accountId: string;
	accountName: string;
	transactions: RecurringTransaction[];
}

interface TransactionGroupsProps {
	transactionGroups: AccountGroup[];
}

export const TransactionGroups = ({
	transactionGroups,
}: TransactionGroupsProps) => {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
			<Accordion
				defaultExpandedKeys={transactionGroups.map((group) => group.accountId)}
			>
				{transactionGroups.map((group) => (
					<AccordionItem
						key={group.accountId}
						className="border-b last:border-b-0"
						title={
							<div className="flex justify-between items-center py-2 px-4">
								<span className="font-medium">{group.accountName}</span>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{group.transactions.length} 件の定期取引
								</span>
							</div>
						}
					>
						<div>
							{/* モバイル対応のカードベースレイアウト */}
							<div className="grid gap-4 p-4">
								{group.transactions.map((transaction) => (
									<div
										key={transaction.id}
										className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-600"
									>
										<div className="flex justify-between items-start mb-2">
											<div className="flex-1">
												<h3 className="font-medium">{transaction.name}</h3>
												{transaction.description && (
													<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
														{transaction.description}
													</p>
												)}
											</div>
											<span
												className={
													transaction.type === "income"
														? "text-green-600 dark:text-green-400 font-medium"
														: "text-red-600 dark:text-red-400 font-medium"
												}
											>
												{transaction.type === "income" ? "" : "-"}¥
												{transaction.amount.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600 dark:text-gray-300">
												毎月{transaction.day_of_month}日
											</span>
											<div className="flex space-x-2">
												<RefreshHandler transaction={transaction} />
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
};
