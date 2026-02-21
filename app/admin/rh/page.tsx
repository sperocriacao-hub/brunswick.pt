"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Search, UserPlus, Users, Edit, UserX, UserCheck, Shield } from 'lucide-react';
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
};

export default function GestaoRHPage() {
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [operadores, setOperadores] = useState<OperadorInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const carregarEquipa = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, tag_rfid_operador, funcao, status, iluo_nivel, possui_acesso_sistema')
            .order('nome_operador');

        if (data) setOperadores(data);
        if (error) console.error("Erro a carregar RH:", error);
        setIsLoading(false);
    };

    useEffect(() => {
        carregarEquipa();
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
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Users size={32} className="text-[var(--primary)]" />
                        Gestão de Equipa (RH)
                    </h1>
                    <p className="text-white/60">Controlo Cadastral, Permissões M.E.S e Níveis ILUO.</p>
                </div>
                <Link href="/admin/rh/cadastro" className="btn btn-primary flex gap-2 items-center">
                    <UserPlus size={18} /> Novo Operário
                </Link>
            </header>

            <div className="glass-panel p-6 mb-8 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome, Nº, Função ou Tag RFID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                </div>
                <div className="text-sm text-white/50 px-4 border-l border-[rgba(255,255,255,0.1)]">
                    Total: <strong className="text-white">{filtrados.length}</strong> Registos
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12 opacity-50"><Loader2 className="animate-spin" size={32} /></div>
            ) : (
                <div className="glass-panel border border-[rgba(255,255,255,0.05)] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[rgba(0,0,0,0.3)] text-xs uppercase tracking-wider text-white/50 border-b border-[rgba(255,255,255,0.05)]">
                                <th className="p-4 font-semibold">Nº</th>
                                <th className="p-4 font-semibold">Colaborador</th>
                                <th className="p-4 font-semibold">Função</th>
                                <th className="p-4 font-semibold">Permissões M.E.S</th>
                                <th className="p-4 font-semibold">Status / IoT</th>
                                <th className="p-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map(op => (
                                <tr key={op.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                    <td className="p-4 text-sm font-mono text-white/50">{op.numero_operador || '---'}</td>
                                    <td className="p-4">
                                        <div className="font-semibold">{op.nome_operador}</div>
                                        <div className="text-xs text-white/40 mt-1 flex items-center gap-2">
                                            RFID: <span className="font-mono bg-black/30 px-1 rounded">{op.tag_rfid_operador}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm">{op.funcao || 'Não Atribuída'}</span>
                                        {op.iluo_nivel && (
                                            <span className="ml-2 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/20">
                                                ILUO: {op.iluo_nivel}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {op.possui_acesso_sistema ? (
                                            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded inline-block">
                                                <Shield size={12} /> Acesso Concedido
                                            </span>
                                        ) : (
                                            <span className="text-xs text-white/30">Sem Acesso</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${op.status === 'Ativo'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {op.status === 'Ativo' ? <UserCheck size={12} /> : <UserX size={12} />}
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/rh/cadastro?id=${op.id}`)}
                                            className="p-2 bg-[rgba(255,255,255,0.05)] hover:bg-[var(--primary)] hover:text-white rounded transition-colors"
                                            title="Editar Cadastro Completo"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(op.id, op.status)}
                                            className={`p-2 rounded transition-colors ${op.status === 'Ativo'
                                                    ? 'bg-[rgba(255,255,255,0.05)] hover:bg-red-500/80 text-white'
                                                    : 'bg-[rgba(255,255,255,0.05)] hover:bg-green-500/80 text-white'
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
                                    <td colSpan={6} className="p-8 text-center text-white/40">Nenhum operador encontrado na lista.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
