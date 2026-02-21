import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos o Supabase Admin Client puro (sem cookies) porque o UPLOAD de 
// Server actions de Storage precisará muitas vezes de service_role puro. 
// Mas aqui manteremos simples com os dados de App Vercel
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const modelContext = formData.get('modelContext') as string || 'geral';

        if (!file) {
            return NextResponse.json({ error: 'Nenhum ficheiro fornecido' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Gerar um nome de ficheiro único para evitar sobreposições
        const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `${modelContext}/${uniqueFileName}`;

        // 1. Fazer o Upload para o Bucket Supabase
        // NOTA: O bucket 'instrucoes_producao' tem de ser criado fisicamente no Painel Supabase
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('instrucoes_producao')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false // Não substitui
            });

        if (uploadError) {
            console.error('Erro de upload Supabase:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // 2. Extrair o URL Público da imagem alojada para guardar na Tabela SQL de Tarefas
        const { data: urlData } = supabase
            .storage
            .from('instrucoes_producao')
            .getPublicUrl(uploadData.path);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            fileName: file.name
        });

    } catch (error: unknown) {
        console.error('Falha de processamento de API Storage:', error);
        return NextResponse.json({ error: 'Erro de processamento interno de ficheiro' }, { status: 500 });
    }
}
