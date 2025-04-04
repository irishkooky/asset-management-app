import { Button } from "@/components/button";
import LoginButton from "@/components/login-button";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const metadata = {
	title: "資産管理アプリ - シンプルで使いやすい家計簿・資産管理ツール",
	description:
		"収支の把握から将来の貯蓄予測まで一元管理できる資産管理アプリ。シンプルで使いやすいインターフェースで、あなたの資産管理をサポートします。",
};

export default async function Home() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<div className="space-y-16 py-8">
			{/* ヒーローセクション */}
			<section className="py-12">
				<div className="max-w-3xl mx-auto text-center space-y-8">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight">
						あなたの資産を<span className="text-primary">スマートに管理</span>
					</h1>
					<p className="text-xl text-muted-foreground">
						シンプルで使いやすい資産管理アプリで、収支の把握から将来の貯蓄予測まで一元管理。
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
						{user ? (
							<Link href="/dashboard">
								<Button size="lg" variant="default">
									ダッシュボード
								</Button>
							</Link>
						) : (
							<LoginButton size="lg" variant="default">
								今すぐ始める
							</LoginButton>
						)}
						<Button variant="outline" size="lg" asChild>
							<Link href="/demo">デモを見る</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* 特徴セクション */}
			<section id="features" className="scroll-mt-16">
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

			{/* 使い方セクション */}
			<section className="bg-muted/50 rounded-lg p-8">
				<h2 className="text-3xl font-bold text-center mb-8">簡単3ステップ</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<StepCard
						number={1}
						title="アカウント登録"
						description="Googleアカウントで簡単登録。面倒な入力は不要です。"
					/>
					<StepCard
						number={2}
						title="収支情報の登録"
						description="定期的な収入や支出を登録して、資産管理の基盤を作ります。"
					/>
					<StepCard
						number={3}
						title="資産の可視化"
						description="ダッシュボードで資産状況を確認し、将来の貯蓄目標を立てましょう。"
					/>
				</div>
			</section>

			{/* CTAセクション */}
			<section className="text-center space-y-6 py-8">
				<h2 className="text-3xl font-bold">今すぐ始めましょう</h2>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					資産管理の第一歩は、現状を把握することから。
					シンプルで使いやすいツールで、あなたの資産管理をサポートします。
				</p>
				<div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
					<LoginButton size="lg" variant="default">
						無料で始める
					</LoginButton>
					<Button variant="outline" size="lg" asChild>
						<Link href="/demo">デモを試す</Link>
					</Button>
				</div>
			</section>
		</div>
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

function StepCard({
	number,
	title,
	description,
}: {
	number: number;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center text-center">
			<div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
				{number}
			</div>
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
