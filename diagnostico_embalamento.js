const fs = require('fs');

async function run() {
    console.log("A iniciar extração direta via Supabase REST API...");
    
    // Ler credenciais do .env.local de forma segura
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1]] = match[2].trim().replace(/['"]/g, '');
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("Faltam credenciais Supabase no .env.local");
        return;
    }

    // Fazer a query direta à API REST do Supabase (Bypassa o @supabase/supabase-js)
    // Procurar Linha D e Peça que tenha "embalam", limitar aos recentes para análise
    const endpoint = `${url}/rest/v1/qcis_audits?select=id,fail_date,boat_id,peca,substation_name,count_of_defects,linha_linha&linha_linha=eq.D&order=fail_date.desc&limit=2000`;
    
    try {
        const response = await fetch(endpoint, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Total de registos recentes da Linha D devolvidos pela DB: ${data.length}`);

        // Filtrar no lado do cliente (script) para simular exatamente a vista do código
        const embalamentoRows = data.filter(row => {
            const peca = (row.peca || '').toLowerCase();
            return peca.includes('inspecc?o final de embalam') || peca.includes('embalam');
        });

        console.log(`\n--- RESULTADOS PARA 'EMBALAM' NA LINHA D ---`);
        console.log(`Registos encontrados: ${embalamentoRows.length}`);

        // Agrupar por data para ver onde estão os "57 defeitos"
        const byDate = {};
        embalamentoRows.forEach(r => {
            const d = r.fail_date ? r.fail_date.split('T')[0] : 'Sem Data';
            if (!byDate[d]) byDate[d] = { sum: 0, count: 0, rows: [] };
            byDate[d].sum += (Number(r.count_of_defects) || 0);
            byDate[d].count += 1;
            byDate[d].rows.push(r);
        });

        for (const date in byDate) {
            console.log(`\nData: ${date} -> Soma Defeitos = ${byDate[date].sum} (em ${byDate[date].count} registos SAP)`);
            if (byDate[date].sum > 0) {
                console.log("  Amostra de registos neste dia:");
                byDate[date].rows.slice(0, 3).forEach(r => {
                    console.log(`  - Peça: "${r.peca}" | Substation: "${r.substation_name}" | Defeitos: ${r.count_of_defects} | Barco: ${r.boat_id}`);
                });
            }
        }

    } catch (err) {
        console.error("Erro na extração:", err.message);
    }
}

run();
