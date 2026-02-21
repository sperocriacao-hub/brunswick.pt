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
                    <p className="text-slate-500">Controlo Cadastral, Permissões M.E.S e Níveis ILUO.</p>
                </div>
                <Link href="/admin/rh/cadastro" className="btn btn-primary flex gap-2 items-center">
                    <UserPlus size={18} /> Novo Operário
                </Link>
            </header>

            <div className="glass-panel p-6 mb-8 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome, Nº, Função ou Tag RFID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg py-3.5 pl-12 pr-4 text-slate-800 text-base shadow-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    />
                </div>
                <div className="text-sm text-slate-500 px-4 border-l border-slate-200">
                    Total: <strong className="text-slate-900">{filtrados.length}</strong> Registos
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12 opacity-50"><Loader2 className="animate-spin" size={32} /></div>
            ) : (
                <div className="glass-panel border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
                                <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-sm font-mono text-slate-500">{op.numero_operador || '---'}</td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-900">{op.nome_operador}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            RFID: <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">{op.tag_rfid_operador}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-700">
                                        <span className="text-sm">{op.funcao || 'Não Atribuída'}</span>
                                        {op.iluo_nivel && (
                                            <span className="ml-2 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/20">
                                                ILUO: {op.iluo_nivel}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {op.possui_acesso_sistema ? (
                                            <span className="flex items-center w-max gap-1 text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded inline-block">
                                                <Shield size={12} /> Acesso Concedido
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Sem Acesso</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${op.status === 'Ativo'
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : 'bg-red-100 text-red-800 border-red-200'
                                            }`}>
                                            {op.status === 'Ativo' ? <UserCheck size={12} /> : <UserX size={12} />}
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/rh/cadastro?id=${op.id}`)}
                                            className="p-2 bg-slate-100 text-slate-600 hover:bg-[var(--primary)] hover:text-white rounded border border-slate-200 transition-colors"
                                            title="Editar Cadastro Completo"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(op.id, op.status)}
                                            className={`p-2 rounded border transition-colors ${op.status === 'Ativo'
                                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-red-500 hover:border-red-500 hover:text-white'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-green-500 hover:border-green-500 hover:text-white'
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
                                    <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum operador encontrado na lista.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
