const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) acc[match[1]] = match[2];
    return acc;
}, {});

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
    console.log("Starting Raw Injection to", URL);
    const headers = {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // 1. Fetch the Model ID
    let modelRes = await fetch(`${URL}/rest/v1/modelos?nome_modelo=eq.Brunswick%20X-Pro%20(Manual%20Edition)&select=id`, { headers });
    let models = await modelRes.json();
    let modelId = models[0]?.id;
    console.log("Model ID:", modelId);

    // 2. Fetch the Estacoes IDs
    let estRes = await fetch(`${URL}/rest/v1/estacoes?select=id&order=nome_estacao.asc`, { headers });
    let estacoes = await estRes.json();
    console.log("Stations found:", estacoes.length);

    // 3. Create Mold
    let moldRes = await fetch(`${URL}/rest/v1/moldes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            nome_parte: 'Molde Golden X-Pro',
            categoria: 'BIG_PART',
            tipo_parte: 'Casco',
            ciclos_estimados: 0,
            limite_ciclos: 50,
            moldagem_obrigatoria: true
        })
    });
    let resultMold = await moldRes.text();
    console.log("Mold Creation:", moldRes.status, resultMold);

    // 4. Create Roteiro
    if (modelId && estacoes.length >= 3) {
        let routeRes = await fetch(`${URL}/rest/v1/roteiros_producao`, {
            method: 'POST',
            headers,
            body: JSON.stringify([
                { modelo_id: modelId, estacao_id: estacoes[0].id, sequencia: 1, tempo_estimado_minutos: 120 },
                { modelo_id: modelId, estacao_id: estacoes[1].id, sequencia: 2, tempo_estimado_minutos: 240 },
                { modelo_id: modelId, estacao_id: estacoes[2].id, sequencia: 3, tempo_estimado_minutos: 360 }
            ])
        });
        console.log("Routing Creation:", routeRes.status, await routeRes.text());
    } else {
        console.log("Skipping Route Creation. Missing modelId or stations.");
    }
}

run();
