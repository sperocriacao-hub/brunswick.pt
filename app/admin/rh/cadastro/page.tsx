"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { criarContaAcesso } from './actions';

// Componente Core contido em Fallback do Suspense Client
function FuncionarioFormCore() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // Modo Edição vs Criação

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(!!id);
    const [estacoesDisponiveis, setEstacoesDisponiveis] = useState<{ id: string, nome_estacao: string }[]>([]);
    const [areasDisponiveis, setAreasDisponiveis] = useState<{ id: string, nome_area: string }[]>([]);
    const [originalEmail, setOriginalEmail] = useState('');

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
        senha_acesso: '',
        nivel_permissao: '',
        permissoes_modulos: [] as string[],
        // 6. Financeiro OEE
        salario_hora: '10.00'
    });

    useEffect(() => {
        // Carregar Estações (Para Alocação do Posto de Trabalho M.E.S)
        supabase.from('estacoes').select('id, nome_estacao').order('nome_estacao')
            .then(({ data }) => setEstacoesDisponiveis(data || []));

        // Carregar Áreas de Fábrica (Para Equipa / Grupo)
        supabase.from('areas_fabrica').select('id, nome_area').order('nome_area')
            .then(({ data }) => setAreasDisponiveis(data || []));

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
                            senha_acesso: '', // Valor nunca vem preenchido do DB (fica no Auth)
                            nivel_permissao: data.nivel_permissao || '',
                            permissoes_modulos: data.permissoes_modulos || [],
                            salario_hora: data.salario_hora?.toString() || '10.00'
                        });
                        if (data.email_acesso) setOriginalEmail(data.email_acesso);
                    }
                    setIsFetchingData(false);
                });
        }
    }, [id, supabase]);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload: Record<string, unknown> = { ...formData };
        delete payload.senha_acesso; // Nunca guardar passwords não cifradas na base de dados de RH

        if (payload.matriz_talento_media === '') payload.matriz_talento_media = null;
        if (payload.posto_base_id === '') payload.posto_base_id = null;
        if (payload.data_nascimento === '') payload.data_nascimento = null;
        if (payload.data_admissao === '') payload.data_admissao = null;
        if (payload.data_rescisao === '') payload.data_rescisao = null;
        if (payload.nivel_permissao === '') payload.nivel_permissao = null;

        // Limpeza de Espaços e minúsculas no email para garantir Match com o Cofre Auth
        payload.email_acesso = formData.email_acesso ? formData.email_acesso.trim().toLowerCase() : '';
        const curEmailLimpo = payload.email_acesso as string;
        const curSenha = formData.senha_acesso ? formData.senha_acesso.trim() : undefined;

        // Parse float for DB
        payload.salario_hora = parseFloat(formData.salario_hora) || 0.0;

        // Se ativado e contiver password (ou mudou de email), criar/vincular a identidade na Supabase Autenticacao Oficial
        if (formData.possui_acesso_sistema && (curSenha || curEmailLimpo !== originalEmail)) {
            const authRes = await criarContaAcesso(curEmailLimpo, curSenha, originalEmail);
            if (!authRes.success) {
                // Se avisar que a Service Role Key está em falta, vamos notificar agressivamente o administrador
                if (authRes.error?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                    alert('AVISO CRÍTICO: A chave de Servidor SUPABASE_SERVICE_ROLE_KEY não está presente no Vercel nem no .env.local. Devido a isso, a palavra-passe / E-mail não pode ser sincronizada no Cofre de Cibersegurança Auth. Configure essa variável de ambiente p/ continuar.');
                    setIsLoading(false);
                    return;
                }

                setIsLoading(false);
                alert("Erro ao registar credenciais no Cofre Auth: " + authRes.error);
                return;
            }
        }

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

    const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm";

    return (
        <form onSubmit={handleSalvar} className="max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{id ? 'Editar Colaborador' : 'Admitir Novo Operário'}</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Ficha Integrada de Recursos Humanos e M.E.S</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/rh" className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-medium transition-colors flex gap-2 items-center shadow-sm">
                        <ArrowLeft size={16} /> Cancelar
                    </Link>
                    <button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors flex gap-2 items-center shadow-sm">
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {id ? 'Atualizar Registo' : 'Confirmar Admissão'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* BLOCO 1: IDENTIFICAÇÃO */}
                <section className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-slate-800 border-b border-slate-100 pb-3">I. Identificação Pessoal</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Número RH</label>
                            <input type="text" value={formData.numero_operador} onChange={e => setFormData({ ...formData, numero_operador: e.target.value })} className={inputClass} placeholder="Ex: OP-021" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Data Nascimento</label>
                            <input type="date" value={formData.data_nascimento} onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                        <input required type="text" value={formData.nome_operador} onChange={e => setFormData({ ...formData, nome_operador: e.target.value })} className={inputClass} placeholder="Nome Profissional" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tag RFID / NFC (Chão de Fábrica) *</label>
                        <input required type="text" value={formData.tag_rfid_operador} onChange={e => setFormData({ ...formData, tag_rfid_operador: e.target.value })} className={inputClass} placeholder="Ler Cartão Físico..." />
                        <p className="text-[10px] text-slate-400 mt-1 italic">Este identificador será intercetado pelas antenas IoT.</p>
                    </div>
                </section>

                {/* BLOCO 2: ESTRUTURA E ALOCAÇÃO */}
                <section className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-slate-800 border-b border-slate-100 pb-3">II. Alocação Estrutural</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Função / Cargo</label>
                            <input type="text" value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value })} className={inputClass} placeholder="Ex: Laminador Sênior" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Posto de Trabalho (M.E.S)</label>
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
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Equipa / Grupo (Área)</label>
                            <select value={formData.grupo_equipa} onChange={e => setFormData({ ...formData, grupo_equipa: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="">Não Alocada...</option>
                                {areasDisponiveis.map(a => (
                                    <option key={a.id} value={a.nome_area}>{a.nome_area}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Turno</label>
                            <input type="text" value={formData.turno} onChange={e => setFormData({ ...formData, turno: e.target.value })} className={inputClass} placeholder="Ex: Diurno" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Líder Equipa</label>
                            <input type="text" value={formData.lider_nome} onChange={e => setFormData({ ...formData, lider_nome: e.target.value })} className={`${inputClass} text-xs`} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Supervisor</label>
                            <input type="text" value={formData.supervisor_nome} onChange={e => setFormData({ ...formData, supervisor_nome: e.target.value })} className={`${inputClass} text-xs`} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Gestor</label>
                            <input type="text" value={formData.gestor_nome} onChange={e => setFormData({ ...formData, gestor_nome: e.target.value })} className={`${inputClass} text-xs`} />
                        </div>
                    </div>
                </section>

                {/* BLOCO 3: DADOS CONTRATUAIS */}
                <section className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-slate-800 border-b border-slate-100 pb-3">III. Vínculo Contratual</h2>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Status RH (Bloqueia Ponto)</label>
                            <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={`${inputClass} appearance-none font-medium`}>
                                <option value="Ativo" className="text-green-700 font-bold">🟢 Operador Ativo</option>
                                <option value="Inativo" className="text-red-700 font-bold">🔴 Inativo / Desligado</option>
                                <option value="Suspenso" className="text-yellow-700 font-bold">🟡 Suspenso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Contrato</label>
                            <select value={formData.tipo_contrato} onChange={e => setFormData({ ...formData, tipo_contrato: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="">Selecionar...</option>
                                <option value="Sem Termo">Sem Termo (Efetivo)</option>
                                <option value="Com Termo">Com Termo Resolutivo</option>
                                <option value="Terceirizada">Outsourcing (E.T.T)</option>
                                <option value="Estágio">Estágio Profissional</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div className="col-span-1 border-r border-slate-100 pr-4">
                            <label className="block text-xs font-semibold text-emerald-700 mb-1">Custo Horário (Salário/Hora) *</label>
                            <div className="flex items-center gap-2">
                                <input type="number" step="0.01" min="0" required value={formData.salario_hora} onChange={e => setFormData({ ...formData, salario_hora: e.target.value })} className={`${inputClass} border-emerald-200 focus:ring-emerald-500`} placeholder="10.00" />
                                <span className="font-bold text-slate-400 text-sm">€ / h</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 italic">Usado unicamente para cálculo financeiro do OEE e desvios ao SLA da Produção.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Data Admissão</label>
                            <input type="date" value={formData.data_admissao} onChange={e => setFormData({ ...formData, data_admissao: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-red-600 mb-1">Data Rescisão</label>
                            <input type="date" value={formData.data_rescisao} onChange={e => setFormData({ ...formData, data_rescisao: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* BLOCO 4: TALENTO E DESENVOLVIMENTO (ILUO) */}
                <section className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-slate-800 border-b border-slate-100 pb-3">IV. Avaliação e Talento</h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1" title="I (Trainee), L (Autónomo), U (Especialista), O (Formador)">Matriz Polivalência (ILUO)</label>
                            <select value={formData.iluo_nivel} onChange={e => setFormData({ ...formData, iluo_nivel: e.target.value })} className={`${inputClass} appearance-none font-bold text-indigo-700`}>
                                <option value="" className="text-slate-900 font-normal">Desconhecido</option>
                                <option value="I">I - Em Formação (Trainee)</option>
                                <option value="L">L - Autónomo (Executa)</option>
                                <option value="U">U - Especialista (Resolve)</option>
                                <option value="O">O - Formador (Ensina/Lidera)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Performance (Meta)</label>
                            <div className="flex items-center gap-2">
                                <input type="number" step="0.1" min="0" max="100" value={formData.matriz_talento_media} onChange={e => setFormData({ ...formData, matriz_talento_media: e.target.value })} className={inputClass} placeholder="0 - 100" />
                                <span className="font-bold text-slate-400 text-sm">%</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Anotações RH</label>
                        <textarea rows={3} value={formData.notas_rh} onChange={e => setFormData({ ...formData, notas_rh: e.target.value })} className={`${inputClass} resize-none`} placeholder="Registo de ausências, feedbacks disciplinares ou elogios..." />
                    </div>
                </section>

                {/* BLOCO 5: ACESSOS PLATAFORMA (BACKOFFICE) */}
                <section className={`bg-white p-6 lg:col-span-2 shadow-sm rounded-lg border-2 transition-colors duration-300 ${formData.possui_acesso_sistema ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                        <h2 className="text-sm uppercase tracking-widest font-bold text-slate-800">
                            V. Acesso ao M.E.S Platform
                        </h2>
                        <label className="flex items-center cursor-pointer gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 transition-all">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                                checked={formData.possui_acesso_sistema}
                                onChange={e => setFormData({ ...formData, possui_acesso_sistema: e.target.checked })}
                            />
                            <span className="text-sm font-bold text-slate-700 select-none">Conceder Login Digital?</span>
                        </label>
                    </div>

                    {formData.possui_acesso_sistema ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-lg bg-blue-50/50 border border-blue-100 animate-in slide-in-from-top-4 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-blue-900 mb-1">E-mail Corporativo (Login)</label>
                                <input required={formData.possui_acesso_sistema} type="email" value={formData.email_acesso} onChange={e => setFormData({ ...formData, email_acesso: e.target.value })} className={`${inputClass} border-blue-200 focus:ring-blue-500`} placeholder="operador@brunswick.pt" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-900 mb-1">Palavra-passe (Login)</label>
                                <input type="password" value={formData.senha_acesso} onChange={e => setFormData({ ...formData, senha_acesso: e.target.value })} className={`${inputClass} border-blue-200 focus:ring-blue-500`} placeholder={id ? "(Ocultada). Digite p/ alterar." : "Ex: Brunswick123!"} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-blue-900 mb-1">Nível de Permissão (Role)</label>
                                <select required={formData.possui_acesso_sistema} value={formData.nivel_permissao} onChange={e => setFormData({ ...formData, nivel_permissao: e.target.value })} className={`${inputClass} appearance-none border-blue-200 focus:ring-blue-500`}>
                                    <option value="">Selecionar Perfil Cibersegurança...</option>
                                    <option value="Operador">Leitura Básica (Consultas)</option>
                                    <option value="Supervisor">Chefe / Supervisor (Vê Hierarquia Orgânica)</option>
                                    <option value="Recursos Humanos">RH (Visibilidade Total Master de Operadores)</option>
                                    <option value="Planeador">Engenheiro Industrial (Muda Roteiros/Modelos)</option>
                                    <option value="Admin">Master Admin (Controlo Total Sistema)</option>
                                </select>
                            </div>

                            {/* Granular Permissions UI */}
                            {formData.nivel_permissao !== "Admin" && (
                                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-blue-200/50">
                                    <label className="block text-xs font-bold text-blue-900 mb-4">
                                        Módulos e Acessos Diretos (Granular)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {[
                                            { path: "/admin/producao/ordens", label: "Gestão de Ordens", group: "Planeamento" },
                                            { path: "/admin/producao/aps", label: "Control Tower / APS Gantt", group: "Planeamento" },
                                            { path: "/admin/producao/live", label: "Andon TV & SCADA", group: "Planeamento" },

                                            { path: "/operador", label: "Terminal HMI Central", group: "Produção" },
                                            { path: "/admin/producao/andon", label: "Saúde OEE do Andon", group: "Produção" },

                                            { path: "/admin/rh/produtividade", label: "Feedback Produtividade", group: "Equipa & Talento" },
                                            { path: "/admin/rh", label: "Gerir Operadores", group: "Equipa & Talento" },
                                            { path: "/admin/rh/avaliacoes", label: "Avaliações Diárias", group: "Equipa & Talento" },
                                            { path: "/admin/rh/avaliacoes-lideranca", label: "Avaliações de Liderança", group: "Equipa & Talento" },
                                            { path: "/admin/rh/produtividade-lideranca", label: "Feedback Liderança", group: "Equipa & Talento" },
                                            { path: "/admin/rh/assiduidade", label: "Assiduidade Ativa", group: "Equipa & Talento" },
                                            { path: "/admin/rh/quiz-cultura", label: "Gestão Quiz Cultura", group: "Equipa & Talento" },
                                            { path: "/operador/quiz", label: "Quiosque (Rating Anónimo)", group: "Equipa & Talento" },

                                            { path: "/logistica/picking", label: "Tablet Armazém (Picking)", group: "Warehouse" },
                                            { path: "/admin/engenharia/genealogia", label: "Rastreabilidade B.O.M", group: "Warehouse" },

                                            { path: "/admin/modelos", label: "Modelos & Produtos", group: "Engenharia" },
                                            { path: "/admin/engenharia/regras", label: "Regras Sequenciais", group: "Engenharia" },
                                            { path: "/admin/engenharia/roteiros", label: "Tempos Roteiro OEE", group: "Engenharia" },
                                            { path: "/admin/engenharia/moldes", label: "Cadastro de Moldes", group: "Engenharia" },
                                            { path: "/admin/fabrica", label: "Fábrica & Estações", group: "Engenharia" },

                                            { path: "/admin/manutencao/moldes", label: "Preventiva Moldes TPM", group: "Manutenção" },

                                            { path: "/admin/qualidade/rnc", label: "Gestão RNC (8D/A3)", group: "Qualidade" },
                                            { path: "/admin/qualidade/templates", label: "Checklists Qualidade", group: "Qualidade" },
                                            { path: "/admin/qualidade/qcis", label: "QCIS Analytics", group: "Qualidade" },

                                            { path: "/admin/lean/kaizen", label: "Ideias Kaizen", group: "Lean" },
                                            { path: "/admin/lean/gemba", label: "Gemba Walking", group: "Lean" },
                                            { path: "/admin/lean/acoes", label: "Scrum Board de Ações", group: "Lean" },

                                            { path: "/admin/hst/ocorrencias", label: "Registar Ocorrência", group: "HST" },
                                            { path: "/admin/hst/epis", label: "Matriz Ocupacional", group: "HST" },
                                            { path: "/admin/hst/certificacoes", label: "Cursos e EPI's", group: "HST" },
                                            { path: "/admin/hst/auditorias", label: "Auditorias HST", group: "HST" },
                                            { path: "/admin/hst/dashboard", label: "Cruz de Segurança", group: "HST" },
                                            { path: "/admin/hst/8d/historico", label: "Investigações 8D", group: "HST" },
                                            { path: "/admin/hst/acoes", label: "Ações HST", group: "HST" },

                                            { path: "/admin/producao/logs", label: "Auditoria Telemetria", group: "Sistema" },
                                            { path: "/admin/diagnostico", label: "Central Dispositivos", group: "Sistema" },
                                            { path: "/admin/configuracoes/gerais", label: "Gerais da Fábrica", group: "Configuração" },
                                            { path: "/admin/qa", label: "Laboratório QA (Auto-Tester)", group: "Configuração" },
                                            { path: "/admin/configuracoes/utilizadores", label: "Níveis de Acesso", group: "Configuração" },
                                        ].map(module => {
                                            const isChecked = formData.permissoes_modulos.includes(module.path);
                                            return (
                                                <label key={module.path} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-white border-blue-400 shadow-sm' : 'bg-transparent border-blue-100 hover:border-blue-300'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 accent-blue-600 w-4 h-4 rounded border-blue-300"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const arr = [...formData.permissoes_modulos];
                                                            if (e.target.checked) arr.push(module.path);
                                                            else {
                                                                const idx = arr.indexOf(module.path);
                                                                if (idx > -1) arr.splice(idx, 1);
                                                            }
                                                            setFormData({ ...formData, permissoes_modulos: arr });
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className={`text-xs font-bold ${isChecked ? 'text-blue-900' : 'text-slate-600'}`}>{module.label}</span>
                                                        <span className="text-[10px] text-slate-400 mt-0.5">{module.group}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-blue-500/70 mt-3 italic flex items-center gap-1">
                                        Selecione as áreas exatas que o utilizador pode aceder na barra principal.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic px-4">Ao não conceder acesso, o Colaborador será estritamente físico (apenas interage com hardware IoT via tag NFC/RFID nas linhas de montagem, mas não possui credenciais Web para fazer login nesta plataforma de Gestão).</p>
                    )}
                </section>

            </div>
        </form>
    );
}

// Wrapper Principal
export default function FormularioRHPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-mono text-slate-400 animate-pulse">A inicializar os ficheiros do Colaborador...</div>}>
            <FuncionarioFormCore />
        </Suspense>
    );
}
