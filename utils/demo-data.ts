/**
 * デモモード用のサンプルデータを提供するユーティリティ関数
 */

// 型定義
interface Prediction {
	period: string;
	date: string;
	amount: number;
}

interface Transaction {
	id: string;
	name: string;
	type: "income" | "expense";
	amount: number;
	day_of_month?: number;
	transaction_date?: string;
}

/**
 * デモ用の総残高を取得
 */
export function getDemoTotalBalance() {
	return 1250000; // 例: ¥1,250,000
}

/**
 * デモ用の貯蓄予測データを取得
 */
export function getDemoPredictions(): Prediction[] {
	const today = new Date();

	return [
		{
			period: "1month",
			date: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
				.toISOString()
				.split("T")[0],
			amount: 1300000,
		},
		{
			period: "3months",
			date: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
				.toISOString()
				.split("T")[0],
			amount: 1400000,
		},
		{
			period: "6months",
			date: new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
				.toISOString()
				.split("T")[0],
			amount: 1550000,
		},
		{
			period: "12months",
			date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
				.toISOString()
				.split("T")[0],
			amount: 1850000,
		},
	];
}

/**
 * デモ用の定期的な収支データを取得
 */
export function getDemoRecurringTransactions(): Transaction[] {
	return [
		{
			id: "demo-1",
			name: "給料",
			type: "income",
			amount: 280000,
			day_of_month: 25,
		},
		{
			id: "demo-2",
			name: "家賃",
			type: "expense",
			amount: 85000,
			day_of_month: 5,
		},
		{
			id: "demo-3",
			name: "光熱費",
			type: "expense",
			amount: 15000,
			day_of_month: 10,
		},
		{
			id: "demo-4",
			name: "通信費",
			type: "expense",
			amount: 8000,
			day_of_month: 15,
		},
	];
}

/**
 * デモ用の最近の臨時収支データを取得
 */
export function getDemoRecentTransactions(): Transaction[] {
	const today = new Date();
	const month = today.getMonth();
	const year = today.getFullYear();

	return [
		{
			id: "demo-recent-1",
			name: "ボーナス",
			type: "income",
			amount: 300000,
			transaction_date: new Date(year, month, 15).toISOString().split("T")[0],
		},
		{
			id: "demo-recent-2",
			name: "旅行費用",
			type: "expense",
			amount: 120000,
			transaction_date: new Date(year, month, 10).toISOString().split("T")[0],
		},
		{
			id: "demo-recent-3",
			name: "電化製品購入",
			type: "expense",
			amount: 45000,
			transaction_date: new Date(year, month, 5).toISOString().split("T")[0],
		},
		{
			id: "demo-recent-4",
			name: "副業収入",
			type: "income",
			amount: 30000,
			transaction_date: new Date(year, month, 20).toISOString().split("T")[0],
		},
	];
}
