import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: Request) {
    // Only allow if DATABASE_URL is somehow resolvable on edge, or we hardcode it temporarily for the migration if we could find it.
    // Wait, if I don't have it locally, I can't run it locally, but Vercel has it in production.
    // I can deploy this temporary route, trigger it on the live site, and it will execute using Vercel's env!

    try {
        const sql = `ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS permissoes_modulos TEXT[] DEFAULT '{}';`;

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        await client.query(sql);
        await client.end();

        return NextResponse.json({ success: true, message: "Migration 57 executed via Production Env" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
