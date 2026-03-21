const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function checkData() {
    const res = await fetch(`${supabaseUrl}/rest/v1/log_ponto_diario?select=*&limit=10&order=timestamp.desc`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

checkData();
