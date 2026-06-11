import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * 認証済みユーザーを取得する。未認証の場合は例外を投げる。
 * データ層の各関数で繰り返されていた認証チェックの共通化。
 */
export async function requireUser(
	supabase: TypedSupabaseClient,
): Promise<User> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("ユーザーが認証されていません");
	}

	return user;
}
