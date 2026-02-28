'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMoldesMestres, deleteMolde, getModelosForSelect, getOpcionaisForSelect, createMolde } from './actions';
import { Box, Plus, Trash2, Tag, Wrench, Layers } from 'lucide-react';

export default function GestaoMoldesEngPage() {
    const [moldes, setMoldes] = useState<any[]>([]);
    const [relacoes, setRelacoes] = useState<any[]>([]);

    // Selects Data
    const [modelos, setModelos] = useState<any[]>([]);
    const [opcionais, setOpcionais] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [nomeParte, setNomeParte] = useState('');
    const [rfid, setRfid] = useState('');
    const [categoria, setCategoria] = useState('BIG_PART');
    const [tipoParte, setTipoParte] = useState('');
    const [manutenirEm, setManutenirEm] = useState(50);
    const [modeloBaseId, setModeloBaseId] = useState('');
    const [isObrigatorio, setIsObrigatorio] = useState(true);
    const [selectedOpcionais, setSelectedOpcionais] = useState<string[]>([]);
    const [svgContent, setSvgContent] = useState('');

    useEffect(() => {
        carregarTudo();
    }, []);

    async function carregarTudo() {
        setLoading(true);
        const res = await fetchMoldesMestres();
        if (res.success) {
            setMoldes(res.moldes || []);
            setRelacoes(res.relacoes || []);
        }

        const mods = await getModelosForSelect();
        setModelos(mods);

        const opcs = await getOpcionaisForSelect();
        setOpcionais(opcs);

        setLoading(false);
    }

    async function handleRemover(id: string) {
        if (!confirm('Deseja eliminar este molde do sistema?')) return;
        setLoading(true);
        await deleteMolde(id);
        await carregarTudo();
    }

    async function handleSubmeter(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const payload = {
            nome_parte: nomeParte,
            rfid: rfid,
            categoria: categoria,
            tipo_parte: tipoParte,
            manutenir_em: manutenirEm,
            modelo_base_id: modeloBaseId === '' ? null : modeloBaseId,
            moldagem_obrigatoria: isObrigatorio
        };

        const result = await createMolde(payload, isObrigatorio ? [] : selectedOpcionais, svgContent);

        if (result.success) {
            setNomeParte('');
            setRfid('');
            setCategoria('BIG_PART');
            setTipoParte('');
            setManutenirEm(50);
            setModeloBaseId('');
            setIsObrigatorio(true);
            setSelectedOpcionais([]);
            setSvgContent('');
            setIsCreating(false);
            carregarTudo();
        } else {
            alert("Erro ao criar molde: " + result.error);
            setLoading(false);
        }
    }

    const toggleOpcional = (id: string) => {
        if (selectedOpcionais.includes(id)) {
            setSelectedOpcionais(selectedOpcionais.filter(i => i !== id));
        } else {
            setSelectedOpcionais([...selectedOpcionais, id]);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">A carregar registos fabris...</div>;

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Cadastro de Moldes</h1>
                    <p className="text-lg text-slate-500 mt-1">Registo de carcaças físicas, categorização M.E.S. e condicionalismos de produto</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                    <Plus className="w-5 h-5 mr-2" /> Novo Molde
                </Button>
            </header>

            {isCreating && (
                <Card className="border-blue-200 bg-blue-50/30 shadow-sm transition-all">
                    <CardHeader className="bg-white border-b border-blue-100 pb-4">
                        <CardTitle className="text-blue-800 flex items-center gap-2"><Box size={20} /> Entrar Nova Ferramenta / Molde</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmeter} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Nome Comercial da Peça (Identificação)</label>
                                    <Input required value={nomeParte} onChange={(e) => setNomeParte(e.target.value)} placeholder="Ex: Casco Inferior VIP" className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Tag RFID Integrada (Opcional)</label>
                                    <Input value={rfid} onChange={(e) => setRfid(e.target.value)} placeholder="0400... (Picar tag)" className="bg-white font-mono" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Categoria Físico-Logística</label>
                                    <select required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                        <option value="BIG_PART">BIG PART (Cascos, Cobertas grandes)</option>
                                        <option value="MEDIUM_PART">MEDIUM PART (Liners, HardTops, Consolas)</option>
                                        <option value="SMALL_PART">SMALL PART (Tampões, Bancos, Caixas de Gelo)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Classe Técnica (Tipo Peça)</label>
                                    <Input required value={tipoParte} onChange={(e) => setTipoParte(e.target.value)} placeholder="Ex: Casco, Hardtop, Tampa..." className="bg-white" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Lotação TPM (Ciclos Vida Útil Máxima)</label>
                                    <Input required type="number" min="1" value={manutenirEm} onChange={(e) => setManutenirEm(parseInt(e.target.value))} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Restrito a Modelo Específico?</label>
                                    <select value={modeloBaseId} onChange={(e) => setModeloBaseId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 font-medium">
                                        <option value="">-- Molde Partilhado Universal (Qualquer modelo) --</option>
                                        {modelos.map(m => (
                                            <option key={m.id} value={m.id}>{m.nome_modelo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                                    <span>Blueprint Digital (Código SVG)</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Para Cockpit TPM 2D</span>
                                </label>
                                <textarea
                                    value={svgContent}
                                    onChange={(e) => setSvgContent(e.target.value)}
                                    placeholder='<svg viewBox="0 0 ...'
                                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm min-h-[120px] font-mono whitespace-pre text-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <p className="text-[10px] text-slate-400">Cole o código SVG bruto do desenho 2D da peça para permitir o Pin Mapping de Qualidade. Pode ser adicionado futuramente.</p>
                            </div>

                            <hr className="my-6 border-blue-100" />

                            <div className="bg-white p-6 inset-shadow-sm rounded-xl border border-slate-200">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Layers size={18} className="text-blue-500" /> Regra de Utilização M.E.S.
                                </h3>

                                <div className="flex gap-4 mb-6">
                                    <label className={`cursor-pointer flex-1 p-4 border-2 rounded-xl transition-all ${isObrigatorio ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" className="hidden" checked={isObrigatorio} onChange={() => setIsObrigatorio(true)} />
                                        <div className="font-bold text-slate-800">PEÇA ESTRUTURAL (OBRIGATÓRIO)</div>
                                        <div className="text-xs text-slate-500 mt-1">Este molde será exigido em absolutamente TODAS as ordens de produção emitidas.</div>
                                    </label>

                                    <label className={`cursor-pointer flex-1 p-4 border-2 rounded-xl transition-all ${!isObrigatorio ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" className="hidden" checked={!isObrigatorio} onChange={() => setIsObrigatorio(false)} />
                                        <div className="font-bold text-slate-800">PEÇA COMPLEMENTAR (OPCIONAL)</div>
                                        <div className="text-xs text-slate-500 mt-1">Este molde SÓ será ativado para Laminação se o cliente pagou por um "Extra" / "Kit".</div>
                                    </label>
                                </div>

                                {!isObrigatorio && (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300 mt-4 animate-in slide-in-from-top-4">
                                        <p className="text-xs font-bold text-slate-700 uppercase mb-3">Selecione as Opções/Kits Comerciais que instigam o uso deste molde:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 max-h-48 overflow-y-auto gap-2 pr-2">
                                            {opcionais.map(opc => (
                                                <label key={opc.id} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded text-sm cursor-pointer hover:bg-slate-100 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOpcionais.includes(opc.id)}
                                                        onChange={() => toggleOpcional(opc.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="truncate flex-1">
                                                        {opc.nome_opcao} <span className="text-xs text-slate-400">({opc.modelo?.nome_modelo})</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Gravar Ficha de Molde</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-6 py-4 font-bold">Identificação Base</th>
                            <th className="px-6 py-4 font-bold">Classe / Categoria</th>
                            <th className="px-6 py-4 font-bold text-center">Desgaste / Estado</th>
                            <th className="px-6 py-4 font-bold">Regra de Inclusão M.E.S.</th>
                            <th className="px-6 py-4 font-bold text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {moldes.map(molde => (
                            <tr key={molde.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-sm uppercase">{molde.nome_parte}</div>
                                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1"><Tag size={12} /> {molde.rfid || 'SEM TAG ASSOCIADA'}</div>
                                    {molde.modelo_base && (
                                        <div className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm w-max mt-1 border border-blue-200 font-bold">EXCLUSIVO: {molde.modelo_base.nome_modelo}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold text-white tracking-widest ${molde.categoria === 'BIG_PART' ? 'bg-indigo-600' : molde.categoria === 'MEDIUM_PART' ? 'bg-sky-500' : 'bg-teal-500'}`}>
                                        {molde.categoria.replace('_', ' ')}
                                    </span>
                                    <p className="text-xs text-slate-500 uppercase mt-2 font-medium">({molde.tipo_parte || 'Genérico'})</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="font-black text-slate-700 text-lg">{molde.ciclos_estimados} <span className="text-xs text-slate-400">/ {molde.manutenir_em}</span></div>
                                    <div className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${molde.status === 'Ativo' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {molde.status}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {molde.moldagem_obrigatoria ? (
                                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg border w-max">
                                            <Wrench size={14} /> COMPONENTE BASE (SEMPRE REQUERIDO)
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 w-max">
                                                <Layers size={14} className="text-amber-500" /> GERADO POR OPCIONAIS
                                            </div>
                                            <div className="text-[10px] text-slate-500 max-w-[200px] truncate">
                                                Gatilhos: {relacoes.filter(r => r.molde_id === molde.id).length} Opcionais Mapeados
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0 round" onClick={() => handleRemover(molde.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {moldes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                                    Nenhuma carcaça ou molde registado no ecossistema M.E.S.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
