import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { getAllPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "資産管理アプリ - シンプルで使いやすい家計簿・資産管理ツール",
	description:
		"収支の把握から将来の貯蓄予測まで一元管理できる資産管理アプリ。シンプルで使いやすいインターフェースで、あなたの資産管理をサポートします。",
};

export default async function Home() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// ログインしていない場合はランディングページを表示
	if (!user) {
		return <LandingPage />;
	}

	// ログインしている場合はダッシュボードを表示
	// データ取得
	const totalBalance = await getTotalBalance();
	const predictions = await getAllPredictions();
	const recurringTransactions = await getUserRecurringTransactions();

	// 最近の臨時収支を取得（過去1ヶ月）
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	const recentTransactions = await getUserOneTimeTransactions(
		undefined,
		oneMonthAgo,
		new Date(),
	);

	return (
		<Dashboard
			totalBalance={totalBalance}
			predictions={predictions}
			recurringTransactions={recurringTransactions}
			recentTransactions={recentTransactions}
		/>
	);
}
