import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database.types';

export async function createServerClient() {
	const cookieStore = await cookies();

	return createSSRClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return cookieStore.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					try {
						cookieStore.set({ name, value, ...options });
					} catch {
						// Setting cookies in some Server Component contexts is not supported.
					}
				},
				remove(name: string, options: CookieOptions) {
					try {
						cookieStore.set({ name, value: '', ...options });
					} catch {
						// Setting cookies in some Server Component contexts is not supported.
					}
				},
			},
		}
	);
}

export function createAdminClient() {
	return createSupabaseClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		}
	);
}
