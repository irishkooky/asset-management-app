"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransactionFormData } from "@/types";
import { createClient } from "@/utils/supabase/client";
import {
	Button,
	Card,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Select,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddTransactionButtonProps {
	accountId: string;
}

export default function AddTransactionButton({
	accountId,
}: AddTransactionButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const formData = new FormData(e.currentTarget);
			const data: TransactionFormData = {
				description: formData.get("description") as string,
				amount: Number.parseFloat(formData.get("amount") as string),
				date: formData.get("date") as string,
				type: formData.get("type") as "regular" | "temporary",
				transactionType: formData.get("transactionType") as
					| "income"
					| "expense",
			};

			const supabase = createClient();
			const { error: supabaseError } = await supabase
				.from("transactions")
				.insert([
					{
						account_id: accountId,
						description: data.description,
						amount: data.amount,
						date: data.date,
						type: data.type,
						transaction_type: data.transactionType,
					},
				]);

			if (supabaseError) {
				throw supabaseError;
			}

			setIsOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "取引の登録に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>取引を追加</Button>
			<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<ModalContent>
					<Card>
						<ModalHeader>新規取引の追加</ModalHeader>
						<ModalBody>
							<form onSubmit={handleSubmit} className="space-y-4">
								{error && (
									<div className="text-sm text-rose-500 bg-rose-50 p-2 rounded">
										{error}
									</div>
								)}
								<div>
									<Label htmlFor="description">内容</Label>
									<Input
										id="description"
										name="description"
										required
										placeholder="給料など"
										className="mt-1"
									/>
								</div>
								<div>
									<Label htmlFor="amount">金額</Label>
									<Input
										id="amount"
										name="amount"
										type="number"
										required
										placeholder="0"
										className="mt-1"
									/>
								</div>
								<div>
									<Label htmlFor="date">日付</Label>
									<Input
										id="date"
										name="date"
										type="date"
										required
										className="mt-1"
									/>
								</div>
								<div>
									<Label htmlFor="type">種類</Label>
									<Select id="type" name="type" required className="mt-1">
										<option value="regular">定期</option>
										<option value="temporary">臨時</option>
									</Select>
								</div>
								<div>
									<Label htmlFor="transactionType">収支</Label>
									<Select
										id="transactionType"
										name="transactionType"
										required
										className="mt-1"
									>
										<option value="income">収入</option>
										<option value="expense">支出</option>
									</Select>
								</div>
								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? "登録中..." : "登録"}
								</Button>
							</form>
						</ModalBody>
					</Card>
				</ModalContent>
			</Modal>
		</>
	);
}
