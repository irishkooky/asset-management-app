export type RecurringTransaction = {
	id: string;
	user_id: string;
	account_id: string | null;
	name: string;
	description: string | null;
	type: "income" | "expense";
	day_of_month: number;
	default_amount: number;
	amount: number; // 互換性のために残す
	created_at: string;
	updated_at: string;
};

export type RecurringTransactionAmount = {
	id: string;
	recurring_transaction_id: string;
	year: number;
	month: number;
	amount: number;
	created_at: string;
	updated_at: string;
};

export type MonthlyAmount = {
	year: number;
	month: number;
	amount: number;
};
