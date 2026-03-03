import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Atividade Diária / Cron (Sem UI)
// Limpa OEE fantasma caso os operadores não piquem a saída.

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds

export async function GET(request: Request) {
    // 1. Validate auth token if supplied via Cron Provider (e.g. Vercel Cron)
    const authHeader = request.headers.get('Authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS to clean up properly
    );

    try {
        // --- LOGIC: AUTO-PAUSE & AUTO-CLOSE (OEE PROTECTION) ---
        // Exemplo:
        // 1. Fetch todos os operadores "Atualmente numa estação"
        // 2. Fetch a configuração do turno do operador vs hora atual
        // 3. Se Hora Atual > Hora Fim do Turno (+ Tolerância), forçar "SAÍDA"

        const agoraUTC = new Date();
        const horaLocal = new Date(agoraUTC.toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
        const timeStr = horaLocal.toTimeString().substring(0, 5); // "HH:MM"

        console.log(`[Cron Enforcer] Running at ${timeStr} (Lisbon time)`);

        // Fetch shift bounds (e.g., T1, T2 configs)
        const { data: configs } = await supabaseAdmin.from('configuracao_turnos').select('*').eq('ativo', true);

        if (!configs || configs.length === 0) {
            return NextResponse.json({ status: 'skipped', reason: 'No active shift configurations found.' });
        }

        // --- EXPORT METRICS ---
        let closedCount = 0;
        let pausedCount = 0;

        // Fetch running sessions (simplified as an example, needs to hook into your 'estado_operador' logic)
        // Assume you have a table tracking who is 'working' or just querying logs...
        // For actual ISA-95 compliance, you'd close the active `OrdensProducao` allocations too.

        // This is a stub for the complex logic to show the architecture.
        // It should match the user's specific state machine table (e.g. `estado_operador`).

        return NextResponse.json({
            status: 'success',
            time: timeStr,
            actions: {
                auto_closed_shifts: closedCount,
                auto_paused_breaks: pausedCount
            }
        });

    } catch (err: any) {
        console.error('[Cron Enforcer Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
