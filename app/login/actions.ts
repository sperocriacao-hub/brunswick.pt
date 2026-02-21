'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    // Trata erro de utilizador não encontrado ou password errada
    if (error) {
        redirect('/login?error=' + encodeURIComponent('Erro no login: ' + error.message))
    }

    // Acesso permitido, limpar cache e redirecionar para App!
    revalidatePath('/', 'layout')
    redirect('/admin/producao/nova')
}

export async function signup(formData: FormData) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Criação da conta de Utilizador no Supabase Auth
    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=' + encodeURIComponent('Erro ao criar Master: ' + error.message))
    }

    // Conta recém-criada volta para o form pedindo o login na nova master key
    redirect('/login?message=' + encodeURIComponent('Conta Master criada com sucesso! Podes clicar em Entrar.'))
}
