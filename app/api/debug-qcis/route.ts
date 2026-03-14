import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data: subsData, error } = await supabaseAdmin
        .from('qcis_audits')
        .select('substation_name');

    if (error) return NextResponse.json({ error });

    const subs = Array.from(new Set(subsData.map(d => String(d.substation_name).trim().toLowerCase())));

    return NextResponse.json({ subs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
