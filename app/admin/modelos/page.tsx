"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Package, Edit, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ModeloInfo = {
  id: string;
  nome_modelo: string;
  model_year: string;
  created_at: string;
  status: string;
  linha_padrao_id?: any;
};

export default function ModelosListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [modelos, setModelos] = useState<ModeloInfo[]>([]);

  const fetchModelos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("modelos")
        .select("id, nome_modelo, model_year, created_at, status, linha_padrao_id(letra_linha)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModelos(data || []);
    } catch (error: unknown) {
      console.error(error);
      alert("Erro ao carregar modelos.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchModelos();
  }, [fetchModelos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
      case "Em Desenvolvimento":
        return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "Descontinuado":
        return "bg-stone-500/20 text-stone-500 border-stone-500/30";
      default:
        return "bg-slate-500/20 text-slate-500 border-slate-500/30";
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus =
      currentStatus === "Descontinuado" || currentStatus === "Obsoleto"
        ? "Ativo"
        : "Obsoleto";
    if (!confirm(`Deseja alterar o estado deste modelo para: ${newStatus}?`))
      return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("modelos")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      await fetchModelos(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar o estado do Modelo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen text-slate-200">
      {/* NASA-Level Header */}
      <header className="sticky top-0 z-50 flex flex-nowrap justify-between items-center gap-4 bg-slate-900/80 p-4 border-b border-white/5 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] -m-4 mb-8 w-[calc(100%+2rem)] overflow-x-auto whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mr-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold m-0 text-white tracking-tight drop-shadow-md">
              Modelos de Embarcações
            </h1>
            <p className="text-white/50 text-xs m-0 tracking-wide uppercase font-semibold mt-0.5">
              Catálogo & Engenharia de Produto
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/modelos/novo"
            className="flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all h-9 px-5 border-0 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Novo Modelo (B.O.M.)
          </Link>
        </div>
      </header>

      {/* Content Area */}
      <div className="py-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-32 opacity-30">
            <Loader2 size={48} className="animate-spin text-blue-400" />
          </div>
        ) : modelos.length === 0 ? (
          <div className="bg-blue-900/30 border border-blue-800/50 backdrop-blur-sm shadow-xl rounded-2xl p-16 text-center flex flex-col items-center gap-4 relative overflow-hidden">
            {/* Glow orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400/50 mb-4 border border-blue-500/10">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-bold m-0 text-white tracking-tight">
              Base de Dados Vazia
            </h3>
            <p className="opacity-50 max-w-sm mx-auto text-sm leading-relaxed">
              Ainda não existem embarcações listadas no sistema central. Inicie
              a modelação do primeiro casco.
            </p>
            <Link
              href="/admin/modelos/novo"
              className="inline-flex items-center justify-center text-sm font-semibold transition-all h-10 mt-6 px-6 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              <Plus size={16} className="mr-2" />
              Inicializar Cadastro
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-700/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700/80 text-xs uppercase tracking-wider text-slate-400 font-semibold shadow-sm">
                    <th className="px-6 py-4 whitespace-nowrap">Embarcação</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Ano (MY)</th>
                    <th className="px-6 py-4 whitespace-nowrap">Linha de Produção</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Estado Catálogo</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right text-slate-500">Registo DB</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Controlo Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {modelos.map((modelo) => (
                    <tr 
                      key={modelo.id}
                      className="group bg-transparent hover:bg-blue-900/20 transition-all duration-300 relative cursor-pointer"
                      onClick={() => router.push(`/admin/modelos/${modelo.id}`)}
                    >
                      {/* Left border accent on hover */}
                      <td className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></td>
                      
                      {/* 1. Nome do Modelo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:bg-blue-900/60 group-hover:border-blue-500/40 group-hover:text-blue-400 transition-all shadow-sm">
                            <Package size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors drop-shadow-sm">
                              {modelo.nome_modelo}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5 opacity-50">
                              UUID: {modelo.id.split('-')[0]}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Model Year */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold font-mono shadow-inner">
                          {modelo.model_year}
                        </span>
                      </td>

                      {/* 3. Linha de Produção (NOVIDADE) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {modelo.linha_padrao_id && (modelo.linha_padrao_id as any).letra_linha ? (
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm group-hover:border-indigo-400/50 transition-colors">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                               Linha {(modelo.linha_padrao_id as any).letra_linha}
                           </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic opacity-60 px-2">Sem Alocação</span>
                        )}
                      </td>

                      {/* 4. Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-[10px] uppercase font-extrabold tracking-widest border shadow-sm ${getStatusColor(modelo.status || "Ativo")}`}>
                          {modelo.status || "Ativo"}
                        </span>
                      </td>

                      {/* 5. Data Tstamp */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xs text-slate-400 font-mono opacity-80">
                           {new Date(modelo.created_at).toLocaleDateString("pt-PT")}
                        </span>
                      </td>

                      {/* 6. Ações Directas */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-3">
                            <button
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${
                                    modelo.status === "Obsoleto" || modelo.status === "Descontinuado" 
                                    ? "bg-emerald-900/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                                    : "bg-rose-900/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white"
                                }`}
                                title={modelo.status === "Obsoleto" ? "Reativar Modelo" : "Marcar como Obsoleto"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleStatus(modelo.id, modelo.status);
                                }}
                            >
                                {modelo.status === "Obsoleto" || modelo.status === "Descontinuado" ? (
                                    <CheckCircle2 size={16} />
                                ) : (
                                    <Ban size={16} />
                                )}
                            </button>
                            <button
                                className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all shadow-sm z-20"
                                title="Editar Engenharia / BOM"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/admin/modelos/${modelo.id}`);
                                }}
                            >
                                <Edit size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* NASA Ambient Base Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent blur-sm pointer-events-none"></div>
          </div>
        )}
      </div>
    </div>
  );
}
