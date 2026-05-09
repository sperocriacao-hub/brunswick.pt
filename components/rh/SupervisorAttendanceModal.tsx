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
    estacoes: { nome: string } | null;
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

    useEffect(() => {
        async function checkUser() {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) return;
            
            // Descobrir quem é o user atual através do email
            const { data: opData } = await supabase.from('operadores')
                .select('nome_operador, funcao')
                .eq('email', authData.user.email)
                .single();

            if (opData) {
                setMyName(opData.nome_operador);
                const role = opData.funcao?.toLowerCase() || '';
                if (role.includes('supervisor') || role.includes('lider') || role.includes('líder') || role.includes('gestor')) {
                    setIsLider(true);
                }
            }
        }
        checkUser();
    }, []);

    const fetchEquipa = async () => {
        setIsLoading(true);
        const hojeIso = new Date().toISOString().split('T')[0];

        // 1. Obter a equipa do lider atual
        const { data: equipa } = await supabase.from('operadores')
            .select('id, nome_operador, tag_rfid_operador, estacoes(nome)')
            .eq('status', 'ATIVO')
            .or(`lider_nome.eq."${myName}",supervisor_nome.eq."${myName}",gestor_nome.eq."${myName}"`)
            .order('nome_operador');

        if (!equipa || equipa.length === 0) {
            setOperadores([]);
            setIsLoading(false);
            return;
        }

        // 2. Obter ausências de hoje para esta equipa
        const opIds = equipa.map(op => op.id);
        const { data: ausencias } = await supabase.from('rh_ausencias')
            .select('operador_id, tipo_ausencia, motivo_observacao')
            .lte('data_inicio', hojeIso)
            .gte('data_fim', hojeIso)
            .in('operador_id', opIds);

        const ausenciasMap = new Map((ausencias || []).map(a => [a.operador_id, { tipo: a.tipo_ausencia, motivo: a.motivo_observacao }]));

        // 3. Obter marcações de ponto (Ponto Diário) para ver quem já "picou" a entrada
        const rfidTags = equipa.map(op => op.tag_rfid_operador);
        const { data: pontos } = await supabase.from('log_ponto_diario')
            .select('operador_rfid')
            .gte('timestamp', `${hojeIso}T00:00:00Z`)
            .lte('timestamp', `${hojeIso}T23:59:59Z`)
            .in('operador_rfid', rfidTags);

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
        setIsLoading(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchEquipa();
    };

    const setStatus = async (opId: string, novoStatus: string) => {
        const hojeIso = new Date().toISOString().split('T')[0];
        
        // Optimistic UI Update
        setOperadores(prev => prev.map(op => op.id === opId ? { ...op, status_hoje: novoStatus } : op));

        try {
            if (novoStatus === 'Presente') {
                // Remove qualquer ausência manual marcada hoje para que fique limpo
                await supabase.from('rh_ausencias')
                    .delete()
                    .eq('operador_id', opId)
                    .eq('data_inicio', hojeIso)
                    .eq('data_fim', hojeIso);
            } else {
                // Inserir ou atualizar ausência com data_fim = data_inicio = HOJE (ausência de 1 dia)
                // Primeiro verificamos se já tem uma ausência pontual hoje
                const { data: exist } = await supabase.from('rh_ausencias')
                    .select('id')
                    .eq('operador_id', opId)
                    .eq('data_inicio', hojeIso)
                    .eq('data_fim', hojeIso)
                    .single();

                if (exist) {
                    await supabase.from('rh_ausencias')
                        .update({ 
                            tipo_ausencia: novoStatus === 'Entrada/Saída Antecipada' ? 'Outro' : novoStatus,
                            motivo_observacao: novoStatus === 'Entrada/Saída Antecipada' ? 'Entrada/Saída Antecipada' : 'Apontamento Diário Supervisor' 
                        })
                        .eq('id', exist.id);
                } else {
                    await supabase.from('rh_ausencias').insert({
                        operador_id: opId,
                        tipo_ausencia: novoStatus === 'Entrada/Saída Antecipada' ? 'Outro' : novoStatus,
                        data_inicio: hojeIso,
                        data_fim: hojeIso,
                        motivo_observacao: novoStatus === 'Entrada/Saída Antecipada' ? 'Entrada/Saída Antecipada' : 'Apontamento Diário Supervisor'
                    });
                }
            }
        } catch (error) {
            console.error(error);
            alert("Falha ao atualizar o estado do operador.");
            fetchEquipa(); // revert
        }
    };

    // Agrupar por estação
    const grouped = operadores.reduce((acc, op) => {
        const est = op.estacoes?.nome || 'Sem Estação Fixa';
        if (!acc[est]) acc[est] = [];
        acc[est].push(op);
        return acc;
    }, {} as Record<string, Operador[]>);

    if (!isLider) return null; // Apenas visível se for lider/supervisor

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
                    ) : operadores.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 bg-white rounded-lg border border-slate-200">
                            Não tem nenhum operador associado ao seu perfil para liderar.
                        </div>
                    ) : (
                        <div className="space-y-6">
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
                </DialogContent>
            </Dialog>
        </>
    );
}
