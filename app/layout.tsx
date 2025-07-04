import { Geist } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";
import HeaderAuth from "./_components/header-auth";
import "./globals.css";
import { HeroUIProvider } from "@heroui/react";

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: "資産管理アプリ",
	description: "収入・支出データを基に未来の貯蓄額を予測するアプリケーション",
};

const geistSans = Geist({
	display: "swap",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={geistSans.className} suppressHydrationWarning>
			<body className="bg-background text-foreground">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<HeroUIProvider>
						<main className="min-h-screen flex flex-col items-center">
							<div className="flex-1 w-full flex flex-col items-center">
								<nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
									<div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
										<Link
											href={"/dashboard"}
											className="font-semibold whitespace-nowrap"
										>
											資産管理アプリ
										</Link>
										<HeaderAuth />
									</div>
								</nav>
								<div className="flex flex-col gap-8 sm:gap-20 max-w-5xl p-3 sm:p-5 w-full">
									{children}
								</div>

								<footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
									<p>© 2025 資産管理アプリ</p>
									<ThemeSwitcher />
								</footer>
							</div>
						</main>
					</HeroUIProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
