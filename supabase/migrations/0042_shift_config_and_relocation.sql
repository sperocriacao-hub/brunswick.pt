-- 1. Create table for Area Shift Configurations (Turnos e Pausas)
CREATE TABLE IF NOT EXISTS public.configuracao_turnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    linha_producao_id UUID REFERENCES public.linhas_producao(id) ON DELETE CASCADE,
    nome_turno TEXT NOT NULL, -- e.g., 'T1', 'T2'
    hora_inicio TIME NOT NULL, -- e.g., '06:00:00'
    hora_fim TIME NOT NULL, -- e.g., '14:00:00'
    tem_pausa_refeicao BOOLEAN DEFAULT true,
    hora_inicio_refeicao TIME, -- e.g., '12:00:00'
    hora_fim_refeicao TIME, -- e.g., '12:30:00'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(linha_producao_id, nome_turno)
);

-- 2. Add dynamic relocation columns to operadores
ALTER TABLE public.operadores 
ADD COLUMN IF NOT EXISTS estacao_alocada_temporaria UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS em_realocacao BOOLEAN DEFAULT false;

-- 3. RLS for configuracao_turnos
ALTER TABLE public.configuracao_turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access on configuracao_turnos" ON public.configuracao_turnos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anon read access on configuracao_turnos" ON public.configuracao_turnos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow admin all access on configuracao_turnos" ON public.configuracao_turnos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Enable realtime for configuracao_turnos and let operadores updates flow
ALTER PUBLICATION supabase_realtime ADD TABLE configuracao_turnos;
