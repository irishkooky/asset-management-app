"use server";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signOutAction = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	return redirect("/");
};

export const signInWithGoogleAction = async () => {
	const supabase = await createClient();
	const origin = (await headers()).get("origin");

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${origin}/auth/callback`,
		},
	});

	if (error) {
		return encodedRedirect("error", "/", error.message);
	}

	if (data.url) {
		return redirect(data.url);
	}

	return encodedRedirect("error", "/", "Something went wrong");
};
