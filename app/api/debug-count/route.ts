import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("qcis_audits")
      .select("fail_date, boat_id, peca, substation_name, count_of_defects, linha_linha")
      .eq('linha_linha', 'D')
      .gte('fail_date', '2026-03-12')
      .lte('fail_date', '2026-03-14');

    if (error) throw error;

    let embSum = 0;
    const boats = new Set();
    const rowsFound: any[] = [];
    
    // Group all defects by date
    const breakdown: any = {};

    data.forEach(r => {
        const p = (r.peca || "").toLowerCase();
        if (p.includes("embalam") && (p.includes("final") || p.includes("fim") || p.includes("inspe"))) {
            embSum += r.count_of_defects || 0;
            boats.add(r.boat_id);
            rowsFound.push(r);
            
            const dStr = r.fail_date.split('T')[0];
            if(!breakdown[dStr]) breakdown[dStr] = { defects: 0, boats: new Set() };
            breakdown[dStr].defects += (r.count_of_defects || 0);
            breakdown[dStr].boats.add(r.boat_id);
        }
    });

    const breakdownResult: any = {};
    for (let k in breakdown) {
        breakdownResult[k] = { defects: breakdown[k].defects, boats: Array.from(breakdown[k].boats) };
    }

    return NextResponse.json({
        totalSum: embSum,
        totalBoats: Array.from(boats),
        breakdown: breakdownResult,
        rows: rowsFound
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
