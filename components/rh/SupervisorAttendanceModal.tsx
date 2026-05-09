"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from '@/utils/supabase/client';
import { Loader2, ClipboardCheck, UserX, UserCheck, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

type Operador = {
    id: string;
    nome_operador: string;
    tag_rfid_operador: string;
    estacoes: { nome_estacao: string } | null;
    status_hoje: string; // 'Presente', 'Falta Justificada', 'Férias', etc
    is_automatic: boolean;
};

export function SupervisorAttendanceModal() {
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [myName, setMyName] = useState('');
    const [isLider, setIsLider] = useState(false);
    const [isMasterOrRh, setIsMasterOrRh] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function checkUser() {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) return;
            
            // Descobrir quem é o user atual através do email_acesso
            const { data: opData } = await supabase.from('operadores')
                .select('nome_operador, funcao')
                .eq('email_acesso', authData.user.email)
                .single();

            if (opData) {
                setMyName(opData.nome_operador);
                const role = opData.funcao?.toLowerCase() || '';
                if (role.includes('supervisor') || role.includes('lider') || role.includes('líder') || role.includes('gestor') || role.includes('coordenador')) {
                    setIsLider(true);
                }
                if (role.includes('admin') || role.includes('recursos humanos') || role === 'rh' || authData.user.email === 'master@brunswick.pt') {
                    setIsMasterOrRh(true);
                    setIsLider(true); // Master e RH veem tudo
                }
            } else if (authData.user.email === 'master@brunswick.pt' || authData.user.email?.includes('admin')) {
                // Caso seja master e nem tenha registo nos operadores
                setIsMasterOrRh(true);
                setIsLider(true);
                setMyName('Master Admin');
            }
        }
        checkUser();
    }, []);

    const fetchEquipa = async () => {
        setIsLoading(true);
        const hojeIso = new Date().toISOString().split('T')[0];

        // 1. Obter a equipa do lider atual (ou TODOS se for Master/RH)
        let query = supabase.from('operadores')
            .select('id, nome_operador, tag_rfid_operador, estacoes!posto_base_id(nome_estacao)')
            .eq('status', 'Ativo');

        if (!isMasterOrRh) {
            query = query.or(`lider_nome.eq."${myName}",supervisor_nome.eq."${myName}",gestor_nome.eq."${myName}"`);
        }

        const { data: equipa, error: equipaErr } = await query.order('nome_operador');

        if (equipaErr) {
            console.error("Erro na query equipa:", equipaErr);
            setDebugError("Erro BD (Equipa): " + equipaErr.message);
            setOperadores([]);
            setIsLoading(false);
            return;
        }

        if (!equipa || equipa.length === 0) {
            setOperadores([]);
            setIsLoading(false);
            return;
        }

        // 2. Obter ausências de hoje para esta equipa
        const opIds = equipa.map(op => op.id);
        const { data: ausencias, error: ausErr } = await supabase.from('rh_ausencias')
            .select('operador_id, tipo_ausencia, motivo_observacao')
            .lte('data_inicio', hojeIso)
            .gte('data_fim', hojeIso)
            .in('operador_id', opIds);

        const ausenciasMap = new Map((ausencias || []).map(a => [a.operador_id, { tipo: a.tipo_ausencia, motivo: a.motivo_observacao }]));

        // 3. Obter marcações de ponto (Ponto Diário) para ver quem já "picou" a entrada
        const rfidTags = equipa.map(op => op.tag_rfid_operador);
        const { data: pontos, error: ptsErr } = await supabase.from('log_ponto_diario')
            .select('operador_rfid')
            .gte('timestamp', `${hojeIso}T00:00:00Z`)
            .lte('timestamp', `${hojeIso}T23:59:59Z`)
            .in('operador_rfid', rfidTags);

        if (ptsErr) {
            console.error("Erro na query pontos:", ptsErr);
            setDebugError(prev => (prev ? prev + " | " : "") + "Erro BD (Pontos): " + ptsErr.message);
        }

        const picouHoje = new Set((pontos || []).map(p => p.operador_rfid));

        const processed: Operador[] = equipa.map(op => {
            const ausencia = ausenciasMap.get(op.id);
            let status = 'Sem Registo';
            let isAuto = false;

            if (ausencia) {
                status = ausencia.tipo;
                if (ausencia.tipo === 'Outro' && ausencia.motivo === 'Entrada/Saída Antecipada') {
                    status = 'Entrada/Saída Antecipada';
                }
                if (ausencia.tipo === 'Férias' || ausencia.tipo === 'Baixa Médica' || ausencia.tipo === 'Afastamento/Licença') {
                    isAuto = true;
                }
            } else if (picouHoje.has(op.tag_rfid_operador)) {
                status = 'Presente';
            }

            return {
                id: op.id,
                nome_operador: op.nome_operador,
                tag_rfid_operador: op.tag_rfid_operador,
                estacoes: op.estacoes as any,
                status_hoje: status,
                is_automatic: isAuto
            };
        });

        setOperadores(processed);
        setPendingChanges({});
        setIsLoading(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchEquipa();
    };

    const setStatus = (opId: string, novoStatus: string) => {
        // Optimistic UI
        setOperadores(prev => prev.map(op => op.id === opId ? { ...op, status_hoje: novoStatus } : op));
        // Guarda na lista de alterações pendentes
        setPendingChanges(prev => ({ ...prev, [opId]: novoStatus }));
    };

    const handleSave = async () => {
        if (Object.keys(pendingChanges).length === 0) {
            setIsOpen(false);
            return;
        }

        setIsSaving(true);
        const hojeIso = new Date().toISOString().split('T')[0];

        try {
            for (const [opId, novoStatus] of Object.entries(pendingChanges)) {
                if (novoStatus === 'Presente') {
                    const { error: delErr } = await supabase.from('rh_ausencias')
                        .delete()
                        .eq('operador_id', opId)
                        .eq('data_inicio', hojeIso)
                        .eq('data_fim', hojeIso);
                    if (delErr) throw delErr;
                } else {
                    const { data: exist, error: chkErr } = await supabase.from('rh_ausencias')
                        .select('id')
                        .eq('operador_id', opId)
                        .eq('data_inicio', hojeIso)
                        .eq('data_fim', hojeIso)
                        .single();

                    if (chkErr && chkErr.code !== 'PGRST116') throw chkErr; // Ignore row not found

                    if (exist) {
                        const { error: upErr } = await supabase.from('rh_ausencias')
                            .update({ 
                                tipo_ausencia: novoStatus === 'Entrada/Saída Antecipada' ? 'Outro' : novoStatus,
                                motivo_observacao: novoStatus === 'Entrada/Saída Antecipada' ? 'Entrada/Saída Antecipada' : 'Apontamento Diário Supervisor' 
                            })
                            .eq('id', exist.id);
                        if (upErr) throw upErr;
                    } else {
                        const { error: inErr } = await supabase.from('rh_ausencias').insert({
                            operador_id: opId,
                            tipo_ausencia: novoStatus === 'Entrada/Saída Antecipada' ? 'Outro' : novoStatus,
                            data_inicio: hojeIso,
                            data_fim: hojeIso,
                            motivo_observacao: novoStatus === 'Entrada/Saída Antecipada' ? 'Entrada/Saída Antecipada' : 'Apontamento Diário Supervisor'
                        });
                        if (inErr) throw inErr;
                    }
                }
            }

            alert("Chamada gravada com sucesso!");
            setPendingChanges({});
            setIsOpen(false);
        } catch (error: any) {
            console.error(error);
            alert("Falha ao gravar a chamada no sistema: " + (error?.message || "Erro desconhecido"));
        } finally {
            setIsSaving(false);
        }
    };

    // Agrupar por estação
    const grouped = operadores.reduce((acc, op) => {
        const est = op.estacoes?.nome_estacao || 'Sem Estação Fixa';
        if (!acc[est]) acc[est] = [];
        acc[est].push(op);
        return acc;
    }, {} as Record<string, Operador[]>);

    // Removermos o return null para que o botão apareça sempre. Assim o Admin sabe que a funcionalidade existe.
    // if (!isLider) return null; 

    return (
        <>
            <Button 
                onClick={handleOpen}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md shadow-sm flex items-center gap-2"
            >
                <ClipboardCheck size={18} />
                Fazer Chamada (A Minha Equipa)
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto bg-slate-50 border-slate-200">
                    <DialogHeader className="border-b border-slate-200 pb-4 mb-4">
                        <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <ClipboardCheck className="text-blue-600" /> Chamada de Turno
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Faça a gestão rápida de faltas e excepções para a equipa sob a sua alçada.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                    ) : !isLider ? (
                        <div className="text-center p-8 text-slate-500 bg-white rounded-lg border border-slate-200">
                            A sua conta ({myName || 'Admin'}) não tem o cargo de Liderança/RH no cadastro. <br/>
                            Apenas chefias diretas ou RH veem as equipas aqui.
                        </div>
                    ) : debugError ? (
                        <div className="text-center p-8 bg-rose-50 border border-rose-200 rounded-lg">
                            <h3 className="text-rose-800 font-bold mb-2">Erro de Carregamento (Diagnóstico)</h3>
                            <p className="text-rose-600 font-mono text-sm">{debugError}</p>
                        </div>
                    ) : operadores.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 bg-white rounded-lg border border-slate-200">
                            Não tem nenhum operador associado ao seu perfil (Líder/Supervisor/Coordenador/Gestor) para gerir.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isMasterOrRh && (
                                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-3 text-indigo-700 text-sm font-medium">
                                    <ShieldAlert size={18} className="text-indigo-500" />
                                    Está a visualizar com acesso MASTER / RH. Estão visíveis todos os operadores ativos de todas as áreas.
                                </div>
                            )}
                            {Object.entries(grouped).map(([estacao, ops]) => (
                                <div key={estacao} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-xs">
                                        {estacao} ({ops.length})
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {ops.map(op => (
                                            <div key={op.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800">{op.nome_operador}</div>
                                                    <div className="text-xs font-mono text-slate-400">RFID: {op.tag_rfid_operador}</div>
                                                </div>

                                                {op.is_automatic ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded text-slate-600 border border-slate-200 text-sm font-bold">
                                                        <ShieldAlert size={16} /> 
                                                        Bloqueado pelos RH ({op.status_hoje})
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button 
                                                            variant={op.status_hoje === 'Presente' ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={op.status_hoje === 'Presente' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-700 hover:bg-emerald-50'}
                                                            onClick={() => setStatus(op.id, 'Presente')}
                                                        >
                                                            <UserCheck size={14} className="mr-1" /> Presente
                                                        </Button>
                                                        <Button 
                                                            variant={op.status_hoje === 'Falta Justificada' ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={op.status_hoje === 'Falta Justificada' ? 'bg-amber-500 hover:bg-amber-600' : 'text-amber-600 hover:bg-amber-50'}
                                                            onClick={() => setStatus(op.id, 'Falta Justificada')}
                                                        >
                                                            <AlertCircle size={14} className="mr-1" /> F. Justificada
                                                        </Button>
                                                        <Button 
                                                            variant={op.status_hoje === 'Falta Injustificada' ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={op.status_hoje === 'Falta Injustificada' ? 'bg-rose-600 hover:bg-rose-700' : 'text-rose-600 hover:bg-rose-50'}
                                                            onClick={() => setStatus(op.id, 'Falta Injustificada')}
                                                        >
                                                            <UserX size={14} className="mr-1" /> F. Injustificada
                                                        </Button>
                                                        <Button 
                                                            variant={op.status_hoje === 'Entrada/Saída Antecipada' ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={op.status_hoje === 'Entrada/Saída Antecipada' ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-indigo-600 hover:bg-indigo-50'}
                                                            onClick={() => setStatus(op.id, 'Entrada/Saída Antecipada')}
                                                        >
                                                            <Clock size={14} className="mr-1" /> F. Antecipada
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && operadores.length > 0 && !debugError && (
                        <div className="mt-8 flex justify-end gap-4 border-t border-slate-200 pt-6">
                            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || Object.keys(pendingChanges).length === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
                            >
                                {isSaving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A gravar...</>
                                ) : (
                                    <>Gravar Chamada {Object.keys(pendingChanges).length > 0 ? `(${Object.keys(pendingChanges).length})` : ''}</>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
