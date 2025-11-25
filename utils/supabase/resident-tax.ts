import type {
	ResidentTaxPaymentMonth,
	ResidentTaxPeriod,
	ResidentTaxPeriodSetting,
	ResidentTaxSettingWithPeriods,
} from "@/types/database";
import { createClient } from "@/utils/supabase/server";

const PAYMENT_MONTHS: Record<ResidentTaxPeriod, ResidentTaxPaymentMonth> = {
	1: 6, // 第1期: 6月
	2: 8, // 第2期: 8月
	3: 10, // 第3期: 10月
	4: 1, // 第4期: 1月（翌年）
};

/**
 * 住民税テーブルの存在を確認する関数
 */
export async function checkResidentTaxTablesExist(): Promise<boolean> {
	const supabase = await createClient();

	try {
		// resident_tax_settings テーブルの存在を確認
		const { error } = await supabase
			.from("resident_tax_settings")
			.select("id")
			.limit(1);

		// テーブルが存在しない場合は42P01エラーが返される
		if (error?.code === "42P01") {
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error checking resident tax tables:", error);
		return false;
	}
}

export async function getUserResidentTaxSettings(): Promise<
	ResidentTaxSettingWithPeriods[]
> {
	const supabase = await createClient();

	const { data: settings, error: settingsError } = await supabase
		.from("resident_tax_settings")
		.select("*")
		.order("fiscal_year", { ascending: false });

	if (settingsError) {
		// テーブルが存在しない場合は空の配列を返す
		if (settingsError.code === "42P01") {
			console.warn(
				"resident_tax_settings table does not exist. Migration may not be applied.",
			);
			return [];
		}
		throw new Error(`住民税設定の取得に失敗しました: ${settingsError.message}`);
	}

	if (!settings || settings.length === 0) {
		return [];
	}

	const { data: periods, error: periodsError } = await supabase
		.from("resident_tax_periods")
		.select("*")
		.in(
			"setting_id",
			settings.map((s) => s.id),
		)
		.order("period");

	if (periodsError) {
		// テーブルが存在しない場合は空の配列を返す
		if (periodsError.code === "42P01") {
			console.warn(
				"resident_tax_periods table does not exist. Migration may not be applied.",
			);
			return settings.map((setting) => ({ ...setting, periods: [] }));
		}
		throw new Error(
			`住民税期間設定の取得に失敗しました: ${periodsError.message}`,
		);
	}

	return settings.map((setting) => ({
		...setting,
		periods: periods?.filter((p) => p.setting_id === setting.id) || [],
	}));
}

export async function getResidentTaxSettingByYear(
	fiscalYear: number,
): Promise<ResidentTaxSettingWithPeriods | null> {
	const supabase = await createClient();

	const { data: setting, error: settingError } = await supabase
		.from("resident_tax_settings")
		.select("*")
		.eq("fiscal_year", fiscalYear)
		.single();

	if (settingError) {
		if (settingError.code === "PGRST116") {
			return null;
		}
		throw new Error(`住民税設定の取得に失敗しました: ${settingError.message}`);
	}

	const { data: periods, error: periodsError } = await supabase
		.from("resident_tax_periods")
		.select("*")
		.eq("setting_id", setting.id)
		.order("period");

	if (periodsError) {
		throw new Error(
			`住民税期間設定の取得に失敗しました: ${periodsError.message}`,
		);
	}

	return {
		...setting,
		periods: periods || [],
	};
}

export async function createResidentTaxSetting(
	fiscalYear: number,
	totalAmount: number,
	periodAmounts: Record<ResidentTaxPeriod, number>,
	targetTransactionIds: Record<ResidentTaxPeriod, string | null>,
): Promise<ResidentTaxSettingWithPeriods> {
	const supabase = await createClient();

	// Get the current user
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	console.log("Creating resident tax setting with:", {
		user_id: user.id,
		fiscal_year: fiscalYear,
		total_amount: totalAmount,
	});

	try {
		const { data: setting, error: settingError } = await supabase
			.from("resident_tax_settings")
			.insert({
				user_id: user.id,
				fiscal_year: fiscalYear,
				total_amount: totalAmount,
			})
			.select()
			.single();

		console.log("Insert result:", { data: setting, error: settingError });

		if (settingError || !setting) {
			console.error("Error creating resident tax setting:", {
				error: settingError,
				errorString: JSON.stringify(settingError),
				data: setting,
				code: settingError?.code,
				message: settingError?.message,
				details: settingError?.details,
				hint: settingError?.hint,
			});

			if (settingError?.code === "42P01") {
				throw new Error(
					"住民税テーブルが存在しません。管理者に以下のマイグレーションを実行してもらってください：\n" +
						"1. Supabaseダッシュボードの SQL Editor で以下のSQLを実行\n" +
						"2. または `supabase db push` コマンドを実行\n" +
						"マイグレーションファイル: supabase/migrations/20250712_add_resident_tax_system.sql",
				);
			}

			// Check for unique constraint violation
			if (settingError?.code === "23505") {
				throw new Error(
					`この年度（${fiscalYear}年）の住民税設定は既に存在します。`,
				);
			}

			const errorMessage =
				settingError?.message ||
				settingError?.code ||
				(settingError ? JSON.stringify(settingError) : "不明なエラー");

			throw new Error(`住民税設定の作成に失敗しました: ${errorMessage}`);
		}

		if (!setting) {
			throw new Error(
				"住民税設定の作成に失敗しました: データが取得できませんでした",
			);
		}

		const periodsData = Object.entries(periodAmounts).map(
			([period, amount]) => ({
				setting_id: setting.id,
				period: Number(period) as ResidentTaxPeriod,
				amount,
				payment_month: PAYMENT_MONTHS[Number(period) as ResidentTaxPeriod],
				target_recurring_transaction_id:
					targetTransactionIds[Number(period) as ResidentTaxPeriod] || null,
			}),
		);

		console.log("Creating resident tax periods with data:", periodsData);

		const { data: periods, error: periodsError } = await supabase
			.from("resident_tax_periods")
			.insert(periodsData)
			.select();

		if (periodsError) {
			console.error("Error creating resident tax periods:", {
				error: periodsError,
				code: periodsError.code,
				message: periodsError.message,
				details: periodsError.details,
				hint: periodsError.hint,
				data: periodsData,
			});

			// Rollback the setting creation
			await supabase
				.from("resident_tax_settings")
				.delete()
				.eq("id", setting.id);

			if (periodsError.code === "42P01") {
				throw new Error(
					"住民税期間テーブルが存在しません。データベースマイグレーションを実行してください。",
				);
			}

			throw new Error(
				`住民税期間設定の作成に失敗しました: ${periodsError.message || periodsError.code || JSON.stringify(periodsError)}`,
			);
		}

		console.log("Periods created successfully:", periods);

		if (periods && periods.length > 0) {
			await createResidentTaxRecurringTransactions(setting.id, periods);
		}

		return {
			...setting,
			periods: periods || [],
		};
	} catch (error) {
		console.error("Unexpected error in createResidentTaxSetting:", error);
		throw error;
	}
}

async function createResidentTaxRecurringTransactions(
	_settingId: string,
	periods: ResidentTaxPeriodSetting[],
): Promise<void> {
	const supabase = await createClient();

	// Get the current user
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	for (const period of periods) {
		if (period.target_recurring_transaction_id) {
			continue;
		}

		const { data: transaction, error } = await supabase
			.from("recurring_transactions")
			.insert({
				user_id: user.id,
				account_id: null,
				amount: period.amount,
				default_amount: period.amount,
				type: "expense",
				name: `住民税 第${period.period}期`,
				description: `住民税の第${period.period}期支払い`,
				day_of_month: 30,
				is_transfer: false,
				is_resident_tax: true,
			})
			.select()
			.single();

		if (error) {
			console.error(
				"Error creating resident tax recurring transaction:",
				error,
			);
			throw new Error(`住民税用定期収支の作成に失敗しました: ${error.message}`);
		}

		await supabase
			.from("resident_tax_periods")
			.update({ created_recurring_transaction_id: transaction.id })
			.eq("id", period.id);
	}
}

export async function updateResidentTaxSetting(
	settingId: string,
	totalAmount: number,
	periodAmounts: Record<ResidentTaxPeriod, number>,
	targetTransactionIds: Record<ResidentTaxPeriod, string | null>,
): Promise<ResidentTaxSettingWithPeriods> {
	const supabase = await createClient();

	const { data: setting, error: settingError } = await supabase
		.from("resident_tax_settings")
		.update({ total_amount: totalAmount })
		.eq("id", settingId)
		.select()
		.single();

	if (settingError) {
		throw new Error(`住民税設定の更新に失敗しました: ${settingError.message}`);
	}

	const { data: existingPeriods } = await supabase
		.from("resident_tax_periods")
		.select("*")
		.eq("setting_id", settingId);

	for (const [periodStr, amount] of Object.entries(periodAmounts)) {
		const period = Number(periodStr) as ResidentTaxPeriod;
		const existingPeriod = existingPeriods?.find((p) => p.period === period);
		const targetTransactionId = targetTransactionIds[period];

		if (existingPeriod) {
			await supabase
				.from("resident_tax_periods")
				.update({
					amount,
					target_recurring_transaction_id: targetTransactionId,
				})
				.eq("id", existingPeriod.id);

			if (
				existingPeriod.created_recurring_transaction_id &&
				!targetTransactionId
			) {
				await supabase
					.from("recurring_transactions")
					.update({
						amount,
						default_amount: amount,
					})
					.eq("id", existingPeriod.created_recurring_transaction_id);
			}
		}
	}

	const { data: updatedPeriods, error: periodsError } = await supabase
		.from("resident_tax_periods")
		.select("*")
		.eq("setting_id", settingId)
		.order("period");

	if (periodsError) {
		throw new Error(
			`更新後の住民税期間設定の取得に失敗しました: ${periodsError.message}`,
		);
	}

	return {
		...setting,
		periods: updatedPeriods || [],
	};
}

export async function deleteResidentTaxSetting(
	settingId: string,
): Promise<void> {
	const supabase = await createClient();

	const { data: periods } = await supabase
		.from("resident_tax_periods")
		.select("*")
		.eq("setting_id", settingId);

	for (const period of periods || []) {
		if (period.created_recurring_transaction_id) {
			await supabase
				.from("recurring_transactions")
				.delete()
				.eq("id", period.created_recurring_transaction_id);
		}
	}

	const { error } = await supabase
		.from("resident_tax_settings")
		.delete()
		.eq("id", settingId);

	if (error) {
		throw new Error(`住民税設定の削除に失敗しました: ${error.message}`);
	}
}

export function calculateActualPaymentMonth(
	residentTaxPaymentMonth: ResidentTaxPaymentMonth,
	billingDay: number | null,
	paymentDay: number | null,
): number {
	if (!billingDay || !paymentDay) {
		return residentTaxPaymentMonth;
	}

	const taxPaymentDay = 30;

	if (taxPaymentDay <= billingDay) {
		// 住民税支払い日が締め日以前の場合、翌月の支払いとなる
		if (residentTaxPaymentMonth === 1) {
			return 2; // 1月 → 2月
		}
		if (residentTaxPaymentMonth === 6) {
			return 7; // 6月 → 7月
		}
		if (residentTaxPaymentMonth === 8) {
			return 9; // 8月 → 9月
		}
		if (residentTaxPaymentMonth === 10) {
			return 11; // 10月 → 11月
		}
	}

	return residentTaxPaymentMonth;
}

export function getFiscalYearRange(fiscalYear: number): {
	start: Date;
	end: Date;
} {
	return {
		start: new Date(fiscalYear, 5, 1), // 6月1日
		end: new Date(fiscalYear + 1, 4, 31), // 翌年5月31日
	};
}

export function getCurrentFiscalYear(): number {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	return currentMonth >= 6 ? currentYear : currentYear - 1;
}
