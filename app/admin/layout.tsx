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
            // Fetch Admin/Operador row to get granular permissions safely
            const { data: opDataArray, error: fetchErr } = await supabase
                .from('operadores')
                .select('nivel_permissao, permissoes_modulos, possui_acesso_sistema')
                .ilike('email_acesso', user.email);

            if (opDataArray && opDataArray.length > 0) {
                // Em caso de duplicação orgânica de Fichas HR c/ o mesmo email, agrega as permissões!
                // Prioriza as fichas que detêm "possui_acesso_sistema = true" para obter a role.
                const validAuthRow = opDataArray.find(r => r.possui_acesso_sistema) || opDataArray[0];
                
                nivelPermissao = validAuthRow.nivel_permissao || '';
                
                // Mesclar as rotas de todas as fichas duplicadas para não deixar a operaria às cegas
                const mergedModulos = opDataArray.flatMap(r => r.permissoes_modulos || []);
                permissoesModulos = Array.from(new Set(mergedModulos));
            }
            if (fetchErr) {
                console.error("Erro a buscar layout permissões:", fetchErr);
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
