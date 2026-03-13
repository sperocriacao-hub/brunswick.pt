import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        const supabase = createClient(sbUrl, sbKey);
        
        // Grab top 200 records to inspect the distribution
        const { data, error } = await supabase
            .from('qcis_audits')
            .select('fail_date')
            .not('fail_date', 'is', null)
            .limit(200);
            
        if (error) {
            return NextResponse.json({ success: false, error: error.message });
        }
        
        // Return raw data
        return NextResponse.json({ success: true, count: data?.length || 0, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
