const parseExcelDate = (serial) => {
   if (!serial) return null;
   if (typeof serial === 'number') {
      const utc_days  = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;                                        
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
   }
   
   let dateStr = String(serial).trim().split(' ')[0];
   if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
   
   if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts[2].length >= 4) { return `${parts[2].substring(0,4)}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; } 
        else if (parts[0].length === 4) { return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].substring(0,2).padStart(2,'0')}`; }
    } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) { return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].substring(0,2).padStart(2,'0')}`; } 
        else { return `${parts[2].substring(0,4)}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; }
    }
   return dateStr;
};

console.log(parseExcelDate("11/03/2026 00:00:00"));
console.log(parseExcelDate("2026-01-15"));
console.log(parseExcelDate("05-02-2026"));
console.log(parseExcelDate(45700));
