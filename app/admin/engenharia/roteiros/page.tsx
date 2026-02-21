'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, GripVertical, Save, RefreshCw, Box, Map, ArrowRight } from 'lucide-react';
import Image from 'next/image';

type Modelo = {
    id: string;
    nome: string;
    versao: string;
    imagem_url: string | null;
};

type Parte = {
    id: string;
    nome_parte: string;
    descricao: string | null;
    categoria: string;
    parent_id: string | null;
};

type Estacao = {
    id: string;
    nome_estacao: string;
    area: { nome_area: string };
};

type RoteiroPasso = {
    id?: string;
    modelo_id: string;
    sequencia_num: number;
    parte_id: string;
    estacao_destino_id: string;
    tempo_ciclo_especifico: number;
    instrucoes_tecnicas: string | null;
};

export default function RoteirosPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [estacoes, setEstacoes] = useState<Estacao[]>([]);
    const [partes, setPartes] = useState<Parte[]>([]); // Partes do modelo ativo
    const [roteiro, setRoteiro] = useState<RoteiroPasso[]>([]); // O Roteiro do modelo ativo

    const [modeloAtivoId, setModeloAtivoId] = useState<string | null>(null);

    const fetchMestres = useCallback(async () => {
        setIsLoading(true);
        try {
            const [modRes, estRes] = await Promise.all([
                supabase.from('modelos').select('id, nome, versao, imagem_url').order('nome'),
                supabase.from('estacoes').select('id, nome_estacao, area:areas_fabrica(nome_area)').order('nome_estacao')
            ]);

            if (modRes.data) setModelos(modRes.data);
            if (estRes.data) setEstacoes(estRes.data as unknown as Estacao[]);
            if (modRes.data && modRes.data.length > 0) {
                setModeloAtivoId(modRes.data[0].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchMestres();
    }, [fetchMestres]);

    // Sempre que o Modelo Ativo muda, carregar os detalhes dele (BOM e o Routing gravado atual)
    useEffect(() => {
        if (!modeloAtivoId) return;

        const loadModelDetails = async () => {
            setIsLoading(true);
            try {
                const [bomRes, rotRes] = await Promise.all([
                    supabase.from('modelo_partes').select('id, nome_parte, descricao, categoria, parent_id').eq('modelo_id', modeloAtivoId).order('created_at'),
                    supabase.from('roteiros_sequencia').select('*').eq('modelo_id', modeloAtivoId).order('sequencia_num', { ascending: true })
                ]);

                if (bomRes.data) setPartes(bomRes.data);
                if (rotRes.data) setRoteiro(rotRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadModelDetails();
    }, [modeloAtivoId, supabase]);


    const handleAddPasso = () => {
        if (!modeloAtivoId || partes.length === 0 || estacoes.length === 0) return;

        // Obter número de sequência máximo
        const maxSeq = roteiro.reduce((max, r) => r.sequencia_num > max ? r.sequencia_num : max, 0);

        const newPasso: RoteiroPasso = {
            modelo_id: modeloAtivoId,
            sequencia_num: maxSeq + 10, // Incrementamos 10 em 10 para dar espaco a intercalar
            parte_id: partes[0].id,
            estacao_destino_id: estacoes[0].id,
            tempo_ciclo_especifico: 60,
            instrucoes_tecnicas: ''
        };

        setRoteiro([...roteiro, newPasso]);
    };

    const handlePassoChange = (idx: number, field: keyof RoteiroPasso, value: string | number) => {
        const novo = [...roteiro];
        novo[idx] = { ...novo[idx], [field]: value };
        setRoteiro(novo);
    };

    const handleRemoverPasso = (idx: number) => {
        const novo = [...roteiro];
        novo.splice(idx, 1);
        setRoteiro(novo);
    };

    const handleSaveRoteiro = async () => {
        if (!modeloAtivoId) return;

        // VALIDAÇÃO B.O.M: Uma peça (parte_id) nunca pode entrar (sequencia_num) ANTES de uma peça que seja a sua parent_id.
        for (const passo of roteiro) {
            const parteAssociada = partes.find(p => p.id === passo.parte_id);
            if (parteAssociada && parteAssociada.parent_id) {
                // Existe uma parent_id. Temos de garantir que esta parent já foi montada num passo ANTERIOR ou no MESMO passo.
                // Se a Parent não existe de todo no Roteiro atual, ou se ela for executada apenas no futuro, dá erro.
                const passoDoPai = roteiro.find(r => r.parte_id === parteAssociada.parent_id);

                if (!passoDoPai) {
                    alert(`Validação B.O.M Falhou:\n\nA peça "${parteAssociada.nome_parte}" depende da peça Pai, mas a peça Pai não foi inserida no Roteiro Produtivo.`);
                    return;
                }

                if (passoDoPai.sequencia_num > passo.sequencia_num) {
                    const paiLocal = partes.find(p => p.id === parteAssociada.parent_id);
                    alert(`Validação B.O.M Falhou:\n\nA peça "${parteAssociada.nome_parte}" (Agendada: Passo ${passo.sequencia_num}) tenta ser montada ANTES da sua peça predecessora obrigatória "${paiLocal?.nome_parte || 'Pai'}" (Agendada: Passo ${passoDoPai.sequencia_num}).`);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            // Elimpar roteiro velho
            await supabase.from('roteiros_sequencia').delete().eq('modelo_id', modeloAtivoId);

            // Inserir roteiro novo
            if (roteiro.length > 0) {
                // Prevenir duplicacao de id se tivermos re-arranjado
                const payload = roteiro.map(r => ({
                    modelo_id: r.modelo_id,
                    sequencia_num: r.sequencia_num,
                    parte_id: r.parte_id,
                    estacao_destino_id: r.estacao_destino_id,
                    tempo_ciclo_especifico: r.tempo_ciclo_especifico,
                    instrucoes_tecnicas: r.instrucoes_tecnicas || null
                }));
                const { error } = await supabase.from('roteiros_sequencia').insert(payload);
                if (error) throw error;
            }

            alert("Roteiro Produtivo guardado na BD!");
        } catch (error: unknown) {
            console.error(error);
            alert("Erro a guardar roteiro: " + (error instanceof Error ? error.message : "Erro desconhecido"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '100%', padding: '1rem', overflowX: 'hidden' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 50, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                background: 'rgba(15, 23, 42, 0.95)', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                margin: '-1rem -1rem 2rem -1rem', width: 'calc(100% + 2rem)', overflowX: 'auto', whiteSpace: 'nowrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        Roteiros Produtivos (B.O.M.)
                    </h1>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 12px' }}></div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: '0.85rem', margin: 0 }}>
                        Construtor de Sequências
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => fetchMestres()} disabled={isLoading || isSaving}>
                        <RefreshCw size={14} style={{ marginRight: '6px' }} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', boxShadow: '0 0 15px var(--accent)', background: 'var(--accent)' }} onClick={handleAddPasso} disabled={isLoading || isSaving || !modeloAtivoId}>
                        <Plus size={14} style={{ marginRight: '6px' }} />
                        Adicionar Passo
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', boxShadow: '0 0 15px var(--primary)' }} onClick={handleSaveRoteiro} disabled={isLoading || isSaving || !modeloAtivoId}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} /> : <Save size={14} style={{ marginRight: '6px' }} />}
                        Gravar Sequência
                    </button>
                </div>
            </header>

            {isLoading && !modeloAtivoId ? (
                <div className="flex justify-center items-center py-20 opacity-50">
                    <Loader2 size={48} className="animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Lateral Esquerda - Selector de Modelo */}
                    <div style={{ width: '300px', flexShrink: 0 }}>
                        <div className="glass-panel" style={{ padding: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Box size={18} color="var(--primary)" /> Produto Alvo
                            </h3>
                            <div className="flex flex-col gap-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {modelos.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setModeloAtivoId(m.id)}
                                        style={{
                                            padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                            background: modeloAtivoId === m.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                                            border: modeloAtivoId === m.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex', alignItems: 'center', gap: '12px'
                                        }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: '6px', background: '#000', overflow: 'hidden', flexShrink: 0 }}>
                                            {m.imagem_url && <Image src={m.imagem_url} alt={m.nome} width={36} height={36} style={{ objectFit: 'cover' }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>{m.nome}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Versão: {m.versao}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Area Central - Builder de Passos */}
                    <div style={{ flex: 1 }}>
                        {modeloAtivoId ? (
                            <div className="glass-panel p-6">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Map size={24} color="var(--accent)" /> Fluxo de Sequenciamento
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 400, marginLeft: '8px' }}>(Passo a Passo)</span>
                                </h3>

                                {roteiro.length === 0 ? (
                                    <div className="p-10 border border-dashed rounded-xl text-center opacity-50 flex flex-col items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                        <ArrowRight size={32} />
                                        <div>Nenhum roteiro definido para este barco.</div>
                                        <div style={{ fontSize: '0.8rem' }}>Adicione o 1º passo no botão acima.</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {roteiro.map((passo, idx) => (
                                            <div key={idx} className="flex gap-4 items-center glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                                                {/* Grip Icon */}
                                                <div style={{ cursor: 'grab', opacity: 0.3 }}><GripVertical size={20} /></div>

                                                {/* Seq */}
                                                <div style={{ width: '60px' }}>
                                                    <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>Passo Nº</label>
                                                    <input
                                                        type="number"
                                                        value={passo.sequencia_num}
                                                        onChange={e => handlePassoChange(idx, 'sequencia_num', parseInt(e.target.value) || 0)}
                                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', textAlign: 'center' }}
                                                    />
                                                </div>

                                                {/* BOM Peca */}
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>Peça / Categoria (BOM)</label>
                                                    <select
                                                        value={passo.parte_id}
                                                        onChange={e => handlePassoChange(idx, 'parte_id', e.target.value)}
                                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
                                                    >
                                                        {partes.map(p => (
                                                            <option key={p.id} value={p.id}>{p.nome_parte} ({p.categoria})</option>
                                                        ))}
                                                        {partes.length === 0 && <option value="">Nenhuma peça cadastrada</option>}
                                                    </select>
                                                </div>

                                                <div style={{ opacity: 0.3 }}><ArrowRight size={20} /></div>

                                                {/* Estacao */}
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>Estação de Destino</label>
                                                    <select
                                                        value={passo.estacao_destino_id}
                                                        onChange={e => handlePassoChange(idx, 'estacao_destino_id', e.target.value)}
                                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', borderRadius: '6px', color: '#fff' }}
                                                    >
                                                        {estacoes.map(e => (
                                                            <option key={e.id} value={e.id}>{e.area.nome_area} &raquo; {e.nome_estacao}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* SLA */}
                                                <div style={{ width: '110px' }}>
                                                    <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>SLA Específico</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={passo.tempo_ciclo_especifico}
                                                            onChange={e => handlePassoChange(idx, 'tempo_ciclo_especifico', parseFloat(e.target.value) || 0)}
                                                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', textAlign: 'right' }}
                                                        />
                                                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>min</span>
                                                    </div>
                                                </div>

                                                {/* Trash */}
                                                <button onClick={() => handleRemoverPasso(idx)} className="hover:opacity-100" style={{ padding: '0.5rem', color: '#ef4444', opacity: 0.7, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="glass-panel p-10 flex items-center justify-center opacity-50 h-full">
                                Selecione um modelo à esquerda para editar o seu roteiro prático.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
