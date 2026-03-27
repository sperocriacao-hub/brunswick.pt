const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    console.log("Checking operadores...");
    const { data: opData } = await supabase.from('operadores').select('*').limit(1);
    console.log(opData ? Object.keys(opData[0]) : "No operadores");
    console.log("Checking rh_colaboradores...");
    const { data: rhData } = await supabase.from('rh_colaboradores').select('*').limit(1).catch(()=>({data:null}));
    console.log(rhData ? Object.keys(rhData[0]) : "Empty or no rh_colaboradores");
}
run();
