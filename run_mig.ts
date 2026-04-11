import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlFilePath = path.join(process.cwd(), "supabase_migrations", "0027_bussola_lideranca_v2.sql");
const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

supabase.rpc("exec_sql", { sql_string: sqlContent }).then(({ error }) => {
  if (error) {
    console.error("Failed to execute SQL:", error);
  } else {
    console.log("Migration executed successfully!");
  }
});
