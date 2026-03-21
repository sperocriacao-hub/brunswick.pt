const fs = require('fs');
const env = fs.readFileSync('/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch[1].trim().replace(/["']/g, '');
const key = keyMatch[1].trim().replace(/["']/g, '');

fetch(`${url}/rest/v1/`, {
    headers: { 'apikey': key }
})
.then(res => res.json())
.then(swagger => {
    const tableDef = swagger.definitions && swagger.definitions.registos_rfid_realtime;
    if (tableDef && tableDef.properties) {
        console.log("ACTUAL COLUMNS:", Object.keys(tableDef.properties));
    } else {
        console.log("Table definition not found in swagger.");
    }
}).catch(console.error);
