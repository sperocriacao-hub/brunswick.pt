-- Migração 0014: Suporte de Instruções para Relações de Roteiro Gerais
-- A nossa UI de Engenharia permite anexar Instruções de Texto e Imagem PDF às tarefas GERAIS (Roteiro),
-- mas o schema inicial só previa isso para as Tarefas Opcionais. Adicionamos estas colunas a roteiros_producao.

ALTER TABLE public.roteiros_producao 
ADD COLUMN IF NOT EXISTS descricao_tarefa TEXT,
ADD COLUMN IF NOT EXISTS imagem_instrucao_url TEXT;

-- Vamos também adicionar o campo 'versao' e 'status' à tabela 'modelos' que foi o causador do crash anterior.
ALTER TABLE public.modelos
ADD COLUMN IF NOT EXISTS versao VARCHAR(50) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Desenvolvimento';
