-- Migração 0013: Stored Procedure (RPC) para cálculo vetorial de perfis de RH
-- O Modal Raio-X do Operador requer agregações matemáticas complexas em 7 eixos (Spider Chart)
-- Resolvemos tudo do lado do PostgREST num só endpoint.

CREATE OR REPLACE FUNCTION public.get_medias_operador_v2(target_rfid TEXT)
RETURNS TABLE (
    med_epi numeric,
    med_hst numeric,
    med_qualidade numeric,
    med_5s numeric,
    med_rendimento numeric,
    med_polivalencia numeric,
    med_kaisen numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(nota_epi)::numeric, 1), 0) as med_epi,
        COALESCE(ROUND(AVG(nota_hst)::numeric, 1), 0) as med_hst,
        COALESCE(ROUND(AVG(nota_qualidade)::numeric, 1), 0) as med_qualidade,
        COALESCE(ROUND(AVG(nota_5s)::numeric, 1), 0) as med_5s,
        COALESCE(ROUND(AVG(nota_eficiencia)::numeric, 1), 0) as med_rendimento,
        COALESCE(ROUND(AVG(nota_objetivos)::numeric, 1), 0) as med_polivalencia,
        COALESCE(ROUND(AVG(nota_atitude)::numeric, 1), 0) as med_kaisen
    FROM 
        public.avaliacoes_diarias
    WHERE 
        operador_rfid = target_rfid
        AND data_avaliacao >= current_date - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
