const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAreas() {
    console.log("Fetching areas_fabrica with sigla_area...");
    const { data, error } = await supabase.from('areas_fabrica').select('id, nome_area, sigla_area');
    if (error) {
        console.error("Error fetching areas:", error);
    } else {
        console.log(`Found ${data.length} areas:`, data);
    }
}

checkAreas();
