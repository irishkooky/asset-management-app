import type {
	Account,
	OneTimeTransaction,
	RecurringTransaction,
	RecurringTransactionAmount,
	ResidentTaxPeriodSetting,
	ResidentTaxSetting,
} from "./database";

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type ProcessedTransaction = {
	id: string;
	transaction_id: string;
	transaction_type: "one_time" | "recurring";
	account_id: string;
	processed_at: string;
};

export type MonthlyAccountBalance = {
	id: string;
	account_id: string;
	user_id: string;
	year: number;
	month: number;
	balance: number;
	created_at: string;
	updated_at: string;
};

/**
 * supabase/migrations のスキーマから導出したテーブル定義。
 * Row はドメイン型（types/database.ts）を単一の真実として参照する。
 * DB 側で自動生成されるカラムは Insert で省略可能にしている。
 */
type TableDef<Row, Generated extends keyof Row> = {
	Row: Row;
	Insert: Omit<Row, Generated> & Partial<Pick<Row, Generated>>;
	Update: Partial<Row>;
	Relationships: [];
};

type GeneratedColumns = "id" | "created_at" | "updated_at";

export type Database = {
	public: {
		Tables: {
			accounts: TableDef<Account, GeneratedColumns | "sort_order">;
			recurring_transactions: TableDef<
				RecurringTransaction,
				| GeneratedColumns
				| "frequency"
				| "is_transfer"
				| "destination_account_id"
				| "transfer_pair_id"
				| "month_of_year"
				| "day_of_year"
				| "billing_day"
				| "payment_day"
				| "is_resident_tax"
			>;
			one_time_transactions: TableDef<
				OneTimeTransaction,
				| GeneratedColumns
				| "is_transfer"
				| "destination_account_id"
				| "transfer_pair_id"
			>;
			recurring_transaction_amounts: TableDef<
				RecurringTransactionAmount,
				GeneratedColumns
			>;
			processed_transactions: TableDef<
				ProcessedTransaction,
				"id" | "processed_at"
			>;
			monthly_account_balances: TableDef<
				MonthlyAccountBalance,
				GeneratedColumns
			>;
			resident_tax_settings: TableDef<ResidentTaxSetting, GeneratedColumns>;
			resident_tax_periods: TableDef<
				ResidentTaxPeriodSetting,
				| GeneratedColumns
				| "target_recurring_transaction_id"
				| "created_recurring_transaction_id"
			>;
		};
		Views: Record<string, never>;
		Functions: {
			create_one_time_transfer: {
				Args: {
					p_user_id: string;
					p_source_account_id: string;
					p_destination_account_id: string;
					p_name: string;
					p_amount: number;
					p_transaction_date: string;
					p_description?: string | null;
					p_transfer_pair_id?: string | null;
				};
				Returns: Json;
			};
			update_one_time_transfer_pair: {
				Args: Record<string, Json | null | undefined>;
				Returns: Json;
			};
			delete_one_time_transfer_pair: {
				Args: Record<string, Json | null | undefined>;
				Returns: Json;
			};
			create_recurring_transfer: {
				Args: {
					p_user_id: string;
					p_source_account_id: string;
					p_destination_account_id: string;
					p_name: string;
					p_amount: number;
					p_default_amount: number;
					p_day_of_month: number;
					p_frequency: string;
					p_month_of_year?: number | null;
					p_description?: string | null;
					p_transfer_pair_id?: string | null;
				};
				Returns: Json;
			};
		};
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
