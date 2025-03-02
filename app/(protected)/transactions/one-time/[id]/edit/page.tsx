import { OneTimeTransactionEditForm } from "@/app/(protected)/transactions/one-time/[id]/edit/one-time-transaction-edit-form";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionById } from "@/utils/supabase/one-time-transactions";
import { notFound } from "next/navigation";

export default async function EditOneTimeTransactionPage({
	params,
}: {
	params: { id: string };
}) {
	// 臨時収支データ取得
	const transaction = await getOneTimeTransactionById(params.id);
	if (!transaction) {
		notFound();
	}

	// 口座一覧を取得
	const accounts = await getUserAccounts();

	return (
		<OneTimeTransactionEditForm transaction={transaction} accounts={accounts} />
	);
}
