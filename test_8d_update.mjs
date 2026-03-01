import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const occId = 'ec517e83-8ebd-4b3d-83b1-1631c12c8671';

    console.log("Pre-flight...");
    const { data: existing, error } = await supabase
        .from('hst_8d')
        .select('id')
        .eq('ocorrencia_id', occId)
        .maybeSingle();

    if (error) {
        console.error("Error checking:", error);
        return;
    }
    console.log("Existing 8D?", existing);

    if (existing) {
        console.log("Trying to update...", existing.id);
        const { data, error: upErr } = await supabase
            .from('hst_8d')
            .update({ d1_equipa: 'UPDATED EQUIPA TEST' })
            .eq('id', existing.id)
            .select()
            .single();

        if (upErr) {
            console.error("UPDATE ERR:", upErr);
        } else {
            console.log("UPDATE OK:", data);
        }
    }
}
run();
