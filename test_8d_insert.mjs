import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking ocorrencias...");
    const { data: occ, error: occErr } = await supabase.from('hst_ocorrencias').select('id, tipo_ocorrencia').limit(1);
    if (occErr) {
        console.error("Error fetching ocorrencias:", occErr);
        return;
    }
    if (!occ || occ.length === 0) {
        console.log("No ocorrencias found.");
        return;
    }

    const occId = occ[0].id;
    console.log("Found occ:", occId);

    console.log("Trying to list existing 8D...");
    const { data: ext, error: extErr } = await supabase.from('hst_8d').select('*');
    console.log("Existing 8D count:", ext?.length);
    if (extErr) console.error("Ext error:", extErr);

    if (ext && ext.length > 0) {
        console.log("First 8D:", ext[0]);
    }

    console.log("Trying to insert new 8D for occ:", occId);
    const payload = {
        ocorrencia_id: occId,
        status: 'Rascunho',
        d1_equipa: 'Test Automation'
    };

    const { data: ins, error: insErr } = await supabase.from('hst_8d').insert([payload]).select().maybeSingle();
    if (insErr) {
        console.error("\n[!] INSERT ERROR:");
        console.error(insErr);
    } else {
        console.log("\n[+] INSERT SUCCESS:");
        console.log(ins);
    }
}
run();
