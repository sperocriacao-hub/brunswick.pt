"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus, Lightbulb, Loader2, Search, Target, ShieldAlert, ArrowRight, Activity, FileText, Plus, Trash2, Crosshair, Save, ImageIcon } from 'lucide-react';
import { getRncs, updateRncStatus, getA3, updateA3, createA3 } from '../actions';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function RncKanbanBoardPage() {
    const router = useRouter();
    const [rncs, setRncs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isA3Open, setIsA3Open] = useState(false);
    const [selectedA3Id, setSelectedA3Id] = useState<string | null>(null);
    const [isSavingA3, setIsSavingA3] = useState(false);

    // A3 specific states
    const [selectedAction, setSelectedAction] = useState<any>(null); // For headers
    const [equipa, setEquipa] = useState('');
    const [whys, setWhys] = useState(['', '', '', '', '']);
    const [tasks5w, setTasks5w] = useState<any[]>([]);
    const [indicadores, setIndicadores] = useState('');
    const [validacao, setValidacao] = useState<'Pendente'|'Eficaz'|'Ineficaz'>('Pendente');

    // Currently we only port A3 EXACTLY as per Lean. 
    // If the card has an 8D, we will show a general warning or map it similarly.
    const [is8dOpen, setIs8dOpen] = useState(false);

    useEffect(() => {
        carregarQuadro();
    }, []);

    async function carregarQuadro() {
        setLoading(true);
        const res = await getRncs();
        if (res.success) {
            setRncs(res.data || []);
        }
        setLoading(false);
    }

    const moveCard = async (id: string, status: string) => {
        const originalStatus = rncs.find(r => r.id === id)?.status;
        if (originalStatus === status) return;

        // Optimistic UI update
        setRncs(prev => prev.map(r => r.id === id ? { ...r, status } : r));

        const res = await updateRncStatus(id, status);
        if (!res.success) {
            // Revert optimitic UI
            carregarQuadro();
            alert("Erro a mover a RNC: " + res.error);
        }
    };

    // A3 Modal Handlers
    const openA3Modal = async (rnc: any) => {
        const idA3 = rnc.qualidade_a3[0].id;
        setSelectedA3Id(idA3);
        setSelectedAction(rnc);
        
        // Fetch specific data
        const res = await getA3(idA3);
        if(res.success && res.report) {
            setSelectedAction({
                ...rnc,
                anexos_url: res.report.qualidade_rnc?.anexos_url
            });
            
            setEquipa(res.report.autor || ''); // Mapped to 'autor'
            
            // Map 'analise_causa' to WHYS
            let w = ['', '', '', '', ''];
            try {
                if (res.report.analise_causa?.startsWith('[')) w = JSON.parse(res.report.analise_causa);
                else w[0] = res.report.analise_causa || '';
            } catch(e) {}
            setWhys(w);

            // Map 'contramedidas' to 5W2H Tasks
            let t = [];
            try {
                if (res.report.contramedidas?.startsWith('[')) t = JSON.parse(res.report.contramedidas);
            } catch(e) {}
            setTasks5w(t);

            setIndicadores(res.report.seguimento || ''); // Mapped to 'seguimento'
            setValidacao(res.report.status === 'Concluido' ? 'Eficaz' : 'Pendente');
        }        
        setIsA3Open(true);
    };

    const handleSalvarA3 = async () => {
        if (!selectedA3Id) return;
        setIsSavingA3(true);

        const newStatus = validacao === 'Eficaz' ? 'Implementado' : 'Em Desenvolvimento';

        const payload = {
            autor: equipa,
            analise_causa: JSON.stringify(whys),
            contramedidas: JSON.stringify(tasks5w),
            seguimento: indicadores,
            status: newStatus
        };

        const res = await updateA3(selectedA3Id, payload);
        if (res.success) {
            setIsA3Open(false);
            carregarQuadro(); // Refresh board statuses if they affected RNC
        } else {
            alert('Falha a atualizar A3: ' + res.error);
        }
        setIsSavingA3(false);
    };

    const addTask5w = () => setTasks5w([...tasks5w, { o_que: '', quem: '', quando: '', status: 'Pendente' }]);
    const updateTask5w = (index: number, field: string, value: string) => {
        const newArr = [...tasks5w];
        newArr[index] = { ...newArr[index], [field]: value };
        setTasks5w(newArr);
    };
    const removeTask5w = (index: number) => setTasks5w(tasks5w.filter((_, i) => i !== index));

    const StatusColumns = ["Aberto", "Em Investigacao", "Validacao", "Concluido"];

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Activity className="text-rose-600" size={36} /> War Room Qualidade
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Quadro Scrum interativo para tratamento visual de Não Conformidades.</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => router.push('/admin/qualidade/rnc')} className="px-4 py-2 bg-white text-slate-600 shadow-sm border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-sm">
                        Ver Modo Lista (Tabela)
                    </button>
                    <button onClick={() => router.push('/admin/qualidade/rnc/nova')} className="px-4 py-2 bg-rose-600 text-white shadow-sm border border-rose-700 rounded-lg hover:bg-rose-700 font-bold text-sm">
                        + Nova RNC
                    </button>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Referência, OP, Causa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                    {StatusColumns.map(columnId => {
                        const colItems = rncs.filter(r => {
                            // If it's something else like "Atribuinda", map it logically or let it hide. Let's force strict mapping if not matching exactly:
                            let matchStatus = false;
                            const sts = r.status || 'Aberto';
                            if (columnId === 'Aberto' && (sts === 'Aberto' || sts === 'Atribuinda')) matchStatus = true;
                            if (columnId === 'Em Investigacao' && sts === 'Em Investigacao') matchStatus = true;
                            if (columnId === 'Validacao' && sts === 'Validacao') matchStatus = true;
                            
                            if (columnId === 'Concluido' && sts === 'Concluido') {
                                // For Concluído, limit to max 30 days to avoid cluttering the board
                                const msPerDay = 1000 * 60 * 60 * 24;
                                const dataCriacao = new Date(r.created_at || Date.now());
                                const diasPassados = (Date.now() - dataCriacao.getTime()) / msPerDay;
                                if (diasPassados <= 30) {
                                    matchStatus = true;
                                }
                            }

                            if (!matchStatus) return false;

                            if (searchTerm === '') return true;
                            const term = searchTerm.toLowerCase();
                            return (
                                r.numero_rnc?.toLowerCase().includes(term) ||
                                r.descricao_problema?.toLowerCase().includes(term) ||
                                r.contexto_producao?.toLowerCase().includes(term) ||
                                r.detetado_por_nome?.toLowerCase().includes(term)
                            );
                        });

                        // Theme definitions
                        let headerTheme = "bg-rose-50 text-rose-800 border-rose-200";
                        if (columnId === 'Em Investigacao') headerTheme = "bg-indigo-100 text-indigo-800 border-indigo-200";
                        if (columnId === 'Validacao') headerTheme = "bg-amber-100 text-amber-800 border-amber-200";
                        if (columnId === 'Concluido') headerTheme = "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                            <div key={columnId} className="flex-1 w-full flex flex-col gap-4">
                                <div className={`px-4 py-3 rounded-xl border flex justify-between items-center font-black uppercase tracking-widest ${headerTheme}`}>
                                    <div className="flex items-center gap-2">
                                        {columnId === 'Aberto' && <AlertTriangle size={16} />}
                                        {columnId === 'Em Investigacao' && <Loader2 size={16} className="animate-spin" />}
                                        {columnId === 'Validacao' && <ShieldAlert size={16} />}
                                        {columnId === 'Concluido' && <CheckCircle2 size={16} />}
                                        {columnId}
                                    </div>
                                    <span className="bg-white/50 text-black/60 px-2 py-0.5 rounded text-xs leading-none">
                                        {colItems.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3 min-h-[500px] border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-100/30">
                                    {colItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold uppercase tracking-widest p-8 text-center italic">
                                            Vazio
                                        </div>
                                    ) : (
                                        colItems.map(rnc => {
                                            const hasA3 = rnc.qualidade_a3 && rnc.qualidade_a3.length > 0;
                                            const isCritical = rnc.gravidade === 'Critica' || rnc.gravidade === 'Bloqueante';

                                            return (
                                                <Card
                                                    key={rnc.id}
                                                    onClick={async (e) => {
                                                        if ((e.target as HTMLElement).closest('.scrum-arrow')) return;
                                                        
                                                        // Open Modal exactly as Lean!
                                                        if (hasA3) {
                                                            openA3Modal(rnc);
                                                        } else {
                                                            if (confirm("Esta RNC encontra-se em Investigação mas sem documento associado. Deseja iniciar o Canvas A3 agora?")) {
                                                                // Silent creation of A3 standard document directly from Board
                                                                const payload = {
                                                                    rnc_id: rnc.id,
                                                                    titulo: 'Análise ' + rnc.numero_rnc,
                                                                    autor: rnc.detetado_por_nome || 'Equipa de Qualidade'
                                                                };
                                                                setLoading(true);
                                                                const res = await createA3(payload);
                                                                if(res.success) {
                                                                    await carregarQuadro();
                                                                    // We have to rely on the user clicking it again since the new ID is now fresh in db,
                                                                    // or we can auto-open, but just refreshing the board is quick enough for them to click the green card.
                                                                } else {
                                                                    alert("Erro ao criar A3: " + res.error);
                                                                    setLoading(false);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className={`cursor-pointer shadow-sm hover:shadow-md transition-all group relative bg-white overflow-hidden border ${isCritical ? 'border-rose-300' : 'border-slate-200 hover:border-emerald-300'}`}
                                                >
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasA3 ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>

                                                    <CardContent className="p-4 pl-5">
                                                        <div className="flex justify-between items-start mb-2 gap-2">
                                                            <span className="text-[10px] font-black tracking-widest text-slate-800">
                                                                {rnc.numero_rnc}
                                                            </span>
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                {rnc.gravidade}
                                                            </span>
                                                        </div>

                                                        <h3 className="font-bold text-slate-800 leading-tight mb-2 text-sm">{rnc.descricao_problema}</h3>
                                                        
                                                        <div className="text-[11px] text-slate-400 font-medium mb-3">
                                                            {rnc.contexto_producao || rnc.estacoes?.nome_estacao || 'Sem contexto assinalado'}
                                                        </div>

                                                        <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                                            <div>
                                                                {hasA3 ? (
                                                                    <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">A3 ATIVO</div>
                                                                ) : (
                                                                    <div className="text-xs font-black text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">PENDENTE</div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity scrum-arrow">
                                                                {columnId !== 'Aberto' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Aberto')} className="w-6 h-6 rounded bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100" title="Mover para Aberto">«</button>
                                                                )}
                                                                {columnId !== 'Em Investigacao' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Em Investigacao')} className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100" title="Mover para Em Investigação"><Loader2 className="w-3 h-3" /></button>
                                                                )}
                                                                {columnId !== 'Validacao' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Validacao')} className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100" title="Mover para Validação"><ShieldAlert className="w-3 h-3" /></button>
                                                                )}
                                                                {columnId !== 'Concluido' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Concluido')} className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100" title="Marcar como Concluído">»</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL IDÊNTICO AO LEAN AÇÕES */}
            <Dialog open={isA3Open} onOpenChange={setIsA3Open}>
                <DialogContent className="max-w-[1000px] h-[90vh] flex flex-col p-0 border-slate-200 bg-slate-50 overflow-hidden">
                    <DialogHeader className="bg-white px-8 py-6 border-b border-slate-200 shrink-0 print:hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <FileText className="text-indigo-600" /> Relatório de Resolução RNC (A3)
                                    <span className="text-xs bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">{selectedAction?.status}</span>
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium mt-1 text-base">
                                    {selectedAction?.numero_rnc} - {selectedAction?.descricao_problema}
                                </DialogDescription>
                            </div>
                            <Button variant="outline" onClick={() => window.print()} className="font-bold border-slate-300 text-slate-700 bg-slate-50 shadow-sm print:hidden">
                                🖨️ Imprimir Folha A3/8D
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* CABEÇALHO SÓ PARA IMPRESSÃO (Oculto no Ecrã) */}
                    <div className="hidden print:flex flex-col mb-6 border-b border-black pb-4 print:p-0">
                        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4">
                            <div>
                                <div className="text-3xl font-black text-black">DOCUMENTO 8D / CANVAS A3</div>
                                <div className="text-lg font-bold text-gray-700 uppercase">{selectedAction?.numero_rnc}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-500 uppercase">Referência de Problema</div>
                                <div className="text-sm font-black">{selectedAction?.contexto_producao || 'Geral'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                            <div><strong className="text-xs uppercase text-gray-500">Data de Extração:</strong><div className="font-bold text-sm">{new Date().toLocaleDateString('pt-PT')}</div></div>
                            <div><strong className="text-xs uppercase text-gray-500">Equipa Responsável:</strong><div className="font-bold text-sm">{equipa}</div></div>
                            <div><strong className="text-xs uppercase text-gray-500">Gravidade Deteção:</strong><div className="font-bold text-sm uppercase">{selectedAction?.gravidade || 'Média'}</div></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full p-8 pb-32 print:p-0 print:overflow-visible">
                        <Tabs defaultValue="definicao" className="w-full">
                            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-slate-200/50 p-1 mb-8 print:hidden">
                                <TabsTrigger value="definicao" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">1. Definição</TabsTrigger>
                                <TabsTrigger value="root_cause" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">2. Origem (5 Porquês)</TabsTrigger>
                                <TabsTrigger value="plano" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">3. Plano 5W2H</TabsTrigger>
                                <TabsTrigger value="verificacao" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">4. Verificação</TabsTrigger>
                            </TabsList>

                            {/* INJECTION OF PRINT CSS */}
                            <style dangerouslySetInnerHTML={{__html:`
                                @media print {
                                    body * { visibility: hidden !important; }
                                    div[role="dialog"], div[role="dialog"] * { visibility: visible !important; }
                                    div[role="dialog"] { position: absolute; left: 0; top: 0; width: 100vw; margin: 0; padding: 0 !important; background: white; border: none; box-shadow: none; overflow: visible !important; }
                                    
                                    /* Force TabsContent to ALWAYS show in print sequentially */
                                    div[role="tabpanel"] { 
                                        display: block !important; 
                                        page-break-inside: avoid;
                                        border: 2px solid #e2e8f0;
                                        margin-bottom: 1.5rem !important;
                                        padding: 1rem !important;
                                    }
                                    .print\\:hidden { display: none !important; }
                                    .print\\:block { display: block !important; }
                                    .print\\:flex { display: flex !important; }
                                }
                            `}} />

                            {/* TAB 1: DEFINIÇÃO */}
                            <TabsContent value="definicao" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-indigo-500" /> Definição do Problema (RNC)</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-wrap text-sm">
                                        {selectedAction?.descricao_problema}
                                        {selectedAction?.contexto_producao && (
                                            <p className="mt-4 font-semibold text-slate-500 uppercase text-xs">Contexto: {selectedAction.contexto_producao}</p>
                                        )}
                                        {/* EXIBIÇÃO DE FOTOS NATIVAS DA RNC */}
                                        {selectedAction?.anexos_url && selectedAction.anexos_url.length > 5 && (
                                            <div className="mt-6 border-t border-slate-200 pt-6">
                                                <h4 className="font-bold text-slate-700 text-xs uppercase mb-3 flex items-center gap-2"><ImageIcon size={14} className="text-indigo-500" /> Evidências Fotográficas da Anomalia</h4>
                                                <div className="flex gap-4 overflow-x-auto pb-4">
                                                    {(() => {
                                                        try {
                                                            const urls = JSON.parse(selectedAction.anexos_url);
                                                            if (Array.isArray(urls)) {
                                                                return urls.map((url: string, index: number) => url ? (
                                                                    <div key={index} className="w-56 h-56 shrink-0 rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative bg-slate-100 group">
                                                                        <img 
                                                                            src={url} 
                                                                            alt={`Prova ${index + 1}`} 
                                                                            className="object-cover w-full h-full cursor-pointer group-hover:scale-105 transition-transform duration-300" 
                                                                            onClick={() => window.open(url, '_blank')}
                                                                        />
                                                                    </div>
                                                                ) : null);
                                                            }
                                                        } catch(e) {}
                                                        return null;
                                                    })()}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium italic">Clique numa prova para a consultar no tamanho original (nova janela).</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-600 text-sm">Equipa de Trabalho</Label>
                                    <Input
                                        placeholder="Ex: Pedro (Engenharia), Maria (Qualidade), João (Produção)"
                                        value={equipa} onChange={e => setEquipa(e.target.value)}
                                        className="bg-slate-50"
                                    />
                                    <p className="text-xs text-slate-400">Quem está envolvido na resolução desta anomalia.</p>
                                </div>
                            </TabsContent>

                            {/* TAB 2: ROOT CAUSE (5 WHYS) */}
                            <TabsContent value="root_cause" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Causa Raiz (5 Porquês)</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">Questione o sintoma repetidamente até chegar à verdadeira causa organizativa.</p>
                                </div>

                                <div className="space-y-3 pl-4 border-l-2 border-amber-200">
                                    {whys.map((why, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[30px] top-2 bg-amber-100 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border border-amber-300 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <Input
                                                placeholder={`Porquê..?`}
                                                value={why}
                                                onChange={e => {
                                                    const w = [...whys];
                                                    w[idx] = e.target.value;
                                                    setWhys(w);
                                                }}
                                                className="bg-slate-50 border-slate-200 focus-visible:ring-amber-500 font-medium"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* TAB 3: PLANO DE AÇÃO 5W2H */}
                            <TabsContent value="plano" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><ListTodo size={18} className="text-blue-500" /> Plano de Ação (Subtarefas)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Contramedidas para atacar a causa raiz que acabou de ser identificada.</p>
                                    </div>
                                    <Button onClick={addTask5w} size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold border border-blue-200">
                                        <Plus size={16} className="mr-1" /> Adicionar Ação
                                    </Button>
                                </div>

                                {tasks5w.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-500 font-medium text-sm">
                                        Nenhuma ação corretiva definida.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tasks5w.map((t, idx) => (
                                            <div key={idx} className="flex flex-col md:flex-row gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 items-start md:items-center">
                                                <div className="flex-1 space-y-1 w-full">
                                                    <Input
                                                        placeholder="O Que Fazer (What)? Ex: Mudar sensor"
                                                        value={t.o_que} onChange={e => updateTask5w(idx, 'o_que', e.target.value)}
                                                        className="h-8 text-sm font-bold bg-white"
                                                    />
                                                </div>
                                                <div className="w-full md:w-[150px]">
                                                    <Input
                                                        placeholder="Quem (Who)?"
                                                        value={t.quem} onChange={e => updateTask5w(idx, 'quem', e.target.value)}
                                                        className="h-8 text-sm bg-white"
                                                    />
                                                </div>
                                                <div className="w-full md:w-[150px]">
                                                    <Input
                                                        type="date"
                                                        value={t.quando} onChange={e => updateTask5w(idx, 'quando', e.target.value)}
                                                        className="h-8 text-sm bg-white text-slate-600"
                                                    />
                                                </div>
                                                <div className="w-full md:w-[130px]">
                                                    <select
                                                        className="w-full h-8 text-sm rounded-md border border-slate-200 bg-white px-2 pr-6 font-semibold truncate"
                                                        value={t.status} onChange={e => updateTask5w(idx, 'status', e.target.value)}
                                                    >
                                                        <option value="Pendente">Pendente</option>
                                                        <option value="Feito">Feito</option>
                                                    </select>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeTask5w(idx)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-full shrink-0">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 4: VERIFICAÇÃO */}
                            <TabsContent value="verificacao" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><Crosshair size={18} className="text-emerald-500" /> Padronização e Verificação (Act)</h3>
                                    <p className="text-sm text-slate-500 font-medium">Após as ações serem fechadas, volte ao terreno para aferir se o problema desapareceu.</p>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-600 text-sm">Indicadores de Controlo (Como Medimos o Sucesso?)</Label>
                                        <Textarea
                                            placeholder="Ex: Acompanhar o OEE da máquina durante 15 dias. O defeito não pode voltar a aparecer."
                                            value={indicadores} onChange={e => setIndicadores(e.target.value)}
                                            className="bg-slate-50 min-h-[80px]"
                                        />
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                        <Label className="font-black text-slate-800 text-sm block">Veredicto Final do Comitê</Label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setValidacao('Pendente')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all ${validacao === 'Pendente' ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Em Análise / Observação
                                            </button>
                                            <button
                                                onClick={() => setValidacao('Eficaz')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all ${validacao === 'Eficaz' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Padrão Eficaz (Fechado)
                                            </button>
                                            <button
                                                onClick={() => setValidacao('Ineficaz')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all ${validacao === 'Ineficaz' ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Falhou (Reabrir Análise)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="bg-white border-t border-slate-200 px-8 py-4 sm:justify-between absolute bottom-0 left-0 right-0 z-10 w-full shrink-0 items-center print:hidden">
                        <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <span>Estado da Ação Kanban:</span>
                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600 font-black uppercase text-xs">{selectedAction?.status}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsA3Open(false)} className="font-bold border-slate-200">Cancelar</Button>
                            <Button
                                disabled={isSavingA3}
                                onClick={handleSalvarA3}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-[180px]"
                            >
                                {isSavingA3 ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar Relatório A3
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
