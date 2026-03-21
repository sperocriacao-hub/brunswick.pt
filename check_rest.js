const fs = require('fs');

const env = fs.readFileSync('/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
    console.error("Credentials not found in .env.local");
    process.exit(1);
}

const url = urlMatch[1].trim().replace(/["']/g, '');
const key = keyMatch[1].trim().replace(/["']/g, '');

fetch(`${url}/rest/v1/registos_rfid_realtime?select=*&limit=1`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
})
.then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.json();
})
.then(data => {
    console.log("REST API Response:");
    if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("Table is empty, trying to insert an invalid row to get error details...");
        return fetch(`${url}/rest/v1/registos_rfid_realtime`, {
            method: 'POST',
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ this_column_does_not_exist: 1 })
        }).then(r => r.json()).then(e => console.log("Insert Error:", e));
    }
})
.catch(e => console.error(e));
