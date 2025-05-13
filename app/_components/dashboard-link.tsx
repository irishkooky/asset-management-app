"use client";

import { Button } from "@/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
