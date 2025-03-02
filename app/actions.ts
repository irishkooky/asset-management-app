"use server";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const supabase = await createClient();
	const origin = (await headers()).get("origin");

	if (!email || !password) {
		return encodedRedirect(
			"error",
			"/sign-up",
			"Email and password are required",
		);
	}

	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${origin}/auth/callback`,
		},
	});

	if (error) {
		console.error(`${error.code} ${error.message}`);
		return encodedRedirect("error", "/sign-up", error.message);
	}

	return encodedRedirect(
		"success",
		"/sign-up",
		"Thanks for signing up! Please check your email for a verification link.",
	);
};

export const signInAction = async (formData: FormData) => {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return encodedRedirect("error", "/sign-in", error.message);
	}

	return redirect("/");
};

// パスワードリセット機能は不要（Googleログインのみ使用）

export const signOutAction = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	return redirect("/sign-in");
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
		return encodedRedirect("error", "/sign-in", error.message);
	}

	if (data.url) {
		return redirect(data.url);
	}

	return encodedRedirect("error", "/sign-in", "Something went wrong");
};
