-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0053: RPC Herói do Mês Resiliente
-- ======================================================================================

-- Retorna o Operador com a média de Eficiência mais alta dos últimos 30 dias.
-- Se quisermos estritamente do mês, usar date_trunc, mas últimos 30 dias evita
-- que a TV fique vazia no dia 1 e dia 2 de cada mês.
DROP FUNCTION IF EXISTS public.get_top_worker_of_month(VARCHAR, UUID);

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
        a.data_avaliacao >= current_date - interval '30 days'
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
