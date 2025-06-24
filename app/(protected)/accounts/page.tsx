import Link from "next/link";
import { Button } from "@/components/button";
import { getUserAccounts } from "@/utils/supabase/accounts";
import SortableAccountList from "./_components/sortable-account-list";

export default async function AccountsPage() {
	// 口座データ取得
	const accounts = await getUserAccounts();

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">口座管理</h1>
				<Button asChild>
					<Link href="/accounts/new">新規口座を追加</Link>
				</Button>
			</div>

			{/* クライアントコンポーネントに口座リストを渡す */}
			<SortableAccountList initialAccounts={accounts} />
		</div>
	);
}
