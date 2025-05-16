import { Dashboard } from "@/components/dashboard";
import { getMonthlyPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { updateAccountBalancesAction } from "./actions";

export default async function DashboardPage() {
	await updateAccountBalancesAction();

	const [totalBalance, monthlyPredictions] = await Promise.all([
		getTotalBalance(),
		getMonthlyPredictions(),
	]);

	return (
		<Dashboard
			totalBalance={totalBalance}
			monthlyPredictions={monthlyPredictions}
		/>
	);
}
