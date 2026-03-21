const url = "https://efenntgldjizgyyttiiw.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc";
fetch(`${url}/rest/v1/`, { headers: { 'apikey': key } })
.then(res => res.json())
.then(swagger => {
    const tableDef = swagger.definitions && swagger.definitions.registos_rfid_realtime;
    if (tableDef && tableDef.properties) {
        console.log("ACTUAL COLUMNS:", Object.keys(tableDef.properties));
    } else {
        console.log("Table definition not found in swagger.");
    }
}).catch(console.error);
