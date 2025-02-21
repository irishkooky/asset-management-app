export type Account = {
	id: string;
	user_id: string;
	name: string;
	balance: number;
	created_at: string;
};

export type Transaction = {
	id: string;
	account_id: string;
	date: string;
	amount: number;
	description: string;
	type: "regular" | "temporary";
	transaction_type: "income" | "expense";
	created_at: string;
};

export type PredictionPeriod = "1month" | "3months" | "6months" | "1year";

export type AccountPrediction = {
	accountId: string;
	accountName: string;
	predictions: {
		[key in PredictionPeriod]: number;
	};
};

export type TotalPrediction = {
	period: PredictionPeriod;
	amount: number;
};

export type TransactionFormData = {
	description: string;
	amount: number;
	date: string;
	type: "regular" | "temporary";
	transactionType: "income" | "expense";
};

export type AccountFormData = {
	name: string;
	balance: number;
};
