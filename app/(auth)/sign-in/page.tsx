import { signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SignIn() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect("/accounts");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center py-2">
			<div className="w-full max-w-md space-y-8 px-4">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
						資産管理アプリにログイン
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Googleアカウントでログインしてください
					</p>
				</div>

				<form action={signInWithGoogle} className="mt-8">
					<Button
						type="submit"
						className="w-full flex items-center justify-center gap-3"
					>
						<svg
							className="h-5 w-5"
							aria-hidden="true"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
						</svg>
						Googleでログイン
					</Button>
				</form>
			</div>
		</div>
	);
}
