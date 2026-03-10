"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Loader2,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

// Definição das tabelas centrais a expor no Gestor
const TABLES = [
  // 1. ESTRUTURA E ENGENHARIA
  {
    key: "areas_fabrica",
    label: "Áreas de Fábrica",
    desc: "Setores estruturais de produção (ex: Laminação).",
  },
  {
    key: "linhas_producao",
    label: "Linhas de Produção",
    desc: "Agrupamento de áreas e estações contíguas.",
  },
  {
    key: "estacoes",
    label: "Estações / Postos",
    desc: "Máquinas e células operacionais da fábrica.",
  },
  {
    key: "estacoes_sequencia",
    label: "Sequência de Estações",
    desc: "Grafo visual com o fluxo lógico da linha de produção.",
  },

  // 2. PRODUTOS E MODELOS
  {
    key: "modelos",
    label: "Modelos de Barco",
    desc: "Catálogo de embarcações fabricadas.",
  },
  {
    key: "opcionais",
    label: "Catálogo de Opcionais",
    desc: "Listagem de opções extra para os modelos na ficha.",
  },
  {
    key: "tarefas_opcionais",
    label: "Tarefas Opcionais",
    desc: "Tarefas dinâmicas associadas a kits e configurações.",
  },
  {
    key: "roteiros_producao",
    label: "Roteiros de Produção",
    desc: "Mapeamento de tempos (SLA) das peças por estação.",
  },
  {
    key: "roteiros_sequencia",
    label: "Rotas de Roteiros",
    desc: "Sequência de fluxos das tarefas entre postos.",
  },
  {
    key: "modelo_area_timing",
    label: "Tempos por Área",
    desc: "Orçamento de horas e OEE alvo por área.",
  },

  // 3. PLANEAMENTO E EXECUÇÃO
  {
    key: "ordens_producao",
    label: "Ordens de Produção",
    desc: "Registo global de OPs em curso e finalizadas.",
  },
  {
    key: "registos_rfid_realtime",
    label: "Micro-OEE (Tarefas WIP)",
    desc: "Registo a tempo real de alocação Homem-Barco.",
  },
  {
    key: "log_estacao_conclusao",
    label: "Macro-OEE (Estações)",
    desc: "Histórico de finalização de cascos por estação.",
  },
  {
    key: "alertas_andon",
    label: "Alertas Andon",
    desc: "Registo de chamadas de ajuda do chão de fábrica.",
  },

  // 4. RECURSOS HUMANOS E EQUIPA
  {
    key: "operadores",
    label: "Recursos Humanos",
    desc: "Trabalhadores e respetivas roles.",
  },
  {
    key: "avaliacoes_diarias",
    label: "Avaliações Diárias",
    desc: "Classificações contínuas atribuídas pelos chefes de secção.",
  },
  {
    key: "apontamentos_negativos",
    label: "Apontamentos Disciplinares",
    desc: "Registo vitalício de justificativas de baixa performance.",
  },
  {
    key: "certificacoes",
    label: "Matriz de Competências",
    desc: "Formações e habilitações de cada trabalhador.",
  },
  {
    key: "log_ponto_diario",
    label: "Assiduidade (Ponto)",
    desc: "Entradas e saídas diárias da fábrica.",
  },
  {
    key: "log_pausas_operador",
    label: "Pausas e Intervalos",
    desc: "Suspensões temporárias de trabalho efetivo.",
  },

  // 5. MOLDES E MANUTENÇÃO (TPM)
  {
    key: "moldes",
    label: "Cadastro de Moldes",
    desc: "Registo físico dos moldes e gabaritos.",
  },
  {
    key: "moldes_defeitos_pins",
    label: "Cadastro de Defeitos",
    desc: "Mapeamento espacial das anomalias do molde.",
  },
  {
    key: "moldes_geometria",
    label: "Geometrias de Moldes",
    desc: "Pontos de verificação técnica 3D e desgaste.",
  },
  {
    key: "moldes_intervencoes",
    label: "Intervenções em Moldes",
    desc: "Registo de manutenções preventivas e corretivas.",
  },

  // 6. QUALIDADE E LEAN
  {
    key: "rastreabilidade_pecas",
    label: "Rastreabilidade B.O.M.",
    desc: "Histórico de peças serializadas coladas.",
  },
  {
    key: "qualidade_checklists",
    label: "Checklists de Qualidade",
    desc: "Modelos de verificação do produto final.",
  },
  {
    key: "qualidade_verificacoes",
    label: "Verificações / Assinaturas",
    desc: "Respostas de validação às checklists.",
  },
  {
    key: "rnc_registos",
    label: "RNC (Não Conformidades)",
    desc: "Ocorrências e acidentes registados na fábrica.",
  },
  {
    key: "rnc_8d_etapas",
    label: "Resoluções RNC 8D",
    desc: "Seguimento da via 8-Disciplines Problem Solving.",
  },
  {
    key: "rnc_a3_etapas",
    label: "Resoluções RNC A3",
    desc: "Seguimento do relatório A3 Problem Solving.",
  },
  {
    key: "ideias_kaizen",
    label: "Ideias Kaizen",
    desc: "Banco de sugestões de melhoria contínua da equipa.",
  },
  {
    key: "gemba_walks",
    label: "Gemba Walks",
    desc: "Gestão visual do chão de fábrica.",
  },
  {
    key: "scrum_acoes",
    label: "Ações Scrum",
    desc: "Planeamento iterativo de melhorias curtas.",
  },

  // 7. ARMAZÉM E LOGÍSTICA
  {
    key: "logistica_pedidos",
    label: "Pedidos Logísticos (Kitting)",
    desc: "Necessidades e separação de materiais BOM.",
  },

  // 8. IOT E ECRÃS
  {
    key: "equipamentos_iot",
    label: "Equipamentos IoT (Hardware)",
    desc: "Credenciais de painéis e terminais ESP32.",
  },
  {
    key: "logs_comunicacao_iot",
    label: "Telemetria IoT",
    desc: "Registos máquina-a-máquina (M2M).",
  },
  {
    key: "tvs",
    label: "Ecrãs Dashboard (TVs)",
    desc: "Configurações físicas de TVs espalhadas pela linha.",
  },
  {
    key: "tv_layouts",
    label: "Layouts de TV",
    desc: "Mosaicos visuais e agrupamento de ecrãs.",
  },
  {
    key: "tv_widgets",
    label: "Widgets Gráficos",
    desc: "Componentes reativos acoplados em cada TV.",
  },
  {
    key: "tv_paginas",
    label: "Páginas de TVs",
    desc: "Rotações e slideshows para os totens.",
  },

  // 9. SISTEMA
  {
    key: "sys_config_geral",
    label: "Configurações de Sistema",
    desc: "Chaves e toggles globais do M.E.S.",
  },
  {
    key: "sys_feriados_fabrica",
    label: "Calendário de Feriados",
    desc: "Dias sem OEE planeada.",
  },
];

export function DatabaseManager() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);

  // 1. GERAR MODELO (HEADERS VAZIOS)
  const handleDownloadTemplate = async (tableName: string) => {
    setIsLoading(`template-${tableName}`);
    setActionLog(null);
    try {
      // Obter os cabeçalhos pedindo na BD um registo limite = 1
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);
      if (error) throw error;

      let headers: string[] = [];
      if (data && data.length > 0) {
        headers = Object.keys(data[0]);
      } else {
        // Tabela vazia: fallback hardcoded básico se necessário (neste caso avisa o UI para povoar à mão via POSTGRES)
        throw new Error(
          `Tabela "${tableName}" está vazia. O sistema necessita de pelo menos 1 registo para ler as Colunas corretas do Modelo.`,
        );
      }

      // Ignora headers que não devem ser escritos pelo user (ex: ID na insercao bruta, created_at)
      const cleanHeaders = headers.filter(
        (h) => h !== "created_at" && h !== "updated_at",
      );

      // Criar workbook sheetJS
      const ws = XLSX.utils.aoa_to_sheet([cleanHeaders]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Modelo");

      // Gravar (Trigger download)
      XLSX.writeFile(wb, `Modelo_Importacao_${tableName.toUpperCase()}.xlsx`);
      setActionLog({
        type: "success",
        msg: `Modelo transferido para a pasta de transferências.`,
      });
    } catch (error: any) {
      console.error(error);
      setActionLog({
        type: "error",
        msg: `Erro ao gerar modelo: ${error.message}`,
      });
    } finally {
      setIsLoading(null);
    }
  };

  // 2. EXPORTAR TODOS OS DADOS (BACKUP / POWER BI)
  const handleExportData = async (tableName: string) => {
    setIsLoading(`export-${tableName}`);
    setActionLog(null);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          `Não existem registos na tabela "${tableName}" para exportar.`,
        );
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");

      XLSX.writeFile(
        wb,
        `Export_BD_${tableName.toUpperCase()}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      setActionLog({
        type: "success",
        msg: `Exportação de ${data.length} registos concluída.`,
      });
    } catch (error: any) {
      console.error(error);
      setActionLog({
        type: "error",
        msg: `Erro ao exportar: ${error.message}`,
      });
    } finally {
      setIsLoading(null);
    }
  };

  // 3. IMPORTAR EXCEL (UPSERT OTIMIZADO)
  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>,
    tableName: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(`import-${tableName}`);
    setActionLog({ type: "info", msg: `A processar ficheiro ${file.name}...` });

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "buffer" });

      if (!wb.SheetNames.length)
        throw new Error("Ficheiro sem folhas (sheets).");

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // Parse Sheet as JSON of Objects
      const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

      if (jsonData.length === 0)
        throw new Error("O Excel fornecido não tem linhas com dados.");

      // Insert Supabase
      // Em Supabase se ID vier, Upsert. Caso contrário, Insert!
      const { error } = await supabase
        .from(tableName)
        .upsert(jsonData, { onConflict: "id", ignoreDuplicates: false });

      if (error) throw error;

      setActionLog({
        type: "success",
        msg: `Sucesso brutal! Importadas com sucesso as entradas para a tabela "${tableName}". Atualize a interface.`,
      });
    } catch (error: any) {
      console.error(error);
      setActionLog({
        type: "error",
        msg: `Erro na validação do Ficheiro. Confirme os Cabeçalhos: ${error.message}`,
      });
    } finally {
      setIsLoading(null);
      // Reset input form
      event.target.value = "";
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database size={20} className="text-emerald-600" />
            Gestor de Massa de Dados (I/O Excel)
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Descarregue o catálogo do sistema diretamente para formato '.xlsx'
            suportado pelo analista de <strong>Power BI</strong>, ou puxe um
            modelo vazio para pré-preencher em linha de comandos e acelerar o
            _Time-To-Market_ de implementações da Fábrica.
          </p>
        </div>
      </div>

      {actionLog && (
        <div
          className={`p-4 mb-6 rounded-lg font-medium text-sm flex items-center gap-2 ${
            actionLog.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : actionLog.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          <AlertCircle size={16} />
          {actionLog.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TABLES.map((table) => (
          <div
            key={table.key}
            className="glass-panel p-5 rounded-xl border border-slate-200 flex flex-col bg-white hover:border-emerald-200 transition-colors"
          >
            <div className="mb-4 flex-1">
              <h4 className="font-bold text-slate-700 text-base mb-1">
                {table.label}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {table.desc}
              </p>
              <code className="text-[10px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded mt-2 inline-block">
                Table: {table.key}
              </code>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => handleDownloadTemplate(table.key)}
                disabled={isLoading !== null}
                className="w-full text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isLoading === `template-${table.key}` ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={14} className="text-slate-400" />
                )}
                Gerar Modelo
              </button>

              <div className="relative">
                <label
                  className={`w-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 rounded shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${isLoading !== null ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isLoading === `import-${table.key}` ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Importar XLSX
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx"
                    onChange={(e) => handleImportData(e, table.key)}
                    disabled={isLoading !== null}
                  />
                </label>
              </div>

              <button
                onClick={() => handleExportData(table.key)}
                disabled={isLoading !== null}
                className="w-full text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isLoading === `export-${table.key}` ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Exportar Base Dados
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
