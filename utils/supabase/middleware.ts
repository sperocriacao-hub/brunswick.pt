import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se as chaves não estiverem no Vercel Edge, evitamos o falso 500 crashando de forma limpa.
    if (!supabaseUrl || !supabaseKey) {
        console.warn('Variáveis do Supabase em falta no Edge Runtime da Vercel!');
        return supabaseResponse;
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                        supabaseResponse = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // Validar token no Edge.
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const url = request.nextUrl.clone();
        const isAuthPage = url.pathname.startsWith('/login');
        const isAdminPage = url.pathname.startsWith('/admin') || url.pathname === '/';

        // Se NÃO estiver logado e tentar ir para rotas protegidas ou raiz
        if (!user && isAdminPage) {
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // Se JÁ estiver logado e for para /login ou raiz, manda para a Dashboard final
        if (user && (isAuthPage || url.pathname === '/')) {
            url.pathname = '/admin/producao/nova';
            return NextResponse.redirect(url);
        }

        return supabaseResponse;
    } catch (e) {
        // Se a invocação do Middleware rebentar (ex: rede Vercel lixada), passa para a frente em vez de empancar o router.
        console.error("Erro interno do Supabase Edge:", e);
        return supabaseResponse;
    }
}
