-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0064: CÁLCULO DE EFICIÊNCIA H/H
-- ======================================================================================

-- Função RPC para calcular a Eficiência Global (NASA) num determinado período e escopo.
-- Retorna as Horas Ganhas, Horas Trabalhadas e o % de Eficiência.
CREATE OR REPLACE FUNCTION public.get_eficiencia_hh(
    p_data_inicio TIMESTAMPTZ,
    p_data_fim TIMESTAMPTZ,
    p_area_id UUID DEFAULT NULL,
    p_linha_id UUID DEFAULT NULL,
    p_estacao_id UUID DEFAULT NULL
)
RETURNS TABLE (
    horas_ganhas NUMERIC,
    horas_trabalhadas NUMERIC,
    eficiencia_percentual NUMERIC,
    barcos_processados INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_horas_ganhas NUMERIC := 0;
    v_horas_trabalhadas NUMERIC := 0;
    v_barcos INTEGER := 0;
    v_tipo_alvo VARCHAR(50);
BEGIN
    -- 1. Determinar o Tipo de Alvo da Meta baseado nos filtros fornecidos
    IF p_estacao_id IS NOT NULL THEN
        v_tipo_alvo := 'ESTACAO';
    ELSIF p_area_id IS NOT NULL AND p_linha_id IS NOT NULL THEN
        v_tipo_alvo := 'AREA_LINHA';
    ELSIF p_area_id IS NOT NULL THEN
        v_tipo_alvo := 'AREA';
    ELSE
        -- Global Factory Level (fallback)
        v_tipo_alvo := 'AREA'; 
    END IF;

    -- 2. Calcular MATEMÁTICA 1: HORAS GANHAS (Target H/H * Barcos Produzidos)
    -- Contabilizamos qualquer OP que tenha 'log_estacao_conclusao' dentro do escopo no período.
    SELECT 
        COALESCE(SUM(m.horas_homem), 0),
        COUNT(DISTINCT op_concluida.op_id)
    INTO v_horas_ganhas, v_barcos
    FROM (
        SELECT DISTINCT c.op_id 
        FROM public.log_estacao_conclusao c
        JOIN public.estacoes e ON e.id = c.estacao_id
        JOIN public.ordens_producao op_inner ON op_inner.id = c.op_id
        WHERE c.timestamp >= p_data_inicio 
          AND c.timestamp <= p_data_fim
          AND (p_estacao_id IS NULL OR c.estacao_id = p_estacao_id)
          AND (p_area_id IS NULL OR e.area_id = p_area_id)
          AND (p_linha_id IS NULL OR op_inner.linha_id = p_linha_id)
    ) op_concluida
    JOIN public.ordens_producao op ON op.id = op_concluida.op_id
    JOIN public.modelo_metas_hh m ON m.modelo_id = op.modelo_id
    WHERE m.tipo_alvo = v_tipo_alvo
      AND (p_estacao_id IS NULL OR m.estacao_id = p_estacao_id)
      AND (p_area_id IS NULL OR m.area_id = p_area_id)
      AND (p_linha_id IS NULL OR m.linha_id = p_linha_id);

    -- 3. Calcular MATEMÁTICA 2: HORAS TRABALHADAS EFETIVAS (Ponto dos Operadores)
    -- Usamos os registos de 'log_ponto_diario' com tipo_registo 'ENTRADA'.
    -- Para robustez (caso os operadores não piquem a SAIDA), assumimos 8 horas padrão
    -- por cada dia único que um operador picou o ponto no Escopo, ou calculamos
    -- a diferença exata se a SAIDA existir no mesmo dia.
    
    SELECT COALESCE(SUM(horas_dia.h_dia), 0)
    INTO v_horas_trabalhadas
    FROM (
        SELECT 
            entrada.operador_rfid,
            entrada.data_corte,
            -- Tenta obter a diferenca para a saida, limitado a 12h, senão assume 8h
            COALESCE(
                LEAST(
                    EXTRACT(EPOCH FROM (MIN(saida.timestamp) - MIN(entrada.timestamp))) / 3600.0, 
                    12.0
                ), 
                8.0
            ) as h_dia
        FROM (
            SELECT operador_rfid, timestamp, DATE(timestamp AT TIME ZONE 'UTC') as data_corte, estacao_id
            FROM public.log_ponto_diario
            WHERE tipo_registo = 'ENTRADA'
              AND timestamp >= p_data_inicio AND timestamp <= p_data_fim
        ) entrada
        JOIN public.estacoes e_ent ON e_ent.id = entrada.estacao_id
        LEFT JOIN public.log_ponto_diario saida 
            ON saida.operador_rfid = entrada.operador_rfid 
            AND saida.tipo_registo = 'SAIDA'
            AND saida.timestamp > entrada.timestamp
            AND DATE(saida.timestamp AT TIME ZONE 'UTC') = entrada.data_corte
        WHERE (p_estacao_id IS NULL OR entrada.estacao_id = p_estacao_id)
          AND (p_area_id IS NULL OR e_ent.area_id = p_area_id)
        GROUP BY entrada.operador_rfid, entrada.data_corte
    ) horas_dia;

    -- 4. Retornar Tabela
    RETURN QUERY SELECT 
        ROUND(v_horas_ganhas, 2),
        ROUND(v_horas_trabalhadas, 2),
        CASE WHEN v_horas_trabalhadas > 0 THEN ROUND((v_horas_ganhas / v_horas_trabalhadas) * 100, 2) ELSE 0.00 END,
        v_barcos;
END;
$$;
