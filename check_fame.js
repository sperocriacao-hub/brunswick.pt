require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function run() {
    const url = `${supabaseUrl}/rest/v1/operadores?select=id,nome_operador,matriz_talento_media,status&status=eq.Ativo&matriz_talento_media=not.is.null&order=matriz_talento_media.desc&limit=10`;
    
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const data = await res.json();
        console.log(`FOUND ${data.length} OPERATORS:`);
        console.log(data);
        
        const res2 = await fetch(`${supabaseUrl}/rest/v1/avaliacoes_diarias?select=*&limit=5`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const data2 = await res2.json();
        console.log(`\nRAW EVALUATIONS (${data2.length}):`);
        console.log(data2);
    } catch (e) {
        console.error(e);
    }
}

run();
