"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PlusCircle, Loader2, Hospital, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, Activity, Crosshair } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getHstOcorrencias, submitHstOcorrencia, fecharOcorrencia } from './actions';
import { getLeanFormData } from '@/app/operador/ideias/actions';
import { getSelectData } from '@/app/admin/qualidade/rnc/actions'; // Use Qualidade deps

export default function RegistosHstPage() {
    const [ocorrencias, setOcorrencias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dependentes Listas
    const [operadores, setOperadores] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [estacoes, setEstacoes] = useState<any[]>([]);

    // Modals
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [selectedOcc, setSelectedOcc] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Event State
    const [colabId, setColabId] = useState("");
    const [areaId, setAreaId] = useState("");
    const [estacaoId, setEstacaoId] = useState("");
    const [tipo, setTipo] = useState("Acidente com Baixa");
    const [gravidade, setGravidade] = useState("Moderada");
    const [dataHora, setDataHora] = useState("");
    const [desc, setDesc] = useState("");
    const [lesao, setLesao] = useState("");

    // Close State
    const [tratamento, setTratamento] = useState("");
    const [diasBaixa, setDiasBaixa] = useState(0);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const reqOcc = await getHstOcorrencias();
        const reqLean = await getLeanFormData();
        const reqRnc = await getSelectData(); // get estacoes

        if (reqOcc.success) setOcorrencias(reqOcc.data || []);
        if (reqLean.success) setOperadores(reqLean.operadores || []);
        if (reqLean.success) setAreas(reqLean.areas || []);
        if (reqRnc.success) setEstacoes(reqRnc.estacoes || []);
        setLoading(false);
    }

    const handleSubmitNova = async () => {
        setIsSubmitting(true);
        const ref = {
            colaborador_id: colabId || null,
            area_id: areaId || null,
            estacao_id: estacaoId || null,
            tipo_ocorrencia: tipo,
            gravidade: gravidade,
            data_hora_ocorrencia: dataHora ? new Date(dataHora).toISOString() : new Date().toISOString(),
            descricao_evento: desc,
            lesao_reportada: lesao
        };

        const res = await submitHstOcorrencia(ref);
        if (res.success) {
            setIsNewModalOpen(false);
            carregarDados();
            resetForms();
        } else {
            alert("Erro ao criar: " + res.error);
        }
        setIsSubmitting(false);
    };

    const handleValidarTratamento = async () => {
        setIsSubmitting(true);
        const res = await fecharOcorrencia(selectedOcc.id, tratamento, diasBaixa);
        if (res.success) {
            setIsCloseModalOpen(false);
            carregarDados();
        } else alert("Erro: " + res.error);
        setIsSubmitting(false);
    };

    const resetForms = () => {
        setColabId(""); setAreaId(""); setEstacaoId(""); setDesc(""); setLesao(""); setDataHora("");
    };

    const getIconColor = (type: string) => {
        if (type.includes('com Baixa')) return 'text-rose-600 bg-rose-100 border-rose-600';
        if (type.includes('sem Baixa')) return 'text-amber-600 bg-amber-100 border-amber-500';
        if (type.includes('Near-Miss') || type.includes('Incidente')) return 'text-blue-600 bg-blue-100 border-blue-400';
        return 'text-slate-600 bg-slate-100 border-slate-400';
    };

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Hospital className="text-rose-600" size={36} fill="currentColor" /> Relatórios de HST
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Registo de Acidentes, Incidentes (Near-Miss) e Doenças Profissionais.</p>
                </div>
                <Button onClick={() => setIsNewModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 h-12 px-6 font-bold shadow-md shadow-rose-500/20 text-white">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Declarar Ocorrência
                </Button>
            </header>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
            ) : ocorrencias.length === 0 ? (
                <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    <Crosshair className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    Zero Acidentes Reportados. Continue com o bom trabalho!
                </div>
            ) : (
                <div className="grid gap-4">
                    {ocorrencias.map(o => {
                        const style = getIconColor(o.tipo_ocorrencia);
                        const isFechado = o.status === 'Fechado';

                        return (
                            <Card key={o.id} className={`overflow-hidden transition-all shadow-sm flex flex-col sm:flex-row \${isFechado ? 'opacity-80 bg-slate-50' : 'bg-white border-slate-300 hover:shadow-md'}`}>
                                <div className={`w-3 \${isFechado ? 'bg-emerald-400' : o.tipo_ocorrencia.includes('Baixa') ? 'bg-rose-500' : 'bg-amber-400'}`}></div>

                                <div className="p-5 flex-1 flex flex-col md:flex-row gap-6">
                                    {/* Esquerda: Meteo */}
                                    <div className="w-full md:w-1/4 shrink-0 border-r border-slate-100 pr-4">
                                        <div className={`px-3 py-1.5 rounded-md border text-xs font-black uppercase tracking-widest text-center mb-4 \${style}`}>
                                            {o.tipo_ocorrencia}
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Activity size={12} /> Gravidade
                                        </div>
                                        <div className="font-medium text-slate-700">
                                            {o.gravidade}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-400">
                                            {new Date(o.data_hora_ocorrencia).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Meio: Descrição */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 leading-tight">
                                                    Colaborador: {o.operadores?.nome_operador}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-500 flex flex-wrap gap-2 items-center mt-1">
                                                    <span>📍 {o.areas_fabrica?.nome_area}</span>
                                                    <span>•</span>
                                                    <span>🏭 {o.estacoes?.nome_estacao || 'Geral'}</span>
                                                </p>
                                            </div>
                                            {isFechado ? (
                                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={14} /> Fechado
                                                </span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-black uppercase tracking-widest animate-pulse border border-slate-200">
                                                    Em Análise
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                                            "{o.descricao_evento}"
                                        </div>

                                        {o.lesao_reportada && (
                                            <div className="text-sm text-rose-700 font-medium bg-rose-50 p-2 rounded inline-block">
                                                🩸 Lesão: {o.lesao_reportada}
                                            </div>
                                        )}

                                        {isFechado && o.tratamento_aplicado && (
                                            <div className="mt-4 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-800">
                                                <strong className="block mb-1 text-emerald-900">Tratamento Realizado / Preventivo:</strong>
                                                {o.tratamento_aplicado}
                                                <div className="mt-2 text-xs font-bold uppercase">Dias Baixa: {o.dias_baixa}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Direita: Ações */}
                                    {!isFechado && (
                                        <div className="flex flex-col justify-end w-full md:w-auto h-full space-y-2 shrink-0 md:pl-4">
                                            <Button
                                                onClick={() => { setSelectedOcc(o); setIsCloseModalOpen(true); }}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                                            >
                                                Encerrar Caso <ChevronRight size={16} className="ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal de Criação */}
            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
                <DialogContent className="sm:max-w-[800px] border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-rose-600 flex items-center gap-2 uppercase tracking-widest">
                            <ShieldAlert size={28} /> Participação de Ocorrência
                        </DialogTitle>
                        <DialogDescription>
                            Preencha os dados do sinistro ou incidente. Este relatório servirá de base legal para as seguradoras e atualizará a Cruz de Segurança da fábrica.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Colaborador Envolvido</label>
                                <SearchableSelect
                                    options={operadores.map(op => ({ value: op.id, label: `${op.numero_operador || ''} - ${op.nome_operador || 'Colaborador sem Nome'}` }))}
                                    value={colabId} onChange={setColabId} placeholder="Pesquisar..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Classificação HST</label>
                                <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-[46px] border border-slate-200 rounded-md px-3 text-sm font-medium">
                                    <option value="Acidente com Baixa">🔴 Acidente com Baixa</option>
                                    <option value="Acidente sem Baixa">🟠 Acidente sem Baixa</option>
                                    <option value="Incidente/Quase-Acidente">🟡 Incidente (Near-Miss)</option>
                                    <option value="Doenca Profissional">🟣 Doença Profissional</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Área do Pavilhão</label>
                                <select value={areaId} onChange={e => setAreaId(e.target.value)} className="w-full h-[46px] border border-slate-200 rounded-md px-3 text-sm">
                                    <option value="" disabled>Selecione Área...</option>
                                    {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Estação Exata / Máquina</label>
                                <select value={estacaoId} onChange={e => setEstacaoId(e.target.value)} className="w-full h-[46px] border border-slate-200 rounded-md px-3 text-sm">
                                    <option value="">Geral (Sem Estação Específica)</option>
                                    {estacoes.map(e => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Data/Hora Real</label>
                                <Input type="datetime-local" value={dataHora} onChange={e => setDataHora(e.target.value)} className="h-[46px]" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Potencial de Dano (Gravidade)</label>
                                <select value={gravidade} onChange={e => setGravidade(e.target.value)} className="w-full h-[46px] border border-slate-200 rounded-md px-3 text-sm">
                                    <option value="Leve">Leve (Primeiros Socorros locais)</option>
                                    <option value="Moderada">Moderada (Transporte ao Hospital)</option>
                                    <option value="Grave">Grave (Internamento/Amputação)</option>
                                    <option value="Fatal">Fatal / Risco de Vida</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-rose-600 uppercase">Descrição Ocorrido (O que aconteceu e como?)</label>
                            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalhe da cinemática..." className="resize-none h-20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Lesão/Dano Aparente</label>
                            <Input value={lesao} onChange={e => setLesao(e.target.value)} placeholder="Ex: Corte no indicador esquerdo; Escoriações no braço..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
                        <Button disabled={!colabId || !areaId || !desc || isSubmitting} onClick={handleSubmitNova} className="bg-rose-600 hover:bg-rose-700 font-bold">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                            Gravar Relatório Oficial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Encerramento */}
            <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aprovação de Medidas e Diagnóstico</DialogTitle>
                        <DialogDescription>
                            Feche a Ocorrência validando as ações tomadas pelas equipas de Saúde e pela Engenharia para mitigar o Acidente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Atratamento e Prevenção Efetuada</label>
                            <Textarea
                                value={tratamento} onChange={e => setTratamento(e.target.value)}
                                placeholder="Colocamos proteção na quinadeira..."
                                className="h-24"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Dias de Baixa Computados</label>
                            <Input type="number" min="0" value={diasBaixa} onChange={e => setDiasBaixa(parseInt(e.target.value))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCloseModalOpen(false)}>Sair</Button>
                        <Button disabled={!tratamento || isSubmitting} onClick={handleValidarTratamento} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? <Loader2 className="w-4 h-4" /> : "Encerrar Ocorrência"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
