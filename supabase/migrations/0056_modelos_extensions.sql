-- Migração 0056: Extensão da Tabela de Modelos de Embarcações
-- Adiciona o link direto à Linha de Produção (Onde é feito), a Fotografia Pública e Categoria do Barco.

-- 1. ADICIONAR COLUNAS (IF NOT EXISTS for idempotency)
ALTER TABLE public.modelos ADD COLUMN IF NOT EXISTS linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE SET NULL;
ALTER TABLE public.modelos ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE public.modelos ADD COLUMN IF NOT EXISTS categoria VARCHAR(150);

-- Comentários da Base de Dados para claridade
COMMENT ON COLUMN public.modelos.linha_id IS 'Qual é a Linha de Montagem de Referência onde este Barco ganha vida na Fábrica.';
COMMENT ON COLUMN public.modelos.imagem_url IS 'O Bucket Supabase Storage URL para a Fotografia/Marketing do Barco.';
COMMENT ON COLUMN public.modelos.categoria IS 'Ex: Daycruiser, Bowrider, Pilothouse, etc.';
