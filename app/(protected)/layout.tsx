import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NavMenu } from "./_components/nav-menu";

export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();

	// ユーザー認証チェック
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/");
	}

	return (
		<div className="w-full max-w-5xl mx-auto">
			<NavMenu />
			{children}
		</div>
	);
}
