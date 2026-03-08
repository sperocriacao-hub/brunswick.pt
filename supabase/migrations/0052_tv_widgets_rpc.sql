-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0052: RPC para Widget TV com Filtro de Área
-- ======================================================================================

-- Retorna o Operador com a média de Eficiência mais alta do mês atual, filtrável por alvo da TV.
DROP FUNCTION IF EXISTS public.get_top_worker_of_month();

CREATE OR REPLACE FUNCTION public.get_top_worker_of_month(p_tipo_alvo VARCHAR DEFAULT 'GERAL', p_alvo_id UUID DEFAULT NULL)
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
        AND (
            p_tipo_alvo = 'GERAL' 
            OR (p_tipo_alvo = 'AREA' AND o.area_base_id = p_alvo_id)
            OR (p_tipo_alvo = 'LINHA' AND o.linha_base_id = p_alvo_id)
        )
    GROUP BY
        a.funcionario_id, o.nome_operador
    ORDER BY
        media_eficiencia DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
