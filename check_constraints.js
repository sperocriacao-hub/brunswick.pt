const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    const { data, error } = await supabase.rpc('get_table_constraints', { p_table_name: 'ordens_producao' });
    if (error) {
        console.error("RPC failed, fetching via direct query might be needed:", error);
        return;
    }
    console.log("Constraints:", data);
}

checkConstraints();
