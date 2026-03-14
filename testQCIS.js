require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase.from('qcis_audits').select('id, fail_date, substation_name, count_of_defects, object_type, seccao').limit(5);
    console.log(data);
    if(error) console.error(error);
}
run();
