import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
	// This `try/catch` block is only here for the interactive tutorial.
	// Feel free to remove once you have Supabase connected.
	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error("Missing Supabase environment variables");
		}

		// Create an unmodified response
		let response = NextResponse.next({
			request: {
				headers: request.headers,
			},
		});

		const supabase = createServerClient(supabaseUrl, supabaseKey, {
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					response = NextResponse.next({
						request,
					});
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		});

		// This will refresh session if expired - required for Server Components
		// https://supabase.com/docs/guides/auth/server-side/nextjs
		const user = await supabase.auth.getUser();

		// No protected routes needed

		return response;
	} catch (e) {
		// If you are here, a Supabase client could not be created!
		// This is likely because you have not set up environment variables.
		// Check out http://localhost:3000 for Next Steps.
		return NextResponse.next({
			request: {
				headers: request.headers,
			},
		});
	}
};
