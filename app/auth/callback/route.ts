import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	// The `/auth/callback` route is required for the server-side auth flow implemented
	// by the SSR package. It exchanges an auth code for the user's session.
	// https://supabase.com/docs/guides/auth/server-side/nextjs
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");

	// Get host and construct origin
	const host = requestUrl.host;
	const protocol = host.includes("localhost") ? "http" : "https";
	const origin = `${protocol}://${host}`;

	const next = requestUrl.searchParams.get("next")?.toString();

	// Validate that the next parameter is a safe relative path
	const isValidRedirectPath = (path: string | undefined): boolean => {
		if (!path) return false;
		// Ensure the path starts with / and doesn't contain protocol or domain
		return (
			path.startsWith("/") && !path.includes("://") && !path.startsWith("//")
		);
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
	}

	// Only redirect to next if it's a valid relative path
	if (next && isValidRedirectPath(next)) {
		return NextResponse.redirect(`${origin}${next}`);
	}

	// URL to redirect to after sign up process completes
	return NextResponse.redirect(`${origin}`);
}
