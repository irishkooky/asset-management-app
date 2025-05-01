import { Button } from "@/components/button";
import { Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { Suspense } from "react";
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

// サマリーデータを表示するコンポーネント
async function SummaryContent({
	year,
	month,
}: { year: number; month: number }) {
	// 月次収支データを取得
	const summary = await getMonthlySummary(year, month);

	return (
		<>
			{/* 全体サマリー */}
			<Card>
				<CardBody>
					<div className="grid grid-cols-2 gap-0">
						<div className="border-r border-gray-200 dark:border-gray-700 pr-4">
							<div className="flex justify-between items-center py-2">
								<div className="text-xs text-gray-600 dark:text-gray-400">
									収入
								</div>
								<div className="text-lg font-medium text-green-600 dark:text-green-400">
									¥{summary.totalIncome.toLocaleString()}
								</div>
							</div>
							<div className="flex justify-between items-center py-2">
								<div className="text-xs text-gray-600 dark:text-gray-400">
									支出
								</div>
								<div className="text-lg font-medium text-red-600 dark:text-red-400">
									¥{summary.totalExpense.toLocaleString()}
								</div>
							</div>
							<div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-2">
								<div className="flex justify-between items-center py-2">
									<div className="text-xs text-gray-600 dark:text-gray-400">
										収支
									</div>
									<div
										className={`text-lg font-medium ${summary.netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
									>
										¥{summary.netBalance.toLocaleString()}
									</div>
								</div>
							</div>
						</div>
						<div className="flex text-center flex-col justify-center">
							<div className="text-xs text-gray-600 dark:text-gray-400">
								残高
							</div>
							<div className="text-xl font-medium text-green-600 dark:text-green-400">
								¥{summary.totalBalance.toLocaleString()}
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* 口座別サマリーリスト */}
			<div className="space-y-4">
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
		</>
	);
}

// ローディング表示用コンポーネント
function SummaryLoading() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="grid grid-cols-3 gap-2 md:gap-4 text-center md:text-left">
				{[1, 2, 3].map((i) => (
					<div key={i} className="space-y-2">
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto md:mx-0" />
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto md:mx-0" />
					</div>
				))}
			</div>

			<div className="space-y-4">
				<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4"
					>
						<div className="flex justify-between items-start">
							<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
							<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							{[1, 2, 3].map((j) => (
								<div key={j} className="space-y-2">
									<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
									<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
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
			{/* ヘッダー部分（月選択、全体サマリー） */}
			<div>
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

				{/* サマリーデータ（Suspenseで囲む） */}
				<Suspense fallback={<SummaryLoading />}>
					<SummaryContent year={year} month={month} />
				</Suspense>
			</div>
		</div>
	);
}
