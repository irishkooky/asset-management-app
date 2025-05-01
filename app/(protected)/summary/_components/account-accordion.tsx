"use client";
import { Accordion, AccordionItem } from "@heroui/accordion";

// 口座サマリーの型定義
interface AccountSummary {
	id: string;
	name: string;
	income: number;
	expense: number;
	balance: number;
}

interface AccountAccordionProps {
	accounts: AccountSummary[];
}

export const AccountAccordion = ({ accounts }: AccountAccordionProps) => {
	return (
		<Accordion variant="splitted" selectionMode="multiple" className="px-0">
			{accounts.map((account) => (
				<AccordionItem
					key={account.id}
					title={
						<div className="flex justify-between items-center w-full">
							<span className="font-semibold">{account.name}</span>
							<div className="text-right">
								<div className="text-xs text-gray-600">収支</div>
								<div
									className={`${account.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
								>
									¥{account.balance.toLocaleString()}
								</div>
							</div>
						</div>
					}
				>
					<div className="grid grid-cols-3 gap-4">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">収入</p>
							<p className="text-xl font-bold text-blue-600 dark:text-blue-400">
								¥{account.income.toLocaleString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">支出</p>
							<p className="text-xl font-bold text-red-600 dark:text-red-400">
								¥{account.expense.toLocaleString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">残高</p>
							<p
								className={`${account.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
							>
								¥{account.balance.toLocaleString()}
							</p>
						</div>
					</div>
				</AccordionItem>
			))}
		</Accordion>
	);
};
