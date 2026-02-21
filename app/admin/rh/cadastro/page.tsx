"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Componente Core contido em Fallback do Suspense Client
function FuncionarioFormCore() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // Modo Edição vs Criação

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(!!id);
    const [estacoesDisponiveis, setEstacoesDisponiveis] = useState<{ id: string, nome_estacao: string }[]>([]);

    // State Unificado do Formulário (Os 5 Blocos)
    const [formData, setFormData] = useState({
        // 1. Identificação
        numero_operador: '',
        nome_operador: '',
        tag_rfid_operador: '',
        data_nascimento: '',
        // 2. Estrutura
        funcao: '',
        grupo_equipa: '',
        posto_base_id: '',
        turno: '',
        lider_nome: '',
        supervisor_nome: '',
        gestor_nome: '',
        // 3. Contratos
        tipo_contrato: '',
        status: 'Ativo',
        data_admissao: '',
        data_rescisao: '',
        // 4. Talento
        iluo_nivel: '',
        matriz_talento_media: '',
        notas_rh: '',
        // 5. Acesso
        possui_acesso_sistema: false,
        email_acesso: '',
        nivel_permissao: ''
    });

    useEffect(() => {
        // Carregar Estações (Para Alocação do Posto de Trabalho M.E.S)
        supabase.from('estacoes').select('id, nome_estacao').order('nome_estacao')
            .then(({ data }) => setEstacoesDisponiveis(data || []));

        // Carregar Dados se Modo Edição
        if (id) {
            supabase.from('operadores').select('*').eq('id', id).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        setFormData({
                            numero_operador: data.numero_operador || '',
                            nome_operador: data.nome_operador || '',
                            tag_rfid_operador: data.tag_rfid_operador || '',
                            data_nascimento: data.data_nascimento || '',
                            funcao: data.funcao || '',
                            grupo_equipa: data.grupo_equipa || '',
                            posto_base_id: data.posto_base_id || '',
                            turno: data.turno || '',
                            lider_nome: data.lider_nome || '',
                            supervisor_nome: data.supervisor_nome || '',
                            gestor_nome: data.gestor_nome || '',
                            tipo_contrato: data.tipo_contrato || '',
                            status: data.status || 'Ativo',
                            data_admissao: data.data_admissao || '',
                            data_rescisao: data.data_rescisao || '',
                            iluo_nivel: data.iluo_nivel || '',
                            matriz_talento_media: data.matriz_talento_media?.toString() || '',
                            notas_rh: data.notas_rh || '',
                            possui_acesso_sistema: data.possui_acesso_sistema || false,
                            email_acesso: data.email_acesso || '',
                            nivel_permissao: data.nivel_permissao || ''
                        });
                    }
                    setIsFetchingData(false);
                });
        }
    }, [id, supabase]);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload: Record<string, unknown> = { ...formData };
        if (payload.matriz_talento_media === '') payload.matriz_talento_media = null;
        if (payload.posto_base_id === '') payload.posto_base_id = null;
        if (payload.data_nascimento === '') payload.data_nascimento = null;
        if (payload.data_admissao === '') payload.data_admissao = null;
        if (payload.data_rescisao === '') payload.data_rescisao = null;

        let errorObj = null;

        if (id) {
            const { error } = await supabase.from('operadores').update(payload).eq('id', id);
            errorObj = error;
        } else {
            const { error } = await supabase.from('operadores').insert([payload]);
            errorObj = error;
        }

        setIsLoading(false);

        if (errorObj) {
            alert("Erro ao gravar ficha cadastral: " + errorObj.message);
        } else {
            router.push('/admin/rh');
            router.refresh();
        }
    };

    if (isFetchingData) {
        return <div className="p-20 flex justify-center opacity-50"><Loader2 className="animate-spin" size={40} /></div>;
    }

    const inputClass = "form-control";

    return (
        <form onSubmit={handleSalvar} className="max-w-5xl mx-auto p-4 sm:p-8 animate-fade-in pb-20">
            <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{id ? 'Editar Colaborador' : 'Admitir Novo Operário'}</h1>
                    <p className="text-slate-500 text-sm mt-1">Ficha Integrada de Recursos Humanos e M.E.S</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/rh" className="btn btn-outline border-slate-300 text-slate-700 flex gap-2 hover:bg-slate-50 hover:text-slate-900">
                        <ArrowLeft size={16} /> Cancelar
                    </Link>
                    <button type="submit" disabled={isLoading} className="btn btn-primary flex gap-2 items-center">
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {id ? 'Atualizar Registo' : 'Confirmar Admissão'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* BLOCO 1: IDENTIFICAÇÃO */}
                <section className="glass-panel p-6 shadow-sm border border-slate-200">
                    <h2 className="text-base font-semibold mb-6 text-slate-800 border-b border-slate-200 pb-3">I. Identificação Pessoal</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Número RH</label>
                            <input type="text" value={formData.numero_operador} onChange={e => setFormData({ ...formData, numero_operador: e.target.value })} className={inputClass} placeholder="Ex: OP-021" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Data Nascimento</label>
                            <input type="date" value={formData.data_nascimento} onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs uppercase tracking-wider opacity-60 mb-1">Nome Completo *</label>
                        <input required type="text" value={formData.nome_operador} onChange={e => setFormData({ ...formData, nome_operador: e.target.value })} className={inputClass} placeholder="Nome Profissional" />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Tag RFID / NFC (Chão de Fábrica) *</label>
                        <input required type="text" value={formData.tag_rfid_operador} onChange={e => setFormData({ ...formData, tag_rfid_operador: e.target.value })} className={inputClass} placeholder="Ler Cartão Físico..." />
                        <p className="text-[10px] text-slate-400 mt-1">Este identificador será intercetado pelas antenas IoT.</p>
                    </div>
                </section>

                {/* BLOCO 2: ESTRUTURA E ALOCAÇÃO */}
                <section className="glass-panel p-6 shadow-sm border border-slate-200">
                    <h2 className="text-base font-semibold mb-6 text-slate-800 border-b border-slate-200 pb-3">II. Alocação Estrutural</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Função / Cargo</label>
                            <input type="text" value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value })} className={inputClass} placeholder="Ex: Laminador Sênior" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Posto de Trabalho (M.E.S)</label>
                            <select value={formData.posto_base_id} onChange={e => setFormData({ ...formData, posto_base_id: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="">Não Alocado (Móvel)</option>
                                {estacoesDisponiveis.map(e => (
                                    <option key={e.id} value={e.id}>{e.nome_estacao}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Equipa / Grupo</label>
                            <input type="text" value={formData.grupo_equipa} onChange={e => setFormData({ ...formData, grupo_equipa: e.target.value })} className={inputClass} placeholder="Ex: Equipa Alfa" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Turno</label>
                            <input type="text" value={formData.turno} onChange={e => setFormData({ ...formData, turno: e.target.value })} className={inputClass} placeholder="Ex: Diurno" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 mb-1">Líder Equipa</label>
                            <input type="text" value={formData.lider_nome} onChange={e => setFormData({ ...formData, lider_nome: e.target.value })} className={`${inputClass} !py-2 !text-sm`} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 mb-1">Supervisor</label>
                            <input type="text" value={formData.supervisor_nome} onChange={e => setFormData({ ...formData, supervisor_nome: e.target.value })} className={`${inputClass} !py-2 !text-sm`} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 mb-1">Gestor</label>
                            <input type="text" value={formData.gestor_nome} onChange={e => setFormData({ ...formData, gestor_nome: e.target.value })} className={`${inputClass} !py-2 !text-sm`} />
                        </div>
                    </div>
                </section>

                {/* BLOCO 3: DADOS CONTRATUAIS */}
                <section className="glass-panel p-6 shadow-sm border border-slate-200">
                    <h2 className="text-base font-semibold mb-6 text-slate-800 border-b border-slate-200 pb-3">III. Vínculo Contratual</h2>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Status RH (Bloqueia Ponto)</label>
                            <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="Ativo">🟢 Operador Ativo</option>
                                <option value="Inativo">🔴 Inativo / Desligado</option>
                                <option value="Suspenso">🟡 Suspenso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Tipo Contrato</label>
                            <select value={formData.tipo_contrato} onChange={e => setFormData({ ...formData, tipo_contrato: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="">Selecionar...</option>
                                <option value="Sem Termo">Sem Termo (Efetivo)</option>
                                <option value="Com Termo">Com Termo Resolutivo</option>
                                <option value="Terceirizada">Outsourcing (E.T.T)</option>
                                <option value="Estágio">Estágio Profissional</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Data Admissão</label>
                            <input type="date" value={formData.data_admissao} onChange={e => setFormData({ ...formData, data_admissao: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-red-600 mb-1 font-semibold">Data Rescisão</label>
                            <input type="date" value={formData.data_rescisao} onChange={e => setFormData({ ...formData, data_rescisao: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* BLOCO 4: TALENTO E DESENVOLVIMENTO (ILUO) */}
                <section className="glass-panel p-6 shadow-sm border border-slate-200">
                    <h2 className="text-base font-semibold mb-6 text-slate-800 border-b border-slate-200 pb-3">IV. Avaliação e Talento</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1" title="I (Trainee), L (Autónomo), U (Especialista), O (Formador)">Matriz Polivalência (ILUO)</label>
                            <select value={formData.iluo_nivel} onChange={e => setFormData({ ...formData, iluo_nivel: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="">Desconhecido</option>
                                <option value="I">I - Em Formação (Trainee)</option>
                                <option value="L">L - Autónomo (Executa)</option>
                                <option value="U">U - Especialista (Resolve)</option>
                                <option value="O">O - Formador (Ensina/Lidera)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Performance (Média 6 Meses)</label>
                            <div className="flex items-center gap-2">
                                <input type="number" step="0.1" min="0" max="100" value={formData.matriz_talento_media} onChange={e => setFormData({ ...formData, matriz_talento_media: e.target.value })} className={inputClass} placeholder="0 - 100" />
                                <span className="text-slate-500 text-sm font-semibold">%</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Anotações RH</label>
                        <textarea rows={3} value={formData.notas_rh} onChange={e => setFormData({ ...formData, notas_rh: e.target.value })} className={`${inputClass} resize-none`} placeholder="Registo de ausências, feedbacks disciplinares ou elogios..." />
                    </div>
                </section>

                {/* BLOCO 5: ACESSOS PLATAFORMA (BACKOFFICE) */}
                <section className="glass-panel p-6 lg:col-span-2 shadow-sm border-t-4 border-x border-b border-x-slate-200 border-b-slate-200" style={{ borderTopColor: formData.possui_acesso_sistema ? 'var(--primary)' : 'transparent' }}>
                    <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-3">
                        <h2 className="text-base font-semibold text-slate-800">
                            V. Acesso ao Sistema (S.C.A.D.A)
                        </h2>
                        <label className="flex items-center cursor-pointer gap-2 bg-slate-100 p-2 pr-4 rounded-full border border-slate-200 hover:border-slate-300 transition-all">
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                                checked={formData.possui_acesso_sistema}
                                onChange={e => setFormData({ ...formData, possui_acesso_sistema: e.target.checked })}
                            />
                            <span className="text-sm font-semibold text-slate-700 select-none">Conceder Acesso Backoffice?</span>
                        </label>
                    </div>

                    {formData.possui_acesso_sistema ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg bg-sky-50 border border-sky-100 animate-fade-in shadow-sm">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">E-mail Corporativo (Login)</label>
                                <input required={formData.possui_acesso_sistema} type="email" value={formData.email_acesso} onChange={e => setFormData({ ...formData, email_acesso: e.target.value })} className={inputClass} placeholder="operador@brunswick.pt" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Nível de Permissão (Role)</label>
                                <select required={formData.possui_acesso_sistema} value={formData.nivel_permissao} onChange={e => setFormData({ ...formData, nivel_permissao: e.target.value })} className={`${inputClass} appearance-none`}>
                                    <option value="">Selecionar Perfil Cibersegurança...</option>
                                    <option value="Operador">Leitura Básica (Consultas)</option>
                                    <option value="Supervisor">Chefe / Supervisor (Edita Ordens, Vê KPIs)</option>
                                    <option value="Planeador">Engenheiro Industrial (Muda Roteiros)</option>
                                    <option value="Admin">Master Admin (Controlo Total RH/M.E.S)</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200 italic">Ao não conceder acesso, o Colaborador será estritamente físico (apenas interage com hardware IoT via tag NFC/RFID nas linhas de montagem, mas não possui credenciais Web para fazer login nesta plataforma de Gestão).</p>
                    )}
                </section>

            </div>
        </form>
    );
}

// Wrapper Principal
export default function FormularioRHPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-white/50">Carregando Módulo Cadastral...</div>}>
            <FuncionarioFormCore />
        </Suspense>
    );
}
