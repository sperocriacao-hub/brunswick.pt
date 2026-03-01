"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMoldeDetails, saveDefectPin } from './actions';
import { ArrowLeft, MapPin, AlertCircle, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function AuditoriaMoldePage() {
    const params = useParams();
    const router = useRouter();
    const moldeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [molde, setMolde] = useState<any>(null);
    const [geometria, setGeometria] = useState<any>(null);
    const [intervencao, setIntervencao] = useState<any>(null);
    const [pinsAbertos, setPinsAbertos] = useState<any[]>([]);

    // Interaction State
    const svgWrapperRef = useRef<HTMLDivElement>(null);
    const [activeDraftPin, setActiveDraftPin] = useState<{ x: number, y: number } | null>(null);
    const [showDefectForm, setShowDefectForm] = useState(false);

    // Form State
    const [novoDefeito, setNovoDefeito] = useState('Porosidade Severa');
    const [novaNota, setNovaNota] = useState('');

    useEffect(() => {
        carregarAuditoria();
    }, [moldeId]);

    async function carregarAuditoria() {
        setLoading(true);
        const res = await getMoldeDetails(moldeId);
        if (res.success) {
            setMolde(res.molde);
            setGeometria(res.geometria);
            setIntervencao(res.intervencaoAberto);
            setPinsAbertos(res.pins || []);
        } else {
            console.error("Falha ao carregar auditoria do molde:", res.error);
        }
        setLoading(false);
    }

    const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!svgWrapperRef.current) return;

        // Posição Clicada Relativa ao Contentor SVG
        const rect = svgWrapperRef.current.getBoundingClientRect();

        // Calculamos a percentagem (Relative 0.0 - 100.0) de onde ocorreu o click para escalar independentemente do ecrã
        let relativeX = ((e.clientX - rect.left) / rect.width) * 100;
        let relativeY = ((e.clientY - rect.top) / rect.height) * 100;

        // Boundaries strict 0-100
        relativeX = Math.max(0, Math.min(100, relativeX));
        relativeY = Math.max(0, Math.min(100, relativeY));

        setActiveDraftPin({ x: parseFloat(relativeX.toFixed(2)), y: parseFloat(relativeY.toFixed(2)) });
        setShowDefectForm(true);
    };

    const handleSavePin = async () => {
        if (!activeDraftPin || !intervencao || !geometria) return;

        setLoading(true);

        const payload = {
            intervencao_id: intervencao.id,
            geometria_id: geometria.id,
            coord_x: activeDraftPin.x,
            coord_y: activeDraftPin.y,
            tipo_defeito: novoDefeito,
            anotacao_reparador: novaNota,
            status: 'Aberto'
        };

        const res = await saveDefectPin(payload);

        if (res.success) {
            // Limpa Draft UI
            setActiveDraftPin(null);
            setShowDefectForm(false);
            setNovaNota('');

            // Recarrega lista
            await carregarAuditoria();
        } else {
            alert('Falha a guardar Pin: ' + res.error);
        }
        setLoading(false);
    };

    if (loading && !molde) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh]">
                <Loader2 className="animate-spin text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium">A carregar Gêmeo Digital do Molde...</p>
            </div>
        );
    }

    // SVG Genérico de Fallback de Barco/Molde (Caso não tenha sido feito upload de Blueprint via Cockpit)
    const renderSvgCanvas = () => {
        if (geometria?.svg_content) {
            return (
                <div dangerouslySetInnerHTML={{ __html: geometria.svg_content }} className="w-full h-full text-slate-300" />
            );
        }
        // Fallback Default Shape OVAL shape
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200 fill-current drop-shadow-md">
                <ellipse cx="50" cy="50" rx="25" ry="45" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" />
                <path d="M 50 5 Q 75 20, 75 50 Q 75 95, 50 95 Q 25 95, 25 50 Q 25 20, 50 5 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                <text x="50" y="50" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace">FORMA GENÉRICA</text>
            </svg>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 p-4 md:p-8 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/admin/manutencao/moldes')}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Auditoria de Qualidade TPM
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">{molde?.nome_parte || 'Molde Desconhecido'} (ID: {molde?.id?.split('-')[0]})</p>
                </div>
            </header>

            {!intervencao && (
                <div className="bg-rose-50 text-rose-800 p-4 rounded-lg flex items-center gap-3 border border-rose-200 shadow-sm">
                    <AlertCircle size={24} className="text-rose-500" />
                    <div>
                        <p className="font-bold text-sm">Nenhuma O.S. Aberta</p>
                        <p className="text-xs">Este molde não possui intervenções de manutenção abertas com o qual eu possa associar Defeitos.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Lado Esquerdo - O Gémeo Digital / Blueprint Canvas */}
                <div className="lg:col-span-2">
                    <Card className="h-full border-blue-100 shadow-md overflow-hidden bg-slate-50/50">
                        <CardHeader className="bg-white border-b pb-3 border-blue-50">
                            <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                                <MapPin size={18} className="text-blue-500" /> Gêmeo Digital (Mapeamento Poka-Yoke)
                            </CardTitle>
                            <CardDescription>Clique diretamente na área anatómica do SVG abaixo onde detetou a Avaria na Camada de Vidro/Gelcoat.</CardDescription>
                        </CardHeader>

                        <CardContent className="p-0 relative flex justify-center items-center bg-dots cursor-crosshair h-[600px]">
                            {/* O container que escuta ticks/clicks - Tem que ser Relativo para os Pins Absolutos */}
                            <div
                                className="relative w-full max-w-[400px] h-full flex justify-center items-center py-8"
                                ref={svgWrapperRef}
                                onClick={handleSvgClick}
                            >
                                {renderSvgCanvas()}

                                {/* RENDER DOS PINS EXISTENTES (VERMELHOS) */}
                                {pinsAbertos.map(pin => (
                                    <div
                                        key={pin.id}
                                        className="absolute w-4 h-4 rounded-full bg-rose-500 shadow-lg border-2 border-white cursor-pointer hover:scale-150 transition-transform group flex items-center justify-center"
                                        style={{ left: `${pin.coord_x}%`, top: `${pin.coord_y}%`, transform: 'translate(-50%, -50%)' }}
                                        title={`${pin.tipo_defeito}: ${pin.anotacao_reparador}`}
                                    >
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse z-10"></div>

                                        {/* Tooltip Hover nativo via Tailwind Group */}
                                        <div className="absolute hidden group-hover:flex flex-col bottom-full mb-2 bg-slate-900 border border-slate-700 p-2 rounded-md shadow-xl text-white whitespace-nowrap z-50 pointer-events-none min-w-[120px]">
                                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{pin.tipo_defeito}</span>
                                            <span className="text-xs">{pin.anotacao_reparador || 'Sem Notas.'}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* RENDER DO PIN DRAFT (AMARELO A PISCAR QUANDO SE CLICA MAS AINDA NÃO SE GUARDOU) */}
                                {activeDraftPin && (
                                    <div
                                        className="absolute w-6 h-6 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] border-2 border-white flex items-center justify-center pointer-events-none animate-bounce"
                                        style={{ left: `${activeDraftPin.x}%`, top: `${activeDraftPin.y}%`, transform: 'translate(-50%, -100%)' }}
                                    >
                                        <div className="w-2 h-2 bg-amber-900 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lado Direito - Registo e Lista de Ocorrências */}
                <div className="flex flex-col gap-6">

                    {/* Painel Popup - Só visível se houver Active Draft */}
                    {showDefectForm && activeDraftPin && (
                        <Card className="border-amber-200 shadow-lg bg-amber-50/20 animate-in slide-in-from-right-4">
                            <CardHeader className="bg-amber-100/50 pb-3">
                                <CardTitle className="text-amber-800 text-sm font-bold flex gap-2">
                                    <AlertCircle size={16} /> Registar Nova Ocorrência
                                </CardTitle>
                                <CardDescription className="text-xs text-amber-700/70">Coordenadas Capturadas (X: {activeDraftPin.x}%, Y: {activeDraftPin.y}%)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Classificação Primária</label>
                                    <select
                                        value={novoDefeito}
                                        onChange={(e) => setNovoDefeito(e.target.value)}
                                        className="h-10 w-full rounded-md border border-slate-200 font-bold text-slate-700"
                                    >
                                        <option value="Fissura Extrema">Moldagem Fissurada</option>
                                        <option value="Risco Profundo">Risco Profundo Capa</option>
                                        <option value="Porosidade Severa">Porosidade de Gelcoat</option>
                                        <option value="Colapso de Veio">Colapso / Embalo</option>
                                        <option value="Polimento Falho">Falta de Polimento Acabamento</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Diagnóstico Clínico (Requerimento)</label>
                                    <Input
                                        value={novaNota}
                                        onChange={(e) => setNovaNota(e.target.value)}
                                        placeholder="Ex: Mandar betumar antes do prox ciclo"
                                        className="bg-white text-sm"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1 text-slate-500 border-slate-300" onClick={() => { setActiveDraftPin(null); setShowDefectForm(false); }}>Cancelar</Button>
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSavePin} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} className="mr-2" /> Pinar</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lista do Checklist de Problemas Abertos (A reparar) */}
                    <Card className="flex-1 border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm uppercase tracking-widest text-slate-800 font-bold">Intervenções Pendentes</CardTitle>
                            <CardDescription>O Molde não pode ser libertado para o Shopfloor enquanto existir um Pin Aberto.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pinsAbertos.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                                    <CheckCircle2 size={40} className="text-emerald-300 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Nenhuma anomalia grave reportada.</p>
                                    <p className="text-[10px] uppercase">O molde está tecnicamente saudável.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                    {pinsAbertos.map(pin => (
                                        <li key={pin.id} className="p-4 hover:bg-rose-50/30 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded mb-1">
                                                        {pin.tipo_defeito}
                                                    </span>
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{pin.anotacao_reparador || 'Sem indicações.'}</p>
                                                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-mono tracking-widest">MAPA. (X: {pin.coord_x}%, Y: {pin.coord_y}%)</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 shrink-0" title="Marcar Resolvido (Safar Pin)">
                                                    <CheckCircle2 size={14} />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

        </div>
    );
}
