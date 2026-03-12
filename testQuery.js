import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from("modelos")
    .select("id, nome_modelo, linha_padrao_id:linhas_producao(letra_linha)")
    .limit(1);

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
