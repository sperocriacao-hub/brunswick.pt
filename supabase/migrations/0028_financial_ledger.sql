-- Migration 0028: Financial Ledger & Operator Wages

-- 1. Add Wage Column to Operadores
ALTER TABLE public.operadores
    ADD COLUMN salario_hora NUMERIC DEFAULT 10.00;

COMMENT ON COLUMN public.operadores.salario_hora IS 'Custo Horário Base do Trabalhador em Euros (€/h) para cálculo de desvios no Plano M.E.S OEE.';

-- Nota: Como "salario_hora" é informação sensível, as políticas RLS já restringem a tabela inteiriça de "operadores" aos
-- Administradores, pelo que não será exposta às apps do Shopfloor que operam por Server Actions e Chaves de Acesso Restrito.
