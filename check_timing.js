const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTiming() {
    const { data, error } = await supabase.from('modelo_area_timing').select('*').limit(1);
    console.log("Error:", error?.message || "No error, data: " + JSON.stringify(data));
}

checkTiming();
