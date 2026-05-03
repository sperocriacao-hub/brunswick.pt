import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import SmartActionHubClient from './SmartActionHubClient';

export const dynamic = 'force-dynamic';

export default async function MelhoriaContinuaPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Fetch All Unified Actions (From the SQL VIEW)
    const { data: actionsMaster, error } = await supabase
        .from('view_master_acoes')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="bg-slate-50 min-h-screen">
            <SmartActionHubClient
                initialActions={actionsMaster || []}
            />
        </div>
    );
}
