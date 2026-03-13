require('dotenv').config({ path: '.env.local' });
console.log("Keys available:");
Object.keys(process.env).filter(k => k.includes('SUPABASE')).forEach(k => console.log(k));
