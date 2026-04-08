export function generateRncEml(rnc: any, base64Image?: string | null) {
    const boundary = "----=_NextPart_RNC_Email_Boundary";
    
    // Header
    const emlHeader = `To: 
Subject: [Brunswick RNC] Relatório de Ocorrência: ${rnc.numero_rnc}
MIME-Version: 1.0
Content-Type: multipart/related; boundary="${boundary}"

`;

    // HTML Body
    const htmlPart = `--${boundary}
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <div style="border-bottom: 2px solid #e11d48; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #e11d48; margin: 0;">Relatório de Não Conformidade (RNC)</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Gerado a partir do M.E.S. Brunswick Hub</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; width: 30%; font-weight: bold; color: #475569;">Número / Data</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${rnc.numero_rnc} <span style="font-weight: normal; color: #64748b;">(${new Date(rnc.data_deteccao).toLocaleDateString()})</span></td>
        </tr>
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Detetado Por</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${rnc.detetado_por_nome}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Estação / Linha</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${rnc.estacoes?.nome_estacao || 'N/A'}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Classificação</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${rnc.tipo_defeito} (Gravidade: ${rnc.gravidade})</td>
        </tr>
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Status Ocorrência</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0284c7; font-weight: bold;">${rnc.status}</td>
        </tr>
    </table>

    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Descrição do Defeito</h3>
        <p style="margin: 0; white-space: pre-wrap; font-size: 15px; line-height: 1.5;">${rnc.descricao_problema}</p>
    </div>

    ${rnc.acao_imediata ? `
    <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; border: 1px solid #fde68a; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #92400e; font-size: 16px;">Ação Imediata (D3)</h3>
        <p style="margin: 0; white-space: pre-wrap; font-size: 15px;">${rnc.acao_imediata}</p>
    </div>` : ''}

    ${base64Image ? `
    <div style="margin-top: 20px;">
        <h3 style="color: #334155; font-size: 16px;">Evidência Fotográfica</h3>
        <img src="cid:evidencia_imagem" alt="Ocorrência RNC" style="max-width: 100%; border-radius: 6px; border: 1px solid #cbd5e1;" />
    </div>` : ''}
</div>
`;

    // Image Attachment (if exists)
    let imagePart = "";
    if (base64Image) {
        // base64Image comes as "data:image/webp;base64,xxxxxx..." or just "data:image/jpeg;base64,xxxx"
        const matches = base64Image.match(/^data:(.+?);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            
            imagePart = `--${boundary}
Content-Type: ${mimeType}; name="evidencia.webp"
Content-Transfer-Encoding: base64
Content-ID: <evidencia_imagem>
Content-Disposition: inline; filename="evidencia.webp"

${base64Data}
`;
        }
    }

    const emlEnd = `--${boundary}--`;

    const blob = new Blob([emlHeader, htmlPart, imagePart, emlEnd], { type: "message/rfc822" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rnc.numero_rnc}.eml`;
    a.click();
    URL.revokeObjectURL(url);
}
