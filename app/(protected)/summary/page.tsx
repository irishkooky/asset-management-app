import { Card, CardBody } from "@heroui/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/button";
import { createClient } from "@/utils/supabase/server";
import { AccountAccordion } from "./_components/account-accordion";
import { MonthNavigationButtons } from "./_components/month-navigation-buttons";
import {
	calculatePreviousMonthBalances,
	carryoverMonthlyBalances,
	getMonthlySummary,
	recordMonthlyBalances,
} from "./actions";

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

// 月初残高の記録とデータ取得を処理
async function handleMonthlyBalances(
	supabase: SupabaseClient,
	currentYear: number,
	currentMonth: number,
	year: number,
	month: number,
) {
	const today = new Date();

	// 現在の月の1日から3日までであれば、月初残高を記録
	if (today.getDate() <= 3) {
		const { data: existingRecords } = await supabase
			.from("monthly_account_balances")
			.select("id")
			.eq("year", currentYear)
			.eq("month", currentMonth)
			.limit(1);

		if (!existingRecords || existingRecords.length === 0) {
			await recordMonthlyBalances(currentYear, currentMonth);
		}
	}

	// 月初残高データを取得、なければ自動で前月から繰り越し
	let { data: monthlyBalances } = await supabase
		.from("monthly_account_balances")
		.select("*")
		.eq("year", year)
		.eq("month", month);

	// 月初残高データがない場合、前月から自動繰り越し
	if (!monthlyBalances || monthlyBalances.length === 0) {
		const carryoverResult = await carryoverMonthlyBalances(
			supabase,
			year,
			month,
		);
		if (carryoverResult.success) {
			// 繰り越し後に再取得
			const { data: newMonthlyBalances } = await supabase
				.from("monthly_account_balances")
				.select("*")
				.eq("year", year)
				.eq("month", month);
			monthlyBalances = newMonthlyBalances;
		}
	}

	// 月初残高をマップに変換
	const monthlyBalanceMap: Record<string, number> = {};
	if (monthlyBalances) {
		for (const balance of monthlyBalances) {
			monthlyBalanceMap[balance.account_id] = balance.balance;
		}
	}

	return monthlyBalanceMap;
}

// 口座の最終残高を計算
function calculateAccountFinalBalance(
	account: {
		transactions: Array<{
			transaction_date: string;
			type: "income" | "expense";
			amount: number;
		}>;
	},
	initialBalance: number,
): number {
	const sortedTransactions = [...account.transactions].sort(
		(a, b) =>
			new Date(a.transaction_date).getTime() -
			new Date(b.transaction_date).getTime(),
	);

	let finalBalance = initialBalance;
	for (const transaction of sortedTransactions) {
		finalBalance =
			transaction.type === "income"
				? finalBalance + transaction.amount
				: finalBalance - transaction.amount;
	}

	return finalBalance;
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
	const supabase = await createClient();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	// 月初残高の処理
	const monthlyBalanceMap = await handleMonthlyBalances(
		supabase,
		currentYear,
		currentMonth,
		year,
		month,
	);

	// 月次収支データを取得
	const summary = await getMonthlySummary(year, month);

	// 日付関連の計算
	const selectedDate = new Date(year, month - 1, 1);
	const currentYearMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const isSelectedDateAfterCurrent = selectedDate > currentYearMonth;

	// 前月残高の取得
	const previousMonthBalances = isSelectedDateAfterCurrent
		? await calculatePreviousMonthBalances(supabase, now, year, month)
		: undefined;

	// 月末残高の合計を計算
	const totalEndOfMonthBalance = summary.accounts.reduce((total, account) => {
		// 初期残高を決定（優先順位: 月初残高テーブル > 前月計算値 > 現在残高）
		let initialBalance = account.balance;

		if (monthlyBalanceMap[account.id] !== undefined) {
			initialBalance = monthlyBalanceMap[account.id];
		} else if (
			isSelectedDateAfterCurrent &&
			previousMonthBalances?.[account.id] !== undefined
		) {
			initialBalance = previousMonthBalances[account.id];
		}

		const finalBalance = calculateAccountFinalBalance(account, initialBalance);
		return total + finalBalance;
	}, 0);

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
