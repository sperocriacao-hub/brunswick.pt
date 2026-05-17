'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, MonitorPlay, AlertTriangle, PackageOpen, LayoutDashboard, CheckSquare, Clock, ArrowRight, Cog, ChevronRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function JitTabletHub() {
    const supabase = createClient();
    const [areas, setAreas] = useState<any[]>([]);
    const [selectedArea, setSelectedArea] = useState<any>(null);
    
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal de Tarefa Ativa
    const [activeTicket, setActiveTicket] = useState<any>(null);
    const [roteiroChecklist, setRoteiroChecklist] = useState<any[]>([]);
    const [isFetchingRoteiro, setIsFetchingRoteiro] = useState(false);

    // 1. Carregar Áreas Iniciais
    useEffect(() => {
        const fetchAreas = async () => {
            const { data, error } = await supabase.from('areas_fabrica').select('*').order('nome_area');
            if (error) {
                console.error(error);
                return;
            }
            const fil = (data || []).filter(a => {
                const n = a.nome_area.toLowerCase();
                return n.includes('armaz') || n.includes('carpintaria') || n.includes('estofos');
            });
            setAreas(fil);
            setLoading(false);
        };
        fetchAreas();
    }, [supabase]);

    // 2. Carregar Tickets da Área Selecionada e assinar o Websocket
    useEffect(() => {
        if (!selectedArea) return;
        
        setLoading(true);
        const fetchTickets = async () => {
            const { data, error } = await supabase
                .from('ordens_secundarias_realtime')
                .select(`
                    *,
                    regra:regra_id(descricao_tarefa, sla_horas, estacao_gatilho:estacao_gatilho_id(nome_estacao), estacao_destino:estacao_destino_id(nome_estacao)),
                    op_principal:op_principal_id(hin_hull_id, modelo_id, modelo:modelo_id(nome_modelo)),
                    estacao_alvo:estacao_alvo_id(nome_estacao)
                `)
                .eq('area_alvo_id', selectedArea.id)
                .neq('status', 'CONCLUIDO')
                .order('timestamp_disparo', { ascending: true });

            if (error) {
                console.error("Erro a buscar tickets:", error);
                setError(error.message);
            } else {
                setTickets(data || []);
            }
            setLoading(false);
        };

        fetchTickets();

        const sub = supabase.channel('jit_tickets')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'ordens_secundarias_realtime',
                filter: `area_alvo_id=eq.${selectedArea.id}`
            }, (payload) => {
                console.log("Novo Ticket/Atualização JIT:", payload);
                fetchTickets(); // Re-fetch completo para garantir os joins
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [selectedArea, supabase]);

    // 3. Ao clicar num Ticket, vai buscar as Tarefas do Roteiro
    const openTicketModal = async (ticket: any) => {
        setActiveTicket(ticket);
        setIsFetchingRoteiro(true);
        setRoteiroChecklist([]);

        // Tentar ir buscar o Roteiro para o Modelo e a Estacao Alvo (se existir)
        if (ticket.op_principal?.modelo_id && ticket.estacao_alvo_id) {
            const { data, error } = await supabase
                .from('roteiros_producao')
                .select('*')
                .eq('modelo_id', ticket.op_principal.modelo_id)
                .eq('estacao_id', ticket.estacao_alvo_id)
                .order('ordem', { ascending: true });
                
            if (!error && data) {
                setRoteiroChecklist(data);
            }
        }
        setIsFetchingRoteiro(false);
    };

    const updateTicketStatus = async (id: string, newStatus: string) => {
        const payload: any = { status: newStatus };
        if (newStatus === 'CONCLUIDO') {
            payload.timestamp_conclusao = new Date().toISOString();
        }
        
        const { error } = await supabase.from('ordens_secundarias_realtime').update(payload).eq('id', id);
        if (error) {
            alert("Erro ao atualizar ticket: " + error.message);
        } else {
            setActiveTicket(null);
            // O realtime vai atualizar a lista automaticamente
        }
    };

    // TELA 1: Selecionar a Área (Modo Quiosque)
    if (!selectedArea) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white selection:bg-blue-500/30">
                <div className="max-w-3xl w-full text-center animate-in fade-in zoom-in-95 duration-700">
                    <MonitorPlay className="w-20 h-20 text-blue-500 mx-auto mb-6 opacity-80" />
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4">Tablet <span className="text-blue-500">J.I.T</span> Hub</h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto">
                        Selecione a área onde este tablet ficará afixado para receber as ordens de fabrico sincronizadas com a linha principal.
                    </p>

                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {areas.map(area => (
                                <button 
                                    key={area.id}
                                    onClick={() => setSelectedArea(area)}
                                    className="group relative bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 hover:bg-slate-800 hover:border-blue-500 transition-all shadow-xl hover:shadow-blue-500/20 text-left overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <h2 className="text-2xl font-black text-white uppercase group-hover:text-blue-400 transition-colors mb-2">{area.nome_area}</h2>
                                    <p className="text-slate-400 text-sm font-medium">Ligar terminal realtime</p>
                                    <ArrowRight className="absolute bottom-8 right-8 text-slate-600 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                                </button>
                            ))}
                            {areas.length === 0 && <div className="col-span-3 text-slate-500">Nenhuma área logística encontrada.</div>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // TELA 2: Dashboard Kanban JIT
    const pendentes = tickets.filter(t => t.status === 'PENDENTE');
    const emCurso = tickets.filter(t => t.status === 'EM_CURSO');
    const prontos = tickets.filter(t => t.status === 'PRONTO_ENTREGA');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Cabecalho Tablet */}
            <header className="bg-slate-900 text-white p-4 sm:p-6 shadow-md flex justify-between items-center z-10 shrink-0 border-b-4" style={{ borderColor: selectedArea.cor_destaque || '#3b82f6' }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedArea(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-3">
                            <Activity className="text-emerald-400 animate-pulse w-6 h-6" />
                            {selectedArea.nome_area}
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Terminal J.I.T Sincronizado</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-800 rounded-xl px-4 py-2 text-center border border-slate-700">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pendentes</div>
                        <div className="text-xl font-black text-rose-400">{pendentes.length}</div>
                    </div>
                    <div className="bg-slate-800 rounded-xl px-4 py-2 text-center border border-slate-700 hidden sm:block">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Em Curso</div>
                        <div className="text-xl font-black text-blue-400">{emCurso.length}</div>
                    </div>
                </div>
            </header>

            {/* Kanban Body */}
            <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col">
                {error && <div className="bg-rose-100 text-rose-800 p-4 rounded-xl font-bold mb-4 border border-rose-200"><AlertTriangle className="inline mr-2" /> {error}</div>}
                
                {loading && tickets.length === 0 ? (
                    <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
                        {/* Coluna 1: Pendentes */}
                        <div className="bg-slate-200/50 rounded-2xl p-4 flex flex-col border border-slate-200/80 shadow-inner">
                            <h2 className="text-rose-700 font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                                <span>A Fazer (Fila)</span>
                                <Badge className="bg-rose-500 hover:bg-rose-600">{pendentes.length}</Badge>
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {pendentes.map(t => <TicketCard key={t.id} ticket={t} onClick={() => openTicketModal(t)} />)}
                                {pendentes.length === 0 && <EmptyColumn />}
                            </div>
                        </div>

                        {/* Coluna 2: Em Curso */}
                        <div className="bg-slate-200/50 rounded-2xl p-4 flex flex-col border border-slate-200/80 shadow-inner">
                            <h2 className="text-blue-700 font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                                <span>A Fabricar / Separar</span>
                                <Badge className="bg-blue-500 hover:bg-blue-600">{emCurso.length}</Badge>
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {emCurso.map(t => <TicketCard key={t.id} ticket={t} onClick={() => openTicketModal(t)} />)}
                                {emCurso.length === 0 && <EmptyColumn />}
                            </div>
                        </div>

                        {/* Coluna 3: Prontos / Entrega */}
                        <div className="bg-slate-200/50 rounded-2xl p-4 flex flex-col border border-slate-200/80 shadow-inner">
                            <h2 className="text-emerald-700 font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                                <span>Aguardam Recolha</span>
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">{prontos.length}</Badge>
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {prontos.map(t => <TicketCard key={t.id} ticket={t} onClick={() => openTicketModal(t)} />)}
                                {prontos.length === 0 && <EmptyColumn />}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal do Ticket (Uber Style) */}
            {activeTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        
                        {/* Header Modal */}
                        <div className={`p-6 sm:p-8 text-white ${activeTicket.status === 'PENDENTE' ? 'bg-rose-600' : activeTicket.status === 'EM_CURSO' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-md px-3 py-1 font-black text-xs uppercase tracking-widest">
                                    Ticket JIT: {activeTicket.status}
                                </Badge>
                                <button onClick={() => setActiveTicket(null)} className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors">
                                    ✕
                                </button>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">{activeTicket.op_principal?.hin_hull_id || 'N/A'}</h2>
                            <p className="text-white/80 font-semibold text-lg">{activeTicket.op_principal?.modelo?.nome_modelo}</p>
                            
                            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium bg-black/10 p-4 rounded-xl">
                                <div className="flex-1 min-w-[120px]">
                                    <p className="text-white/60 text-xs uppercase mb-1">Entregar Para:</p>
                                    <p className="font-bold">{activeTicket.regra?.estacao_destino?.nome_estacao || 'Linha Principal'}</p>
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <p className="text-white/60 text-xs uppercase mb-1">Prazo (SLA):</p>
                                    <p className="font-bold">{activeTicket.regra?.sla_horas} Horas</p>
                                </div>
                            </div>
                        </div>

                        {/* Body Modal (Checklist / Roteiro) */}
                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50">
                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                <CheckSquare className="text-blue-500" /> Tarefas a Executar
                            </h3>
                            
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <Cog size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{activeTicket.regra?.descricao_tarefa}</p>
                                        <p className="text-xs text-slate-500 font-medium">Estação Alvo: {activeTicket.estacao_alvo?.nome_estacao || 'Geral'}</p>
                                    </div>
                                </div>

                                {/* Checklist Roteiro Auto-Vinculada */}
                                {isFetchingRoteiro ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                                ) : roteiroChecklist.length > 0 ? (
                                    <ul className="space-y-2 mt-4">
                                        {roteiroChecklist.map((tk, idx) => (
                                            <li key={tk.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                <div className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 flex-shrink-0 flex items-center justify-center">
                                                    {/* Checkbox visual placeholder */}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 leading-snug">{tk.nome_tarefa}</p>
                                                    {tk.is_critical && <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-200 text-[9px] px-1.5 py-0">Crítica</Badge>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center p-6 text-slate-400">
                                        <PackageOpen className="mx-auto h-8 w-8 mb-2 opacity-30" />
                                        <p className="text-sm font-medium">Não há roteiro específico mapeado para esta estação.<br/>Apenas prossiga com o pedido.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Modal Actions */}
                        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                            {activeTicket.status === 'PENDENTE' && (
                                <button 
                                    onClick={() => updateTicketStatus(activeTicket.id, 'EM_CURSO')}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 text-lg transition-transform hover:scale-[1.02] active:scale-95"
                                >
                                    Aceitar Ticket (Iniciar)
                                </button>
                            )}
                            
                            {activeTicket.status === 'EM_CURSO' && (
                                <button 
                                    onClick={() => updateTicketStatus(activeTicket.id, 'PRONTO_ENTREGA')}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 text-lg transition-transform hover:scale-[1.02] active:scale-95"
                                >
                                    Marcar Pronto (Aguardar Recolha)
                                </button>
                            )}

                            {activeTicket.status === 'PRONTO_ENTREGA' && (
                                <button 
                                    onClick={() => updateTicketStatus(activeTicket.id, 'CONCLUIDO')}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl shadow-lg shadow-slate-800/20 text-lg transition-transform hover:scale-[1.02] active:scale-95"
                                >
                                    Concluir e Fechar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-componentes
function TicketCard({ ticket, onClick }: { ticket: any, onClick: () => void }) {
    const isPendente = ticket.status === 'PENDENTE';
    
    // Calcular tempo decorrido desde o disparo
    const [tempo, setTempo] = useState('');
    useEffect(() => {
        const calc = () => {
            const diff = Math.floor((new Date().getTime() - new Date(ticket.timestamp_disparo).getTime()) / 60000);
            if (diff < 60) setTempo(`${diff}m`);
            else setTempo(`${Math.floor(diff/60)}h ${diff%60}m`);
        };
        calc();
        const int = setInterval(calc, 60000);
        return () => clearInterval(int);
    }, [ticket.timestamp_disparo]);

    return (
        <Card 
            onClick={onClick}
            className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all active:scale-95 bg-white border-slate-200 overflow-hidden group"
        >
            <div className={`h-1.5 w-full ${isPendente ? 'bg-rose-500' : ticket.status === 'EM_CURSO' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm group-hover:bg-blue-50 transition-colors">
                        {ticket.op_principal?.hin_hull_id || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        <Clock className="w-3 h-3 text-amber-500" /> {tempo}
                    </span>
                </div>
                
                <h3 className="font-bold text-slate-700 text-sm mb-1 leading-tight">{ticket.regra?.descricao_tarefa}</h3>
                <p className="text-xs font-semibold text-slate-400 truncate mb-3">{ticket.op_principal?.modelo?.nome_modelo}</p>
                
                <div className="flex items-center gap-2 text-[10px] bg-slate-50 p-1.5 rounded-md border border-slate-100 font-bold text-slate-500 uppercase">
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span>Para: {ticket.regra?.estacao_destino?.nome_estacao || 'Linha'}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyColumn() {
    return (
        <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <LayoutDashboard className="w-8 h-8 mb-2 opacity-50 text-slate-300" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">Sem Tickets</span>
        </div>
    );
}
