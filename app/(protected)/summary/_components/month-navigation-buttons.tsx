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
import { useEffect, useRef, useState } from "react";

interface MonthNavigationButtonsProps {
	currentYear: number;
	currentMonth: number;
	prevYear: number;
	prevMonth: number;
	nextYear: number;
	nextMonth: number;
	monthNames: string[];
}

interface YearMonthOption {
	year: number;
	month: number;
	label: string;
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
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Generate year-month options (3 years back, 1 year forward)
	const currentActualYear = new Date().getFullYear();
	const yearMonthOptions: YearMonthOption[] = [];
	for (
		let year = currentActualYear - 3;
		year <= currentActualYear + 1;
		year++
	) {
		for (let month = 1; month <= 12; month++) {
			yearMonthOptions.push({
				year,
				month,
				label: `${year}年${monthNames[month - 1]}`,
			});
		}
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

		router.push(href);

		setTimeout(() => {
			setIsNavigating(false);
			setNavigatingDirection(null);
		}, 3000);
	};

	const handleYearMonthSelect = (year: number, month: number) => {
		router.push(`/summary?year=${year}&month=${month}`);
	};

	const currentLabel = `${currentYear}年${monthNames[currentMonth - 1]}`;
	const isCurrentOption = (option: YearMonthOption) =>
		option.year === currentYear && option.month === currentMonth;

	const currentOptionIndex = yearMonthOptions.findIndex(
		(option) => option.year === currentYear && option.month === currentMonth,
	);

	// Scroll to current option when dropdown opens
	useEffect(() => {
		if (!isDropdownOpen || currentOptionIndex === -1) return;

		const timer = setTimeout(() => {
			const currentKey = `${currentYear}-${currentMonth}`;
			
			// Find the dropdown menu element (HeroUI uses portal, so search document)
			const menuElement = document.querySelector<HTMLElement>(
				'[role="listbox"], [data-slot="base"] [class*="overflow"]',
			);
			
			if (!menuElement) return;

			// Find the current option by key attribute or text content
			const currentItem = Array.from(
				menuElement.querySelectorAll<HTMLElement>('[role="option"], li, button'),
			).find((item) => {
				const key = item.getAttribute('data-key') || 
				           item.getAttribute('data-value') ||
				           item.textContent?.trim();
				return key === currentKey || 
				       key?.includes(`${currentYear}年${monthNames[currentMonth - 1]}`);
			});

			if (!currentItem) return;

			// Scroll the current item into view, centered if possible
			currentItem.scrollIntoView({
				behavior: 'instant',
				block: 'center',
			});
		}, 150);

		return () => clearTimeout(timer);
	}, [isDropdownOpen, currentOptionIndex, currentYear, currentMonth, monthNames]);

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

			<div ref={menuRef}>
				<Dropdown onOpenChange={setIsDropdownOpen}>
					<DropdownTrigger>
						<Button
							variant="light"
							endContent={<IconChevronDown size={16} />}
							className="text-xl font-semibold px-0"
						>
							{currentLabel}
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label="年月の選択"
						className="max-h-[300px] overflow-y-auto"
						selectedKeys={[`${currentYear}-${currentMonth}`]}
					>
						{yearMonthOptions.map((option) => (
							<DropdownItem
								key={`${option.year}-${option.month}`}
								onPress={() => handleYearMonthSelect(option.year, option.month)}
								className={isCurrentOption(option) ? "bg-primary-50" : ""}
								textValue={option.label}
							>
								{option.label} {isCurrentOption(option) && "✓"}
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
