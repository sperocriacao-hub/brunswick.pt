import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { count, error } = await supabaseAdmin.from('qcis_audits').select('*', { count: 'exact', head: true });
    
    // Group by month/day to see data spread
    const { data: daysData, error: datesError } = await supabaseAdmin
        .from('qcis_audits')
        .select('fail_date');

    if (error || datesError) return NextResponse.json({ error });

    const dateCounts: Record<string, number> = {};
    if (daysData) {
        daysData.forEach(r => {
            const d = String(r.fail_date);
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        });
    }

    return NextResponse.json({ 
        totalRecords: count,
        dateDistribution: dateCounts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
