import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");

	// if "next" is in param, use it as the redirect URL
	const next = searchParams.get("next") ?? "/";

	// Validate that the next parameter is a safe relative path
	const isValidRedirectPath = (path: string): boolean => {
		// Ensure the path starts with / and doesn't contain protocol or domain
		return (
			path.startsWith("/") && !path.includes("://") && !path.startsWith("//")
		);
	};

	// Helper function to get the appropriate redirect URL based on environment
	const getRedirectUrl = (path: string): string => {
		const forwardedHost = request.headers.get("x-forwarded-host");
		const isLocalEnv = process.env.NODE_ENV === "development";

		if (isLocalEnv) {
			return `${origin}${path}`;
		}

		if (forwardedHost) {
			return `https://${forwardedHost}${path}`;
		}

		return `${origin}${path}`;
	};

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error("Error exchanging code for session:", error.message);
			return NextResponse.redirect(
				`${origin}?error=${encodeURIComponent(error.message)}`,
			);
		}

		// Redirect to next path if valid, otherwise to root
		const redirectPath = next && isValidRedirectPath(next) ? next : "/";
		return NextResponse.redirect(getRedirectUrl(redirectPath));
	}

	// Return the user to an error page if no code was provided
	return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
