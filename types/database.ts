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

export type FrequencyType = "monthly" | "quarterly" | "yearly";

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
	frequency: FrequencyType;
	month_of_year: number | null;
	day_of_year: number | null;
	is_transfer: boolean;
	destination_account_id: string | null;
	transfer_pair_id: string | null;
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
	is_transfer: boolean;
	destination_account_id: string | null;
	transfer_pair_id: string | null;
	created_at: string;
	updated_at: string;
};

export type PredictionPeriod = "1month" | "3months" | "6months" | "12months";

export type SavingsPrediction = {
	period: PredictionPeriod;
	amount: number;
	date: string;
};

// 送金ペア用の型定義
export type TransferPair = {
	sourceTransaction: OneTimeTransaction | RecurringTransaction;
	destinationTransaction: OneTimeTransaction | RecurringTransaction;
};
