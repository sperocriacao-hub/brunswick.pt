"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { criarContaAcesso } from './actions';

// Componente Core contido em Fallback do Suspense Client
function FuncionarioFormCore() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // Modo Edição vs Criação

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(!!id);
    const [estacoesDisponiveis, setEstacoesDisponiveis] = useState<any[]>([]);
    const [areasDisponiveis, setAreasDisponiveis] = useState<{ id: string, nome_area: string }[]>([]);
    const [originalEmail, setOriginalEmail] = useState('');

    // Novos Dicionários e Listas Hierárquicas
    const [funcoesDisponiveis, setFuncoesDisponiveis] = useState<{ id: string, nome_funcao: string }[]>([]);
    const [lideresDisponiveis, setLideresDisponiveis] = useState<{ id: string, nome_operador: string }[]>([]);
    const [supervisoresDisponiveis, setSupervisoresDisponiveis] = useState<{ id: string, nome_operador: string }[]>([]);
    const [gestoresDisponiveis, setGestoresDisponiveis] = useState<{ id: string, nome_operador: string }[]>([]);

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
        area_base_id: '',
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
    
    // Novo State para ILUO Relacional Múltiplo
    const [iluoList, setIluoList] = useState<{estacao_id: string, nivel_iluo: string, avaliador_nome: string, data_avaliacao: string}[]>([]);
    
    // State para Histórico/Roadmap de Formações
    const [historicoFormacoes, setHistoricoFormacoes] = useState<any[]>([]);

    useEffect(() => {
        // Carregar Estações (Para Alocação do Posto de Trabalho M.E.S)
        supabase.from('estacoes').select('id, nome_estacao, areas_fabrica(id)').order('nome_estacao')
            .then(({ data }) => setEstacoesDisponiveis(data || []));

        // Carregar Áreas de Fábrica (Para Equipa / Grupo)
        supabase.from('areas_fabrica').select('id, nome_area').order('nome_area')
            .then(({ data }) => setAreasDisponiveis(data || []));

        // Carregar Funções DB
        supabase.from('funcoes').select('id, nome_funcao').order('nome_funcao')
            .then(({ data }) => setFuncoesDisponiveis(data || []));

        // Carregar Líderes (Coordenador de Grupo)
        supabase.from('operadores').select('id, nome_operador').eq('funcao', 'Coordenador de Grupo').order('nome_operador')
            .then(({ data }) => setLideresDisponiveis(data || []));

        // Carregar Supervisores
        supabase.from('operadores').select('id, nome_operador').eq('funcao', 'Supervisor').order('nome_operador')
            .then(({ data }) => setSupervisoresDisponiveis(data || []));

        // Carregar Gestores
        supabase.from('operadores').select('id, nome_operador').eq('funcao', 'Gestor').order('nome_operador')
            .then(({ data }) => setGestoresDisponiveis(data || []));

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
                            area_base_id: data.area_base_id || '',
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
                
            // Carregar Matrizes Relacionais ILUO do Colaborador
            supabase.from('operador_iluo_matriz').select('*').eq('operador_id', id)
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setIluoList(data.map((item: any) => ({
                            estacao_id: item.estacao_id,
                            nivel_iluo: item.nivel_iluo,
                            avaliador_nome: item.avaliador_nome || '',
                            data_avaliacao: item.data_avaliacao ? item.data_avaliacao.substring(0, 10) : ''
                        })));
                    }
                });

            // Carregar Histórico e Roadmap de Formações
            supabase.from('rh_planos_formacao')
                .select('*, estacao:estacoes(nome_estacao), formador:operadores!formador_id(nome_operador)')
                .eq('formando_id', id)
                .order('data_inicio', { ascending: false })
                .then(({ data }) => setHistoricoFormacoes(data || []));

            // Carregar e calcular Média Histórica de Avaliações em tempo real (Garante a precisão)
            Promise.all([
                supabase.from('avaliacoes_diarias').select('*').eq('funcionario_id', id),
                supabase.from('avaliacoes_lideranca').select('*').eq('funcionario_id', id)
            ]).then(([diariasRes, liderancaRes]) => {
                let totalScore = 0;
                let numMetrics = 0;

                if (diariasRes.data && !diariasRes.error) {
                    diariasRes.data.forEach((av: any) => {
                        totalScore += Number(av.nota_hst||0) + Number(av.nota_epi||0) + Number(av.nota_5s||0) + Number(av.nota_qualidade||0) + Number(av.nota_eficiencia||0) + Number(av.nota_objetivos||0) + Number(av.nota_atitude||0);
                        numMetrics += 7;
                    });
                }

                if (liderancaRes.data && !liderancaRes.error) {
                    liderancaRes.data.forEach((av: any) => {
                        totalScore += Number(av.nota_hst||0) + Number(av.nota_epi||0) + Number(av.nota_5s||0) + Number(av.nota_eficiencia||0) + Number(av.nota_objetivos||0) + Number(av.nota_atitude||0) + Number(av.nota_gestao_motivacao||0) + Number(av.nota_desenvolvimento||0) + Number(av.nota_desperdicios||0) + Number(av.nota_qualidade||0) + Number(av.nota_operacoes||0) + Number(av.nota_melhoria||0) + Number(av.nota_kpis||0) + Number(av.nota_cultura||0);
                        numMetrics += 14;
                    });
                }

                if (numMetrics > 0) {
                    const avg = totalScore / numMetrics;
                    setFormData(prev => ({ ...prev, matriz_talento_media: avg.toFixed(1) }));
                }
            });
        }
    }, [id, supabase]);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload: Record<string, unknown> = { ...formData };
        delete payload.senha_acesso; // Nunca guardar passwords não cifradas na base de dados de RH
        payload.iluo_nivel = 'I'; // Bypass temporário para a restrição legada da BD antiga

        if (payload.matriz_talento_media === '') payload.matriz_talento_media = null;
        if (payload.posto_base_id === '') payload.posto_base_id = null;
        if (payload.area_base_id === '') payload.area_base_id = null;
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
        let finalOpId: string | null = id;

        if (id) {
            const { error } = await supabase.from('operadores').update(payload).eq('id', id);
            errorObj = error;
        } else {
            const { data, error } = await supabase.from('operadores').insert([payload]).select();
            errorObj = error;
            if (data && data.length > 0) finalOpId = data[0].id;
        }

        setIsLoading(false);

        if (errorObj) {
            alert("Erro ao gravar ficha cadastral: " + errorObj.message);
        } else {
            // Sincronizar Relacionamentos ILUO
            if (finalOpId && finalOpId.trim() !== '') {
                // Delete everything older
                const { error: deleteError } = await supabase.from('operador_iluo_matriz').delete().eq('operador_id', finalOpId);
                if (deleteError) {
                    alert("Aviso: Erro ao limpar matrizes antigas: " + deleteError.message);
                }
                
                const validList = iluoList.filter(i => i.estacao_id && i.estacao_id.trim() !== '');
                
                // UX Auto-FallBack: Capturar valores que o utilizador selecionou mas esqueceu de clicar em "Adicionar"
                const pendingEstacaoL = document.getElementById('iluo_estacao') as HTMLSelectElement | null;
                const pendingNivelL = document.getElementById('iluo_nivel') as HTMLSelectElement | null;
                const pendingAvL = document.getElementById('iluo_avaliador') as HTMLInputElement | null;
                
                if (pendingEstacaoL && pendingEstacaoL.value && pendingEstacaoL.value.trim() !== '') {
                    // Evitar duplicar se já foi adicionado
                    if (!validList.find(i => i.estacao_id === pendingEstacaoL.value)) {
                        validList.push({
                            estacao_id: pendingEstacaoL.value,
                            nivel_iluo: pendingNivelL?.value || 'I',
                            avaliador_nome: pendingAvL?.value || 'Sistema',
                            data_avaliacao: new Date().toISOString().substring(0, 10)
                        });
                    }
                }
                
                if (validList.length > 0) {
                    const mappedIluoRows = validList.map(i => ({
                        operador_id: finalOpId,
                        estacao_id: i.estacao_id,
                        nivel_iluo: i.nivel_iluo || 'I',
                        avaliador_nome: i.avaliador_nome || 'Sistema',
                        data_avaliacao: i.data_avaliacao || new Date().toISOString()
                    }));
                    
                    const { data: insertedData, error: iluoError } = await supabase.from('operador_iluo_matriz').insert(mappedIluoRows).select();
                    if (iluoError) {
                        alert("Erro a gravar as matrizes ILUO: " + iluoError.message);
                        return; // Halt navigation
                    }
                    if (!insertedData || insertedData.length === 0) {
                        alert("Atenção Crítica: O Supabase reportou sucesso (Sem Erros) mas rejeitou fisicamente os dados (0 linhas gravadas)! Contacte suporte (Verifique a permissão RLS do Postgres).");
                        return;
                    } else {
                        // Forçamos o browser a mostrar-nos a verdade!
                        alert("Gravado com Sucesso: " + insertedData.length + " Matrizes ILUO foram escritas na base de dados (Tabela Nova)!");
                    }
                } else {
                    alert("Aviso: Nenhuma Matriz ILUO foi encontrada para gravar. A tabela para este operário ficará vazia.");
                }
            }

            router.push('/admin/rh');
            router.refresh();
        }
    };

    const getIluoPoints = (nivel: string) => {
        if (nivel === 'I') return 1;
        if (nivel === 'L') return 2;
        if (nivel === 'U') return 3;
        if (nivel === 'O') return 4;
        return 0;
    };

    const getIluoCoefficient = () => {
        if (!formData.posto_base_id || iluoList.length === 0) return 0;
        
        // Find Area of the Primary Station
        const estacaoPrincipalInfo = estacoesDisponiveis.find(e => e.id === formData.posto_base_id);
        const areaId = estacaoPrincipalInfo?.areas_fabrica?.id;

        if (!areaId) return 0;

        let totalPoints = 0;
        iluoList.forEach(iluo => {
            const pts = getIluoPoints(iluo.nivel_iluo);
            const estInfo = estacoesDisponiveis.find(e => e.id === iluo.estacao_id);
            if (estInfo && estInfo.areas_fabrica?.id === areaId) {
                totalPoints += pts; // Mesma área
            } else {
                totalPoints += pts * 1.25; // Bonus polivalência externa
            }
        });

        // Benchmark Excelência (12 Pontos na Área = Max 4.0)
        const BENCHMARK = 12.0;
        let coeff = (totalPoints / BENCHMARK) * 4.0;
        if (coeff > 4.0) coeff = 4.0;
        
        return Math.round(coeff * 10) / 10;
    };

    const iluoCoefficient = getIluoCoefficient();
    const evalCoefficientStr = formData.matriz_talento_media || '0';
    let evalCoefficient = parseFloat(evalCoefficientStr);
    if (isNaN(evalCoefficient)) evalCoefficient = 0;
    
    // Coeficiente Real
    const realCoefficient = Math.round(((iluoCoefficient + evalCoefficient) / 2) * 10) / 10;

    const getBadgeInfo = (coeff: number) => {
        if (coeff > 3.8) return { label: 'Super Estrela', classes: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-extrabold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]' };
        if (coeff >= 3.5) return { label: 'Estrela', classes: 'bg-sky-100 text-sky-800 border-sky-400 font-bold' };
        if (coeff >= 3.0) return { label: 'Potencial', classes: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-400 font-bold' };
        if (coeff >= 2.5) return { label: 'Contribuidor', classes: 'bg-amber-100 text-amber-800 border-amber-400 font-bold' };
        if (coeff >= 2.0) return { label: 'Passageiro', classes: 'bg-orange-100 text-orange-800 border-orange-400 font-bold' };
        return { label: 'Alerta RH', classes: 'bg-red-100 text-red-800 border-red-500 font-extrabold' };
    };
    
    const badge = getBadgeInfo(realCoefficient);

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
                            <select value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value })} className={`${inputClass} appearance-none`}>
                                <option value="">Selecionar Função...</option>
                                {funcoesDisponiveis.map(f => (
                                    <option key={f.id} value={f.nome_funcao}>{f.nome_funcao}</option>
                                ))}
                                {formData.funcao && !funcoesDisponiveis.find(f => f.nome_funcao === formData.funcao) && (
                                    <option value={formData.funcao}>{formData.funcao} (Antigo)</option>
                                )}
                            </select>
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
                            <select 
                                value={formData.area_base_id} 
                                onChange={e => {
                                    const selId = e.target.value;
                                    const selName = selId ? e.target.options[e.target.selectedIndex].text : '';
                                    setFormData({ ...formData, area_base_id: selId, grupo_equipa: selName });
                                }} 
                                className={`${inputClass} appearance-none`}
                            >
                                <option value="">Não Alocada...</option>
                                {areasDisponiveis.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome_area}</option>
                                ))}
                                {formData.grupo_equipa && !formData.area_base_id && (
                                    <option value="" disabled>⚠️ Antigo: {formData.grupo_equipa}</option>
                                )}
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
                            <select value={formData.lider_nome} onChange={e => setFormData({ ...formData, lider_nome: e.target.value })} className={`${inputClass} text-xs appearance-none`}>
                                <option value="">Não Aplicável</option>
                                {lideresDisponiveis.map(l => (
                                    <option key={l.id} value={l.nome_operador}>{l.nome_operador}</option>
                                ))}
                                {formData.lider_nome && !lideresDisponiveis.find(l => l.nome_operador === formData.lider_nome) && (
                                    <option value={formData.lider_nome}>{formData.lider_nome} (Antigo)</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Supervisor</label>
                            <select value={formData.supervisor_nome} onChange={e => setFormData({ ...formData, supervisor_nome: e.target.value })} className={`${inputClass} text-xs appearance-none`}>
                                <option value="">Não Aplicável</option>
                                {supervisoresDisponiveis.map(s => (
                                    <option key={s.id} value={s.nome_operador}>{s.nome_operador}</option>
                                ))}
                                {formData.supervisor_nome && !supervisoresDisponiveis.find(s => s.nome_operador === formData.supervisor_nome) && (
                                    <option value={formData.supervisor_nome}>{formData.supervisor_nome} (Antigo)</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Gestor</label>
                            <select value={formData.gestor_nome} onChange={e => setFormData({ ...formData, gestor_nome: e.target.value })} className={`${inputClass} text-xs appearance-none`}>
                                <option value="">Não Aplicável</option>
                                {gestoresDisponiveis.map(g => (
                                    <option key={g.id} value={g.nome_operador}>{g.nome_operador}</option>
                                ))}
                                {formData.gestor_nome && !gestoresDisponiveis.find(g => g.nome_operador === formData.gestor_nome) && (
                                    <option value={formData.gestor_nome}>{formData.gestor_nome} (Antigo)</option>
                                )}
                            </select>
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
                <section className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg lg:col-span-2">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-slate-800 border-b border-slate-100 pb-3">IV. Habilidades Fabris & Matriz Polivalência (ILUO)</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ILUO Multi-Skills Matrix Section */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase">Cartão de Habilidades (Certificações Validadas)</h3>
                            
                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Máquina / Estação</label>
                                    <select id="iluo_estacao" className={inputClass}>
                                        <option value="">(Selecione)</option>
                                        {estacoesDisponiveis.map(e => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Proficiência</label>
                                    <select id="iluo_nivel" className={`${inputClass} font-bold text-indigo-700`}>
                                        <option value="I">I - Trainee</option>
                                        <option value="L">L - Autónomo</option>
                                        <option value="U">U - Especialista</option>
                                        <option value="O">O - Formador</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Instrutor (Avaliador)</label>
                                    <input type="text" id="iluo_avaliador" className={inputClass} placeholder="Nome..." />
                                </div>
                                <div className="md:col-span-1">
                                    <button 
                                        type="button"
                                        className="w-full bg-slate-800 text-white font-bold py-2 px-3 rounded-md text-xs hover:bg-slate-900 transition-colors shadow-sm"
                                        onClick={() => {
                                            const e = document.getElementById('iluo_estacao') as HTMLSelectElement;
                                            const l = document.getElementById('iluo_nivel') as HTMLSelectElement;
                                            const a = document.getElementById('iluo_avaliador') as HTMLInputElement;
                                            if(!e.value) return;
                                            
                                            // Guardar valores primitivos IMEDIATAMENTE antes da função assíncrona do React
                                            const valEstacao = e.value;
                                            const valNivel = l.value;
                                            const valAvaliador = a.value;
                                            
                                            setIluoList(prev => {
                                                const cleaned = prev.filter(item => item.estacao_id !== valEstacao);
                                                return [...cleaned, {
                                                    estacao_id: valEstacao,
                                                    nivel_iluo: valNivel,
                                                    avaliador_nome: valAvaliador,
                                                    data_avaliacao: new Date().toISOString().substring(0, 10)
                                                }];
                                            });
                                            
                                            e.value = '';
                                            a.value = '';
                                        }}
                                    >Adicionar</button>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {iluoList.map(skill => {
                                    const estacaoNome = estacoesDisponiveis.find(e => e.id === skill.estacao_id)?.nome_estacao || 'Desconhecida';
                                    const cores: Record<string, string> = {
                                        'I': 'bg-slate-100 text-slate-600 border-slate-300',
                                        'L': 'bg-amber-100 text-amber-700 border-amber-300',
                                        'U': 'bg-blue-100 text-blue-700 border-blue-300',
                                        'O': 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    };
                                    return (
                                        <div key={skill.estacao_id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white shadow-sm hover:border-slate-300 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-9 h-9 rounded-full border-2 shadow-inner flex items-center justify-center font-black ${cores[skill.nivel_iluo] || cores['I']}`}>
                                                    {skill.nivel_iluo}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{estacaoNome}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">Avaliado por {skill.avaliador_nome || 'Sistema'} em {skill.data_avaliacao}</div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setIluoList(prev => prev.filter(i => i.estacao_id !== skill.estacao_id))} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md border border-transparent hover:border-red-100 transition-colors">Retirar</button>
                                        </div>
                                    )
                                })}
                                {iluoList.length === 0 && (
                                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
                                        <p className="text-slate-500 font-medium text-sm">Operário sem portefólio ILUO.</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Este funcionário não tem permissão matriculada em nenhuma máquina/estação produtiva.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Meta and Legacy */}
                        <div className="lg:col-span-1 space-y-5 border-l border-slate-100 lg:pl-8">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner relative overflow-hidden">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Motor Dinâmico de Talentos</h4>
                                
                                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                                    <div className="bg-white p-2 border border-slate-200 rounded-lg text-center shadow-sm">
                                        <div className="text-[9px] font-bold text-slate-500 uppercase">ILUO Habilidades</div>
                                        <div className="text-xl font-black text-slate-800">{iluoCoefficient.toFixed(1)} <span className="text-[10px] text-slate-400 font-medium">/ 4.0</span></div>
                                    </div>
                                    <div className="bg-white p-2 border border-slate-200 rounded-lg text-center shadow-sm relative group cursor-help">
                                        <div className="text-[9px] font-bold text-slate-500 uppercase">Avaliações Históricas</div>
                                        <div className="flex items-center justify-center">
                                            <span className="text-xl font-black text-blue-700">{evalCoefficient.toFixed(1)}</span>
                                            <span className="text-[10px] text-slate-400 font-medium ml-1">/ 4.0</span>
                                        </div>
                                        {/* Tooltip */}
                                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 shadow-xl rounded-md p-2 text-left z-50">
                                            <div className="text-white text-xs font-medium">Extraído em tempo real das tabelas de Avaliações Diárias e de Liderança.</div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white border border-indigo-100 rounded-lg p-3 text-center shadow-[0_2px_10px_rgba(79,70,229,0.06)] relative z-10">
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Coeficiente Real</div>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-3xl font-black text-indigo-900">{realCoefficient.toFixed(1)}</span>
                                        <div className={`px-2 py-1 rounded text-xs uppercase tracking-tight border ${badge.classes} min-w-[100px]`}>
                                            {badge.label}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Background Decorative Element */}
                                <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                                    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                            </div>

                            <div className="relative mt-6">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Anotações da Liderança Fabril / RH</label>
                                <textarea rows={5} value={formData.notas_rh} onChange={e => setFormData({ ...formData, notas_rh: e.target.value })} className={`${inputClass} resize-none h-32 focus:bg-white`} placeholder="Registo de advertências, progressões ou absentismo grave..." />
                            </div>
                        </div>

                        {/* Roadmap de Formações (Academia Fabril) */}
                        {id && (
                            <div className="lg:col-span-3 mt-6 pt-6 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                                    <span>Roadmap de Capacitação & Formação Oficial (P.I.P / Academia)</span>
                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">{historicoFormacoes.length} Registos</Badge>
                                </h3>
                                
                                {historicoFormacoes.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                                        <p className="text-slate-500 font-medium text-sm">Sem histórico de capacitação na Academia.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {historicoFormacoes.map(f => (
                                            <div key={f.id} className="bg-white border hover:border-purple-300 border-slate-200 rounded-xl p-4 shadow-sm transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-black text-slate-800 text-sm group-hover:text-purple-700 transition-colors uppercase">
                                                            {f.estacao?.nome_estacao}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Formador: {f.formador?.nome_operador}</p>
                                                    </div>
                                                    <Badge variant="outline" className={`font-bold text-[9px] uppercase ${f.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : f.status === 'Em Curso' ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                                                        {f.status}
                                                    </Badge>
                                                </div>

                                                <div className="flex gap-2 text-[10px] items-center text-slate-400 font-mono mt-4 pt-4 border-t border-slate-100">
                                                    <span>Início: <strong className="text-slate-600 font-sans">{new Date(f.data_inicio).toLocaleDateString('pt-PT')}</strong></span>
                                                    <span>•</span>
                                                    <span>Alvo/Fim: <strong className="text-purple-600 font-sans">{f.data_fim_estimada ? new Date(f.data_fim_estimada).toLocaleDateString('pt-PT') : (f.data_fim ? new Date(f.data_fim).toLocaleDateString('pt-PT') : 'N/A')}</strong></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
                                            { path: "/admin/engenharia/oee", label: "Analytics (Desperdício OEE)", group: "Produção" },
                                            { path: "/admin/producao/financeiro", label: "OEE Ledger (Finanças)", group: "Produção" },

                                            { path: "/admin/rh/produtividade", label: "Feedback Produtividade", group: "Equipa & Talento" },
                                            { path: "/admin/rh", label: "Gerir Operadores", group: "Equipa & Talento" },
                                            { path: "/admin/rh/iluo", label: "Matriz ILUO (Skills)", group: "Equipa & Talento" },
                                            { path: "/admin/rh/avaliacoes", label: "Avaliações Diárias", group: "Equipa & Talento" },
                                            { path: "/admin/rh/avaliacoes-lideranca", label: "Avaliações de Liderança", group: "Equipa & Talento" },
                                            { path: "/admin/rh/produtividade-lideranca", label: "Feedback Liderança", group: "Equipa & Talento" },
                                            { path: "/admin/rh/assiduidade", label: "Assiduidade Ativa", group: "Equipa & Talento" },
                                            { path: "/admin/rh/formacoes", label: "Academia Fabril", group: "Clima & Academia" },
                                            { path: "/admin/rh/gestao-quizzes", label: "Gestão de Quizzes 360", group: "Clima & Academia" },
                                            { path: "/operador/quiz", label: "Quiosque (Rating Anónimo)", group: "Equipa & Talento" },

                                            { path: "/logistica/picking", label: "Tablet Armazém (Picking)", group: "Warehouse" },
                                            { path: "/admin/engenharia/genealogia", label: "Rastreabilidade B.O.M", group: "Warehouse" },

                                            { path: "/admin/modelos", label: "Modelos & Produtos", group: "Engenharia" },
                                            { path: "/admin/engenharia/regras", label: "Regras Sequenciais", group: "Engenharia" },
                                            { path: "/admin/engenharia/roteiros", label: "Tempos Roteiro OEE", group: "Engenharia" },
                                            { path: "/admin/engenharia/moldes", label: "Cadastro de Moldes", group: "Engenharia" },
                                            { path: "/admin/fabrica", label: "Fábrica & Estações", group: "Engenharia" },

                                            { path: "/admin/manutencao/moldes", label: "Preventiva Moldes TPM", group: "Manutenção" },

                                            { path: "/admin/qualidade/rnc", label: "Gestão RNC (Lançar)", group: "Qualidade" },
                                            { path: "/admin/qualidade/rnc/quadro", label: "Scrum Board RNC", group: "Qualidade" },
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
