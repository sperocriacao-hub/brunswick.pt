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
        <div className="dashboard-layout">
            <Sidebar userEmail={user?.email} />

            <div className="main-content">
                {children}
            </div>
        </div>
    );
}
