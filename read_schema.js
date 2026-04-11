const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.rpc("exec_sql", { sql_string: "SELECT column_name FROM information_schema.columns WHERE table_name = 'estacoes';" }).then(res => {
    console.log(res);
});
