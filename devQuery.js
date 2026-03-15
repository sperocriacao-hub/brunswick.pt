const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('hst_ocorrencias').select('*').order('data_hora_ocorrencia', { ascending: false }).limit(5);
    console.log("Error:", error);
    console.log("Recent Ocorrencias:", JSON.stringify(data, null, 2));

    const ptFormatter = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = ptFormatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    const todayStartStr = `${year}-${month}-${day}T00:00:00.000Z`;
    const todayEndStr = `${year}-${month}-${day}T23:59:59.999Z`;
    console.log("Query bounds:", todayStartStr, todayEndStr);
}
check();
