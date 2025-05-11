"use client";

import type { RecurringTransaction } from "@/types/database";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { TransactionEditButton } from "./transaction-edit-button";

type RefreshHandlerProps = {
	transaction: RecurringTransaction;
};

export const RefreshHandler = ({ transaction }: RefreshHandlerProps) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleUpdate = () => {
		startTransition(() => {
			// ページ全体を再取得してレンダリング
			router.refresh();
		});
	};

	return (
		<TransactionEditButton transaction={transaction} onUpdate={handleUpdate} />
	);
};
