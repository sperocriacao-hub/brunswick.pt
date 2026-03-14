const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://efenntgldjizgyyttiiw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('qcis_audits').select('substation_name');
  if(error) { console.log(error); return;}
  const unique = new Set(data.map(d => String(d.substation_name).toLowerCase()));
  console.log('Substations:', Array.from(unique));
}
run();
