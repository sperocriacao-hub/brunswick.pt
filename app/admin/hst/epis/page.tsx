"use client";

import { useState, useEffect } from "react";
import { getEpiMatrixData, toggleEpiRequirement } from "./actions";
import { Loader2, ShieldCheck, Eye, Ear, Wind, Hand, Zap, Beaker, HardHat, Glasses } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interface maping
interface Area {
    id: string;
    nome_area: string;
}

interface EpiMatriz {
    area_id: string;
    epi_oculos: boolean;
    epi_protetor_auricular: boolean;
    epi_mascara_respiratoria: boolean;
    epi_luvas_anticorte: boolean;
    epi_luvas_quimicas: boolean;
    epi_botas_biqueira: boolean;
    epi_capacete: boolean;
    epi_fato_macaco: boolean;
}

// Columns definition for UI
const EPI_COLUMNS = [
    { key: "epi_capacete", label: "Capacete", icon: HardHat, color: "text-yellow-600" },
    { key: "epi_oculos", label: "Óculos", icon: Eye, color: "text-blue-500" },
    { key: "epi_protetor_auricular", label: "Auricular", icon: Ear, color: "text-orange-500" },
    { key: "epi_mascara_respiratoria", label: "Máscara", icon: Wind, color: "text-slate-500" },
    { key: "epi_luvas_anticorte", label: "L. Anticorte", icon: Hand, color: "text-zinc-600" },
    { key: "epi_luvas_quimicas", label: "L. Químicas", icon: Beaker, color: "text-green-500" },
    { key: "epi_botas_biqueira", label: "Botas", icon: Zap, color: "text-amber-700" },
    { key: "epi_fato_macaco", label: "Fato", icon: ShieldCheck, color: "text-indigo-600" },
];

export default function EpisMatrizPage() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [matrizes, setMatrizes] = useState<EpiMatriz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarGrelha();
    }, []);

    async function carregarGrelha() {
        setLoading(true);
        const res = await getEpiMatrixData();
        if (res.success) {
            setAreas(res.areas);
            setMatrizes(res.matrizes);
        } else {
            toast.error("Erro ao carregar a Matriz Ocupacional.");
        }
        setLoading(false);
    }

    const handleToggle = async (areaId: string, columnKey: string, currentValue: boolean) => {
        // Optimistic UI Update
        const novoValor = !currentValue;

        setMatrizes(prev => {
            const hasRow = prev.find(m => m.area_id === areaId);
            if (hasRow) {
                return prev.map(m => m.area_id === areaId ? { ...m, [columnKey]: novoValor } : m);
            } else {
                return [...prev, { area_id: areaId, [columnKey]: novoValor } as unknown as EpiMatriz];
            }
        });

        const res = await toggleEpiRequirement(areaId, columnKey, novoValor);

        if (!res.success) {
            toast.error("Falha ao gravar política de EPI na Base de Dados.");
            carregarGrelha(); // Rollback UI if fails
        }
    };

    const getEpiValue = (areaId: string, columnKey: keyof EpiMatriz): boolean => {
        const row = matrizes.find(m => m.area_id === areaId);
        if (!row) return false;
        return !!row[columnKey];
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <ToastContainer position="bottom-right" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-blue-600" />
                        Matriz Ocupacional EPIs
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                        Define os Equipamentos de Proteção Individual (EPIs) de uso obrigatório por cada Área Fabril.
                        A sua modificação entra em vigor instantaneamente para as vistorias de Qualidade/HST.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="p-4 font-semibold text-slate-700 w-1/4">Área Fabril</th>
                                    {EPI_COLUMNS.map(col => {
                                        const Icon = col.icon;
                                        return (
                                            <th key={col.key} className="p-4 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 group">
                                                    <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 \${col.color} group-hover:scale-110 transition-transform`}>
                                                        <Icon strokeWidth={2} className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                                                        {col.label}
                                                    </span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {areas.map((area) => (
                                    <tr key={area.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{area.nome_area}</p>
                                                    <p className="text-xs text-slate-400">Área Restrita</p>
                                                </div>
                                            </div>
                                        </td>

                                        {EPI_COLUMNS.map(col => {
                                            const val = getEpiValue(area.id, col.key as keyof EpiMatriz);
                                            return (
                                                <td key={col.key} className="p-4 text-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={val}
                                                            onChange={() => handleToggle(area.id, col.key, val)}
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}

                                {areas.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-500">
                                            Nenhuma Área Fabril registada na Base de Dados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
