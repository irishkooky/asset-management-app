import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMenu() {
	const pathname = usePathname();

	const isActive = (path: string) => {
		return pathname === path || pathname.startsWith(`${path}/`);
	};

	const navItems = [
		{ href: "/dashboard", label: "ダッシュボード" },
		{ href: "/accounts", label: "口座管理" },
		{ href: "/transactions/recurring", label: "定期的な収支" },
		{ href: "/transactions/one-time", label: "臨時収支" },
	];

	return (
		<nav className="flex space-x-4 mb-6">
			{navItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={`px-3 py-2 rounded-md text-sm font-medium ${
						isActive(item.href)
							? "bg-primary text-primary-foreground"
							: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
					}`}
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
