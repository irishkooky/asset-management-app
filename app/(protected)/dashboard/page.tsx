import { Dashboard } from "@/components/dashboard";
import { getMonthlyPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { Suspense } from "react";
import { updateAccountBalancesAction } from "./actions";
import DashboardLoading from "./loading";

async function DashboardData() {
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

export default function DashboardPage() {
	return (
		<Suspense fallback={<DashboardLoading />}>
			<DashboardData />
		</Suspense>
	);
}
