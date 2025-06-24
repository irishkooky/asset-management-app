"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { RecurringTransaction } from "@/types/database";
import { TransactionEditButton } from "./transaction-edit-button";

type RefreshHandlerProps = {
	transaction: RecurringTransaction;
};

export const RefreshHandler = ({ transaction }: RefreshHandlerProps) => {
	const router = useRouter();
	const [_isPending, startTransition] = useTransition();

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
