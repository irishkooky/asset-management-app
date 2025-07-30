"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Input, Textarea } from "@heroui/input";
import { Radio, RadioGroup } from "@heroui/radio";
import { Select, SelectItem } from "@heroui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Account, FrequencyType } from "@/types/database";
import { createRecurringTransactionAction } from "./actions";

interface RecurringTransactionFormProps {
	accounts?: Account[];
	defaultAccountId?: string;
}

export function RecurringTransactionForm({
	accounts = [],
	defaultAccountId,
}: RecurringTransactionFormProps) {
	const router = useRouter();
	const initialState = { error: "", success: "" };
	const [state, formAction] = useActionState(
		createRecurringTransactionAction,
		initialState,
	);

	// URLからaccountIdを取得
	const [accountId, setAccountId] = useState(defaultAccountId || "");
	const [isTransfer, setIsTransfer] = useState(false);
	const [destinationAccount, setDestinationAccount] = useState("");
	const [frequency, setFrequency] = useState<FrequencyType>("monthly");

	useEffect(() => {
		// URLからクエリパラメータを取得
		const params = new URLSearchParams(window.location.search);
		const urlAccountId = params.get("accountId");
		if (urlAccountId) {
			setAccountId(urlAccountId);
		}
	}, []);

	// 成功時にリダイレクト
	useEffect(() => {
		if (state.success) {
			// メッセージを少し表示してからリダイレクト
			router.push("/transactions/recurring");
		}
	}, [state.success, router]);

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">新規定期的な収支の追加</h1>
				<Button
					as={Link}
					href="/transactions/recurring"
					variant="bordered"
					color="default"
				>
					戻る
				</Button>
			</div>

			<Card>
				<CardHeader>
					<h2 className="text-lg font-semibold">取引情報</h2>
				</CardHeader>
				<CardBody className="space-y-6">
					{state.error && (
						<div className="p-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-800">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg
										className="h-5 w-5 text-danger-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<title>エラー</title>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium">{state.error}</p>
								</div>
							</div>
						</div>
					)}

					{state.success && (
						<div className="p-4 rounded-lg bg-success-50 border border-success-200 text-success-800">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg
										className="h-5 w-5 text-success-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<title>成功</title>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium">{state.success}</p>
								</div>
							</div>
						</div>
					)}

					<form action={formAction} className="space-y-6">
						<Select
							label={isTransfer ? "送金元口座" : "口座"}
							placeholder="口座を選択してください"
							name="accountId"
							isRequired
							selectedKeys={accountId ? [accountId] : []}
							onSelectionChange={(keys) => {
								const selected = Array.from(keys)[0];
								setAccountId(selected ? String(selected) : "");
							}}
						>
							{accounts.map((account) => (
								<SelectItem key={account.id}>{account.name}</SelectItem>
							))}
						</Select>

						<div className="space-y-2">
							<Checkbox
								name="isTransfer"
								value="true"
								isSelected={isTransfer}
								onValueChange={setIsTransfer}
							>
								口座間送金
							</Checkbox>
							{isTransfer && (
								<p className="text-sm text-gray-500">
									送金先口座に同じ金額が収入として自動記録されます
								</p>
							)}
						</div>

						{isTransfer && (
							<Select
								label="送金先口座"
								placeholder="送金先口座を選択してください"
								name="destinationAccountId"
								isRequired={isTransfer}
								selectedKeys={destinationAccount ? [destinationAccount] : []}
								onSelectionChange={(keys) => {
									const selected = Array.from(keys)[0];
									setDestinationAccount(selected ? String(selected) : "");
								}}
							>
								{accounts
									.filter((account) => account.id !== accountId)
									.map((account) => (
										<SelectItem key={account.id}>{account.name}</SelectItem>
									))}
							</Select>
						)}

						<Input
							label="名前"
							name="name"
							type="text"
							isRequired
							placeholder="例: 給料"
						/>

						<Input
							label="金額"
							name="amount"
							type="number"
							step="1"
							isRequired
							placeholder="0"
							startContent={
								<div className="pointer-events-none flex items-center">
									<span className="text-default-400 text-small">¥</span>
								</div>
							}
						/>

						{!isTransfer && (
							<RadioGroup
								name="type"
								label="種別"
								defaultValue="income"
								orientation="horizontal"
							>
								<Radio value="income">収入</Radio>
								<Radio value="expense">支出</Radio>
							</RadioGroup>
						)}

						{isTransfer && <input type="hidden" name="type" value="expense" />}

						<Select
							label="頻度"
							name="frequency"
							isRequired
							selectedKeys={frequency ? [frequency] : []}
							onSelectionChange={(keys) => {
								const selected = Array.from(keys)[0];
								setFrequency(
									selected ? (selected as FrequencyType) : "monthly",
								);
							}}
						>
							<SelectItem key="monthly">毎月</SelectItem>
							<SelectItem key="quarterly">四半期</SelectItem>
							<SelectItem key="yearly">年次</SelectItem>
						</Select>

						{(frequency === "quarterly" || frequency === "yearly") && (
							<Select
								label="月"
								name="monthOfYear"
								placeholder="月を選択してください"
								isRequired
							>
								<SelectItem key="1">1月</SelectItem>
								<SelectItem key="2">2月</SelectItem>
								<SelectItem key="3">3月</SelectItem>
								<SelectItem key="4">4月</SelectItem>
								<SelectItem key="5">5月</SelectItem>
								<SelectItem key="6">6月</SelectItem>
								<SelectItem key="7">7月</SelectItem>
								<SelectItem key="8">8月</SelectItem>
								<SelectItem key="9">9月</SelectItem>
								<SelectItem key="10">10月</SelectItem>
								<SelectItem key="11">11月</SelectItem>
								<SelectItem key="12">12月</SelectItem>
							</Select>
						)}

						<Input
							label={frequency === "monthly" ? "日付（毎月）" : "日付"}
							name="dayOfMonth"
							type="number"
							min="1"
							max="31"
							isRequired
							placeholder="例: 25"
						/>

						<Textarea
							label="説明（任意）"
							name="description"
							placeholder="説明を入力してください"
							minRows={3}
						/>

						<Button type="submit" color="primary" size="lg" className="w-full">
							{isTransfer ? "送金を作成" : "登録する"}
						</Button>
					</form>
				</CardBody>
			</Card>
		</div>
	);
}
