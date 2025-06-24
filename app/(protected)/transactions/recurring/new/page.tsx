import { notFound } from "next/navigation";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { RecurringTransactionForm } from "./recurring-transaction-form";

export default async function NewRecurringTransactionPage(props: {
	searchParams?: Promise<{ accountId?: string }>;
}) {
	const searchParams = await props.searchParams;
	// 口座一覧を取得
	const accounts = await getUserAccounts();

	// 指定されたアカウントIDがある場合、存在確認
	const accountId = searchParams?.accountId;
	if (accountId) {
		const accountExists = accounts.some((account) => account.id === accountId);
		if (!accountExists) {
			notFound();
		}
	}

	return (
		<RecurringTransactionForm
			accounts={accounts}
			defaultAccountId={accountId}
		/>
	);
}
