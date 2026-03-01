"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRnc, getSelectData } from '../actions';
import { useRouter } from 'next/navigation';
import { FileWarning, Save, Loader2, Info } from 'lucide-react';

export default function NovaRncPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Selects Data
    const [ops, setOps] = useState<any[]>([]);
    const [estacoes, setEstacoes] = useState<any[]>([]);

    // Form State
    const [opId, setOpId] = useState('');
    const [estacaoId, setEstacaoId] = useState('');
    const [detetadoPor, setDetetadoPor] = useState('');
    const [tipo, setTipo] = useState('Dimensional');
    const [gravidade, setGravidade] = useState('Media');
    const [descricao, setDescricao] = useState('');
    const [acao, setAcao] = useState('');

    useEffect(() => {
        carregarSelects();
    }, []);

    async function carregarSelects() {
        const res = await getSelectData();
        if (res.success) {
            setOps(res.ops || []);
            setEstacoes(res.estacoes || []);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ordem_producao_id: opId || null,
            estacao_id: estacaoId || null,
            detetado_por_nome: detetadoPor,
            tipo_defeito: tipo,
            gravidade: gravidade,
            descricao_problema: descricao,
            acao_imediata: acao
        };

        const res = await createRnc(payload);
        if (res.success) {
            router.push('/admin/qualidade/rnc');
        } else {
            alert("Falha a abrir RNC: " + res.error);
            setSubmitting(false);
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-[900px] mx-auto animate-in fade-in duration-500 pb-32">
            <header className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileWarning className="text-rose-600" size={32} /> Abertura de RNC
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Registo Inicial de Não Conformidade no M.E.S.</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </header>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">Detalhes da Ocorrência</CardTitle>
                    <CardDescription>O número sequencial (Ex: RNC-2026-X) será gerado automaticamente.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase">Contexto Produtivo (O.P.)</label>
                                <Select value={opId} onValueChange={setOpId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Aplicar a Ordem..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- RNC Geral (Sem OP Específica) --</SelectItem>
                                        {ops.map(op => (
                                            <SelectItem key={op.id} value={op.id}>
                                                O.P. {op.id.split('-')[0]} ({op.modelos?.nome_modelo})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase">Estação de Trabalho</label>
                                <Select value={estacaoId} onValueChange={setEstacaoId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Local da Ocorrência..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Não Especificado --</SelectItem>
                                        {estacoes.map(st => (
                                            <SelectItem key={st.id} value={st.id}>
                                                {st.areas_fabrica?.nome_area} - {st.nome_estacao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase">Detetado Por</label>
                                <Input required value={detetadoPor} onChange={e => setDetetadoPor(e.target.value)} placeholder="Nome do Inspetor/Operador" className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase">Classe do Defeito</label>
                                <Select value={tipo} onValueChange={setTipo}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dimensional">Dimensional / Geometria</SelectItem>
                                        <SelectItem value="Estético">Estético / Cosmético (Fibra)</SelectItem>
                                        <SelectItem value="Material">Material Não-Conforme (Stock)</SelectItem>
                                        <SelectItem value="Processo">Falha de Processo / Humana</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase">Gravidade Inicial</label>
                                <Select value={gravidade} onValueChange={setGravidade}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Baixa">Baixa (Retoque cosmético rápido)</SelectItem>
                                        <SelectItem value="Media">Média (Requer retrabalho fora do tempo standard)</SelectItem>
                                        <SelectItem value="Critica">Crítica (Risco Estrutural / Desmantelar)</SelectItem>
                                        <SelectItem value="Bloqueante">Bloqueante (Para a linha imediatamente)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-700 uppercase">Descrição da Desconformidade</label>
                            <textarea
                                required
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="Descreva os factos em pormenor. O que está errado? Qual a tolerância desrespeitada?"
                            />
                        </div>

                        <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <label className="text-xs font-bold text-amber-900 uppercase flex items-center gap-2">
                                <Info size={14} /> Ação de Contenção Imediata (D3)
                            </label>
                            <textarea
                                value={acao}
                                onChange={e => setAcao(e.target.value)}
                                className="flex w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="De forma a proteger o cliente e não infetar outras fases, o que foi feito logo na hora? (Ex: Isolar lote, refazer peça, travar a máquina...)"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-6">
                            <Button disabled={submitting} type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8">
                                {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Gerar Número de RNC
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
