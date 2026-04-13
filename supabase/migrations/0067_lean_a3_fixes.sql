-- Migration 0067: Fix lean_acoes schema for A3 Report data structures

-- 1. Add correctly named columns for the A3 Report in Scrum Board
ALTER TABLE public.lean_acoes
ADD COLUMN IF NOT EXISTS equipa_trabalho VARCHAR(255),
ADD COLUMN IF NOT EXISTS indicadores_sucesso TEXT,
ADD COLUMN IF NOT EXISTS plano_acao_5w2h JSONB;

-- 2. Ensure causa_raiz_5w is JSONB (since the frontend pushes an Array of 5 strings)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='lean_acoes' AND column_name='causa_raiz_5w' AND data_type='text'
    ) THEN
        -- Safely cast previous text column to jsonb
        ALTER TABLE public.lean_acoes ALTER COLUMN causa_raiz_5w TYPE JSONB USING causa_raiz_5w::jsonb;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='lean_acoes' AND column_name='causa_raiz_5w'
    ) THEN
        ALTER TABLE public.lean_acoes ADD COLUMN causa_raiz_5w JSONB;
    END IF;
END $$;

-- 3. Reload schema cache for Supabase Rest API
NOTIFY pgrst, 'reload schema';
