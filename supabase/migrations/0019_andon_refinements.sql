-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0019: Andon TV Refinamentos & Modo Área
-- ======================================================================================

-- 1. ADICIONAR COLUNAS DE META-DADOS AO ALERTA ANDON
-- O Operador tem de justificar qual a razão da linha estar suspensa.
ALTER TABLE public.alertas_andon
    ADD COLUMN IF NOT EXISTS tipo_alerta VARCHAR(255) DEFAULT 'Outros',
    ADD COLUMN IF NOT EXISTS descricao_alerta TEXT;

-- Garantir que não existem erros na vista (Caso aplicável). Realtime já publicou "*", logo herdará isto automaticamente.
