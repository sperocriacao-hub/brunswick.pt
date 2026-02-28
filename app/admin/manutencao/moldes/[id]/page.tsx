'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, CheckCircle, ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
    getMoldeDetails,
    getActiveOrNewIntervention,
    getMoldeGeometry,
    getPinsForIntervention,
    createPin as actionCreatePin,
    validatePin as actionValidatePin,
    closeIntervention
} from './actions';

// Types para lidar com as tabelas de Manutenção TPM NASA
export type MoldeTPM = {
    id: string;
    nome_parte: string;
    rfid: string;
    categoria: string;
    manutenir_em: number;
    ciclos_estimados: number;
};

export type Intervencao = {
    id: string;
    molde_id: string;
    reportado_por: string;
    prioridade: string;
    descricao: string;
    status: string;
    data_abertura: string;
};

export type DefeitoPin = {
    id: string;
    intervencao_id: string;
    coord_x: number;
    coord_y: number;
    tipo_defeito: string;
    status: 'Aberto' | 'Reparado' | 'Validado';
    anotacao_reparador?: string;
};

// SVG Fallback para quando o Molde não tem registo na base de dados
const FALLBACK_SVG = `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#E2E8F0" />
    <path d="M100 200 C300 50 500 50 700 200 C500 350 300 350 100 200 Z" fill="#94A3B8" stroke="#334155" stroke-width="4"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#334155" opacity="0.6">Vista Superior Genérica do Molde</text>
</svg>`;

export default function MoldMaintenanceCockpit() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const moldeId = params?.id || '';
    const [isLoading, setIsLoading] = useState(true);

    const [molde, setMolde] = useState<MoldeTPM | null>(null);
    const [intervencaoAtiva, setIntervencaoAtiva] = useState<Intervencao | null>(null);
    const [pins, setPins] = useState<DefeitoPin[]>([]);
    const [svgGeo, setSvgGeo] = useState<string>(FALLBACK_SVG);

    const [pinDialog, setPinDialog] = useState<{ x: number, y: number, open: boolean }>({ x: 0, y: 0, open: false });
    const [pinType, setPinType] = useState("Fissura Estrutural");
    const [isPrinting, setIsPrinting] = useState(false);

    const svgContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const md = await getMoldeDetails(moldeId);
                setMolde(md as MoldeTPM);

                const intv = await getActiveOrNewIntervention(moldeId);
                setIntervencaoAtiva(intv as Intervencao);

                const bp = await getMoldeGeometry(moldeId);
                if (bp && bp.svg_content) setSvgGeo(bp.svg_content);

                const savedPins = await getPinsForIntervention(intv.id);
                setPins(savedPins as DefeitoPin[]);
            } catch (err) {
                console.error("Erro a carregar dados do Molde TPM:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [moldeId]);

    const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setPinDialog({ x, y, open: true });
    };

    const confirmPin = async () => {
        if (!intervencaoAtiva) return;
        try {
            const newPin = await actionCreatePin(intervencaoAtiva.id, pinDialog.x, pinDialog.y, pinType);
            setPins([...pins, newPin as DefeitoPin]);
            setPinDialog({ ...pinDialog, open: false });
        } catch (err) {
            console.error("Erro ao criar pin:", err);
            alert("Erro ao gravar Defeito no Banco de Dados.");
        }
    };

    const markPinAsValidated = async (id: string) => {
        try {
            await actionValidatePin(id);
            setPins(pins.map(p => p.id === id ? { ...p, status: 'Validado' } : p));
        } catch (err) {
            console.error("Erro ao validar pin:", err);
        }
    };

    const closeOrder = async () => {
        if (!intervencaoAtiva || !molde) return;
        if (pins.some(p => p.status !== 'Validado')) {
            alert("Existem defeitos não validados. Resolva todas as anomalias para encerrar a OS de Recuperação.");
            return;
        }
        try {
            await closeIntervention(intervencaoAtiva.id, molde.id);
            alert("OS de Manutenção de Molde TPM validada e encerrada com sucesso! Ciclos redefinidos/limpos.");
            router.push('/admin/manutencao/moldes');
        } catch (err) {
            console.error(err);
            alert("Falha ao Encerrar a O.S.");
        }
    };

    const printMoldsMaintenanceReport = async () => {
        setIsPrinting(true);
        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text(`Relatório de Conformidade - TPM Molde`, 14, 22);

            if (!molde || !intervencaoAtiva) return;

            doc.setFontSize(12);
            doc.text(`Molde: ${molde?.nome_parte} (RFID: ${molde?.rfid})`, 14, 32);
            doc.text(`Ordem de Serviço (OS): ${intervencaoAtiva.id}`, 14, 40);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, 14, 48);

            const tableColumn = ["Tipo Defeito", "Coordenadas", "Status Auditoria"];
            const tableRows: any[] = [];

            pins.forEach(pin => {
                tableRows.push([
                    pin.tipo_defeito,
                    `[X: ${pin.coord_x.toFixed(1)}%, Y: ${pin.coord_y.toFixed(1)}%]`,
                    pin.status
                ]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 60,
            });

            // Gerar imagem do Canvas (SVG + Pins)
            if (svgContainerRef.current) {
                const canvas = await html2canvas(svgContainerRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                const finalY = (doc as any).lastAutoTable?.finalY || 100;

                // Calcular dimensões (A4 tem 210mm larg, margem de 14mm) = 182mm max
                const pdfWidth = 182;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                if (finalY + pdfHeight + 20 > 280) doc.addPage();
                const drawY = finalY + pdfHeight + 20 > 280 ? 20 : finalY + 15;

                doc.setFontSize(14);
                doc.text("Mapa Visual de Anomalias (Defeitos / Danos Georreferenciados):", 14, drawY);
                doc.addImage(imgData, 'PNG', 14, drawY + 8, pdfWidth, pdfHeight);
            }

            doc.save(`Auditoria_Molde_${molde?.nome_parte?.replace(/\s+/g, '_')}_${intervencaoAtiva.id}.pdf`);
        } catch (e) {
            console.error("Erro ao gerar PDF com Blueprint:", e);
            alert("Ocorreu um erro na renderização inteligente do Blueprint PDF.");
        } finally {
            setIsPrinting(false);
        }
    };

    if (isLoading || !molde || !intervencaoAtiva) {
        return <div className="flex justify-center py-20"><Loader2 size={48} className="animate-spin text-slate-300" /></div>;
    }

    return (
        <div className="space-y-4 max-w-7xl mx-auto h-full animate-fade-in shadow-inner bg-slate-50/50 p-4 rounded-xl">
            {/* Header da OS */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            OS: {intervencaoAtiva.id} <Badge variant="outline" className="text-xs">{molde.rfid}</Badge>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Equipamento: {molde.nome_parte}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={printMoldsMaintenanceReport} disabled={isPrinting} className="text-slate-600">
                        {isPrinting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Printer className="mr-2 h-4 w-4" />}
                        {isPrinting ? "A Processar Blueprint..." : "Relatório M.E.S. PDF"}
                    </Button>
                    <Button onClick={closeOrder} className="bg-emerald-600 hover:bg-emerald-500 shadow-md">
                        <CheckCircle className="mr-2 h-4 w-4" /> Validar & Encerrar TPM
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Visual Mapper Column */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-500" /> Matriz de Danos 2D
                        </CardTitle>
                        <CardDescription>Clique em qualquer parte da imagem da peça em fibro-vidro para associar uma não-conformidade à Ordem de Manutenção.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 bg-slate-100/30">
                        <div
                            ref={svgContainerRef}
                            className="relative w-full aspect-[2/1] bg-white rounded-lg border border-slate-200 shadow-inner overflow-hidden cursor-crosshair group flex items-center justify-center transition-all"
                            onClick={handleSvgClick}
                        >
                            <div className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" dangerouslySetInnerHTML={{ __html: svgGeo }} />

                            {/* Renderizar Pinos Registados */}
                            {pins.map(pin => (
                                <div
                                    key={pin.id}
                                    className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 shadow-lg flex items-center justify-center text-[10px] font-bold text-white z-10 transition-transform cursor-pointer ${pin.status === 'Validado' ? 'bg-emerald-500 border-white hover:scale-110' : 'bg-red-500 border-white hover:scale-125 animate-pulse'}`}
                                    style={{ left: `${pin.coord_x}%`, top: `${pin.coord_y}%` }}
                                    title={`${pin.tipo_defeito} - ${pin.status}`}
                                >
                                    {pin.status === 'Validado' ? '✓' : '!'}
                                </div>
                            ))}

                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar com Lista de Pins & Dados OS */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-600">Contexto M.E.S.</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Prioridade:</span>
                                <Badge variant={intervencaoAtiva.prioridade === 'Critica' ? 'destructive' : 'secondary'} className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                                    Nível {intervencaoAtiva.prioridade}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Trigger Origem:</span>
                                <span className="font-semibold text-slate-700">{intervencaoAtiva.reportado_por}</span>
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed shadow-sm">
                                {intervencaoAtiva.descricao}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-600">Tracking de Reparações</CardTitle>
                            <Badge variant="outline" className="bg-slate-100 text-slate-500">{pins.length}</Badge>
                        </CardHeader>
                        <CardContent className="pt-4 max-h-[350px] overflow-y-auto">
                            {pins.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-sm">Nenhum defeito reportado fisicamente.</div>
                            ) : (
                                <ul className="space-y-3">
                                    {pins.map(pin => (
                                        <li key={pin.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${pin.status === 'Validado' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm text-slate-700">{pin.tipo_defeito}</span>
                                                    <span className="text-xs text-slate-400">[{pin.coord_x.toFixed(0)}%, {pin.coord_y.toFixed(0)}%]</span>
                                                </div>
                                            </div>
                                            {pin.status !== 'Validado' ? (
                                                <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => markPinAsValidated(pin.id)}>
                                                    Validar ✓
                                                </Button>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">Validado</Badge>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de Registo de Defeito Mapeado */}
            <Dialog open={pinDialog.open} onOpenChange={o => setPinDialog({ ...pinDialog, open: o })}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-slate-800">Georreferenciar Defeito</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Selecionou as coordenadas [X: {pinDialog.x.toFixed(1)}%, Y: {pinDialog.y.toFixed(1)}%] na Matriz Mestra. O defeito será associado a esta localização para correção.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2.5">
                            <Label className="text-slate-700 font-semibold">Categoria da Anomalia</Label>
                            <Select value={pinType} onValueChange={setPinType}>
                                <SelectTrigger className="w-full bg-white border-slate-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Gelcoat Estalado">Reparo Gelcoat</SelectItem>
                                    <SelectItem value="Fissura Estrutural">Trinca / Fissura Estrutural</SelectItem>
                                    <SelectItem value="Risco Profundo">Risco Profundo</SelectItem>
                                    <SelectItem value="Polimento Local">Defeito Requer Polimento Local</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPinDialog({ ...pinDialog, open: false })}>Cancelar</Button>
                        <Button onClick={confirmPin} className="bg-blue-600 hover:bg-blue-700 shadow-md">Submeter Local</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
