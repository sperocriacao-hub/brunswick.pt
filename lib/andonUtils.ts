export const calcActiveMinutes = (inicio: string, fim: string | null, temT2: boolean) => {
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
