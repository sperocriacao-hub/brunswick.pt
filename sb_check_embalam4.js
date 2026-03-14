const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse env manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const {data, error} = await supabase.from('qcis_audits').select('fail_date, linha_linha, peca, count_of_defects, boat_id, substation_name').gte('fail_date', '2026-03-10');
  if(error) { console.error(error); return; }
  
  console.log("Total recent rows:", data.length);
  const lineD = data.filter(d => (d.linha_linha || '').trim().toUpperCase() === 'D');
  console.log("Line D records:", lineD.length);
  
  const emb = lineD.filter(d => {
    const p = (d.peca || '').toLowerCase();
    const sub = (d.substation_name || '').toLowerCase();
    return p.includes('embalam') || sub.includes('embalam') || p.includes('inspe');
  });
  console.log("Embalamento records matched:", emb.length);
  
  const byDate = {};
  emb.forEach(d => {
      const dt = d.fail_date.split('T')[0];
      if(!byDate[dt]) byDate[dt] = { defects: 0, boats: new Set() };
      byDate[dt].defects += (Number(d.count_of_defects) || 0);
      byDate[dt].boats.add(d.boat_id);
  });
  
  for(const dt in byDate) {
      console.log(`[${dt}] Sum: ${byDate[dt].defects} | Unique Boats: ${byDate[dt].boats.size} | PDU: ${(byDate[dt].defects / byDate[dt].boats.size).toFixed(2)}`);
  }

  // Console log the raw matched records for the 13th
  const on13th = emb.filter(d => d.fail_date.startsWith('2026-03-13'));
  console.log("RAW MATCHES ON 13TH:");
  on13th.forEach(r => console.log(`ID: ${r.boat_id} | Peça: ${r.peca} | Sub: ${r.substation_name} | Def: ${r.count_of_defects}`));
}
run();
