import { Card, CardBody, Skeleton } from "@heroui/react";

export default function DashboardLoading() {
	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			<div className="space-y-8">
				{/* Title Skeleton */}
				<Skeleton className="rounded-lg">
					<div className="h-10 w-48 bg-gray-300" />
				</Skeleton>

				{/* Chart Card Skeleton */}
				<Card>
					<CardBody className="p-6">
						<Skeleton className="rounded-lg mb-6">
							<div className="h-8 w-48 bg-gray-300" />
						</Skeleton>
						<Skeleton className="rounded-lg">
							<div className="h-[400px] w-full bg-gray-300" />
						</Skeleton>
					</CardBody>
				</Card>

				{/* Table Card Skeleton */}
				<Card>
					<CardBody className="p-6">
						<Skeleton className="rounded-lg mb-6">
							<div className="h-8 w-48 bg-gray-300" />
						</Skeleton>
						<div className="space-y-3">
							{Array.from({ length: 6 }).map((_, index) => {
								const uniqueKey = `skeleton-row-${Date.now()}-${index}`;
								return (
									<Skeleton key={uniqueKey} className="rounded-lg">
										<div className="h-12 w-full bg-gray-300" />
									</Skeleton>
								);
							})}
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
