"use client";

import { Button } from "@heroui/button";
import {
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/dropdown";
import { IconChevronDown } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

	// Generate year options (3 years back, 1 year forward)
	const currentActualYear = new Date().getFullYear();
	const yearOptions = [];
	for (
		let year = currentActualYear - 3;
		year <= currentActualYear + 1;
		year++
	) {
		yearOptions.push(year);
	}

	// Reset navigation state when year/month changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to reset state when props change
	useEffect(() => {
		setIsNavigating(false);
		setNavigatingDirection(null);
	}, [currentYear, currentMonth]);

	const handleNavigation = async (href: string, direction: "prev" | "next") => {
		setIsNavigating(true);
		setNavigatingDirection(direction);

		// Use router.push for faster navigation
		router.push(href);

		// Also set a timeout to reset state in case the navigation doesn't update props
		setTimeout(() => {
			setIsNavigating(false);
			setNavigatingDirection(null);
		}, 3000);
	};

	const handleYearSelect = (year: number) => {
		router.push(`/summary?year=${year}&month=${currentMonth}`);
	};

	const handleMonthSelect = (month: number) => {
		router.push(`/summary?year=${currentYear}&month=${month}`);
	};

	return (
		<div className="flex justify-between items-center mb-6">
			<Button
				variant="bordered"
				size="sm"
				isDisabled={isNavigating}
				onPress={() =>
					handleNavigation(
						`/summary?year=${prevYear}&month=${prevMonth}`,
						"prev",
					)
				}
			>
				{isNavigating && navigatingDirection === "prev" ? "読込中..." : "前月"}
			</Button>

			<div className="flex items-center gap-2">
				{/* 年選択 */}
				<Dropdown>
					<DropdownTrigger>
						<Button
							variant="light"
							endContent={<IconChevronDown size={16} />}
							className="text-xl font-semibold"
						>
							{currentYear}年
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label="年の選択"
						className="max-h-[300px] overflow-y-auto"
					>
						{yearOptions.map((year) => (
							<DropdownItem
								key={`year-${year}`}
								onPress={() => handleYearSelect(year)}
								className={year === currentYear ? "bg-primary-50" : ""}
							>
								{year}年 {year === currentYear && "✓"}
							</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>

				{/* 月選択 */}
				<Dropdown>
					<DropdownTrigger>
						<Button
							variant="light"
							endContent={<IconChevronDown size={16} />}
							className="text-xl font-semibold"
						>
							{monthNames[currentMonth - 1]}
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label="月の選択"
						className="max-h-[300px] overflow-y-auto"
					>
						{monthNames.map((monthName, index) => (
							<DropdownItem
								key={`month-${index + 1}`}
								onPress={() => handleMonthSelect(index + 1)}
								className={index + 1 === currentMonth ? "bg-primary-50" : ""}
							>
								{monthName} {index + 1 === currentMonth && "✓"}
							</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
			</div>

			<Button
				variant="bordered"
				size="sm"
				isDisabled={isNavigating}
				onPress={() =>
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
