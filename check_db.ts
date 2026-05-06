import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing'
);

async function check() {
  const { data, error } = await supabase
    .from('hst_acoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(data);
}
check();
