"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";

export function UpdateBalancesButton() {
	const router = useRouter();
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdateBalances = async () => {
		setIsUpdating(true);
		try {
			// ページをリフレッシュして残高を更新
			router.refresh();
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<Button
			onClick={handleUpdateBalances}
			size="sm"
			variant="outline"
			className="whitespace-nowrap"
			disabled={isUpdating}
		>
			{isUpdating ? "更新中..." : "残高を更新"}
		</Button>
	);
}
