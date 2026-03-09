const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('estacoes_sequencia').select('*').limit(1);
    // If the table is empty and we select *, data will be an empty array [] but we'll know the keys if we use a different query.
    // However, if we do a single insert and get the error, that tells us something.
    console.log(error || (data && data.length > 0 ? Object.keys(data[0]) : "Empty table, cannot infer columns from select *"));
}

checkColumns();
