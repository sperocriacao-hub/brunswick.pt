import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import crypto from "crypto";

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

    // --- INTERCETOR ESPECIAL: QCIS AUDITS (SAP EXPORT) ---
    // O ficheiro SAP "QCIS Excel.xlsx" tem nomenclaturas próprias e datas em formato Serial.
    if (tableName === "qcis_audits") {
      const qcisData = rawData.map((row) => {
        // Função utilitária agressiva para forçar formato ISO YYYY-MM-DD no Postgres
        const parseExcelDate = (serial: any) => {
           if (!serial) return null;
           if (typeof serial === 'number') {
              const utc_days  = Math.floor(serial - 25569);
              const utc_value = utc_days * 86400;                                        
              const date_info = new Date(utc_value * 1000);
              return date_info.toISOString().split('T')[0];
           }
           let dateStr = String(serial).trim().split(' ')[0];
           if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
           
           if (dateStr.includes('/')) {
                let parts = dateStr.split('/');
                let p0 = parts[0], p1 = parts[1], p2 = parts[2];
                if (p2 && p2.length === 2) p2 = `20${p2}`; 
                
                // Formato Americano (MM/DD/YYYY) provado pelo output do SAP do cliente
                let mm = p0, dd = p1;
                // Safety net: Se o primeiro número for maior que 12, então É OBRIGATORIAMENTE o dia (DD/MM/YYYY)
                if (Number(p0) > 12 && p0.length <= 2) { dd = p0; mm = p1; }
                
                if (p2 && p2.length >= 4) { return `${p2.substring(0,4)}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`; } 
                else if (p0 && p0.length === 4) { return `${p0}-${mm.padStart(2,'0')}-${p2.substring(0,2).padStart(2,'0')}`; }
            } else if (dateStr.includes('-')) {
                let parts = dateStr.split('-');
                let p0 = parts[0], p1 = parts[1], p2 = parts[2];
                if (p2 && p2.length === 2) p2 = `20${p2}`;
                
                let mm = p0, dd = p1;
                if (Number(p0) > 12 && p0.length <= 2) { dd = p0; mm = p1; }
                
                if (p0 && p0.length === 4) { return `${p0}-${mm.padStart(2,'0')}-${p2.substring(0,2).padStart(2,'0')}`; } 
                else if (p2 && p2.length >= 4) { return `${p2.substring(0,4)}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`; }
            }
           return dateStr;
        };

        // Algoritmo de Hashing Sequencial para injetar um UUID determinístico
        // que respeita múltiplas linhas estritamente iguais no mesmo ficheiro (ex: 57 defeitos iguais no mesmo barco).
        const payloadCounter = new Map<string, number>();

        const generateDeterministicUUID = (payload: any) => {
            const str = JSON.stringify(payload);
            
            // Generate base hash to count occurrences
            const baseHash = crypto.createHash('md5').update(str).digest('hex');
            const count = payloadCounter.get(baseHash) || 0;
            payloadCounter.set(baseHash, count + 1);

            // Create unique hash incorporating the sequence order
            const finalStr = str + "_" + count;
            const hash = crypto.createHash('md5').update(finalStr).digest('hex');
            
            return `${hash.substring(0,8)}-${hash.substring(8,12)}-4${hash.substring(13,16)}-a${hash.substring(17,20)}-${hash.substring(20,32)}`;
        };

        return {
           id: generateDeterministicUUID({
               fail_date: parseExcelDate(row["Failed Date"] || row["Fail Date"] || row["Data"]),
               boat_id: row["Boat ID"] ? String(row["Boat ID"]) : null,
               peca: row["Peça"] ? String(row["Peça"]) : null,
               defect_description: row["Defect Description"] ? String(row["Defect Description"]) : null,
               substation_name: row["Substation Name"] || row["Principal Auditoria"] ? String(row["Substation Name"] || row["Principal Auditoria"]) : null,
               count: row["Count of Defects"] ? Number(row["Count of Defects"]) : 0,
               comment: row["Defect Comment"] ? String(row["Defect Comment"]) : null,
               seccao: row["Secção"] ? String(row["Secção"]) : null,
               linha: row["Linha.Linha"] ? String(row["Linha.Linha"]) : null,
               categoria: row["Lista.Categoria"] || row["Lista Categoria"] ? String(row["Lista.Categoria"] || row["Lista Categoria"]) : null,
               gate: row["Lista.Gate"] || row["Lista Gate"] ? String(row["Lista.Gate"] || row["Lista Gate"]) : null,
               area: row["Dtl Responsible Area"] ? String(row["Dtl Responsible Area"]) : null
           }),
           fail_date: parseExcelDate(row["Failed Date"] || row["Fail Date"] || row["Data"]),
           boat_id: row["Boat ID"] ? String(row["Boat ID"]) : null,
           model_ref: row["Model"] ? String(row["Model"]) : null,
           peca: row["Peça"] ? String(row["Peça"]) : null,
           responsible_area: row["Dtl Responsible Area"] ? String(row["Dtl Responsible Area"]) : null,
           hull_number: row["Hull Number"] ? Number(row["Hull Number"]) : null,
           component_name: row["Component Name"] ? String(row["Component Name"]) : null,
           substation_name: row["Substation Name"] || row["Principal Auditoria"] ? String(row["Substation Name"] || row["Principal Auditoria"]) : null,
           defect_description: row["Defect Description"] ? String(row["Defect Description"]) : null,
           seccao: row["Secção"] ? String(row["Secção"]) : null,
           count_of_defects: row["Count of Defects"] ? Number(row["Count of Defects"]) : 0,
           defect_comment: row["Defect Comment"] ? String(row["Defect Comment"]) : null,
           linha_linha: row["Linha.Linha"] ? String(row["Linha.Linha"]) : null,
           lista_categoria: row["Lista.Categoria"] || row["Lista Categoria"] ? String(row["Lista.Categoria"] || row["Lista Categoria"]) : null,
           lista_sub: row["Lista.Sub"] || row["Lista Sub"] ? String(row["Lista.Sub"] || row["Lista Sub"]) : null,
           lista_gate: row["Lista.Gate"] || row["Lista Gate"] ? String(row["Lista.Gate"] || row["Lista Gate"]) : null
        };
      });
      
      // Deduplicate the array in memory mapping by the Deterministic Hash ID 
      // This prevents the "ON CONFLICT DO UPDATE command cannot affect row a second time" error 
      // caused by the SAP Excel having identically duplicated rows in the same spreadsheet.
      const uniqueQcisData: any[] = [];
      const seenIds = new Set<string>();
      for (const row of qcisData) {
          if (!seenIds.has(row.id)) {
              seenIds.add(row.id);
              uniqueQcisData.push(row);
          }
      }

      // Upsert QCIS directly bypassing standard generic string normalizations
      const { error } = await supabaseAdmin.from(tableName).upsert(uniqueQcisData);
      
      if (error) {
         return NextResponse.json({ success: false, error: `Erro no parser QCIS: ${error.message}` }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        recordsAffected: uniqueQcisData.length,
        message: `Processadas ${uniqueQcisData.length} auditorias ÚNICAS (Filtrou ${qcisData.length - uniqueQcisData.length} duplicados do SAP).`,
      });
    }
    // --- FIM INTERCETOR QCIS ---

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

    // 4.5. DICIONÁRIO GERAL HUMANO-PARA-MAQUINA (Universal)
    // Se os utilizadores importarem Nomes (ex: "P - Tampas", "Modelo X") em colunas UUID '_id', convertemos para UUID.
    const foreignKeyMappings: Record<string, { table: string, refColumn: string }> = {
      "area_base_id": { table: "areas_fabrica", refColumn: "nome_area" },
      "posto_base_id": { table: "estacoes", refColumn: "nome_estacao" },
      "estacao_destino_id": { table: "estacoes", refColumn: "nome_estacao" },
      "estacao_id": { table: "estacoes", refColumn: "nome_estacao" },
      "local_ocorrencia_id": { table: "estacoes", refColumn: "nome_estacao" },
      "modelo_id": { table: "modelos", refColumn: "nome_modelo" },
      "opcao_id": { table: "opcionais", refColumn: "nome_opcao" },
      "linha_id": { table: "linhas_producao", refColumn: "letra_linha" }
    };

    const normalizeName = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/[\s\-\_]/g, '').trim();
    };

    const firstRowKeys = dataArray.length > 0 ? Object.keys(dataArray[0]) : [];
    const columnsToMap = Object.keys(foreignKeyMappings).filter(col => firstRowKeys.includes(col));

    for (const col of columnsToMap) {
        const mapping = foreignKeyMappings[col];
        // Check if there are any NON-UUID strings in this column to justify mapping it
        const needsMapping = dataArray.some(row => row[col] && typeof row[col] === 'string' && !row[col].match(/^[0-9a-f]{8}-[0-9a-f]{4}/i));
        
        if (needsMapping) {
            const { data: dictData } = await supabaseAdmin.from(mapping.table).select(`id, ${mapping.refColumn}`);
            const dict: any[] = dictData || [];
            
            dataArray = dataArray.map(row => {
                if (row[col] && typeof row[col] === 'string' && !row[col].match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
                    const srch = normalizeName(row[col]);
                    const matchedRecord = dict.find((d: any) => normalizeName(String(d[mapping.refColumn])) === srch);
                    
                    if (matchedRecord) {
                        row[col] = matchedRecord.id;
                    } else {
                        throw new Error(`Referência "${row[col]}" não encontrada na tabela ${mapping.table}. Registe-a primeiro.`);
                    }
                }
                return row;
            });
        }
    }

    // 4.6. INJETOR CUSTOMIZADO PARA ORDENS DE PRODUCAO (RFID & NOME DE DISPLAY)
    if (tableName === "ordens_producao") {
        // Para construir o display_nome legível precisamos dos nomes dos modelos
        const { data: modelosDict } = await supabaseAdmin.from("modelos").select("id, nome_modelo");
        const modMap = new Map((modelosDict || []).map(m => [m.id, m.nome_modelo]));

        dataArray = dataArray.map(row => {
            // Extrair token RFID se existir na folha Excel
            if (row["RFID token"]) row.rfid_token = String(row["RFID token"]).trim();
            if (row["rfid_token"]) row.rfid_token = String(row["rfid_token"]).trim();

            // Construir Display Name: "Modelo X # 012"
            if (row.modelo_id && row.hin_hull_id) {
                const humanModel = modMap.get(row.modelo_id) || "Barco Desconhecido";
                row.display_nome = `${humanModel} # ${row.hin_hull_id}`;
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
