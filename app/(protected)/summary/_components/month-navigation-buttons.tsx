"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";

interface MonthNavigationButtonsProps {
	currentYear: number;
	currentMonth: number;
	prevYear: number;
	prevMonth: number;
	nextYear: number;
	nextMonth: number;
	monthNames: string[];
}

export function MonthNavigationButtons({
	currentYear,
	currentMonth,
	prevYear,
	prevMonth,
	nextYear,
	nextMonth,
	monthNames,
}: MonthNavigationButtonsProps) {
	const router = useRouter();
	const [isNavigating, setIsNavigating] = useState(false);
	const [navigatingDirection, setNavigatingDirection] = useState<
		"prev" | "next" | null
	>(null);

	const handleNavigation = async (href: string, direction: "prev" | "next") => {
		setIsNavigating(true);
		setNavigatingDirection(direction);

		// Use router.push for faster navigation
		router.push(href);

		// Reset loading state after navigation - the loading state will be cleared when the component unmounts
		// or when a new navigation occurs
	};

	return (
		<div className="flex justify-between items-center mb-6">
			<Button
				variant="outline"
				size="sm"
				disabled={isNavigating}
				onClick={() =>
					handleNavigation(
						`/summary?year=${prevYear}&month=${prevMonth}`,
						"prev",
					)
				}
			>
				{isNavigating && navigatingDirection === "prev" ? "読込中..." : "前月"}
			</Button>
			<h2 className="text-xl font-semibold">
				{currentYear}年 {monthNames[currentMonth - 1]}
			</h2>
			<Button
				variant="outline"
				size="sm"
				disabled={isNavigating}
				onClick={() =>
					handleNavigation(
						`/summary?year=${nextYear}&month=${nextMonth}`,
						"next",
					)
				}
			>
				{isNavigating && navigatingDirection === "next" ? "読込中..." : "翌月"}
			</Button>
		</div>
	);
}
