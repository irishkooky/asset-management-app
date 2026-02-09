import { Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/button";
import { AccountAccordion } from "./_components/account-accordion";
import { MonthNavigationButtons } from "./_components/month-navigation-buttons";
import { getMonthlySummaryData } from "./actions";

interface PageProps {
	searchParams: Promise<{
		year?: string;
		month?: string;
	}>;
}

// ユーティリティ関数
function getDateParams(searchParams: { year?: string; month?: string }) {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	const year = searchParams.year
		? Number.parseInt(searchParams.year, 10)
		: currentYear;
	const month = searchParams.month
		? Number.parseInt(searchParams.month, 10)
		: currentMonth;

	return { year, month, currentYear, currentMonth };
}

function getNavigationParams(year: number, month: number) {
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

	return { prevYear, prevMonth, nextYear, nextMonth };
}

const MONTH_NAMES = [
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

export default async function MonthlySummaryPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const { year, month } = getDateParams(params);
	const { prevYear, prevMonth, nextYear, nextMonth } = getNavigationParams(
		year,
		month,
	);

	return (
		<div className="space-y-6">
			<MonthNavigationButtons
				currentYear={year}
				currentMonth={month}
				prevYear={prevYear}
				prevMonth={prevMonth}
				nextYear={nextYear}
				nextMonth={nextMonth}
				monthNames={MONTH_NAMES}
			/>
			<Suspense fallback={<SummaryLoading />}>
				<SummaryContent year={year} month={month} />
			</Suspense>
		</div>
	);
}

// サマリーデータを表示するコンポーネント
async function SummaryContent({
	year,
	month,
}: {
	year: number;
	month: number;
}) {
	const now = new Date();
	const {
		summary,
		monthlyBalanceMap,
		previousMonthBalances,
		totalEndOfMonthBalance,
	} = await getMonthlySummaryData(year, month);

	// 口座が登録されていない場合の空状態を表示
	if (summary.accounts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 space-y-4">
				<div className="text-center space-y-2">
					<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
						口座が登録されていません
					</h3>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						まずは口座を登録して資産管理を始めましょう
					</p>
				</div>
				<Button color="primary" asChild>
					<Link href="/accounts/new">口座を登録する</Link>
				</Button>
			</div>
		);
	}

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
								<div className="text-lg font-medium text-blue-600 dark:text-blue-400">
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
										className={`text-lg font-medium ${summary.netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
									>
										¥{summary.netBalance.toLocaleString()}
									</div>
								</div>
							</div>
						</div>
						<div className="flex text-center flex-col justify-center">
							<div className="text-xs text-gray-600 dark:text-gray-400">
								月末見込残高
							</div>
							<div className="text-xl font-medium text-blue-600 dark:text-blue-400">
								¥{totalEndOfMonthBalance.toLocaleString()}
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			<div className="space-y-4">
				<AccountAccordion
					accounts={summary.accounts}
					previousMonthBalances={previousMonthBalances}
					currentDate={now}
					selectedYear={year}
					selectedMonth={month}
					monthlyBalanceMap={monthlyBalanceMap}
				/>
				<div className="flex justify-center">
					<Button variant="outline" size="sm" asChild>
						<Link href="/accounts/new">口座を追加</Link>
					</Button>
				</div>
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
