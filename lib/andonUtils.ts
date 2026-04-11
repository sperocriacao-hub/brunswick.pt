export const calcActiveMinutes = (inicio: string, fim: string | null, temT2: boolean) => {
    if (!inicio) return 0;
    const start = new Date(inicio).getTime();
    const end = fim ? new Date(fim).getTime() : new Date().getTime();
    if (start >= end) return 0;

    let count = 0;
    let current = new Date(start);
    const limit = new Date(end);
    
    // Permitir loop até ~1.5 anos (1 milhão de minutos) para não ter timeouts com Andons antigos
    let loops = 0;
    while (current < limit && loops < 1000000) { 
        const h = current.getHours();
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6; 
        
        if (!isWeekend) {
            // Se tiver T2, o horário laborável da estação é 06:00 às 22:00 (endHour 22 exclui 22:00)
            // Se NÃO tiver T2, o horário é 06:00 às 14:00 (endHour 14 exclui 14:00)
            const endHour = temT2 ? 22 : 14;
            
            if (h >= 6 && h < endHour) {
                count++;
            }
        }
        current.setMinutes(current.getMinutes() + 1);
        loops++;
    }
    return count;
};
