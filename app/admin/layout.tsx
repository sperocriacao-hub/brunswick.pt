import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

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
        <div className="admin-protected-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Aqui podes futuramente adicionar uma Sidebar Global ou Topbar Global para ser renderizada em todos os ecrãs de /admin */}
            <div style={{ padding: '0.5rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                <span>Utilizador Master Ativo: <strong>{user.email}</strong></span>
                <span style={{ display: 'flex', gap: '15px' }}>
                    <a href="/admin/modelos/novo" style={{ color: 'var(--primary)' }}>[ Cadastro Modelo ]</a>
                    <a href="/admin/producao/nova" style={{ color: 'var(--primary)' }}>[ Planeamento OP ]</a>
                    <a href="/admin/diagnostico" style={{ color: 'var(--accent)' }}>[ Diagnóstico ]</a>
                </span>
            </div>

            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}
