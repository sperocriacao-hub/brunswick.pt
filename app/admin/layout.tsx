import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { Sidebar } from './Sidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Verificação de Autenticação segura do lado do Servidor com Node.js (E não Edge Runtime)
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        // Se não houver sessão de Master Admin válida, chuta de volta para o Login
        redirect('/login');
    }

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <Sidebar userEmail={user?.email} />

            <main className="flex-1 overflow-y-auto bg-slate-100 p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}
