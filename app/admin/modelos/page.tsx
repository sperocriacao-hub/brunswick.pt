"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, PlusCircle, Package, Edit, Ban, CheckCircle2, Search, Layers, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
        .select("id, nome_modelo, model_year, created_at, status, linha_padrao_id:linhas_producao!modelos_linha_padrao_id_fkey(letra_linha)")
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModelos, setFilteredModelos] = useState<ModeloInfo[]>([]);

  useEffect(() => {
        if (!searchTerm) {
            setFilteredModelos(modelos);
            return;
        }
        const lower = searchTerm.toLowerCase();
        setFilteredModelos(modelos.filter(o =>
            o.nome_modelo.toLowerCase().includes(lower) ||
            o.model_year.toLowerCase().includes(lower) ||
            o.status.toLowerCase().includes(lower)
        ));
  }, [searchTerm, modelos]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case "Ativo": return "default";
        case "Em Desenvolvimento": return "secondary";
        case "Descontinuado": return "destructive";
        case "Obsoleto": return "destructive";
        default: return "outline";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Cabecalho - Estilo GOP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Package className="text-blue-600" size={32} />
              Modelos de Embarcações
           </h1>
           <p className="text-slate-500 font-medium mt-2">
              Gerencie o catálogo de produtos, modelos ativos, e a engenharia base de cada casco.
           </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
           <Link href="/admin/modelos/novo">
             <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full sm:w-auto h-11 px-6 shadow-sm">
                 <PlusCircle className="mr-2 h-5 w-5" /> Novo Modelo (B.O.M)
             </Button>
           </Link>
        </div>
      </div>

       {/* Metricas Rapidas - Estilo GOP */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                   <Activity size={24} />
               </div>
               <div>
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Modelos</p>
                   <p className="text-2xl font-black text-slate-800">{modelos.length}</p>
               </div>
           </Card>
           <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                   <Layers size={24} />
               </div>
               <div>
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ativos na Produção</p>
                   <p className="text-2xl font-black text-emerald-600">
                       {modelos.filter(m => m.status === 'Ativo').length}
                   </p>
               </div>
           </Card>
           <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                   <Package size={24} />
               </div>
               <div>
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Em Desenvolvimento</p>
                   <p className="text-2xl font-black text-amber-600">
                       {modelos.filter(m => m.status === 'Em Desenvolvimento').length}
                   </p>
               </div>
           </Card>
       </div>

       {/* Painel Principal com Tabela - Estilo GOP */}
       <div className="bg-white border text-card-foreground shadow-sm rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pesquisar por Modelo, Ano ou Estado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-600">Embarcação</TableHead>
                                <TableHead className="font-bold text-slate-600">Ano (MY)</TableHead>
                                <TableHead className="font-bold text-slate-600">Linha Alocação</TableHead>
                                <TableHead className="font-bold text-slate-600">Estado Catálogo</TableHead>
                                <TableHead className="font-bold text-slate-600">Registo DB</TableHead>
                                <TableHead className="text-right font-bold text-slate-600">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 bg-slate-50 mt-10 p-10 animate-pulse">
                                        <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        A sincronizar catálogo de engenharia...
                                    </TableCell>
                                </TableRow>
                            ) : filteredModelos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500 bg-slate-50 font-medium">
                                        <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Nenhum modelo listado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredModelos.map((modelo) => (
                                    <TableRow key={modelo.id} className="hover:bg-blue-50/30 transition-colors">
                                        <TableCell className="font-bold text-slate-900 border-l-2 border-transparent hover:text-blue-600 cursor-pointer" onClick={() => router.push(`/admin/modelos/${modelo.id}`)}>
                                            <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                                     <Package size={16} />
                                                 </div>
                                                 {modelo.nome_modelo}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">
                                             <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{modelo.model_year}</span>
                                        </TableCell>
                                        <TableCell>
                                            {modelo.linha_padrao_id && (modelo.linha_padrao_id as any).letra_linha ? (
                                                 <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Linha {(modelo.linha_padrao_id as any).letra_linha}</Badge>
                                            ) : (
                                                 <span className="text-xs text-slate-400 italic">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(modelo.status)} className={
                                                modelo.status === "Ativo" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-transparent" :
                                                modelo.status === "Em Desenvolvimento" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-none border-transparent" : ""
                                            }>
                                                {modelo.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-mono text-sm">
                                            {new Date(modelo.created_at).toLocaleDateString("pt-PT")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                              <div className="flex justify-end gap-2">
                                                  <Button 
                                                      variant="outline" 
                                                      size="icon" 
                                                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                                      onClick={() => router.push(`/admin/modelos/${modelo.id}`)}
                                                      title="Editar Modelo"
                                                  >
                                                      <Edit size={14} />
                                                  </Button>
                                                  <Button 
                                                      variant="outline" 
                                                      size="icon" 
                                                      className={`h-8 w-8 ${modelo.status === 'Obsoleto' || modelo.status === 'Descontinuado' ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50' : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'}`}
                                                      onClick={() => toggleStatus(modelo.id, modelo.status)}
                                                      title={modelo.status === "Obsoleto" || modelo.status === "Descontinuado" ? "Ativar Modelo" : "Remover Modelo"}
                                                  >
                                                      {modelo.status === "Obsoleto" || modelo.status === "Descontinuado" ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                                                  </Button>
                                              </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
       </div>
    </div>
  );
}
