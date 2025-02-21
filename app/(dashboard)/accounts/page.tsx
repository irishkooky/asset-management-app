import AccountList from "@/components/accounts/account-list";
import AddAccountButton from "@/components/accounts/add-account-button";
import type { Account } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function AccountsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/sign-in");
	}

	const { data: accounts, error } = await supabase
		.from("accounts")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error fetching accounts:", error);
		return (
			<div className="text-center py-12">
				<p className="text-red-500">データの取得に失敗しました</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl font-bold">口座一覧</h1>
				<AddAccountButton />
			</div>

			<Suspense fallback={<div>読み込み中...</div>}>
				{accounts && accounts.length > 0 ? (
					<AccountList accounts={accounts as Account[]} />
				) : (
					<div className="text-center py-12">
						<p className="text-gray-500 mb-4">口座が登録されていません</p>
						<AddAccountButton />
					</div>
				)}
			</Suspense>

			<div className="mt-8">
				<h2 className="text-xl font-bold mb-4">合計残高</h2>
				<p className="text-3xl font-bold">
					¥
					{accounts
						?.reduce((sum, acc) => sum + acc.balance, 0)
						.toLocaleString() ?? 0}
				</p>
			</div>
		</div>
	);
}
