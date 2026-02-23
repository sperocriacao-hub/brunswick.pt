import * as XLSX from 'xlsx';

/**
 * Converte um Array de Objetos JSON num ficheiro Excel nativo (.xlsx) e desencadeia o download no Browser.
 * Ideal para exportar Listagens Mestre e Relatórios para a Contabilidade suportando múltiplas folhas ou objetos complexos.
 * 
 * @param data Array de Objetos (ex: [{nome: 'Rui', op: '123'}] )
 * @param filename Nome do ficheiro a exportar (ex: 'Relatorio_Financas.xlsx')
 */
export function exportToExcel(data: any[], filename: string) {
    if (!data || !data.length) {
        alert("Sem dados para exportar.");
        return;
    }

    try {
        // Criar folha de worksheet a partir do JSON de input
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dados_Motor');

        // Garantir que a extensão do filename termina em .xlsx
        const finalFilename = filename.endsWith('.xlsx') ? filename : filename.replace(/\.csv$/, '.xlsx');

        // Gravar (Trigger nativo do browser pelo sheetJS)
        XLSX.writeFile(wb, finalFilename);
    } catch (e: any) {
        console.error("Insucesso a transcrever Excel", e);
        alert("Erro na conversão para XLSX nativo");
    }
}
