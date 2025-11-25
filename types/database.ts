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
	billing_day: number | null;
	payment_day: number | null;
	is_resident_tax: boolean;
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

// 住民税期間の型定義
export type ResidentTaxPeriod = 1 | 2 | 3 | 4;
export type ResidentTaxPaymentMonth = 1 | 6 | 8 | 10;

// 住民税設定の型定義
export type ResidentTaxSetting = {
	id: string;
	user_id: string;
	fiscal_year: number;
	total_amount: number;
	created_at: string;
	updated_at: string;
};

// 住民税各期設定の型定義
export type ResidentTaxPeriodSetting = {
	id: string;
	setting_id: string;
	period: ResidentTaxPeriod;
	amount: number;
	payment_month: ResidentTaxPaymentMonth;
	target_recurring_transaction_id: string | null;
	created_recurring_transaction_id: string | null;
	created_at: string;
	updated_at: string;
};

// 住民税設定と期間設定の結合型
export type ResidentTaxSettingWithPeriods = ResidentTaxSetting & {
	periods: ResidentTaxPeriodSetting[];
};

// 定期収支の表示用拡張型（住民税上乗せ情報付き）
export type RecurringTransactionWithResidentTax = RecurringTransaction & {
	resident_tax_additions?: {
		period: ResidentTaxPeriod;
		amount: number;
		fiscal_year: number;
	}[];
};
