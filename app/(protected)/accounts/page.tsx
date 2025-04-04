import { Button } from "@/shared-components/button";
import { getUserAccounts } from "@/utils/supabase/accounts";
import Link from "next/link";

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

			{accounts.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{accounts.map((account) => (
						<div
							key={account.id}
							className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
						>
							<div className="flex justify-between items-start mb-4">
								<h2 className="text-xl font-semibold">{account.name}</h2>
								<div className="flex space-x-2">
									<Button variant="outline" size="sm" asChild>
										<Link href={`/accounts/${account.id}`}>詳細</Link>
									</Button>
									<Button variant="outline" size="sm" asChild>
										<Link href={`/accounts/${account.id}/edit`}>編集</Link>
									</Button>
								</div>
							</div>
							<p className="text-2xl font-bold mb-2">
								¥{account.current_balance.toLocaleString()}
							</p>
							<p className="text-sm text-gray-500">
								最終更新: {new Date(account.updated_at).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			) : (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
					<p className="text-lg mb-4">口座がまだ登録されていません</p>
					<Button asChild>
						<Link href="/accounts/new">最初の口座を追加する</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
