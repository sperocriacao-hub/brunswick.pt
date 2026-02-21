'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import Image from 'next/image';

type Area = {
    id: string;
    nome_area: string;
    ordem_sequencial: number;
};

type Modelo = {
    id: string;
    nome: string;
    versao: string;
    imagem_url: string | null;
};

type TimingRule = {
    id?: string;
    modelo_id: string;
    area_id: string;
    offset_dias: number;
    duracao_dias: number;
};

export default function RegrasSequenciamentoPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [areas, setAreas] = useState<Area[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [rules, setRules] = useState<Record<string, TimingRule>>({}); // Key: "modeloId_areaId"
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Areas
            const { data: areasData } = await supabase
                .from('areas_fabrica')
                .select('id, nome_area, ordem_sequencial')
                .order('ordem_sequencial', { ascending: true });

            if (areasData) setAreas(areasData);

            // Fetch Modelos
            const { data: modelosData } = await supabase
                .from('modelos')
                .select('id, nome, versao, imagem_url')
                .order('nome', { ascending: true });

            if (modelosData) setModelos(modelosData);

            // Fetch Timing Rules
            const { data: rulesData } = await supabase
                .from('modelo_area_timing')
                .select('*');

            if (rulesData) {
                const rulesMap: Record<string, TimingRule> = {};
                rulesData.forEach(rule => {
                    rulesMap[`${rule.modelo_id}_${rule.area_id}`] = rule;
                });
                setRules(rulesMap);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Erro ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCellChange = (modeloId: string, areaId: string, field: 'offset_dias' | 'duracao_dias', value: string) => {
        const numValue = value === '' || isNaN(Number(value)) ? 0 : Number(value);
        const key = `${modeloId}_${areaId}`;

        setRules(prev => {
            const currentRule = prev[key] || { modelo_id: modeloId, area_id: areaId, offset_dias: 0, duracao_dias: 1 };
            return {
                ...prev,
                [key]: { ...currentRule, [field]: numValue }
            };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const rulesToUpsert = Object.values(rules);
            if (rulesToUpsert.length === 0) {
                setIsSaving(false);
                return;
            }

            // O Supabase tem uma flag nativa para ON CONFLICT. Vamos remover os ID's de quem não tinha para forçar o match pelas colunas UNIQUE.
            const payload = rulesToUpsert.map(r => ({
                modelo_id: r.modelo_id,
                area_id: r.area_id,
                offset_dias: r.offset_dias,
                duracao_dias: r.duracao_dias
                // Evitamos o 'id' aqui no insert principal para que a restrição UNIQUE (modelo, area) dispare o Upsert natural
            }));

            const { error } = await supabase
                .from('modelo_area_timing')
                .upsert(payload, { onConflict: 'modelo_id, area_id' });

            if (error) throw error;

            alert("Regras guardadas com sucesso!");
            fetchData(); // Reload para buscar IDs verdadeiros gravados
        } catch (error: unknown) {
            console.error("Error saving rules:", error);
            alert("Erro ao guardar regras: " + (error instanceof Error ? error.message : "Erro desconhecido"));
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
                margin: '-1rem -1rem 2rem -1rem', width: 'calc(100% + 2rem)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        Regras de Sequenciamento
                    </h1>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 12px' }}></div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: '0.85rem', margin: 0 }}>
                        Offsets & Durações
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={fetchData} disabled={isLoading || isSaving}>
                        <RefreshCw size={14} style={{ marginRight: '6px' }} className={isLoading ? "animate-spin" : ""} />
                        Recarregar
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', boxShadow: '0 0 15px var(--primary)' }} onClick={handleSave} disabled={isLoading || isSaving}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} /> : <Save size={14} style={{ marginRight: '6px' }} />}
                        Guardar Alterações
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 opacity-50">
                    <Loader2 size={48} className="animate-spin" />
                </div>
            ) : (
                <div className="glass-panel" style={{ overflowX: 'auto', padding: '1px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', position: 'sticky', left: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
                                    Modelo Produto
                                </th>
                                {areas.map(area => (
                                    <th key={area.id} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', minWidth: '220px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{area.nome_area}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400 }}>Pos. {area.ordem_sequencial}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {modelos.map(modelo => (
                                <tr key={modelo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', position: 'sticky', left: 0, zIndex: 8, background: 'var(--background-panel)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: '#1e293b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {modelo.imagem_url ? (
                                                    <Image src={modelo.imagem_url} alt={modelo.nome} width={40} height={40} style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>S/ img</span>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{modelo.nome}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>v{modelo.versao}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {areas.map(area => {
                                        const key = `${modelo.id}_${area.id}`;
                                        const rule = rules[key] || { offset_dias: 0, duracao_dias: 1 };

                                        return (
                                            <td key={area.id} style={{ padding: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>Offset (Início vs Dia 0)</label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="number"
                                                                value={rule.offset_dias}
                                                                onChange={(e) => handleCellChange(modelo.id, area.id, 'offset_dias', e.target.value)}
                                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.4rem 0.5rem', color: '#fff', fontSize: '0.85rem' }}
                                                            />
                                                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', opacity: 0.5, flexShrink: 0 }}>dias</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>Duração Prevista (SLA)</label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="number"
                                                                value={rule.duracao_dias}
                                                                onChange={(e) => handleCellChange(modelo.id, area.id, 'duracao_dias', e.target.value)}
                                                                min="1"
                                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.4rem 0.5rem', color: '#fff', fontSize: '0.85rem' }}
                                                            />
                                                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', opacity: 0.5, flexShrink: 0 }}>dias</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {modelos.length === 0 && (
                                <tr>
                                    <td colSpan={areas.length + 1} className="p-8 text-center opacity-50">
                                        Nenhum Molde/Produto cadastrado ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
