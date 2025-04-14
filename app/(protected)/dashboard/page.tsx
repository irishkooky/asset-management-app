import Dashboard from "@/components/dashboard";
import { getAllPredictions, getMonthlyPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import { updateAccountBalancesAction } from "./actions";

export default async function DashboardPage() {
	// 現在の日付を過ぎた収支・臨時収支を各口座残高に反映
	await updateAccountBalancesAction();

	// 更新後の残高と予測などを並列で取得
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

	const [
		totalBalance,
		predictions,
		monthlyPredictions,
		recurringTransactions,
		recentTransactions,
	] = await Promise.all([
		getTotalBalance(),
		getAllPredictions(),
		getMonthlyPredictions(),
		getUserRecurringTransactions(),
		getUserOneTimeTransactions(undefined, oneMonthAgo, new Date()),
	]);

	return (
		<Dashboard
			totalBalance={totalBalance}
			predictions={predictions}
			monthlyPredictions={monthlyPredictions}
			recurringTransactions={recurringTransactions}
			recentTransactions={recentTransactions}
		/>
	);
}
