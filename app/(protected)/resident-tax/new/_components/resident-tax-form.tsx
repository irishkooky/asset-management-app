"use client";

import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Divider,
	Input,
	Radio,
	RadioGroup,
	Select,
	SelectItem,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RecurringTransaction, ResidentTaxPeriod } from "@/types/database";
import { createResidentTaxSettingAction } from "../../actions";

interface ResidentTaxFormProps {
	recurringTransactions: RecurringTransaction[];
	defaultFiscalYear: number;
}

const PERIODS: { period: ResidentTaxPeriod; month: number; label: string }[] = [
	{ period: 1, month: 6, label: "第1期 (6月)" },
	{ period: 2, month: 8, label: "第2期 (8月)" },
	{ period: 3, month: 10, label: "第3期 (10月)" },
	{ period: 4, month: 1, label: "第4期 (1月)" },
];

export function ResidentTaxForm({
	recurringTransactions,
	defaultFiscalYear,
}: ResidentTaxFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [fiscalYear, setFiscalYear] = useState(defaultFiscalYear);
	const [totalAmount, setTotalAmount] = useState<number>(0);
	const [amountInputMode, setAmountInputMode] = useState<
		"total" | "individual"
	>("total");

	const [periodSettings, setPeriodSettings] = useState<
		Record<
			ResidentTaxPeriod,
			{
				amount: number;
				paymentMode: "addon" | "standalone";
				targetTransactionId: string | null;
			}
		>
	>({
		1: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
		2: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
		3: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
		4: { amount: 0, paymentMode: "standalone", targetTransactionId: null },
	});

	const handleTotalAmountChange = (value: string) => {
		const amount = Number(value);
		setTotalAmount(amount);

		if (amountInputMode === "total" && amount > 0) {
			const perPeriod = Math.floor(amount / 4);
			const remainder = amount % 4;

			setPeriodSettings((prev) => ({
				1: { ...prev[1], amount: perPeriod + (remainder > 0 ? 1 : 0) },
				2: { ...prev[2], amount: perPeriod + (remainder > 1 ? 1 : 0) },
				3: { ...prev[3], amount: perPeriod + (remainder > 2 ? 1 : 0) },
				4: { ...prev[4], amount: perPeriod },
			}));
		}
	};

	const handlePeriodAmountChange = (
		period: ResidentTaxPeriod,
		amount: number,
	) => {
		setPeriodSettings((prev) => ({
			...prev,
			[period]: { ...prev[period], amount },
		}));

		if (amountInputMode === "individual") {
			const total = Object.values({
				...periodSettings,
				[period]: { ...periodSettings[period], amount },
			}).reduce((sum, setting) => sum + setting.amount, 0);
			setTotalAmount(total);
		}
	};

	const handlePaymentModeChange = (period: ResidentTaxPeriod, mode: string) => {
		setPeriodSettings((prev) => ({
			...prev,
			[period]: {
				...prev[period],
				paymentMode: mode as "addon" | "standalone",
				targetTransactionId:
					mode === "standalone" ? null : prev[period].targetTransactionId,
			},
		}));
	};

	const handleTargetTransactionChange = (
		period: ResidentTaxPeriod,
		transactionId: string,
	) => {
		setPeriodSettings((prev) => ({
			...prev,
			[period]: { ...prev[period], targetTransactionId: transactionId || null },
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!totalAmount || totalAmount <= 0) {
			alert("総額を入力してください");
			return;
		}

		setLoading(true);

		try {
			const periodAmounts: Record<ResidentTaxPeriod, number> = {
				1: periodSettings[1].amount,
				2: periodSettings[2].amount,
				3: periodSettings[3].amount,
				4: periodSettings[4].amount,
			};

			const targetTransactionIds: Record<ResidentTaxPeriod, string | null> = {
				1:
					periodSettings[1].paymentMode === "addon"
						? periodSettings[1].targetTransactionId
						: null,
				2:
					periodSettings[2].paymentMode === "addon"
						? periodSettings[2].targetTransactionId
						: null,
				3:
					periodSettings[3].paymentMode === "addon"
						? periodSettings[3].targetTransactionId
						: null,
				4:
					periodSettings[4].paymentMode === "addon"
						? periodSettings[4].targetTransactionId
						: null,
			};

			const result = await createResidentTaxSettingAction(
				fiscalYear,
				totalAmount,
				periodAmounts,
				targetTransactionIds,
			);

			if (result.error) {
				alert(`エラー: ${result.error}`);
			}
		} catch (error) {
			console.error("住民税設定の作成に失敗しました:", error);
			alert(
				`エラー: ${error instanceof Error ? error.message : "不明なエラーが発生しました"}`,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* 基本設定 */}
			<Card>
				<CardHeader>
					<h3 className="text-lg font-medium">基本設定</h3>
				</CardHeader>
				<Divider />
				<CardBody className="space-y-4">
					<Input
						type="number"
						label="年度"
						value={fiscalYear.toString()}
						onValueChange={(value) => setFiscalYear(Number(value))}
						min={2020}
						max={2030}
						description={`${fiscalYear}年6月〜${fiscalYear + 1}年5月`}
						isRequired
					/>

					<RadioGroup
						label="金額入力方式"
						value={amountInputMode}
						onValueChange={(value) => {
							console.log("金額入力方式 changed:", value, typeof value);
							setAmountInputMode(value as "total" | "individual");
						}}
						orientation="vertical"
						description="選択した方式で金額を入力してください"
						classNames={{
							base: "max-w-md",
							wrapper: "gap-2",
						}}
					>
						<Radio
							value="total"
							description="年間総額を4等分して各期に自動配分します"
						>
							年間総額から4等分
						</Radio>
						<Radio
							value="individual"
							description="各期ごとに個別の金額を入力します"
						>
							各期個別入力
						</Radio>
					</RadioGroup>

					{amountInputMode === "total" && (
						<Input
							type="number"
							label="年間総額"
							value={totalAmount.toString() || ""}
							onValueChange={handleTotalAmountChange}
							placeholder="例: 120000"
							startContent={
								<div className="pointer-events-none flex items-center">
									<span className="text-default-400 text-small">¥</span>
								</div>
							}
							min={0}
							isRequired
						/>
					)}
				</CardBody>
			</Card>

			{/* 各期の設定 */}
			<Card>
				<CardHeader>
					<h3 className="text-lg font-medium">各期の設定</h3>
				</CardHeader>
				<Divider />
				<CardBody className="space-y-6">
					{PERIODS.map(({ period, label }) => (
						<Card key={period} className="border-small">
							<CardHeader className="pb-3">
								<h4 className="font-medium">{label}</h4>
							</CardHeader>
							<CardBody className="space-y-4">
								{amountInputMode === "individual" ? (
									<Input
										type="number"
										label="支払い金額"
										value={periodSettings[period].amount.toString() || ""}
										onValueChange={(value) =>
											handlePeriodAmountChange(period, Number(value))
										}
										placeholder="例: 30000"
										startContent={
											<div className="pointer-events-none flex items-center">
												<span className="text-default-400 text-small">¥</span>
											</div>
										}
										min={0}
										isRequired
									/>
								) : (
									<div className="space-y-2">
										<p className="text-sm font-medium text-default-700">
											支払い金額（自動計算）
										</p>
										<Chip color="primary" variant="flat" size="lg">
											¥{periodSettings[period].amount.toLocaleString()}
										</Chip>
									</div>
								)}

								<RadioGroup
									key={`payment-mode-${period}`}
									label="支払い方法"
									value={periodSettings[period].paymentMode}
									onValueChange={(value) => {
										console.log(
											`Period ${period} payment mode changed:`,
											value,
											typeof value,
										);
										handlePaymentModeChange(period, value);
									}}
									orientation="vertical"
									description="住民税の支払い方法を選択してください"
									classNames={{
										base: "max-w-md",
										wrapper: "gap-2",
									}}
								>
									<Radio
										value="standalone"
										description="単独の定期収支として新規登録します"
									>
										単体で登録
									</Radio>
									<Radio
										value="addon"
										description="既存の定期収支に金額を上乗せします"
									>
										定期収支に上乗せ
									</Radio>
								</RadioGroup>

								{periodSettings[period].paymentMode === "addon" && (
									<Select
										label="上乗せ先の定期収支"
										placeholder="定期収支を選択"
										selectedKeys={
											periodSettings[period].targetTransactionId
												? [periodSettings[period].targetTransactionId]
												: []
										}
										onSelectionChange={(keys) => {
											const selected = Array.from(keys)[0] as string;
											handleTargetTransactionChange(period, selected);
										}}
										isRequired
									>
										{recurringTransactions.map((transaction) => (
											<SelectItem key={transaction.id}>
												{transaction.name} (
												{transaction.amount.toLocaleString()}円)
											</SelectItem>
										))}
									</Select>
								)}
							</CardBody>
						</Card>
					))}
				</CardBody>
			</Card>

			{/* 確認 */}
			{totalAmount > 0 && (
				<Card>
					<CardHeader>
						<h4 className="font-medium">設定内容の確認</h4>
					</CardHeader>
					<Divider />
					<CardBody>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-default-600">年度:</span>
								<span className="font-medium">{fiscalYear}年度</span>
							</div>
							<div className="flex justify-between">
								<span className="text-default-600">総額:</span>
								<span className="font-medium">
									¥{totalAmount.toLocaleString()}
								</span>
							</div>
							<Divider className="my-3" />
							{PERIODS.map(({ period, label }) => (
								<div key={period} className="flex justify-between">
									<span className="text-default-600">{label}:</span>
									<span className="font-medium">
										¥{periodSettings[period].amount.toLocaleString()}
									</span>
								</div>
							))}
						</div>
					</CardBody>
				</Card>
			)}

			<div className="flex gap-4">
				<Button
					type="button"
					color="default"
					variant="flat"
					onPress={() => router.back()}
					isDisabled={loading}
				>
					キャンセル
				</Button>
				<Button
					type="submit"
					color="primary"
					isLoading={loading}
					isDisabled={!totalAmount}
				>
					住民税設定を作成
				</Button>
			</div>
		</form>
	);
}
