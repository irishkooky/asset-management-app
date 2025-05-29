import { Button } from "@/components/button";
import Link from "next/link";

export default function Loading() {
	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">定期的な収支</h1>
				<Button asChild>
					<Link href="/transactions/recurring/new">新規追加</Link>
				</Button>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
				<div className="flex flex-col gap-4">
					{/* スケルトンローダー */}
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={`account-group-${i}-${Date.now()}`} className="animate-pulse">
							<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-40 mb-4" />
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, j) => (
									<div
										key={`transaction-${i}-${j}-${Date.now()}`}
										className="flex items-center space-x-4"
									>
										<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
										<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
										<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
										<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto" />
										<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-8" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
