import { getAccountById } from "@/utils/supabase/accounts";
import { notFound } from "next/navigation";
import { AccountEditForm } from "./account-edit-form";

export default async function EditAccountPage({
	params,
}: {
	params: { id: string };
}) {
	// 口座データ取得
	const account = await getAccountById(params.id);
	if (!account) {
		notFound();
	}

	return <AccountEditForm account={account} />;
}
