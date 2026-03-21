require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('registos_rfid_realtime')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Supabase error:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Columns found in registos_rfid_realtime:", Object.keys(data[0]));
        } else {
            console.log("No data found, but table exists. Cannot infer columns from empty response without pg. Let's try inserting a dummy row and catch the error.");
            const { error: insertErr } = await supabase.from('registos_rfid_realtime').insert([{ dummy_non_existent: 1 }]);
            console.log("Insert Error:", insertErr); // This might reveal something or we might have to just guess.
        }
    }
}
check();
