import { AccountEditForm } from "@/app/(protected)/accounts/[id]/edit/account-edit-form";
import { getAccountById } from "@/utils/supabase/accounts";
import { notFound } from "next/navigation";

export default async function EditAccountPage(
    props: {
        params: Promise<{ id: string }>;
    }
) {
    const params = await props.params;
    // 口座データ取得
    const account = await getAccountById(params.id);
    if (!account) {
		notFound();
	}

    return <AccountEditForm account={account} />;
}
