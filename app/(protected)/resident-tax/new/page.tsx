import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import { getCurrentFiscalYear } from "@/utils/supabase/resident-tax";
import { ResidentTaxForm } from "./_components/resident-tax-form";

export default async function NewResidentTaxPage() {
	const [recurringTransactions, currentFiscalYear] = await Promise.all([
		getUserRecurringTransactions(),
		Promise.resolve(getCurrentFiscalYear()),
	]);

	// 住民税用でない定期収支のみフィルタ
	const eligibleTransactions = recurringTransactions.filter(
		(transaction) => !transaction.is_resident_tax,
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">住民税設定の新規作成</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">
					年度と支払い方法を設定してください
				</p>
			</div>

			<ResidentTaxForm
				recurringTransactions={eligibleTransactions}
				defaultFiscalYear={currentFiscalYear}
			/>
		</div>
	);
}
