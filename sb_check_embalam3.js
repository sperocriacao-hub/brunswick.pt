require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const {data, error} = await supabase.from('qcis_audits').select('fail_date, linha_linha, peca, count_of_defects, boat_id, substation_name').gte('fail_date', '2026-03-10');
  if(error) { console.error(error); return; }
  
  console.log("Total recent rows:", data.length);
  const lineD = data.filter(d => (d.linha_linha || '').trim() === 'D');
  console.log("Line D records:", lineD.length);
  
  const emb = lineD.filter(d => {
    const p = (d.peca || '').toLowerCase();
    const sub = (d.substation_name || '').toLowerCase();
    return p.includes('embalam') || sub.includes('embalam') || p.includes('inspe');
  });
  
  const byDate = {};
  emb.forEach(d => {
      const dt = d.fail_date.split('T')[0];
      if(!byDate[dt]) byDate[dt] = { defects: 0, boats: new Set() };
      byDate[dt].defects += (d.count_of_defects || 0);
      byDate[dt].boats.add(d.boat_id);
  });
  
  for(const dt in byDate) {
      console.log(`[${dt}] Line D -> Sum: ${byDate[dt].defects} | Unique Boats: ${byDate[dt].boats.size} | PDU: ${(byDate[dt].defects / byDate[dt].boats.size).toFixed(2)}`);
  }
}
run();
