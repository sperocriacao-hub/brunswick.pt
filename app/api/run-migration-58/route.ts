import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: Request) {
    try {
        const sql = `
ALTER TABLE public.alertas_andon
ADD COLUMN IF NOT EXISTS local_ocorrencia_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL;

UPDATE public.alertas_andon
SET local_ocorrencia_id = estacao_id
WHERE local_ocorrencia_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_andon_local_ocorrencia ON public.alertas_andon(local_ocorrencia_id);
        `;

        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not set");
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        await client.query(sql);
        await client.end();

        return NextResponse.json({ success: true, message: "Migration 58 (Local Ocorrencia) executed successfully" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
