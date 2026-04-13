-- Migration 0066: Gemba Walks Logic and Lean Acoes A3 Schema fixes

-- 1. Add "resolvido" status to Gemba Walks
ALTER TABLE public.lean_gemba_walks
ADD COLUMN IF NOT EXISTS resolvido BOOLEAN DEFAULT false;

-- 2. Add complete Lean A3 / 8D schema columns to lean_acoes
ALTER TABLE public.lean_acoes
ADD COLUMN IF NOT EXISTS causa_raiz_5w TEXT,
ADD COLUMN IF NOT EXISTS contramedidas TEXT,
ADD COLUMN IF NOT EXISTS validacao_eficacia VARCHAR(50),
ADD COLUMN IF NOT EXISTS indicadores_controlo TEXT,
ADD COLUMN IF NOT EXISTS anexos_url TEXT;

-- Confirming permissions and notifying the system this was executed
NOTIFY pgrst, 'reload schema';
