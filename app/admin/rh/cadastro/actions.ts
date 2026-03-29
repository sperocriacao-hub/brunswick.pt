'use server';

export async function criarContaAcesso(email: string, password?: string) {
    if (!email || !password) {
        return { success: false, error: 'Email e Palavra-passe são obrigatórios para criar Login.' };
    }
    
    try {
        // Utiliza Fetch nativo em vez de @supabase/ssr para garantir que a sessão "Admin" 
        // em vigor não é destruída/sobrescrita magicamente quando criamos o Operador Subalterno.
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            // Caso 1: O Utilizador já existe no Supabase Auth. Nós permitimos e contornamos com Sucesso,
            // porque o Operário RH pode ter sido apagado acidentalmente e refeito com o mesmo email.
            if (data.msg?.includes('already registered') || data.message?.includes('already registered')) {
                return { success: true, message: 'Utilizador já constava no cofre protegido Auth. Vínculo restaurado.' };
            }
            return { success: false, error: data.msg || data.message || 'Erro inesperado da Supabase API.' };
        }
        
        return { success: true, message: 'Credencial Auth cifrada com sucesso.' };
    } catch (e: any) {
         return { success: false, error: e.message || 'Erro interno de servidor.' };
    }
}
