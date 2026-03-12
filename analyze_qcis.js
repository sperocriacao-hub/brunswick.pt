const xlsx = require('xlsx');
const fs = require('fs');

try {
  const workbook = xlsx.readFile('QCIS Excel.xlsx');
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays
  
  const headers = json[0];
  const sample1 = json[1];
  const sample2 = json[2];
  
  const output = {
    headers,
    sample1,
    sample2
  };
  
  fs.writeFileSync('qcis_analysis.json', JSON.stringify(output, null, 2));
  console.log("Analysis saved to qcis_analysis.json");
} catch (e) {
  console.error("Error reading Excel:", e.message);
}
