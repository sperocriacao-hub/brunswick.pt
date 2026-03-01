'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMoldesTPM, criarIntervencaoManual } from './actions';
import { Wrench, ShieldCheck, ShieldAlert, Cpu, PieChart, AlertTriangle, CalendarClock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GestaoMoldesTPMPage() {
    const [moldes, setMoldes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Dialog state
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedMoldeId, setSelectedMoldeId] = useState('');
    const [prioridade, setPrioridade] = useState('MEDIA');
    const [observacao, setObservacao] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    function handleOpenCockpit(moldeId: string) {
        router.push(`/admin/manutencao/moldes/${moldeId}`);
    }

    function openAlertDialog(moldeId: string) {
        setSelectedMoldeId(moldeId);
        setPrioridade('MEDIA');
        setObservacao('');
        setIsAlertOpen(true);
    }

    async function handleAberturaManual() {
        if (!selectedMoldeId) return;
        setIsSubmitting(true);
        const res = await criarIntervencaoManual(selectedMoldeId, prioridade, observacao);
        if (res.success) {
            setIsAlertOpen(false);
            carregarMoldes();
            router.push(`/admin/manutencao/moldes/${selectedMoldeId}`); // Jump straight to cockpit
        } else {
            alert('Falha ao abrir OS manual: ' + res.error);
        }
        setIsSubmitting(false);
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">A carregar matriz de desgaste de moldes...</div>;

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Preventiva TPM de Moldes</h1>
                    <p className="text-lg text-slate-500 mt-1">Inspeção de Limites de Laminação e Controlo de Desgaste OEE</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => router.push('/admin/manutencao/moldes/historico')}>
                        <CalendarClock className="w-4 h-4 mr-2 text-slate-500" />
                        Histórico O.S.
                    </Button>
                    <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => router.push('/admin/manutencao/moldes/dashboard')}>
                        <PieChart className="w-4 h-4 mr-2" />
                        KPI Analítico OEE
                    </Button>
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

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-amber-600 hover:bg-amber-50 rounded-full"
                                            onClick={() => openAlertDialog(molde.id)}
                                            title="Reportar Avaria Manual (Fora de Ciclo)"
                                        >
                                            <AlertTriangle className="w-5 h-5" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-bold shadow-sm"
                                            onClick={() => router.push(`/admin/manutencao/moldes/auditoria/${molde.id}`)}
                                            title="Registar Defeito Geométrico (Poka-Yoke)"
                                        >
                                            <Cpu className="w-4 h-4 mr-2" /> Geo-Audit
                                        </Button>

                                        <Button
                                            variant={isDanger ? "default" : "outline"}
                                            className={isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200' : 'text-slate-600 border-slate-300 hover:bg-slate-50 font-bold'}
                                            onClick={() => handleOpenCockpit(molde.id)}
                                        >
                                            <Wrench className="w-4 h-4 mr-2" /> Tratar O.S.
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500" /> Reportar Avaria no Molde</DialogTitle>
                        <DialogDescription>Abrir Ordem de Serviço Manual, interrompendo a produção no molde imediatamente para acionar Qualidade/Ferramentaria.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nível de Urgência (Gravidade)</Label>
                            <Select value={prioridade} onValueChange={setPrioridade}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a Gravidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BAIXA">Baixa (Reparar no fim do Lote)</SelectItem>
                                    <SelectItem value="MEDIA">Média (Ação Corretiva)</SelectItem>
                                    <SelectItem value="CRITICA">Crítica (Molde Inoperável / Empeno)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Observação Breve da Falha / Riscos Geométricos</Label>
                            <Input value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: Molde colou na extração, rachadura no vértice..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAlertOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button className="bg-rose-600 hover:bg-rose-700" onClick={handleAberturaManual} disabled={isSubmitting || !observacao}>
                            {isSubmitting ? 'A Emitir O.S...' : 'Bloquear Molde & Iniciar TPM'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
