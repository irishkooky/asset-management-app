import { notFound } from "next/navigation";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getOneTimeTransactionById } from "@/utils/supabase/one-time-transactions";
import { OneTimeTransactionEditForm } from "./one-time-transaction-edit-form";

export default async function EditOneTimeTransactionPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
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
