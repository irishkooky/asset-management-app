import { Dashboard } from "@/components/dashboard";
import { getMonthlyPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import { updateAccountBalancesAction } from "./actions";

export default async function DashboardPage() {
	await updateAccountBalancesAction();

	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

	const [
		totalBalance,
		monthlyPredictions,
		recurringTransactions,
		recentTransactions,
	] = await Promise.all([
		getTotalBalance(),
		getMonthlyPredictions(),
		getUserRecurringTransactions(),
		getUserOneTimeTransactions(undefined, oneMonthAgo, new Date()),
	]);

	return (
		<Dashboard
			totalBalance={totalBalance}
			monthlyPredictions={monthlyPredictions}
			recurringTransactions={recurringTransactions}
			recentTransactions={recentTransactions}
		/>
	);
}
