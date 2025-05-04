export interface Transaction {
	id: string;
	name: string;
	amount: number;
	type: "income" | "expense";
	transaction_date: string;
	description?: string;
}

export interface AccountSummary {
	id: string;
	name: string;
	income: number;
	expense: number;
	balance: number;
	transactions: Transaction[];
}
