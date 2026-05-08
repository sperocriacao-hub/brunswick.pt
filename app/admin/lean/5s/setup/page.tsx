"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, CheckCircle2, Settings2, Target, Search } from 'lucide-react';
import { get5SPerguntas, criarPergunta, deletePergunta, getAreas } from './actions';

export default function Setup5SPage() {
    const [perguntas, setPerguntas] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form
    const [novaPergunta, setNovaPergunta] = useState("");
    const [categoria, setCategoria] = useState("1S - Utilização");
    const [areaId, setAreaId] = useState("");

    const categorias = [
        "1S - Utilização",
        "2S - Arrumação",
        "3S - Limpeza",
        "4S - Normalização",
        "5S - Disciplina"
    ];

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const reqP = await get5SPerguntas();
        const reqA = await getAreas();
        if (reqP.success) setPerguntas(reqP.data || []);
        if (reqA.success) setAreas(reqA.areas || []);
        setLoading(false);
    }

    const handleAddPergunta = async () => {
        if (!novaPergunta) return;
        setSaving(true);
        const res = await criarPergunta({
            pergunta: novaPergunta,
            categoria,
            area_id: areaId || null
        });

        if (res.success) {
            setNovaPergunta("");
            carregarDados();
        } else {
            alert("Erro ao criar: " + res.error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja eliminar esta regra?")) return;
        setLoading(true);
        await deletePergunta(id);
        carregarDados();
    };

    const filteredPerguntas = perguntas.filter(p => 
        p.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.areas_fabrica?.nome_area || 'Universal').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Settings2 className="text-blue-600" size={36} /> Engine 5S (Auditorias)
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Gestão de Checklists e Regras por Área Fabril.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Criar Nova Pergunta */}
                <Card className="shadow-sm border-slate-200 lg:col-span-1 h-fit">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Plus size={20} className="text-blue-600" /> Nova Regra 5S
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Categoria 5S</label>
                            <select 
                                value={categoria} 
                                onChange={e => setCategoria(e.target.value)}
                                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm font-medium bg-white"
                            >
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Área Alvo</label>
                            <select 
                                value={areaId} 
                                onChange={e => setAreaId(e.target.value)}
                                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm font-medium bg-white"
                            >
                                <option value="">🌐 Universal (Todas as Áreas)</option>
                                {areas.map(a => <option key={a.id} value={a.id}>📍 {a.nome_area}</option>)}
                            </select>
                            <p className="text-[10px] text-slate-400">Se deixar Universal, esta pergunta aparecerá em todas as rondas da fábrica.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">A Pergunta / Check</label>
                            <Input 
                                value={novaPergunta} 
                                onChange={e => setNovaPergunta(e.target.value)} 
                                placeholder="Ex: O chão está livre de óleos?" 
                                className="h-10"
                            />
                        </div>
                        <Button 
                            onClick={handleAddPergunta} 
                            disabled={!novaPergunta || saving} 
                            className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Gravar Regra
                        </Button>
                    </CardContent>
                </Card>

                {/* Lista de Perguntas */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar regras ou áreas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                        />
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
                    ) : filteredPerguntas.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            Nenhuma regra configurada.
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            {categorias.map(cat => {
                                const pergsCat = filteredPerguntas.filter(p => p.categoria === cat);
                                if (pergsCat.length === 0) return null;

                                return (
                                    <div key={cat} className="border-b border-slate-100 last:border-0">
                                        <div className="bg-slate-50 px-4 py-2 font-bold text-sm text-slate-700 uppercase tracking-widest border-y border-slate-200 first:border-t-0 flex items-center gap-2">
                                            <Target size={14} className="text-blue-500" /> {cat}
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {pergsCat.map(p => (
                                                <div key={p.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{p.pergunta}</p>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                            {p.areas_fabrica?.nome_area ? `📍 \${p.areas_fabrica.nome_area}` : '🌐 Universal'}
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
