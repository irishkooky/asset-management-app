export type Account = {
	id: string;
	user_id: string;
	name: string;
	current_balance: number;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type TransactionType = "income" | "expense";

export type RecurringTransaction = {
	id: string;
	user_id: string;
	account_id: string;
	amount: number;
	default_amount: number;
	type: TransactionType;
	name: string;
	description: string | null;
	day_of_month: number;
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

export type OneTimeTransaction = {
	id: string;
	user_id: string;
	account_id: string;
	amount: number;
	type: TransactionType;
	name: string;
	description: string | null;
	transaction_date: string;
	created_at: string;
	updated_at: string;
};

export type PredictionPeriod = "1month" | "3months" | "6months" | "12months";

export type SavingsPrediction = {
	period: PredictionPeriod;
	amount: number;
	date: string;
};
