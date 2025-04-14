import type { NextPageProps } from "@/types/next";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getRecurringTransactionById } from "@/utils/supabase/recurring-transactions";
import { notFound } from "next/navigation";
import { RecurringTransactionEditForm } from "./recurring-transaction-edit-form";

export default async function EditRecurringTransactionPage(
	props: NextPageProps<{ id: string }>,
) {
	const params = await props.params;
	// 定期的な収支データ取得
	const transaction = await getRecurringTransactionById(params.id);
	if (!transaction) {
		notFound();
	}

	// 口座一覧を取得
	const accounts = await getUserAccounts();

	return (
		<RecurringTransactionEditForm
			transaction={transaction}
			accounts={accounts}
		/>
	);
}
