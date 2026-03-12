import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const tableName = formData.get("tableName") as string;
    const file = formData.get("file") as File;

    if (!tableName || !file) {
      return NextResponse.json(
        { success: false, error: "Parâmetros de importação em branco." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json(
        {
          success: false,
          error: "Servidor mal configurado. Faltam chaves mestras.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 1. LER ARRAYBUFFER DO FICHEIRO ENVIADO
    const arrayBuffer = await file.arrayBuffer();

    // 2. PARSE EXCEL
    const wb = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    if (!wb.SheetNames.length) {
      return NextResponse.json(
        { success: false, error: "Ficheiro sem folhas (sheets)." },
        { status: 400 }
      );
    }

    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];

    // 3. RECUPERAR DADOS E FORÇAR STRING PARA EVITAR OBJETOS COMPLEXOS DE DATAS DO EXCEL
    const rawData: any[] = XLSX.utils.sheet_to_json(ws, {
      defval: null,
      raw: false,
    });

    if (rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: "O Excel fornecido está vazio." },
        { status: 400 }
      );
    }

    // 4. LIMPAR DADOS (REMOVER COLUNAS VAZIAS E ASSEGURAR NULOS EM STRING VAZIAS PARA EVITAR CRASH DE DATAS/UUIDs)
    let dataArray = rawData.map((row) => {
      const newRow: any = {};
      for (const key in row) {
        if (!key || key.includes("__EMPTY")) continue;
        
        const cleanKey = key.trim();
        const value = row[key];
        
        // A SALVAÇÃO DO ERROR 22P02 e NOT-NULL PK:
        // O SheetJS com defval: null já envia null para células vazias.
        // Se a Chave Primária estiver vazia (null ou ""), impedimos a sua inclusão no objeto final.
        // Assim, o upsert não envia "{id: null}" e o Postgres usa o uuid_generate_v4() default.
        if (cleanKey === "id" && (value === null || value === "" || String(value).trim() === "")) {
            continue;
        }

        if (typeof value === "string") {
            const cleanVal = value.trim();
            // Para outras colunas ForeignKey ou DATE, transformamos "" vazios em null nativo para o Postgres não crashar com 22P02.
            if (cleanVal === "") {
                newRow[cleanKey] = null;
            } else {
                newRow[cleanKey] = cleanVal;
            }
        } else {
            // Se já for numérico longo, boolean, ou null normal vindo do Excels.
            newRow[cleanKey] = value;
        }
      }
      return newRow;
    });

    // 4.5. DICIONÁRIO HUMANO-PARA-MAQUINA (Apenas para `operadores`)
    // Utilizadores tentam importar "A - Auditoria Gate 6" em campos UUID 'posto_base_id'. Temos de converter.
    if (tableName === 'operadores') {
       const { data: areasData } = await supabaseAdmin.from('areas_fabrica').select('id, nome_area');
       const { data: estacoesData } = await supabaseAdmin.from('estacoes').select('id, nome_estacao');
       
       // Normalized strict matching for human-names (ignora espaços, traços e underscores)
       const normalizeName = (str: string) => {
           if (!str) return '';
           return str.toLowerCase().replace(/[\s\-\_]/g, '').trim();
       };

       dataArray = dataArray.map(row => {
          // Tratar Area Base (Mapear Nome para UUID)
          if (row.area_base_id && typeof row.area_base_id === 'string' && !row.area_base_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
              const srch = normalizeName(row.area_base_id);
              const matchedArea = (areasData || []).find(a => normalizeName(a.nome_area) === srch);
              if (matchedArea) {
                  row.area_base_id = matchedArea.id;
              } else {
                 throw new Error(`Área "${row.area_base_id}" não encontrada no sistema. Registe a Área primeiro.`);
              }
          }

          // Tratar Posto Base (Mapear Nome para UUID)
          if (row.posto_base_id && typeof row.posto_base_id === 'string' && !row.posto_base_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
              const srch = normalizeName(row.posto_base_id);
              const matchedEstacao = (estacoesData || []).find(e => normalizeName(e.nome_estacao) === srch);
              if (matchedEstacao) {
                  row.posto_base_id = matchedEstacao.id;
              } else {
                 throw new Error(`Estação "${row.posto_base_id}" não encontrada no sistema. Registe a Estação primeiro.`);
              }
          }
          
          return row;
       });
    }

    // 5. INSERIR NO SUPABASE
    const { error } = await supabaseAdmin
      .from(tableName)
      .upsert(dataArray, {
        onConflict: "id", // assume majority tables use id
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      let readableError = error.message;
      if (error.code === "23503")
        readableError = `Falta dependência base. Insira as relações primeiro. (${error.details})`;
      if (error.code === "23505")
        readableError = `Um ou mais registos já existem (Duplicado). (${error.details})`;
      if (error.code === "42P01")
        readableError = `A tabela alvo "${tableName}" não existe.`;
      if (error.code === "22P02")
        readableError = `Formato inválido numa das células (ex: ID vazio em vez de UUID). (${error.details})`;

      return NextResponse.json(
        {
          success: false,
          error: `Erro ao exportar DB ("${tableName}"): ${readableError}`,
        },
        { status: 400 }
      );
    }

    // 6. SUCESSO
    return NextResponse.json({
      success: true,
      recordsAffected: dataArray.length,
      message: `Processados ${dataArray.length} registos.`,
    });
  } catch (e: any) {
    if (e.message && e.message.includes("não encontrada no sistema")) {
        return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }
    
    console.error("ERRO FATAL API UPLOAD EXCEL:", e);
    return NextResponse.json(
      { success: false, error: `Falha técnica no Backend: ${e.message}` },
      { status: 500 }
    );
  }
}
