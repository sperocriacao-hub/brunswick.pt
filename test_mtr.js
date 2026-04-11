const calcActiveMinutes = (inicio, fim, temT2) => {
    if (!inicio) return 0;
    const start = new Date(inicio).getTime();
    const end = fim ? new Date(fim).getTime() : new Date().getTime();
    if (start >= end) return 0;

    if (temT2) {
        return Math.floor((end - start) / 60000);
    }

    let count = 0;
    let current = new Date(start);
    const limit = new Date(end);
    
    let loops = 0;
    while (current < limit && loops < 100000) { 
        const h = current.getHours();
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6; 
        
        if (!isWeekend && h >= 6 && h < 14) {
            count++;
        }
        current.setMinutes(current.getMinutes() + 1);
        loops++;
    }
    return count;
};

const d1 = new Date("2026-04-10T13:00:00Z"); // Sexta, T1
const d2 = new Date("2026-04-10T14:30:00Z"); // Sexta, T2
console.log("Noite 1 (Sexta) sem T2. Esperado: 60 mins ->", calcActiveMinutes(d1, d2, false));

const d3 = new Date("2026-04-10T13:00:00Z"); // Sexta
const d4 = new Date("2026-04-13T07:00:00Z"); // Segunda
console.log("Fim de semana atravessado (Sexta a Seg). Esperado: ~120 mins ->", calcActiveMinutes(d3, d4, false));

const d5 = new Date("2026-04-10T13:00:00Z");
const d6 = new Date("2026-04-13T07:00:00Z");
console.log("Fim de semana atravessado (COM T2). Esperado: Minutos puros ->", calcActiveMinutes(d5, d6, true));

