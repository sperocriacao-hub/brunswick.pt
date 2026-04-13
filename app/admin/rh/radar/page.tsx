import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import RadarDashboardClient from './RadarDashboardClient';

export const dynamic = 'force-dynamic';

export default async function RadarShopfloorPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Fetch Topology (Áreas, Linhas, Estações)
    const [
        { data: areas },
        { data: linhas },
        { data: estacoes }
    ] = await Promise.all([
        supabase.from('areas_fabrica').select('id, nome_area').order('nome_area'),
        supabase.from('linhas_producao').select('id, descricao_linha, letra_linha').order('descricao_linha'),
        supabase.from('estacoes').select('id, nome_estacao, area_id, linha_id').order('nome_estacao')
    ]);

    // 2. Fetch Operadores (Ativos) e suas realocações temporárias
    const { data: operadores } = await supabase
        .from('operadores')
        .select(`
            id,
            nome_operador,
            tag_rfid_operador,
            funcao,
            iluo_nivel,
            posto_base_id,
            estacao_alocada_temporaria,
            em_realocacao
        `)
        .eq('status', 'Ativo');

    // 3. Fetch Pontos de Hoje (Para determinar Presença Efetiva)
    // Obtemos o registo de ponto do dia atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.toISOString();

    const { data: pontosHoje } = await supabase
        .from('log_ponto_diario')
        .select('operador_rfid, tipo_registo, timestamp')
        .gte('timestamp', startOfDay)
        .lt('timestamp', endOfDay)
        .order('timestamp', { ascending: true });

    // Determinar a lista de RFIDs presentes hoje com o timestamp da entrada. 
    const presencasTimestampMap: Record<string, string> = {};
    
    // Iterar kronos
    if (pontosHoje) {
        // Se quisermos apenas quem está com "ENTRADA" ativa sem "SAÍDA":
        const statusMap = new Map<string, { tipo: string, ts: string }>();
        pontosHoje.forEach(p => {
            statusMap.set(p.operador_rfid, { tipo: p.tipo_registo, ts: p.timestamp });
        });
        
        statusMap.forEach((data, rfid) => {
            if (data.tipo === 'ENTRADA') {
                presencasTimestampMap[rfid] = data.ts;
            }
        });
    }

    return (
        <RadarDashboardClient 
            areas={areas || []}
            linhas={linhas || []}
            estacoes={estacoes || []}
            operadores={operadores || []}
            presencasRfidMap={presencasTimestampMap}
        />
    );
}
