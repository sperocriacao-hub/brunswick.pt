import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // M.E.S. Global Read-Only Security Interceptor
    if (typeof window !== 'undefined' && !(supabase as any).__IS_PROXIED__) {
        (supabase as any).__IS_PROXIED__ = true;
        const originalFrom = supabase.from.bind(supabase);
        
        supabase.from = (table: string) => {
            const builder = originalFrom(table);
            
            const checkPermission = (opName: string) => {
                const w = window as any;
                const perms = w.__USER_PERMISSIONS__ || [];
                const level = w.__USER_LEVEL__;
                
                // Master Admin bypass
                if (level === 'Admin') return true;
                
                const path = window.location.pathname;
                if (!path.startsWith('/admin/')) return true;
                
                // Extract base module route: e.g. /admin/engenharia/roteiros -> /admin/engenharia
                const segments = path.split('/').filter(Boolean);
                const baseModule = `/${segments[0]}/${segments[1]}`;
                
                const hasFull = perms.includes(path) || perms.includes(baseModule);
                if (!hasFull) {
                    const hasReadonly = perms.includes(`${path}:readonly`) || perms.includes(`${baseModule}:readonly`);
                    if (hasReadonly) {
                        alert(`🛑 Acesso Negado: Permissão de Apenas Leitura ativa para esta secção.\n\nA operação [${opName}] na base de dados foi bloqueada pelo M.E.S Security transversal.`);
                        return false;
                    }
                    
                    // Sem permissões e sem readonly -> Bloqueio completo para segurança! (Fail Closed)
                    if (path === '/admin' || path === '/admin/melhoria-continua') return true;
                    alert(`🛑 Acesso Negado: Não possui permissões de edição para este módulo.\nA operação [${opName}] foi bloqueada pelo M.E.S Security transversal.`);
                    return false;
                }
                
                return true;
            };

            const wrapMutate = (originalMethod: Function, opName: string) => {
                return (...args: any[]) => {
                    if (!checkPermission(opName)) {
                        // Return a Fake Postgrest Builder Chain that resolves to an error
                        const fakeBuilder = {
                            select: () => fakeBuilder,
                            eq: () => fakeBuilder,
                            neq: () => fakeBuilder,
                            in: () => fakeBuilder,
                            single: () => fakeBuilder,
                            order: () => fakeBuilder,
                            limit: () => fakeBuilder,
                            match: () => fakeBuilder,
                            or: () => fakeBuilder,
                            then: (resolve: any) => resolve({ data: null, error: { message: 'Read-only mode. Mutation blocked.', code: '403' } })
                        };
                        return fakeBuilder as any;
                    }
                    return originalMethod.apply(builder, args);
                };
            };

            builder.insert = wrapMutate(builder.insert, 'inserir');
            builder.update = wrapMutate(builder.update, 'atualizar');
            builder.delete = wrapMutate(builder.delete, 'apagar');
            builder.upsert = wrapMutate(builder.upsert, 'upsert');

            return builder;
        };
    }

    return supabase;
}
