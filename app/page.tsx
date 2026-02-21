import { redirect } from 'next/navigation';

export default function RootPage() {
    // Redireciona imediatamente a raiz principal (/) 
    // para a Proteção de Rota Server-Side do Administrador (/admin).
    // O /admin avaliará se o utilizador está Logado ou mandará pro /login!
    redirect('/admin');
}
