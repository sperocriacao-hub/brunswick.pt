import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('tv') || 'Linha';

        // 1. Fetch TV
        const { data: tvs } = await supabase.from('configuracoes_tv').select('*').ilike('nome_tv', `%${searchQuery}%`);
        
        if (!tvs || tvs.length === 0) {
            return NextResponse.json({ error: 'Nenhuma TV encontrada com esse nome' });
        }

        const tv = tvs[0];
        
        // 2. Fetch RPC
        const { data: topWorker, error: rpcError } = await supabase.rpc('get_top_worker_of_month', {
            p_tipo_alvo: tv.tipo_alvo,
            p_alvo_id: tv.alvo_id
        });

        let workerRaw = topWorker;
        if (Array.isArray(topWorker) && topWorker.length > 0) {
            workerRaw = topWorker[0]; // RPC might return array of 1 since it's RETURNS TABLE
        }

        let progressionData = null;
        let workerStats = null;
        const now = new Date();
        const startOfMonthStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString().split('T')[0];

        if (workerRaw && workerRaw.funcionario_id) {
            const { data } = await supabase
                .from('avaliacoes_diarias')
                .select('*')
                .eq('funcionario_id', workerRaw.funcionario_id)
                .gte('data_avaliacao', startOfMonthStr)
                .order('data_avaliacao', { ascending: true });
            progressionData = data;
            
            // Fetch WITHOUT date limit just to see if data exists previously
            const { data: allData } = await supabase
                .from('avaliacoes_diarias')
                .select('*')
                .eq('funcionario_id', workerRaw.funcionario_id);
            workerStats = {
                todas_avaliacoes_no_banco_total: allData?.length || 0,
                amostra_datas: allData?.slice(0,3).map(x => x.data_avaliacao)
            };
        }

        return NextResponse.json({
            tvConfig: tv,
            rpcResult: topWorker,
            extractedWorker: workerRaw,
            chartQuery: {
                startOfMonthStr,
                progressionDataLength: progressionData?.length,
                data: progressionData
            },
            workerStats
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
