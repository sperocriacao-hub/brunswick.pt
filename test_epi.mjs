import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: areas, error: aErr } = await supabase.from('areas_fabrica').select('id').limit(1);

    if (aErr || !areas || areas.length === 0) {
        console.error("Area error", aErr);
        return;
    }

    const areaId = areas[0].id;
    console.log("Found area:", areaId);

    const payload = {
        area_id: areaId,
        epi_capacete: true
    };

    console.log("Attempting insert...");
    const { data: result, error: iErr } = await supabase.from('hst_matriz_epis').insert(payload);

    if (iErr) {
        console.error("INSERT ERROR:");
        console.dir(iErr, { depth: null });
    } else {
        console.log("INSERT SUCCESS");
        console.log(result);
    }
}
run();
