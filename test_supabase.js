const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://efenntgldjizgyyttiiw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc');

async function test() {
    console.log("Testing Modelos...");
    const req1 = await supabase.from('modelos').select('*').limit(1);
    console.log("Modelos:", req1.data || req1.error);

    console.log("Testing Linhas_producao...");
    const req2 = await supabase.from('linhas_producao').select('*').limit(1);
    console.log("Linhas:", req2.data || req2.error);

    console.log("Testing Roteiros...");
    const req3 = await supabase.from('roteiros_producao').select('*').limit(1);
    console.log("Roteiros:", req3.data || req3.error);
}
test();
