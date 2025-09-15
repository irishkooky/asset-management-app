"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResidentTaxPeriod } from "@/types/database";
import { createResidentTaxSetting } from "@/utils/supabase/resident-tax";

type ActionState = { error?: string; success?: string };

export async function createResidentTaxSettingAction(
	fiscalYear: number,
	totalAmount: number,
	periodAmounts: Record<ResidentTaxPeriod, number>,
	targetTransactionIds: Record<ResidentTaxPeriod, string | null>,
): Promise<ActionState> {
	if (!fiscalYear || fiscalYear < 2020 || fiscalYear > 2030) {
		return { error: "有効な年度を入力してください" };
	}

	if (!totalAmount || totalAmount <= 0) {
		return { error: "総額は0より大きい値を入力してください" };
	}

	try {
		await createResidentTaxSetting(
			fiscalYear,
			totalAmount,
			periodAmounts,
			targetTransactionIds,
		);
		revalidatePath("/resident-tax");
		redirect("/resident-tax");
	} catch (error) {
		console.error("Error creating resident tax setting:", error);
		return {
			error:
				error instanceof Error
					? error.message
					: "住民税設定の作成に失敗しました",
		};
	}
}
