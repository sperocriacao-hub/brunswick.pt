import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read manual keys
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function dump() {
    console.log("Fetching ops...");
    const { data: ops } = await supabase.from('operadores').select('id, nome_operador, status').eq('status', 'Ativo');
    
    console.log("Fetching evals...");
    const { data: evals } = await supabase.from('avaliacoes_diarias').select('*');
    
    const out = { ops: ops || [], evals: evals || [] };
    fs.writeFileSync('db_dump_debug.json', JSON.stringify(out, null, 2));
    console.log("Wrote to db_dump_debug.json");
}

dump();
