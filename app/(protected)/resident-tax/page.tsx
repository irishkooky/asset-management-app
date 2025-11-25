import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/button";
import type { ResidentTaxSettingWithPeriods } from "@/types/database";
import {
	getCurrentFiscalYear,
	getUserResidentTaxSettings,
} from "@/utils/supabase/resident-tax";
import { ResidentTaxList } from "./_components/resident-tax-list";

export default async function ResidentTaxPage() {
	let settings: ResidentTaxSettingWithPeriods[] = [];
	let hasError = false;
	let errorMessage = "";

	try {
		[settings] = await Promise.all([getUserResidentTaxSettings()]);
	} catch (error) {
		hasError = true;
		errorMessage =
			error instanceof Error ? error.message : "不明なエラーが発生しました";
		console.error("Error loading resident tax settings:", error);
	}

	const currentFiscalYear = getCurrentFiscalYear();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">住民税設定</h1>
				<Button asChild>
					<Link href="/resident-tax/new">新規追加</Link>
				</Button>
			</div>

			{hasError ? (
				<div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm">
					<h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
						エラーが発生しました
					</h3>
					<p className="text-red-800 dark:text-red-200 mb-2">{errorMessage}</p>
					<p className="text-red-600 dark:text-red-400 text-xs">
						データベースのマイグレーションが適用されていない可能性があります。
					</p>
				</div>
			) : (
				<div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
					<h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
						住民税について
					</h3>
					<p className="text-blue-800 dark:text-blue-200">
						住民税は6月〜翌年5月の年度で管理されます。現在の年度:{" "}
						{currentFiscalYear}年度
						<br />
						支払い時期: 第1期(6月)、第2期(8月)、第3期(10月)、第4期(1月)
					</p>
				</div>
			)}

			{!hasError && settings.length > 0 ? (
				<Suspense
					fallback={
						<div className="border-t border-gray-100 dark:border-gray-800 pt-4">
							<div className="animate-pulse space-y-3">
								<div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<div
											key={`skeleton-item-${i}-${Date.now()}`}
											className="h-4 bg-gray-100 dark:bg-gray-800 rounded"
										/>
									))}
								</div>
							</div>
						</div>
					}
				>
					<ResidentTaxList settings={settings} />
				</Suspense>
			) : !hasError ? (
				<div className="border-t border-gray-100 dark:border-gray-800 py-8 text-center">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						住民税設定はまだ登録されていません
					</p>
					<Button asChild>
						<Link href="/resident-tax/new">最初の住民税設定を追加する</Link>
					</Button>
				</div>
			) : null}
		</div>
	);
}
