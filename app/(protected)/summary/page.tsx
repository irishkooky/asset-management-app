import { Button } from "@/components/button";
import { Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { Suspense } from "react";
import { AccountAccordion } from "./_components/account-accordion";
import { getMonthlySummary } from "./actions";

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
		<div className="space-y-6">
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
}: { year: number; month: number }) {
	// 現在の日付を取得
	const now = new Date();

	// 月次収支データを取得
	const summary = await getMonthlySummary(year, month);

	// 翌月以降のビューを表示している場合は、前月の残高情報も取得
	let previousMonthBalances: Record<string, number> | undefined;

	// 選択した年月が現在より後の場合、現在から選択した月までのすべての月のデータを考慮する
	const selectedDate = new Date(year, month - 1, 1);
	const currentYearMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	if (selectedDate > currentYearMonth) {
		// 月別残高情報を格納するオブジェクトを初期化
		previousMonthBalances = {} as Record<string, number>;

		// 現在の月を順次処理するための月範囲を計算
		const currentMonth = now.getMonth() + 1; // 0-basedから1-basedに変換
		const currentYear = now.getFullYear();

		// 以前の月の収支データを取得しながら残高を計算する

		// 適用すべき月を計算する
		const monthsToProcess = [];

		// 現在の月から選択した月の前月までのすべての月をリスト化
		let processYear = currentYear;
		let processMonth = currentMonth;

		while (
			processYear < year ||
			(processYear === year && processMonth < month)
		) {
			monthsToProcess.push({ year: processYear, month: processMonth });

			// 次の月に進む
			processMonth++;
			if (processMonth > 12) {
				processYear++;
				processMonth = 1;
			}
		}

		// 口座ごとの最新の残高を追跡するオブジェクト
		const latestBalances: Record<string, number> = {};

		// 各月を順番に処理
		for (const { year: processYear, month: processMonth } of monthsToProcess) {
			// 現在処理している月のデータを取得
			const monthSummary = await getMonthlySummary(processYear, processMonth);

			// 各口座を処理
			for (const account of monthSummary.accounts) {
				// 初回の処理では、current_balanceを初期ベースとして使用
				if (latestBalances[account.id] === undefined) {
					latestBalances[account.id] = account.balance;
				}

				// 取引を日付順にソート
				const sortedTransactions = [...account.transactions].sort(
					(a, b) =>
						new Date(a.transaction_date).getTime() -
						new Date(b.transaction_date).getTime(),
				);

				// 前月からの残高をベースにして、すべての取引を適用
				let currentBalance = latestBalances[account.id];

				for (const transaction of sortedTransactions) {
					currentBalance =
						transaction.type === "income"
							? currentBalance + transaction.amount
							: currentBalance - transaction.amount;
				}

				// 全ての取引を適用した後の最終残高を次の月の初期残高として保存
				latestBalances[account.id] = currentBalance;

				// 選択した月の前月の最終残高を記録
				if (processYear === year && processMonth === month - 1) {
					previousMonthBalances[account.id] = currentBalance;
				} else if (
					processYear === year - 1 &&
					processMonth === 12 &&
					month === 1
				) {
					// 1月の場合は前年の12月の残高を使用
					previousMonthBalances[account.id] = currentBalance;
				}
			}
		}
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
								残高
							</div>
							<div className="text-xl font-medium text-blue-600 dark:text-blue-400">
								¥{summary.totalBalance.toLocaleString()}
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
				/>
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
