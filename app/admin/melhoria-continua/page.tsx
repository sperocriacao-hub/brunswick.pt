import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import SmartActionHubClient from './SmartActionHubClient';

export const dynamic = 'force-dynamic';

export default async function MelhoriaContinuaPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Fetch All Unified Actions (From the SQL VIEW)
    const { data: actionsMaster, error } = await supabase
        .from('view_master_acoes')
        .select('*')
        .order('created_at', { ascending: false });

    // 2. Fetch Categories
    const { data: categoriasData } = await supabase
        .from('central_acoes_categorias')
        .select('nome')
        .order('nome');
        
    const categorias = categoriasData ? categoriasData.map(c => c.nome) : ['Eficiência', 'Scraps', 'Consumíveis', 'Outro'];

    // 3. Fetch Factory Areas
    const { data: areasData } = await supabase
        .from('areas_fabrica')
        .select('id, nome_area')
        .order('ordem_sequencial');

    // 4. Fetch Production Lines
    const { data: linhasData } = await supabase
        .from('linhas_producao')
        .select('id, letra_linha')
        .order('letra_linha');

    // 5. Fetch Stations
    const { data: estacoesData } = await supabase
        .from('estacoes')
        .select('id, nome_estacao, area_id')
        .order('nome_estacao');

    return (
        <div className="bg-slate-50 min-h-screen">
            <SmartActionHubClient
                initialActions={actionsMaster || []}
                initialCategorias={categorias}
                initialAreas={areasData || []}
                initialLinhas={linhasData || []}
                initialEstacoes={estacoesData || []}
            />
        </div>
    );
}
