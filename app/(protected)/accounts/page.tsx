import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import Link from "next/link";
import { getUserAccounts } from "@/utils/supabase/accounts";
import SortableAccountList from "./_components/sortable-account-list";

export default async function AccountsPage() {
	// 口座データ取得
	const accounts = await getUserAccounts();

	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center w-full">
						<h1 className="text-2xl font-bold">口座管理</h1>
						<Button color="primary" as={Link} href="/accounts/new">
							新規口座を追加
						</Button>
					</div>
				</CardHeader>
				<CardBody>
					{/* クライアントコンポーネントに口座リストを渡す */}
					<SortableAccountList initialAccounts={accounts} />
				</CardBody>
			</Card>
		</div>
	);
}
