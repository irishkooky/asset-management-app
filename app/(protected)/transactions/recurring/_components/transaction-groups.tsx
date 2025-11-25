"use client";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import Link from "next/link";
import type { RecurringTransaction } from "@/types/database";
import { RefreshHandler } from "./refresh-handler";

interface AccountGroup {
	accountId: string;
	accountName: string;
	transactions: RecurringTransaction[];
}

interface TransactionGroupsProps {
	transactionGroups: AccountGroup[];
}

export const TransactionGroups = ({
	transactionGroups,
}: TransactionGroupsProps) => {
	return (
		<Card>
			<CardBody className="p-0">
				<Accordion
					defaultExpandedKeys={transactionGroups.map(
						(group) => group.accountId,
					)}
					variant="splitted"
				>
					{transactionGroups.map((group) => (
						<AccordionItem
							key={group.accountId}
							textValue={`${group.accountName} - ${group.transactions.length}件の定期取引`}
							title={
								<div className="flex justify-between items-center">
									<h3 className="text-lg font-semibold">{group.accountName}</h3>
									<Chip size="sm" variant="flat" color="default">
										{group.transactions.length} 件
									</Chip>
								</div>
							}
						>
							<div className="space-y-3 p-4">
								{group.transactions.map((transaction) => (
									<div
										key={transaction.id}
										className="flex items-center justify-between p-3 rounded-lg border border-divider hover:bg-content2 transition-colors"
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="text-sm font-medium truncate">
													{transaction.name}
												</h4>
												{transaction.is_transfer && (
													<Chip size="sm" color="primary" variant="flat">
														送金
													</Chip>
												)}
											</div>
											<p className="text-xs text-foreground-500">
												毎月{transaction.day_of_month}日
												{transaction.is_transfer &&
													transaction.destination_account_id && (
														<span className="ml-1">
															（送金先: {(() => {
																const destAccount = transactionGroups.find(
																	(g) =>
																		g.transactions.some(
																			(t) =>
																				t.account_id ===
																					transaction.destination_account_id &&
																				t.transfer_pair_id ===
																					transaction.transfer_pair_id &&
																				t.type === "income",
																		),
																);
																return destAccount?.accountName || "不明";
															})()}）
														</span>
													)}
											</p>
										</div>
										<div className="flex items-center gap-3">
											<span
												className={`text-sm font-semibold ${
													transaction.type === "income"
														? "text-success"
														: "text-danger"
												}`}
											>
												{transaction.type === "income" ? "+" : "-"}¥
												{transaction.amount.toLocaleString()}
											</span>
											<RefreshHandler transaction={transaction} />
										</div>
									</div>
								))}
								<div className="pt-2">
									<Button
										as={Link}
										href={`/transactions/recurring/new?accountId=${group.accountId}`}
										size="sm"
										variant="bordered"
										color="default"
										className="w-full"
									>
										この口座の定期収支を追加
									</Button>
								</div>
							</div>
						</AccordionItem>
					))}
				</Accordion>
			</CardBody>
		</Card>
	);
};
