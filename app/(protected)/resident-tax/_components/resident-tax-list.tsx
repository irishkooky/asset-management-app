"use client";

import Link from "next/link";
import { Button } from "@/components/button";
import type { ResidentTaxSettingWithPeriods } from "@/types/database";

interface ResidentTaxListProps {
	settings: ResidentTaxSettingWithPeriods[];
}

export function ResidentTaxList({ settings }: ResidentTaxListProps) {
	return (
		<div className="space-y-4">
			{settings.map((setting) => (
				<div
					key={setting.id}
					className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
				>
					<div className="flex justify-between items-start mb-3">
						<div>
							<h3 className="text-lg font-medium">
								{setting.fiscal_year}年度 住民税
							</h3>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								年額: {setting.total_amount.toLocaleString()}円
							</p>
						</div>
						<div className="flex space-x-2">
							<Button size="sm" variant="outline" asChild>
								<Link href={`/resident-tax/${setting.id}/edit`}>編集</Link>
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
						{setting.periods.map((period) => (
							<div
								key={period.id}
								className="bg-gray-50 dark:bg-gray-800 rounded p-3"
							>
								<div className="text-sm font-medium mb-1">
									第{period.period}期 ({period.payment_month}月)
								</div>
								<div className="text-lg font-semibold mb-2">
									{period.amount.toLocaleString()}円
								</div>
								<div className="text-xs text-gray-600 dark:text-gray-400">
									{period.target_recurring_transaction_id
										? "定期収支に上乗せ"
										: "単体で登録"}
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
