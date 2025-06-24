import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { getMonthlyPredictions } from "@/utils/predictions";
import { updateAccountBalancesAction } from "./actions";
import DashboardLoading from "./loading";

async function DashboardData() {
	await updateAccountBalancesAction();

	const monthlyPredictions = await getMonthlyPredictions();

	return <Dashboard monthlyPredictions={monthlyPredictions} />;
}

export default function DashboardPage() {
	return (
		<Suspense fallback={<DashboardLoading />}>
			<DashboardData />
		</Suspense>
	);
}
