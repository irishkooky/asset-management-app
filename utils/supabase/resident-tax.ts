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

export async function getUserResidentTaxSettings(): Promise<
	ResidentTaxSettingWithPeriods[]
> {
	const supabase = await createClient();

	const { data: settings, error: settingsError } = await supabase
		.from("resident_tax_settings")
		.select("*")
		.order("fiscal_year", { ascending: false });

	if (settingsError) {
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

	const { data: setting, error: settingError } = await supabase
		.from("resident_tax_settings")
		.insert({
			fiscal_year: fiscalYear,
			total_amount: totalAmount,
		})
		.select()
		.single();

	if (settingError) {
		throw new Error(`住民税設定の作成に失敗しました: ${settingError.message}`);
	}

	const periodsData = Object.entries(periodAmounts).map(([period, amount]) => ({
		setting_id: setting.id,
		period: Number(period) as ResidentTaxPeriod,
		amount,
		payment_month: PAYMENT_MONTHS[Number(period) as ResidentTaxPeriod],
		target_recurring_transaction_id:
			targetTransactionIds[Number(period) as ResidentTaxPeriod],
	}));

	const { data: periods, error: periodsError } = await supabase
		.from("resident_tax_periods")
		.insert(periodsData)
		.select();

	if (periodsError) {
		await supabase.from("resident_tax_settings").delete().eq("id", setting.id);
		throw new Error(
			`住民税期間設定の作成に失敗しました: ${periodsError.message}`,
		);
	}

	await createResidentTaxRecurringTransactions(setting.id, periods);

	return {
		...setting,
		periods: periods || [],
	};
}

async function createResidentTaxRecurringTransactions(
	_settingId: string,
	periods: ResidentTaxPeriodSetting[],
): Promise<void> {
	const supabase = await createClient();

	for (const period of periods) {
		if (period.target_recurring_transaction_id) {
			continue;
		}

		const { data: transaction, error } = await supabase
			.from("recurring_transactions")
			.insert({
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
