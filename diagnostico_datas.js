const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDates() {
    console.log("Analyzing dates in Supabase for March 2026...");
    const { data, error } = await supabase
        .from('qcis_audits')
        .select('fail_date')
        .gte('fail_date', '2026-03-01')
        .lte('fail_date', '2026-03-31');
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log("No data found for March 2026.");
        return;
    }
    
    const uniqueDates = [...new Set(data.map(r => r.fail_date.split('T')[0]))].sort().reverse();
    console.log(`\nFound ${uniqueDates.length} ACTIVE DATES in March 2026:`);
    console.log(uniqueDates.join('\n'));
}

checkDates();
