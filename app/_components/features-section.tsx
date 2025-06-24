"use client";

import { useId } from "react";

export function FeaturesSection() {
	const featuresId = useId();

	return (
		<section id={featuresId} className="scroll-mt-16">
			<h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				<FeatureCard
					icon={<DashboardIcon className="h-10 w-10 text-primary" />}
					title="直感的なダッシュボード"
					description="総資産残高や収支の推移をひと目で確認できる、シンプルで使いやすいダッシュボード。"
				/>
				<FeatureCard
					icon={<RecurringIcon className="h-10 w-10 text-primary" />}
					title="定期的な収支管理"
					description="給料や家賃などの定期的な収支を登録して、自動的に将来の残高を予測。"
				/>
				<FeatureCard
					icon={<PredictionIcon className="h-10 w-10 text-primary" />}
					title="貯蓄予測"
					description="現在の収支パターンに基づいて、1ヶ月後、3ヶ月後、1年後の資産残高を予測。"
				/>
			</div>
		</section>
	);
}

// 補助コンポーネント
function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="bg-card rounded-lg p-6 shadow-sm border">
			<div className="mb-4">{icon}</div>
			<h3 className="text-xl font-semibold mb-2">{title}</h3>
			<p className="text-muted-foreground">{description}</p>
		</div>
	);
}

// アイコンコンポーネント
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<title>ダッシュボードアイコン</title>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<path d="M9 9h.01" />
			<path d="M15 9h.01" />
			<path d="M9 15h.01" />
			<path d="M15 15h.01" />
			<path d="M9 3v18" />
			<path d="M3 9h18" />
		</svg>
	);
}

function RecurringIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<title>定期的な収支アイコン</title>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
			<path d="M12 7v5l4 2" />
		</svg>
	);
}

function PredictionIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<title>貯蓄予測アイコン</title>
			<path d="M2 12h20" />
			<path d="M2 20h20" />
			<path d="M2 4h20" />
			<path d="M6 20V4" />
			<path d="M18 20V4" />
			<path d="m6 12 6-3 6 3" />
		</svg>
	);
}
