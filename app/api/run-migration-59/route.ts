import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Initialize the Supabase client with the Service Role Key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "supabase", "migrations", "0059_modelos_linha_padrao.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Execute the SQL using the Supabase Postgres meta-function or rpc if you mapped it
    // Note: To execute raw SQL, you generally need an RPC function like 'exec_sql'
    // Since we usually map this for migrations, we assume the RPC 'exec_sql' exists or we run it via psql
    // For safety, let's try the rpc 'exec_sql'. If it doesn't exist, we'll inform the user.
    
    // Instead of raw exec_sql which might not be installed, we will instruct the user to run this locally
    // OR try our best to run it through a standard query if supported. 
    // Actually, running raw DDL via REST API in Supabase requires an RPC. 
    // Let's assume the user has set up `exec_sql(sql_string)` or we will output the SQL.

    // Let's execute via psql CLI via run_command instead, as that's native and robust if we have local psql.
    // Since we are creating a generic API route, let's just make it return the SQL for the user to copy-paste 
    // OR we can create a temporary node script that connects to PG directly.

    // Better approach: Since we are in an agent, we can just use the proxy RPC we used for previous migrations if it exists.
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql_string: sqlContent });

    if (error) {
      // IF RPC fails, it likely doesn't exist.
      console.error("RPC exec_sql failed. You might need to run this manually in the Supabase SQL Editor:", error);
      return NextResponse.json({ error: error.message, sql: sqlContent }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Migration 0059 executed successfully via RPC." });
  } catch (error: any) {
    console.error("Migration execution failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
