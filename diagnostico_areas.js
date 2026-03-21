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
        const resAreas = await fetch(`${supabaseUrl}/rest/v1/areas_fabrica?select=id,nome_area`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const areas = await resAreas.json();
        console.log(JSON.stringify(areas, null, 2));
    };
    
    checkData();
} catch (e) {
    console.error(e);
}
