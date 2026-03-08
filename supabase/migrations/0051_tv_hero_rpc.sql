-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0051: RPC para Widget TV do Herói do Mês
-- ======================================================================================

-- Retorna o Operador com a média de Eficiência mais alta do mês atual (baseado nas avaliações diárias)
CREATE OR REPLACE FUNCTION public.get_top_worker_of_month()
RETURNS TABLE (
    funcionario_id UUID,
    nome_operador VARCHAR,
    media_eficiencia NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.funcionario_id,
        o.nome_operador,
        ROUND(AVG(a.nota_eficiencia)::numeric, 2) as media_eficiencia
    FROM 
        public.avaliacoes_diarias a
    JOIN
        public.operadores o ON a.funcionario_id = o.id
    WHERE 
        date_trunc('month', a.data_avaliacao) = date_trunc('month', current_date)
    GROUP BY
        a.funcionario_id, o.nome_operador
    ORDER BY
        media_eficiencia DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
