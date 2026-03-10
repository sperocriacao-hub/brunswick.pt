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

    let permissoesModulos: string[] = [];
    let nivelPermissao = '';

    if (user?.email) {
        if (user.email === 'master@brunswick.pt') {
            nivelPermissao = 'Admin';
        } else {
            // Fetch Admin/Operador row to get granular permissions
            const { data: opData } = await supabase
                .from('operadores')
                .select('nivel_permissao, permissoes_modulos')
                .eq('email_acesso', user.email)
                .single();

            if (opData) {
                nivelPermissao = opData.nivel_permissao || '';
                permissoesModulos = opData.permissoes_modulos || [];
            }
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-background text-foreground overflow-hidden">
            <Sidebar
                userEmail={user?.email}
                nivelPermissao={nivelPermissao}
                permissoesModulos={permissoesModulos}
            />

            <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
