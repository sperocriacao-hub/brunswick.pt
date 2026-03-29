const { createClient } = require('@supabase/supabase-js');
const s = createClient("", "");

s.from('operadores').select('nome_operador, data_nascimento, status').eq('status', 'Ativo').then(r => {
    const mar = r.data.filter(o => o.data_nascimento && (o.data_nascimento.includes('-03-') || o.data_nascimento.includes('/03/')));
    console.log("Found March Birthdays in DB directly:", mar);
});
