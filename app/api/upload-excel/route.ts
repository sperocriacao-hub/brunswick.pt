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

    // 4. LIMPAR DADOS (REMOVER COLUNAS VAZIAS E ASSEGURAR NULOS EM IDs VAZIOS)
    const dataArray = rawData.map((row) => {
      const newRow: any = {};
      for (const key in row) {
        if (!key || key.includes("__EMPTY")) continue;
        
        const cleanKey = key.trim();
        const value = row[key];
        
        if (typeof value === "string") {
            const cleanVal = value.trim();
            // Evitar erro fatal de UUID: Se a coluna terminar em 'id' e for uma string vazia, anular para o Supabase gerar automaticamente.
            if (cleanVal === "" && (cleanKey === "id" || cleanKey.endsWith("_id"))) {
                // Do not include this key so postgres uses its default generation, or set to null
                continue; 
            }
            newRow[cleanKey] = cleanVal;
        } else {
            newRow[cleanKey] = value;
        }
      }
      return newRow;
    });

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
    console.error("ERRO FATAL API UPLOAD EXCEL:", e);
    return NextResponse.json(
      { success: false, error: `Falha técnica no Backend: ${e.message}` },
      { status: 500 }
    );
  }
}
