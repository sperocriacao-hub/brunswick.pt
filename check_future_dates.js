const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFutureMonths() {
    console.log("Checking DB for future dates (April 2026 to Dec 2026)...");
    const { data, error } = await supabase
        .from('qcis_audits')
        .select('fail_date')
        .gte('fail_date', '2026-04-01');
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log("No future data found.");
        return;
    }
    
    // Group by month
    const counts = {};
    data.forEach(r => {
        const month = r.fail_date.substring(0, 7);
        counts[month] = (counts[month] || 0) + 1;
    });
    
    console.log("Future Dates Found - This PROVES MM/DD/YYYY inversion!");
    console.log(counts);
}

checkFutureMonths();
