import { OneTimeTransactionForm } from "@/app/(protected)/transactions/one-time/new/one-time-transaction-form";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { notFound } from "next/navigation";

export default async function NewOneTimeTransactionPage(
    props: {
        searchParams?: Promise<{ accountId?: string }>;
    }
) {
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
		<OneTimeTransactionForm accounts={accounts} defaultAccountId={accountId} />
	);
}
