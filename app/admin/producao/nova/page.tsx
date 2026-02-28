"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Info, Save, Anchor, PlusCircle, CheckSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { fetchFormularioNovaOPData, emitirOrdemProducao } from './actions';
import { useRouter } from 'next/navigation';

export default function NovaOrdermProducaoPage() {
    const router = useRouter();

    // DB Data
    const [dbModelos, setDbModelos] = useState<any[]>([]);
    const [dbLinhas, setDbLinhas] = useState<any[]>([]);
    const [dbRoteiros, setDbRoteiros] = useState<any[]>([]);
    const [dbOpcionais, setDbOpcionais] = useState<any[]>([]);
    const [dbMoldes, setDbMoldes] = useState<any[]>([]);
    const [dbRelacoes, setDbRelacoes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Seleção de Ordem
    const [modeloSelecionado, setModeloSelecionado] = useState('');
    const [linhaSelecionada, setLinhaSelecionada] = useState('');

    // Roteiro manual dropdown se houver múltiplos roteiros
    const [roteiroSelecionado, setRoteiroSelecionado] = useState('');

    // Opcionais multi-select
    const [opcionaisSelecionados, setOpcionaisSelecionados] = useState<string[]>([]);

    // 2. Administrativo
    const [opNumero, setOpNumero] = useState('');
    const [po, setPo] = useState('');
    const [pp, setPp] = useState('');
    const [hin, setHin] = useState('');
    const [ns, setNs] = useState('');
    const [cliente, setCliente] = useState('');
    const [pais, setPais] = useState('');
    const [region, setRegion] = useState('');

    // 3. Cronograma Automático
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [cronograma, setCronograma] = useState<{ estacao: string; inicio: string; fim: string }[]>([]);

    // 4. RFID Tags das Partes
    const [rfidCasco, setRfidCasco] = useState('');
    const [rfidCoberta, setRfidCoberta] = useState('');
    const [rfidSmallParts, setRfidSmallParts] = useState('');
    const [rfidLiner, setRfidLiner] = useState('');

    // 5. Moldes Relacionados
    const [moldeCascoId, setMoldeCascoId] = useState('');
    const [moldeCobertaId, setMoldeCobertaId] = useState('');
    const [moldeSmallPartsId, setMoldeSmallPartsId] = useState('');
    const [moldeLinerId, setMoldeLinerId] = useState('');

    useEffect(() => {
        async function load() {
            const res = await fetchFormularioNovaOPData();
            if (res.success && res.data) {
                setDbModelos(res.data.modelos);
                setDbLinhas(res.data.linhas);
                setDbRoteiros(res.data.roteiros);
                setDbOpcionais(res.data.opcionais);
                setDbMoldes(res.data.moldes);
                setDbRelacoes(res.data.moldes_opcionais);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    // Filter by model
    const modelosOpcionais = dbOpcionais.filter(o => o.modelo_id === modeloSelecionado);
    const modelosRoteiros = dbRoteiros.filter(r => r.modelo_id === modeloSelecionado);

    const toggleOpcional = (id: string) => {
        if (opcionaisSelecionados.includes(id)) {
            setOpcionaisSelecionados(opcionaisSelecionados.filter(oid => oid !== id));
        } else {
            setOpcionaisSelecionados([...opcionaisSelecionados, id]);
        }
    };

    // --- LÓGICA CONDICIONAL DE MOLDES (POKA-YOKE) ---
    // Filtramos primeiro para os compatíveis com o modelo atual
    const moldesCompativeis = dbMoldes.filter(m => !m.modelo_base_id || m.modelo_base_id === modeloSelecionado);

    // Mofo só é mostrado se for Obrigatório OU se fizer parte de um Opcional escolhido pelo Comercial
    const moldesAtivos = moldesCompativeis.filter(m => {
        if (m.moldagem_obrigatoria) return true;
        // Verificar se este molde opcional foi acionado pelas checkboxes de Encomenda
        const triggersOpts = dbRelacoes.filter(r => r.molde_id === m.id).map(r => r.opcional_id);
        return triggersOpts.some(triggerId => opcionaisSelecionados.includes(triggerId));
    });

    const mCascos = moldesAtivos.filter(m => m.categoria === 'BIG_PART' && m.tipo_parte?.toLowerCase().includes('casc'));
    const mCobertas = moldesAtivos.filter(m => m.categoria === 'BIG_PART' && m.tipo_parte?.toLowerCase().includes('cobert'));
    const mMedium = moldesAtivos.filter(m => m.categoria === 'MEDIUM_PART');
    const mSmall = moldesAtivos.filter(m => m.categoria === 'SMALL_PART');

    useEffect(() => {
        if (!dataInicio || !modeloSelecionado) {
            setCronograma([]);
            return;
        }

        const start = new Date(dataInicio);
        let currentStart = new Date(start);

        const novoCronograma = modelosRoteiros.map(passo => {
            const d_inicio = new Date(currentStart);
            const d_fim = new Date(d_inicio);
            d_fim.setDate(d_fim.getDate() + (passo.tempo_ciclo || 1));

            // Advance for next step
            currentStart = new Date(d_fim);

            return {
                estacao: passo.estacoes?.nome_estacao || `Tarefa ${passo.sequencia}`,
                inicio: d_inicio.toLocaleDateString('pt-PT'),
                fim: d_fim.toLocaleDateString('pt-PT')
            };
        });

        setCronograma(novoCronograma);
    }, [dataInicio, modeloSelecionado, dbRoteiros]);

    const handleSubmit = async () => {
        if (!modeloSelecionado || !opNumero) {
            alert('Por favor, preencha o Modelo e o Número da OP no mínimo.');
            return;
        }
        setIsSubmitting(true);
        const res = await emitirOrdemProducao({
            modelo_id: modeloSelecionado,
            linha_id: linhaSelecionada || null,
            op_numero: opNumero,
            pp_plan: pp,
            po_compra: po,
            hin_hull_id: hin,
            num_serie: ns,
            cliente,
            pais,
            region,
            data_inicio: dataInicio || null,
            data_fim: dataFim || null,
            rfid_casco: rfidCasco || null,
            rfid_coberta: rfidCoberta || null,
            rfid_small_parts: rfidSmallParts || null,
            rfid_liner: rfidLiner || null,
            molde_casco_id: moldeCascoId || null,
            molde_coberta_id: moldeCobertaId || null,
            molde_small_parts_id: moldeSmallPartsId || null,
            molde_liner_id: moldeLinerId || null
        });

        if (res.success) {
            alert('Ordem de Produção Emitida com Sucesso!');
            router.push('/admin/producao/planeamento');
        } else {
            alert('Erro ao emitir OP: ' + res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="container mx-auto mt-4 animate-fade-in max-w-7xl pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-blue-900">Planeamento de Produção (MES)</h1>
                    <p className="text-muted-foreground mt-1">Emissão e escalonamento de novas Ordens de Produção.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                    <Save size={18} className="mr-2" />
                    {isSubmitting ? 'A emitir...' : 'Emitir Ordem (OP)'}
                </Button>
            </header>

            {isLoading ? (
                <div className="flex justify-center p-12 text-slate-500 font-medium">A carregar Master Data do Supabase...</div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* COLUNA ESQUERDA: Dados Primários */}
                    <div className="xl:col-span-2 flex flex-col gap-6">

                        {/* SECÇÃO 1: ESTRUTURA E SELEÇÃO */}
                        <Card className="border-blue-100 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-blue-50/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                    <Anchor size={20} className="text-blue-600" /> Classificação da Ordem
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-blue-900 font-semibold">Modelo a Fabricar *</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                                            value={modeloSelecionado}
                                            onChange={(e) => {
                                                setModeloSelecionado(e.target.value);
                                                setOpcionaisSelecionados([]);
                                            }}
                                        >
                                            <option value="">-- Selecione o Modelo Base --</option>
                                            {dbModelos.map(m => <option key={m.id} value={m.id}>{m.nome_modelo} ({m.model_year})</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-blue-900 font-semibold">Linha de Produção Atribuída</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                                            value={linhaSelecionada}
                                            onChange={(e) => setLinhaSelecionada(e.target.value)}
                                        >
                                            <option value="">-- Linha Fabril --</option>
                                            {dbLinhas.map(l => <option key={l.id} value={l.id}>Linha {l.letra_linha} - {l.descricao_linha}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-blue-900 font-semibold">Roteiro de Produção (Workflow)</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                                            value={roteiroSelecionado}
                                            onChange={(e) => setRoteiroSelecionado(e.target.value)}
                                        >
                                            <option value="">-- Padrão Dinâmico BD --</option>
                                            {modelosRoteiros.length > 0 && <option value="standard">Roteiro Principal ({modelosRoteiros.length} Tarefas)</option>}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-blue-900 font-semibold">Configuração (Opções & Kits)</Label>
                                        <div className="flex flex-col gap-2 p-3 border border-slate-200 rounded-md bg-slate-50 max-h-32 overflow-y-auto">
                                            {modelosOpcionais.length === 0 ? (
                                                <span className="text-xs text-slate-500">Sem opcionais registados para este modelo.</span>
                                            ) : (
                                                modelosOpcionais.map(opc => (
                                                    <label key={opc.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                            checked={opcionaisSelecionados.includes(opc.id)}
                                                            onChange={() => toggleOpcional(opc.id)}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">{opc.nome_opcao}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SECÇÃO 2: CAMPOS ADMINISTRATIVOS */}
                        <Card className="border-blue-100 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-blue-50/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                    <Info size={20} className="text-blue-600" /> Dados Administrativos & Tracking
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                    <div className="flex flex-col gap-2 lg:col-span-1">
                                        <Label className="text-slate-700 font-bold">Nº da OP *</Label>
                                        <Input value={opNumero} onChange={e => setOpNumero(e.target.value)} placeholder="OP-XXXX" className="bg-white border-blue-300 ring-2 ring-blue-50 max-w-full" />
                                    </div>
                                    <div className="flex flex-col gap-2 lg:col-span-1">
                                        <Label className="text-slate-700">PO (Compra)</Label>
                                        <Input value={po} onChange={e => setPo(e.target.value)} placeholder="PO-XX" className="bg-slate-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2 lg:col-span-1">
                                        <Label className="text-slate-700">PP Plan</Label>
                                        <Input value={pp} onChange={e => setPp(e.target.value)} placeholder="PP-XX" className="bg-slate-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2 lg:col-span-1">
                                        <Label className="text-slate-700">HIN (Hull ID)</Label>
                                        <Input value={hin} onChange={e => setHin(e.target.value)} placeholder="US-BR..." className="bg-slate-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2 lg:col-span-1">
                                        <Label className="text-slate-700">Nº de Série</Label>
                                        <Input value={ns} onChange={e => setNs(e.target.value)} placeholder="000" className="bg-slate-50/50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-slate-700">Cliente Final / Dealer</Label>
                                        <Input value={cliente} onChange={e => setCliente(e.target.value)} className="bg-slate-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-slate-700">País de Destino</Label>
                                        <Input value={pais} onChange={e => setPais(e.target.value)} className="bg-slate-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-slate-700">Brand / Region</Label>
                                        <Input value={region} onChange={e => setRegion(e.target.value)} className="bg-slate-50/50" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SECÇÃO EXTRA: ASSINATURAS RFID PARA AS PEÇAS */}
                        <Card className="border-indigo-100 shadow-sm">
                            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
                                    <Tag size={20} className="text-indigo-600" /> Scan de Tags Peças IoT (Assinatura na OP)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-indigo-800 text-xs uppercase tracking-wider font-bold">Casco</Label>
                                        <Input value={rfidCasco} onChange={e => setRfidCasco(e.target.value)} placeholder="Tag RFID..." className="font-mono text-xs border-indigo-200" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-indigo-800 text-xs uppercase tracking-wider font-bold">Coberta</Label>
                                        <Input value={rfidCoberta} onChange={e => setRfidCoberta(e.target.value)} placeholder="Tag RFID..." className="font-mono text-xs border-indigo-200" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-indigo-800 text-xs uppercase tracking-wider font-bold">Small Parts</Label>
                                        <Input value={rfidSmallParts} onChange={e => setRfidSmallParts(e.target.value)} placeholder="Tag RFID..." className="font-mono text-xs border-indigo-200" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-indigo-800 text-xs uppercase tracking-wider font-bold">Liner</Label>
                                        <Input value={rfidLiner} onChange={e => setRfidLiner(e.target.value)} placeholder="Tag RFID..." className="font-mono text-xs border-indigo-200" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* COLUNA DIREITA: CRONOGRAMA & MOLDES */}
                    <div className="flex flex-col gap-6">

                        {/* SECÇÃO 3: CRONOGRAMA INTELIGENTE */}
                        <Card className="border-emerald-100 shadow-sm flex-1">
                            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                                    <Calendar size={18} className="text-emerald-600" /> Datas de Contrato (Gantt)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-emerald-900 font-semibold">Início Previsto (Start)</Label>
                                        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border-emerald-200" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-emerald-900 font-semibold">Fim Previsto (Deadline Contract)</Label>
                                        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border-emerald-200" />
                                    </div>
                                </div>

                                {cronograma.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                                        Selecione um Modelo e Data Iniciadora para projetar o Workflow.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {cronograma.map((c, i) => (
                                            <div key={i} className="flex flex-col p-3 bg-white border border-slate-200 shadow-sm rounded-lg border-l-4 border-l-emerald-500">
                                                <span className="text-sm font-semibold text-slate-800">{c.estacao}</span>
                                                <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                    <span>Início: {c.inicio}</span>
                                                    <span className="font-medium">Fim: {c.fim}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* SECÇÃO 4: SUPERVISÃO DE MOLDES E ATRIBUIÇÃO */}
                        <Card className="border-amber-100 shadow-sm">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                                    <PlusCircle size={18} className="text-amber-600" /> Tracking de Moldes (Atribuição)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                    Associe que moldes exatos desta fábrica irão injetar as partes desta OP garantindo Rastreabilidade e Saúde do Gelcoat.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mCascos.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs text-slate-700 font-bold">Molde do Casco (Big Part)</Label>
                                            <select className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs" value={moldeCascoId} onChange={e => setMoldeCascoId(e.target.value)}>
                                                <option value="">-- Não Associado --</option>
                                                {mCascos.map(m => {
                                                    const isEsgotado = m.status !== 'Ativo';
                                                    return <option key={m.id} value={m.id} disabled={isEsgotado}>{m.nome_parte} (Uso: {m.ciclos_estimados}){isEsgotado ? ' ⛔ MANUTENÇÃO' : ''}</option>
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {mCobertas.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs text-slate-700 font-bold">Molde da Coberta (Big Part)</Label>
                                            <select className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs" value={moldeCobertaId} onChange={e => setMoldeCobertaId(e.target.value)}>
                                                <option value="">-- Não Associado --</option>
                                                {mCobertas.map(m => {
                                                    const isEsgotado = m.status !== 'Ativo';
                                                    return <option key={m.id} value={m.id} disabled={isEsgotado}>{m.nome_parte} (Uso: {m.ciclos_estimados}){isEsgotado ? ' ⛔ MANUTENÇÃO' : ''}</option>
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {mMedium.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs text-slate-700 font-bold">Molde Medium Parts (Liner/Config)</Label>
                                            <select className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs" value={moldeLinerId} onChange={e => setMoldeLinerId(e.target.value)}>
                                                <option value="">-- Não Associado --</option>
                                                {mMedium.map(m => {
                                                    const isEsgotado = m.status !== 'Ativo';
                                                    return <option key={m.id} value={m.id} disabled={isEsgotado}>{m.nome_parte} (Uso: {m.ciclos_estimados}){isEsgotado ? ' ⛔ MANUTENÇÃO' : ''}</option>
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {mSmall.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs text-slate-700 font-bold">Molde Small Parts (Tampas/Extras)</Label>
                                            <select className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs" value={moldeSmallPartsId} onChange={e => setMoldeSmallPartsId(e.target.value)}>
                                                <option value="">-- Não Associado --</option>
                                                {mSmall.map(m => {
                                                    const isEsgotado = m.status !== 'Ativo';
                                                    return <option key={m.id} value={m.id} disabled={isEsgotado}>{m.nome_parte} (Uso: {m.ciclos_estimados}){isEsgotado ? ' ⛔ MANUTENÇÃO' : ''}</option>
                                                })}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            )}
        </div>
    );
}
