"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Package, Edit, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type ModeloInfo = {
  id: string;
  nome_modelo: string;
  model_year: string;
  created_at: string;
  status: string;
};

export default function ModelosListPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [modelos, setModelos] = useState<ModeloInfo[]>([]);

  const fetchModelos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("modelos")
        .select("id, nome_modelo, model_year, created_at, status")
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
          <div className="bg-slate-900/40 border border-slate-700/50 backdrop-blur-sm shadow-xl rounded-2xl p-16 text-center flex flex-col items-center gap-4 relative overflow-hidden">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modelos.map((modelo) => (
              <Link
                href={`/admin/modelos/${modelo.id}`}
                key={modelo.id}
                className="group relative bg-slate-900/50 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60 hover:border-blue-500/30 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)] cursor-pointer overflow-hidden"
              >
                {/* Card Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                    <Package size={24} />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(modelo.status || "Ativo")}`}
                  >
                    {modelo.status || "Ativo"}
                  </span>
                </div>

                <div className="relative z-10 mt-2">
                  <h3 className="text-lg font-bold m-0 text-white tracking-tight group-hover:text-blue-100 transition-colors">
                    {modelo.nome_modelo}
                  </h3>
                  <p className="text-xs text-slate-400 m-0 mt-1 uppercase tracking-wider font-semibold">
                    Model Year:{" "}
                    <span className="text-slate-200">{modelo.model_year}</span>
                  </p>
                </div>

                <div className="flex-1"></div>

                <div className="flex justify-between items-center border-t border-slate-700/50 pt-4 mt-2 relative z-10">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500/50"></div>
                    {new Date(modelo.created_at).toLocaleDateString("pt-PT")}
                  </span>
                  <div className="flex gap-2">
                    {/* Ações de Gestão de Produto */}
                    <button
                      className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20"
                      title={
                        modelo.status === "Obsoleto"
                          ? "Reativar Modelo"
                          : "Marcar como Obsoleto"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleStatus(modelo.id, modelo.status);
                      }}
                    >
                      {modelo.status === "Obsoleto" ||
                      modelo.status === "Descontinuado" ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <Ban
                          size={14}
                          className="text-rose-400 hover:text-rose-300"
                        />
                      )}
                    </button>
                    <div
                      className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-colors z-20"
                      title="Aceder Modelo"
                    >
                      <Edit size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
