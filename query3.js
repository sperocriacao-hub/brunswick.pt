const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    const { data: res } = await supabase.rpc('get_rnc_config_or_fail', {}).single(); // dummy call just to check if we can get schema, but we can't easily. Let's just select a row and look at the keys.
    const { data, error } = await supabase.from('qualidade_rnc').select('*').order('created_at', { ascending: false }).limit(1);
    console.log(JSON.stringify(data, null, 2));
})();
