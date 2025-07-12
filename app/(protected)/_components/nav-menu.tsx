"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMenu() {
	const pathname = usePathname();

	const isActive = (path: string) => {
		return pathname === path || pathname.startsWith(`${path}/`);
	};

	const navItems = [
		{ href: "/summary", label: "月次収支" },
		{ href: "/dashboard", label: "貯蓄予想" },
		{ href: "/accounts", label: "口座管理" },
		{ href: "/transactions/recurring", label: "定期的な収支" },
		{ href: "/transactions/one-time", label: "臨時収支" },
		{ href: "/resident-tax", label: "住民税設定" },
	];

	return (
		<nav className="mb-6">
			<div className="flex overflow-x-auto pb-2 hide-scrollbar">
				<div className="flex space-x-2">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium text-center flex-shrink-0 ${
								isActive(item.href)
									? "bg-primary text-primary-foreground"
									: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
							}`}
						>
							{item.label}
						</Link>
					))}
				</div>
			</div>
		</nav>
	);
}
