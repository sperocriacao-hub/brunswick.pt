'use client';

import { Download } from 'lucide-react';
import { exportToExcel } from '@/utils/excelExport';

interface ExportRHButtonProps {
    data: any[];
    filename: string;
}

export function ExportRHButton({ data, filename }: ExportRHButtonProps) {
    const handleExport = () => {
        // Formatar os dados para um formato CSV mais limpo
        const formattedData = data.map(op => ({
            'Colaborador': op.nome_operador,
            'Equipa/Área': op.area_nome,
            'Presente Hoje?': op.picouHoje ? 'Sim' : 'Não',
            'Trabalho Efetivo (min)': op.totalTrabalhoEfetivo,
            'Desperdício Declarado (min)': op.totalPausas,
            'Rácio NVA/VA (%)': op.valueRation.toFixed(1),
            'Estações Visitadas': op.numEstacoesDiferentes
        }));

        exportToExcel(formattedData, filename.replace('.csv', '.xlsx'));
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-bold py-1.5 px-3 rounded-lg shadow-sm text-xs transition-colors"
            title="Exportar Dados da Tabela para Excel (XLSX)"
        >
            <Download size={14} /> Exportar RH Mestre
        </button>
    );
}
