import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@heroui/react";
import { Inter } from "next/font/google";
import { signOut } from "./actions";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<html lang="ja">
			<body className={inter.className}>
				<div className="min-h-screen bg-gray-50">
					{user && (
						<header className="bg-white shadow">
							<nav className="container mx-auto px-4 py-4">
								<Card className="p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<a
												href="/accounts"
												className="text-gray-700 hover:text-gray-900"
											>
												口座一覧
											</a>
										</div>
										<form action={signOut}>
											<button
												type="submit"
												className="text-gray-600 hover:text-gray-900"
											>
												サインアウト
											</button>
										</form>
									</div>
								</Card>
							</nav>
						</header>
					)}
					<main className="py-4">{children}</main>
				</div>
			</body>
		</html>
	);
}

export const metadata = {
	title: "資産管理アプリ",
	description: "収入・支出のデータを基に、未来の貯蓄額を予測できるアプリ",
};
