import { Card, CardBody } from "@heroui/react";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import {
	checkResidentTaxTablesExist,
	getCurrentFiscalYear,
} from "@/utils/supabase/resident-tax";
import { ResidentTaxForm } from "./_components/resident-tax-form";

export default async function NewResidentTaxPage() {
	// 住民税テーブルの存在を確認
	const tablesExist = await checkResidentTaxTablesExist();

	if (!tablesExist) {
		return (
			<div className="max-w-4xl mx-auto space-y-6">
				<div>
					<h1 className="text-2xl font-bold">住民税設定の新規作成</h1>
					<p className="text-default-600 mt-2">
						年度と支払い方法を設定してください
					</p>
				</div>

				<Card>
					<CardBody className="p-6">
						<div className="text-center space-y-4">
							<h2 className="text-xl font-semibold text-danger">
								住民税機能は現在利用できません
							</h2>
							<p className="text-default-600">
								住民税機能を利用するためには、データベースマイグレーションが必要です。
							</p>
							<div className="text-left bg-default-100 p-4 rounded-lg">
								<p className="font-medium mb-2">管理者へのお知らせ:</p>
								<ol className="text-sm space-y-1 list-decimal list-inside">
									<li>Supabaseダッシュボードの SQL Editor にアクセス</li>
									<li>
										<code className="bg-default-200 px-2 py-1 rounded">
											supabase/migrations/20250712_add_resident_tax_system.sql
										</code>
										の内容を実行
									</li>
									<li>
										または{" "}
										<code className="bg-default-200 px-2 py-1 rounded">
											supabase db push
										</code>{" "}
										コマンドを実行
									</li>
								</ol>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>
		);
	}

	const [recurringTransactions, currentFiscalYear] = await Promise.all([
		getUserRecurringTransactions(),
		Promise.resolve(getCurrentFiscalYear()),
	]);

	// 住民税用でない定期収支のみフィルタ
	const eligibleTransactions = recurringTransactions.filter(
		(transaction) => !transaction.is_resident_tax,
	);

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-bold">住民税設定の新規作成</h1>
				<p className="text-default-600 mt-2">
					年度と支払い方法を設定してください
				</p>
			</div>

			<ResidentTaxForm
				recurringTransactions={eligibleTransactions}
				defaultFiscalYear={currentFiscalYear}
			/>
		</div>
	);
}
