/**
 * Converte um Array de Objetos JSON num ficheiro CSV nativo e desencadeia o download no Browser.
 * Ideal para exportar Listagens Mestre e Relatórios para a Contabilidade sem bibliotecas pesadas.
 * 
 * @param data Array de Objetos (ex: [{nome: 'Rui', op: '123'}] )
 * @param filename Nome do ficheiro a exportar (ex: 'Relatorio_Financas.csv')
 */
export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) {
        alert("Sem dados para exportar.");
        return;
    }

    // 1. Extrair os Headers (Keys do primeiro objeto)
    const headers = Object.keys(data[0]);

    // 2. Mapear as linhas, convertendo para vírgulas e escapando possíveis aspas ou vírgulas nas strings
    const rows = data.map(obj =>
        headers.map(header => {
            let cell = obj[header] === null || obj[header] === undefined ? '' : String(obj[header]);
            // Escapar plicas internas e quebras de linha
            cell = cell.replace(/"/g, '""');
            // Se contiver vírgula ou aspa ou newline, envolver em aspas
            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(',')
    );

    // 3. Juntar Headers + Rows
    const csvString = [headers.join(','), ...rows].join('\n');

    // 4. Criar o Blob e forçar o Browser a fazer o Hook de Download (BOM \ufeff para UTF-8 Excel compatibility)
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Hack de navegação invisível
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
