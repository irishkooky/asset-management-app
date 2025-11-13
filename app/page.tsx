import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/button";
import { LoginButton } from "@/components/login-button";
import { createClient } from "@/utils/supabase/server";
import { FeaturesSection } from "./_components/features-section";

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

	const appUrl = "https://asset-management-app-irishkookys.vercel.app";

	return (
		<div className="space-y-16 py-8">
			{/* ヒーローセクション */}
			<section className="py-12">
				<div className="max-w-3xl mx-auto text-center space-y-8">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight">
						あなたの資産を<span className="text-primary">スマートに管理</span>
					</h1>
<p className="text-xl text-muted-foreground">
シンプルで使いやすい資産管理アプリで、毎日の収支から将来の貯蓄までをまるごと見える化。
</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
						{user ? (
							<Link href="/summary">
								<Button size="lg" variant="default">
									ダッシュボード
								</Button>
							</Link>
						) : (
							<LoginButton size="lg" variant="default">
								今すぐ始める
							</LoginButton>
						)}
					</div>
				</div>
			</section>

			<FeaturesSection />

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

			{/* QRコードセクション */}
			<section className="text-center space-y-6 py-8">
				<h2 className="text-3xl font-bold">アプリのQRコード</h2>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					スマートフォンでQRコードを読み取って、アプリにアクセスできます。
				</p>
				<div className="flex justify-center py-4">
					<QRCodeSVG
						value={appUrl}
						size={192}
						bgColor={"#ffffff"}
						fgColor={"#000000"}
						level={"L"}
					/>
				</div>
			</section>

			{/* CTAセクション */}
			<section className="text-center space-y-6 py-8">
				<h2 className="text-3xl font-bold">今すぐ始めましょう</h2>
<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
資産管理の第一歩は、現状を把握することから。
シンプルな操作で、これからのマネープランづくりを後押しします。
</p>
				<div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
					<LoginButton size="lg" variant="default">
						無料で始める
					</LoginButton>
				</div>
			</section>
		</div>
	);
}

// 補助コンポーネント
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
