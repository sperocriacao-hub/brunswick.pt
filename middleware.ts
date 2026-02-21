import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // DESATIVADO TEMPORARIAMENTE NO EDGE DO VERCEL:
    // Evita crashar chamadas SSR do Supabase neste momento onde
    // só precisamos de testar o front-end aberto do Administrador.
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
