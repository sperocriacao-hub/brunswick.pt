import { createClient } from '@/utils/supabase/server';

import { cookies } from 'next/headers';

export default async function DebugAbsent() {
    const cookieStore = cookies() as any;
    const supabase = createClient(cookieStore);

    const tvId = 'a12ba774-7275-4ae7-ac76-3aaebfd05391'; // A random TV, replace if needed, or just test logic generically

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    const { data: logs, error: lErr } = await supabase.from('log_ponto_diario')
        .select('*')
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay)
        .limit(20);

    const { data: ops, error: oErr } = await supabase.from('operadores')
        .select('id, nome_operador, tag_rfid_operador')
        .eq('status', 'Ativo')
        .limit(20);

    return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
            <h1>Diagnóstico Absenteísmo (Server-Side)</h1>
            
            <h3>Hoje: {startOfDay} até {endOfDay}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                    <h4>Últimas Picagens de Ponto Hoje ({logs?.length})</h4>
                    <pre>{JSON.stringify(logs, null, 2)}</pre>
                </div>
                <div>
                    <h4>Amostra Operadores Ativos ({ops?.length})</h4>
                    <pre>{JSON.stringify(ops, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
