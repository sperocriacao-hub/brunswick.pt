'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMoldesTPM, registarManutencaoMolde } from './actions';
import { Wrench, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function GestaoMoldesTPMPage() {
    const [moldes, setMoldes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarMoldes();
    }, []);

    async function carregarMoldes() {
        setLoading(true);
        try {
            const res = await getMoldesTPM();
            if (res.success) setMoldes(res.data || []);
            else console.error("Falha a puxar TPM: ", res.error);
        } catch (err) {
            console.error("Erro critico servidor TPM: ", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleManutencao(moldeId: string) {
        if (!confirm('Deseja registar a manutenção técnica e reiniciar os ciclos deste molde a ZERO?')) return;
        const res = await registarManutencaoMolde(moldeId);
        if (res.success) {
            carregarMoldes();
        } else {
            alert('Erro ao registar manutenção: ' + res.error);
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">A carregar matriz de desgaste de moldes...</div>;

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Preventiva TPM de Moldes</h1>
                    <p className="text-lg text-slate-500 mt-1">Inspeção de Limites de Laminação e Controlo de Desgaste OEE</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {moldes.map(molde => {
                    const percent = Math.min((molde.ciclos_estimados / molde.manutenir_em) * 100, 100);
                    const isDanger = percent >= 100 || molde.status !== 'Ativo';
                    const isWarning = percent >= 80 && percent < 100;

                    return (
                        <Card key={molde.id} className={`border-2 shadow-sm transition-all hover:shadow-md ${isDanger ? 'border-rose-400 bg-rose-50/40' : isWarning ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-white'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl font-bold uppercase text-slate-800">{molde.nome_parte}</CardTitle>
                                    {isDanger ? <ShieldAlert className="text-rose-500 shrink-0" size={28} /> : <ShieldCheck className="text-emerald-500 shrink-0" size={28} />}
                                </div>
                                <CardDescription className="flex items-center gap-2 font-mono text-xs text-slate-400 mt-1">
                                    <Cpu size={14} /> TAG RFID: {molde.rfid || 'S/ Tag Associada'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 mb-2 flex justify-between text-sm font-medium">
                                    <span className="text-slate-500 uppercase tracking-wider text-xs font-bold">Desgaste Acumulado</span>
                                    <span className={`${isDanger ? 'text-rose-600 font-black' : isWarning ? 'text-amber-600 font-black' : 'text-slate-600 font-bold'}`}>
                                        {molde.ciclos_estimados} / {molde.manutenir_em} LAMINAÇÕES
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 inset-shadow-sm">
                                    <div
                                        className={`h-full transition-all duration-1000 ${isDanger ? 'bg-gradient-to-r from-rose-500 to-rose-600' : isWarning ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                {molde.ultima_manutencao_at && (
                                    <p className="text-[10px] text-right text-slate-400 mt-2 uppercase font-medium">
                                        Última Prevenção: {new Date(molde.ultima_manutencao_at).toLocaleString('pt-PT')}
                                    </p>
                                )}

                                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-200/60">
                                    <span className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest ${isDanger ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                        {molde.status}
                                    </span>

                                    <Button
                                        variant={isDanger ? "default" : "outline"}
                                        className={isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                                        onClick={() => handleManutencao(molde.id)}
                                    >
                                        <Wrench className="w-4 h-4 mr-2" /> Registar Preventiva
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
