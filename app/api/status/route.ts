import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'online',
        versao_next: '15.5.12',
        timestamp: new Date().toISOString(),
        mensagem: 'A Gateway da Vercel Edge Serverless Route está a funcionar 100%!',
    });
}
