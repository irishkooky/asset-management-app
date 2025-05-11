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

export interface MonthlyAccountBalance {
	id: string;
	account_id: string;
	user_id: string;
	year: number;
	month: number;
	balance: number;
	created_at: string;
	updated_at: string;
}
