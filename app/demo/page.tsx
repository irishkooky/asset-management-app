import {
	getDemoPredictions,
	getDemoRecentTransactions,
	getDemoRecurringTransactions,
	getDemoTotalBalance,
} from "@/utils/demo-data";
import Dashboard from "../../components/dashboard";

export const metadata = {
	title: "デモモード - 資産管理アプリ",
	description: "資産管理アプリのデモモードです。実際の機能を体験できます。",
};

export default function DemoPage() {
	// デモデータを取得
	const totalBalance = getDemoTotalBalance();
	const predictions = getDemoPredictions();
	const recurringTransactions = getDemoRecurringTransactions();
	const recentTransactions = getDemoRecentTransactions();

	return (
		<Dashboard
			totalBalance={totalBalance}
			predictions={predictions}
			recurringTransactions={recurringTransactions}
			recentTransactions={recentTransactions}
			isDemo={true}
		/>
	);
}
