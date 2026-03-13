const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const lines = envStr.split('\n');
let url = '';
let serviceKey = '';

for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
}

if (!url || !serviceKey) {
   console.log("Could not find keys in env");
   process.exit(1);
}

// Fetch via REST to bypass client library weirdness
fetch(`${url}/rest/v1/qcis_audits?select=fail_date,count_of_defects,lista_gate&limit=20`, {
    headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log("RAW SUPABASE DATA:");
    console.log(data);
    
    // Quick parse test
    const counts = { dom:0, seg:0, ter:0, qua:0, qui:0, sex:0, sab:0 };
    data.forEach(a => {
        const dateStr = a.fail_date;
        if (!dateStr) return;
        let y = 0, m = 0, d = 0;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts[2].length >= 4) { d = Number(parts[0]); m = Number(parts[1]); y = Number(parts[2].substring(0,4)); }
                else if (parts[0].length === 4) { y = Number(parts[0]); m = Number(parts[1]); d = Number(parts[2].substring(0,2)); }
            } else if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts[0].length === 4) { y = Number(parts[0]); m = Number(parts[1]); d = Number(parts[2].substring(0,2)); }
                else { d = Number(parts[0]); m = Number(parts[1]); y = Number(parts[2].substring(0,4)); }
            } else {
                const dt = new Date(dateStr);
                y = dt.getFullYear(); m = dt.getMonth() + 1; d = dt.getDate();
            }
        const checkDate = new Date(y, m-1, d, 12, 0, 0); 
        const dayIdx = checkDate.getDay();
        const mapa = ['dom','seg','ter','qua','qui','sex','sab'];
        counts[mapa[dayIdx]]++;
        console.log(`Parsed RAW: ${dateStr} -> y=${y} m=${m} d=${d} -> Day: ${mapa[dayIdx]}`);
    });
    console.log(counts);
})
.catch(console.error);
