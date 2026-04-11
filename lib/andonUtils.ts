function getPortugalOffset(dateNum: number) {
    const isoString = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Lisbon',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).format(new Date(dateNum));
    
    const cleanStr = isoString.replace(', ', 'T'); 
    return new Date(`${cleanStr}Z`).getTime() - dateNum;
}

export const calcActiveMinutes = (inicio: string, fim: string | null, temT2: boolean) => {
    if (!inicio) return 0;
    const startObj = new Date(inicio);
    const endObj = fim ? new Date(fim) : new Date();
    
    const start = startObj.getTime();
    const end = endObj.getTime();
    if (start >= end) return 0;

    // Shift to Pseudo-UTC using Portugal offset at that specific date
    const offset = getPortugalOffset(start);

    let count = 0;
    let current = new Date(start + offset);
    const limit = new Date(end + offset);
    
    // Permitir loop até ~1.5 anos (1 milhão de minutos) para não ter timeouts com Andons antigos
    let loops = 0;
    while (current < limit && loops < 1000000) { 
        const h = current.getUTCHours();
        const day = current.getUTCDay();
        const isWeekend = day === 0 || day === 6; 
        
        if (!isWeekend) {
            // Se tiver T2, o horário laborável da estação é 06:00 às 22:00 (endHour 22 exclui 22:00)
            // Se NÃO tiver T2, o horário é 06:00 às 14:00 (endHour 14 exclui 14:00)
            const endHour = temT2 ? 22 : 14;
            
            if (h >= 6 && h < endHour) {
                count++;
            }
        }
        current.setUTCMinutes(current.getUTCMinutes() + 1);
        loops++;
    }
    return count;
};
