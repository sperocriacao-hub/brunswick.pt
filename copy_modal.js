const fs = require('fs');

const rnc_file = "/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/app/admin/qualidade/rnc/quadro/page.tsx";
const hst_file = "/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/app/admin/hst/acoes/page.tsx";

const rnc_content = fs.readFileSync(rnc_file, 'utf8');

const start_idx = rnc_content.indexOf("<Dialog open={isA3Open} onOpenChange={setIsA3Open}>");
const print_start = rnc_content.indexOf("{/* DEDICATED PRINT TEMPLATE FOR 8D / A3 (PROFESSIONAL LEVEL) */}");

// The print template ends with closing divs. It's best to find the end of the block.
// In rnc, the print template is inside `{selectedAction && ( ... )}`.
const end_idx = rnc_content.indexOf(")}", print_start) + 2;

if (start_idx !== -1 && print_start !== -1) {
    let modal_content = rnc_content.substring(start_idx, end_idx);

    // Adapt variables for HST
    modal_content = modal_content.replace(/selectedAction\?\.numero_rnc/g, "selectedAction?.hst_ocorrencias?.tipo_ocorrencia");
    modal_content = modal_content.replace(/selectedAction\?\.descricao_problema/g, "selectedAction?.descricao_acao");
    modal_content = modal_content.replace(/selectedAction\?\.contexto_producao/g, "selectedAction?.hst_ocorrencias?.areas_fabrica?.nome_area");

    const hst_content = fs.readFileSync(hst_file, 'utf8');
    const insertion_point = hst_content.lastIndexOf("</div>\n    );\n}");

    if (insertion_point !== -1) {
        const new_hst_content = hst_content.substring(0, insertion_point) + "\n            {/* MODAL A3/8D */}\n            " + modal_content + "\n        " + hst_content.substring(insertion_point);
        fs.writeFileSync(hst_file, new_hst_content);
        console.log("Success JS");
    } else {
        console.log("Insertion point not found");
    }
} else {
    console.log("Dialog not found");
}
