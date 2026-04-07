require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: areas } = await supabase.from('areas_fabrica').select('*');
    console.log("AREAS:");
    console.log(areas);

    const { data: ordens } = await supabase.from('ordens_producao').select('*').limit(3);
    console.log("ORDENS (first 3):");
    console.log(ordens);

    const { data: linhas } = await supabase.from('linhas_producao').select('*').limit(3);
    console.log("LINHAS PRODUCAO:", linhas);
}
run();
