import Dashboard from "@/components/dashboard";
import { getAllPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";

export default async function DashboardPage() {
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
