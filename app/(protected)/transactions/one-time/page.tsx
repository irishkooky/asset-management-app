import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/table";
import Link from "next/link";
import { getUserAccounts } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";

export default async function OneTimeTransactionsPage() {
	// 臨時収支データ取得（過去3ヶ月と将来のデータ）
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
	const [transactions, accounts] = await Promise.all([
		getUserOneTimeTransactions(undefined, threeMonthsAgo),
		getUserAccounts(),
	]);

	// 口座IDから口座名を取得するヘルパー関数
	const getAccountName = (accountId: string) => {
		const account = accounts.find((acc) => acc.id === accountId);
		return account?.name || "不明な口座";
	};

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">臨時収支</h1>
				<Button color="primary" as={Link} href="/transactions/one-time/new">
					新規追加
				</Button>
			</div>

			{transactions.length > 0 ? (
				<Card>
					<CardBody className="p-0">
						<Table aria-label="取引一覧">
							<TableHeader>
								<TableColumn>名前</TableColumn>
								<TableColumn>種別</TableColumn>
								<TableColumn>口座</TableColumn>
								<TableColumn>日付</TableColumn>
								<TableColumn align="end">金額</TableColumn>
								<TableColumn align="end">操作</TableColumn>
							</TableHeader>
							<TableBody>
								{transactions.map((transaction) => (
									<TableRow key={transaction.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												{transaction.is_transfer && (
													<span className="text-blue-600 text-sm">⟷</span>
												)}
												{transaction.name}
											</div>
										</TableCell>
										<TableCell>
											<Chip
												color={
													transaction.is_transfer
														? "primary"
														: transaction.type === "income"
															? "success"
															: "danger"
												}
												variant="flat"
												size="sm"
											>
												{transaction.is_transfer
													? "送金"
													: transaction.type === "income"
														? "収入"
														: "支出"}
											</Chip>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<div className="font-medium">
													{getAccountName(transaction.account_id)}
												</div>
												{transaction.is_transfer &&
													transaction.destination_account_id && (
														<div className="text-gray-500 text-xs">
															→{" "}
															{getAccountName(
																transaction.destination_account_id,
															)}
														</div>
													)}
											</div>
										</TableCell>
										<TableCell>{transaction.transaction_date}</TableCell>
										<TableCell className="text-right">
											¥{transaction.amount.toLocaleString()}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="bordered"
												size="sm"
												as={Link}
												href={`/transactions/one-time/${transaction.id}/edit`}
											>
												編集
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardBody>
				</Card>
			) : (
				<Card>
					<CardBody className="text-center py-8">
						<p className="text-lg mb-4">臨時収支はまだ登録されていません</p>
						<Button color="primary" as={Link} href="/transactions/one-time/new">
							最初の臨時収支を追加する
						</Button>
					</CardBody>
				</Card>
			)}
		</div>
	);
}
