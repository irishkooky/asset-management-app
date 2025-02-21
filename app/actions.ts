"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
		},
	});

	if (error) {
		return redirect("/sign-in?error=Could not authenticate user");
	}

	return redirect(data.url);
}

export async function signOut() {
	const supabase = await createClient();
	const { error } = await supabase.auth.signOut();

	if (error) {
		return redirect("/accounts?error=Could not sign out");
	}

	return redirect("/sign-in");
}
