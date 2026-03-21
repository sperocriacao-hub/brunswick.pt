const fs = require('fs');

try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const getEnv = (key) => {
        const match = envFile.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };
    
    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY');

    const checkData = async () => {
        // Fetch ops but ignore errors, see what returns
        const resOps = await fetch(`${supabaseUrl}/rest/v1/operadores?select=id,nome_operador,status,tag_rfid_operador,posto_base_id,estacao_alocada_temporaria`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const ops = await resOps.json();

        console.log(JSON.stringify(ops, null, 2));
    };
    
    checkData();
} catch (e) {
    console.error(e);
}
