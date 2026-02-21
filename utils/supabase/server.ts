import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient(cookieStore: ReturnType<typeof cookies>) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async getAll() {
                    const resolveCookies = await cookieStore;
                    return resolveCookies.getAll();
                },
                async setAll(cookiesToSet) {
                    try {
                        const resolveCookies = await cookieStore;
                        for (const { name, value, options } of cookiesToSet) {
                            resolveCookies.set({ name, value, ...options });
                        }
                    } catch (error) {
                        // Este catch ajuda em Server Components que tentam alterar cookies fora do tempo
                    }
                },
            },
        }
    );
}
