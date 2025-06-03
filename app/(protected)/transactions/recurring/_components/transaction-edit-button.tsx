"use client";

import { Button } from "@/components/button";
import type { RecurringTransaction } from "@/types/database";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { EditModal } from "./edit-modal";

type TransactionEditButtonProps = {
	transaction: RecurringTransaction;
	onUpdate?: () => void;
};

export const TransactionEditButton = ({
	transaction,
	onUpdate,
}: TransactionEditButtonProps) => {
	// default_amountが存在しない場合にはamountを代用する
	const enhancedTransaction = {
		...transaction,
		default_amount: transaction.amount,
		account_id: transaction.account_id ?? null, // nullableへの対応
	};
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsModalOpen(true);
	};

	const handleClose = () => {
		setIsModalOpen(false);
	};

	const handleUpdateComplete = () => {
		setIsModalOpen(false);
		if (onUpdate) onUpdate();
	};

	return (
		<>
			<Button variant="ghost" size="sm" onClick={handleClick}>
				<IconPencil size={16} />
			</Button>

			{isModalOpen && (
				<EditModal
					isOpen={isModalOpen}
					onClose={handleClose}
					recurringTransaction={enhancedTransaction}
					onUpdate={handleUpdateComplete}
				/>
			)}
		</>
	);
};
