const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching Hero of Month...");
    const { data: topWorker, error } = await supabase.rpc('get_top_worker_of_month', {
        p_tipo_alvo: 'GERAL',
        p_alvo_id: null
    }).single();
    
    console.log("Result:", topWorker);
    console.log("Error:", error);
}
run();
