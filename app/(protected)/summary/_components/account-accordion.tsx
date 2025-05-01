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
		<Accordion variant="light" selectionMode="multiple">
			{accounts.map((account) => (
				<AccordionItem
					key={account.id}
					title={
						<div className="flex justify-between items-center w-full">
							<span className="font-semibold">{account.name}</span>
							<span className="text-gray-600">
								¥{account.balance.toLocaleString()}
							</span>
						</div>
					}
				>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
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
							<p className="text-xl font-bold">
								¥{account.balance.toLocaleString()}
							</p>
						</div>
					</div>
				</AccordionItem>
			))}
		</Accordion>
	);
};
