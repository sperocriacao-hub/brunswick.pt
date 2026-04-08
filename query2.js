const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    const { data, error } = await supabase.from('qualidade_rnc').select('numero_rnc, status, created_at').order('created_at', { ascending: false }).limit(5);
    console.log(JSON.stringify(data, null, 2));
})();
