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
                                            <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 flex-inline max-w-max py-1 rounded border border-emerald-200">
                                                <Shield size={12} className="text-emerald-500" /> Acesso Concedido
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic font-medium">Sem Acesso Sistémico</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${op.status === 'Ativo'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {op.status === 'Ativo' ? <UserCheck size={12} /> : <UserX size={12} />}
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
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
        </div>
    );
}
