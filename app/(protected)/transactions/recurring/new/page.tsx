import { RecurringTransactionForm } from "@/app/(protected)/transactions/recurring/new/recurring-transaction-form";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { notFound } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";

export default async function NewRecurringTransactionPage({
	searchParams,
}: {
	searchParams: ReadonlyURLSearchParams;
}) {
	// 口座一覧を取得
	const accounts = await getUserAccounts();

	// 指定されたアカウントIDがある場合、存在確認
	const accountId = searchParams.get("accountId");
	if (accountId) {
		const accountExists = accounts.some((account) => account.id === accountId);
		if (!accountExists) {
			notFound();
		}
	}

	return (
		<RecurringTransactionForm
			accounts={accounts}
			defaultAccountId={accountId || undefined}
		/>
	);
}
