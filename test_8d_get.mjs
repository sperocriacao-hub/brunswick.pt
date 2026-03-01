import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const ocorrenciaId = 'ec517e83-8ebd-4b3d-83b1-1631c12c8671';

    // Exact copy of getHst8D server action logic
    const { data: occData, error: occErr } = await supabase
        .from('hst_ocorrencias')
        .select('*, operadores:colaborador_envolvido (nome_operador)')
        .eq('id', ocorrenciaId)
        .single();

    if (occErr) { console.error("occ error", occErr); return; }

    const { data: otdData, error: otdErr } = await supabase
        .from('hst_8d')
        .select('*')
        .eq('ocorrencia_id', ocorrenciaId)
        .maybeSingle();

    if (otdErr) { console.error("otd error", otdErr); }

    console.log("Returned OtdData:", otdData ? "Exists. ID: " + otdData.id : "NULL!");
    console.log("Returned OtdData Status:", otdData?.status);
}
run();
