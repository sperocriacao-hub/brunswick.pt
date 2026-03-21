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
        // Fetch all operators to see their exact schema keys and data mapping
        const resOps = await fetch(`${supabaseUrl}/rest/v1/operadores?select=*`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const ops = await resOps.json();

        if (Array.isArray(ops) && ops.length > 0) {
            console.log("\n--- First Operator Full Object Schema ---");
            console.log(JSON.stringify(ops[0], null, 2));

            console.log("\n--- Total Ativos with Linha/Area ---");
            const ativos = ops.filter(o => o.status === 'Ativo');
            console.log("Status 'Ativo':", ativos.length);
            console.log("With posto_base_id:", ativos.filter(o => o.posto_base_id).length);
            console.log("With linha_base_id (if exists):", ativos.filter(o => o.linha_base_id).length);
            console.log("With area_base_id (if exists):", ativos.filter(o => o.area_base_id).length);

            // Also check TV configuracoes to see what configTv.alvo_id holds
            const resTvs = await fetch(`${supabaseUrl}/rest/v1/tvs_configuradas?select=*`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            const tvs = await resTvs.json();
            console.log("\n--- TVs ---");
            tvs?.forEach(t => console.log(`TV: ${t.nome_tv} | Tipo: ${t.tipo_alvo} | alvo_id: ${t.alvo_id}`));
        } else {
             console.log(ops);
        }
    };
    
    checkData();
} catch (e) {
    console.error(e);
}
