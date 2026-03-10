"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Search, UserPlus, Users, Edit, UserX, UserCheck, Shield, Repeat, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type OperadorInfo = {
    id: string;
    numero_operador: string | null;
    nome_operador: string;
    tag_rfid_operador: string;
    funcao: string | null;
    status: string;
    iluo_nivel: string | null;
    possui_acesso_sistema: boolean;
    posto_base_id: string | null;
    estacao_alocada_temporaria: string | null;
    em_realocacao: boolean;
    permissoes_modulos: string[];
};

type EstacaoInfo = {
    id: string;
    nome_estacao: string;
};

export default function GestaoRHPage() {
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [operadores, setOperadores] = useState<OperadorInfo[]>([]);
    const [estacoes, setEstacoes] = useState<EstacaoInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Relocation Modal State
    const [isRelocateModalOpen, setIsRelocateModalOpen] = useState(false);
    const [relocatingOp, setRelocatingOp] = useState<OperadorInfo | null>(null);
    const [selectedEstacaoId, setSelectedEstacaoId] = useState<string>('');

    const carregarEquipa = async () => {
        setIsLoading(true);
        const [{ data: ops }, { data: ests }] = await Promise.all([
            supabase
                .from('operadores')
                .select('id, numero_operador, nome_operador, tag_rfid_operador, funcao, status, iluo_nivel, possui_acesso_sistema, posto_base_id, estacao_alocada_temporaria, em_realocacao, permissoes_modulos')
                .order('nome_operador'),
            supabase
                .from('estacoes')
                .select('id, nome_estacao')
                .order('nome_estacao')
        ]);

        if (ops) setOperadores(ops);
        if (ests) setEstacoes(ests);
        setIsLoading(false);
    };

    useEffect(() => {
        carregarEquipa();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
        const { error } = await supabase.from('operadores').update({ status: newStatus }).eq('id', id);
        if (!error) {
            carregarEquipa();
        } else {
            alert('Erro ao alterar status: ' + error.message);
        }
    };

    const handleRelocate = async () => {
        if (!relocatingOp) return;

        setIsLoading(true);
        // Se a estacao selecionada for VAZIA ou iqual à base, cancela realocacao
        const isCancelamento = selectedEstacaoId === '' || selectedEstacaoId === relocatingOp.posto_base_id;

        const updatePayload = {
            estacao_alocada_temporaria: isCancelamento ? null : selectedEstacaoId,
            em_realocacao: !isCancelamento
        };

        const { error } = await supabase.from('operadores').update(updatePayload).eq('id', relocatingOp.id);

        if (error) {
            alert('Erro ao realocar: ' + error.message);
        } else {
            setIsRelocateModalOpen(false);
            carregarEquipa();
        }
        setIsLoading(false);
    };

    const filtrados = operadores.filter(op => {
        const term = searchQuery.toLowerCase();
        return (
            (op.nome_operador?.toLowerCase() || '').includes(term) ||
            (op.numero_operador?.toLowerCase() || '').includes(term) ||
            (op.funcao?.toLowerCase() || '').includes(term) ||
            (op.tag_rfid_operador?.toLowerCase() || '').includes(term)
        );
    });

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3 text-slate-900 tracking-tight">
                        <Users size={32} className="text-blue-600" />
                        Gestão de Equipa (RH)
                    </h1>
                    <p className="text-slate-500 font-medium">Controlo Cadastral, Permissões M.E.S e Níveis ILUO.</p>
                </div>
                <Link href="/admin/rh/cadastro" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors flex gap-2 items-center shadow-sm">
                    <UserPlus size={18} /> Novo Operário
                </Link>
            </header>

            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome, Nº, Função ou Tag RFID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                    />
                </div>
                <div className="text-sm text-slate-500 px-4 border-l border-slate-200">
                    Total: <strong className="text-slate-900">{filtrados.length}</strong> Registos
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12 text-slate-400"><Loader2 className="animate-spin" size={32} /></div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600 uppercase tracking-widest text-xs">Nº</th>
                                <th className="p-4 font-semibold text-slate-600 uppercase tracking-widest text-xs">Colaborador</th>
                                <th className="p-4 font-semibold text-slate-600 uppercase tracking-widest text-xs">Função</th>
                                <th className="p-4 font-semibold text-slate-600 uppercase tracking-widest text-xs">Permissões M.E.S</th>
                                <th className="p-4 font-semibold text-slate-600 uppercase tracking-widest text-xs">Status / IoT</th>
                                <th className="p-4 font-semibold text-slate-600 uppercase tracking-widest text-xs text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtrados.map(op => (
                                <tr key={op.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-4 font-mono text-slate-500 text-xs">{op.numero_operador || '---'}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{op.nome_operador}</div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                            RFID: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{op.tag_rfid_operador}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium text-slate-700">{op.funcao || 'Não Atribuída'}</span>
                                        {op.iluo_nivel && (
                                            <span className="ml-2 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-indigo-200">
                                                ILUO: {op.iluo_nivel}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {op.possui_acesso_sistema ? (
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                                    <Shield size={12} className="text-emerald-500" /> Web App
                                                </span>
                                                {op.permissoes_modulos?.length > 0 && (
                                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                        {op.permissoes_modulos.length} Módulos
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic font-medium">Sem Acesso Sistémico</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${op.status === 'Ativo'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {op.status === 'Ativo' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                {op.status}
                                            </span>
                                            {op.em_realocacao && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                    <Repeat size={10} /> Emprestado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setRelocatingOp(op);
                                                setSelectedEstacaoId(op.estacao_alocada_temporaria || '');
                                                setIsRelocateModalOpen(true);
                                            }}
                                            className="p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-md transition-colors border border-transparent hover:border-amber-100"
                                            title="Emprestar / Realocar Operador Temporariamente"
                                        >
                                            <Repeat size={16} />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/admin/rh/cadastro?id=${op.id}`)}
                                            className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors border border-transparent hover:border-blue-100"
                                            title="Editar Cadastro Completo"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(op.id, op.status)}
                                            className={`p-2 rounded-md transition-colors border ${op.status === 'Ativo'
                                                ? 'text-slate-400 border-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                                                : 'text-slate-400 border-transparent hover:border-green-200 hover:bg-green-50 hover:text-green-600'
                                                }`}
                                            title={op.status === 'Ativo' ? "Suspender/Inativar (Bloqueia IoT)" : "Reativar Colaborador"}
                                        >
                                            {op.status === 'Ativo' ? <UserX size={16} /> : <UserCheck size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">Nenhum operador encontrado na lista.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL DE REALOCAÇÃO */}
            {isRelocateModalOpen && relocatingOp && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Repeat size={18} className="text-amber-500" />
                                Realocação de Turno
                            </h3>
                            <button onClick={() => setIsRelocateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-6 border-l-4 border-amber-400 pl-3 py-1 bg-amber-50/50">
                                Emprestar <strong>{relocatingOp.nome_operador}</strong> temporariamente a outra estação. Esta alteração reflete-se imediatamente no Tablet dessa estação.
                            </p>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destino / Estação</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        value={selectedEstacaoId}
                                        onChange={(e) => setSelectedEstacaoId(e.target.value)}
                                    >
                                        <option value="">-- Remover Realocação (Devolver à Base) --</option>
                                        {estacoes.map(est => (
                                            <option key={est.id} value={est.id} disabled={est.id === relocatingOp.posto_base_id}>
                                                {est.nome_estacao} {est.id === relocatingOp.posto_base_id ? '(Estação Base)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setIsRelocateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancelar</button>
                            <button onClick={handleRelocate} disabled={isLoading} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2">
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Repeat size={16} />}
                                Confirmar Empréstimo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
