"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/button";

export function DashboardLink() {
	const pathname = usePathname();

	if (pathname !== "/") return null;

	return (
		<Link href="/summary">
			<Button variant="default" size="sm">
				ダッシュボード
			</Button>
		</Link>
	);
}
