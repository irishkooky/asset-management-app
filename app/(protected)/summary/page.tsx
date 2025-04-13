import { Button } from "@/components/button";
import Link from "next/link";
import { getMonthlySummary } from "../../../app/actions";

// 口座サマリーの型定義
interface AccountSummary {
	id: string;
	name: string;
	income: number;
	expense: number;
	balance: number;
}

// 月次サマリーの型定義
interface MonthlySummary {
	totalIncome: number;
	totalExpense: number;
	totalBalance: number;
	netBalance: number;
	accounts: AccountSummary[];
}

interface PageProps {
	searchParams: Promise<{
		year?: string;
		month?: string;
	}>;
}

export default async function MonthlySummaryPage({ searchParams }: PageProps) {
	// 現在の年月を取得
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1; // JavaScriptの月は0から始まるため+1

	// URLパラメータから年月を取得（指定がない場合は現在の年月を使用）
	const params = await searchParams;
	const year = params.year ? Number.parseInt(params.year) : currentYear;
	const month = params.month ? Number.parseInt(params.month) : currentMonth;

	// 前月と翌月のリンク用のパラメータを計算
	let prevYear = year;
	let prevMonth = month - 1;
	if (prevMonth < 1) {
		prevYear--;
		prevMonth = 12;
	}

	let nextYear = year;
	let nextMonth = month + 1;
	if (nextMonth > 12) {
		nextYear++;
		nextMonth = 1;
	}

	// 月次収支データを取得
	const summary = await getMonthlySummary(year, month);

	// 日本語の月名
	const monthNames = [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月",
	];

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">月次収支サマリー</h1>
			</div>

			{/* ヘッダー部分（月選択、全体サマリー） */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				{/* 月選択 */}
				<div className="flex justify-between items-center mb-6">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/summary?year=${prevYear}&month=${prevMonth}`}>
							前月
						</Link>
					</Button>
					<h2 className="text-xl font-semibold">
						{year}年 {monthNames[month - 1]}
					</h2>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/summary?year=${nextYear}&month=${nextMonth}`}>
							翌月
						</Link>
					</Button>
				</div>

				{/* 全体サマリー */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
						<p className="text-sm text-gray-600 dark:text-gray-400">総収入</p>
						<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
							¥{summary.totalIncome.toLocaleString()}
						</p>
					</div>
					<div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
						<p className="text-sm text-gray-600 dark:text-gray-400">総支出</p>
						<p className="text-2xl font-bold text-red-600 dark:text-red-400">
							¥{summary.totalExpense.toLocaleString()}
						</p>
					</div>
					<div
						className={`${summary.netBalance >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"} p-4 rounded-lg`}
					>
						<p className="text-sm text-gray-600 dark:text-gray-400">差引</p>
						<p
							className={`text-2xl font-bold ${summary.netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
						>
							¥{summary.netBalance.toLocaleString()}
						</p>
					</div>
				</div>
			</div>

			{/* 口座別サマリーリスト */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">口座別収支</h2>
				{summary.accounts.map((account: AccountSummary) => (
					<div
						key={account.id}
						className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
					>
						<div className="flex justify-between items-start mb-4">
							<h3 className="text-lg font-semibold">{account.name}</h3>
							<Button variant="outline" size="sm" asChild>
								<Link href={`/accounts/${account.id}`}>詳細</Link>
							</Button>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">収入</p>
								<p className="text-xl font-bold text-blue-600 dark:text-blue-400">
									¥{account.income.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">支出</p>
								<p className="text-xl font-bold text-red-600 dark:text-red-400">
									¥{account.expense.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">残高</p>
								<p className="text-xl font-bold">
									¥{account.balance.toLocaleString()}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
