'use server';

import { createClient } from '@supabase/supabase-js';

export async function criarContaAcesso(email: string, password?: string, oldEmail?: string) {
    if (!email) {
        return { success: false, error: 'Email é obrigatório para criar ou alterar o Login.' };
    }
    
    // Precisamos do Service Role Key para poder alterar emails ou redefinir senhas (Bypass segurança user)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return { success: false, error: 'A variável SUPABASE_SERVICE_ROLE_KEY não está presente no Servidor. Sem ela não é possível gerir as passwords e emails dos funcionários na Vault Auth.' };
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Procurar o utilizador antigo com Paginação Robusta (até 2000 users) para garantir que é encontrado
        let allUsers: any[] = [];
        let page = 1;
        while (page <= 2) {
            const { data: pageData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
            if (listErr) throw listErr;
            allUsers = allUsers.concat(pageData.users);
            if (pageData.users.length < 1000) break;
            page++;
        }

        // Verifica se o user já está na BD do Auth (pelo OldEmail se tiver mudado, ou pelo email atual)
        const targetUser = allUsers.find(u => u.email === (oldEmail || email));

        if (targetUser) {
            // O Utilizador existe! Faremos um Update das credenciais
            const payloadsUpdate: any = {};
            if (oldEmail && oldEmail !== email) {
                payloadsUpdate.email = email;
                payloadsUpdate.email_confirm = true;
            }
            if (password) {
                payloadsUpdate.password = password;
            }

            if (Object.keys(payloadsUpdate).length > 0) {
                const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, payloadsUpdate);
                if (updErr) return { success: false, error: 'Erro a atualizar cofre de Auth: ' + updErr.message };
            }
            return { success: true, message: 'Cofre Auth atualizado com sucesso.' };
        } else {
            // Conta nunca existiu, vamos criar de raiz
            if (!password) {
                return { success: false, error: 'Falta a Palavra-passe para este funcionário ter login pela primeira vez.' };
            }
            const { error: insertErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });
            if (insertErr) return { success: false, error: 'Erro a providenciar acesso inicial: ' + insertErr.message };
            
            return { success: true, message: 'Novo utilizador Auth sincronizado com sucesso.' };
        }

    } catch (e: any) {
         return { success: false, error: e.message || 'Erro interno de servidor RH Auth.' };
    }
}
