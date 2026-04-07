ALTER TABLE qualidade_rnc DROP CONSTRAINT IF EXISTS qualidade_rnc_status_check;
ALTER TABLE qualidade_rnc ADD CONSTRAINT qualidade_rnc_status_check CHECK (status IN ('Pendente', 'Aberto', 'Em Investigacao', 'Concluido', 'Cancelado', 'Encerrado'));
ALTER TABLE qualidade_rnc ALTER COLUMN status SET DEFAULT 'Pendente';

-- Correção de migração das RNCs antigas sem tratamento associado para Pendente (Habilitar Triagem Automática p/ Histórico)
UPDATE qualidade_rnc SET status = 'Pendente' WHERE status = 'Aberto' AND id NOT IN (SELECT rnc_id FROM qualidade_a3 WHERE rnc_id IS NOT NULL) AND id NOT IN (SELECT rnc_id FROM qualidade_8d WHERE rnc_id IS NOT NULL);
