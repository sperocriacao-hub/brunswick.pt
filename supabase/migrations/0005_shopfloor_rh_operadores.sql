/* 
  Módulo de RH (Operadores) - Migração 0005
  Expansão da Tabela `operadores` existente para conter as 5 Áreas Lógicas de HR.
  Adição da Regra de Bloqueio IoT de Ponto.
*/

-- 1. Expansão de Estrutura da Tabela de Operadores (HR)
ALTER TABLE public.operadores
    -- Bloco 1: Identificação
    ADD COLUMN numero_operador VARCHAR(50) UNIQUE,
    ADD COLUMN data_nascimento DATE,
    
    -- Bloco 2: Estrutura & Alocação
    ADD COLUMN funcao VARCHAR(100),
    ADD COLUMN grupo_equipa VARCHAR(100),
    ADD COLUMN area_base_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL,
    ADD COLUMN posto_base_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    ADD COLUMN turno VARCHAR(50),
    ADD COLUMN lider_nome VARCHAR(255),
    ADD COLUMN supervisor_nome VARCHAR(255),
    ADD COLUMN gestor_nome VARCHAR(255),

    -- Bloco 3: Dados Contratuais
    ADD COLUMN tipo_contrato VARCHAR(100) CHECK (tipo_contrato IN ('Com Termo', 'Sem Termo', 'Terceirizada', 'Estágio', '') OR tipo_contrato IS NULL),
    ADD COLUMN status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Suspenso')),
    ADD COLUMN data_admissao DATE,
    ADD COLUMN data_rescisao DATE,

    -- Bloco 4: Desenvolvimento (Talento)
    ADD COLUMN iluo_nivel VARCHAR(1) CHECK (iluo_nivel IN ('I', 'L', 'U', 'O') OR iluo_nivel IS NULL),
    ADD COLUMN matriz_talento_media NUMERIC(3, 1),
    ADD COLUMN notas_rh TEXT,

    -- Bloco 5: Acesso ao Sistema e UI Escalonado
    ADD COLUMN possui_acesso_sistema BOOLEAN DEFAULT false,
    ADD COLUMN email_acesso VARCHAR(255),
    ADD COLUMN nivel_permissao VARCHAR(50) CHECK (nivel_permissao IN ('Admin', 'Planeador', 'Supervisor', 'Operador') OR nivel_permissao IS NULL);


-- 2. Trigger Biológico: Bloqueio de Entrada IoT para Operadores Inativos
-- Se um funcionário for desligado/Inativo e tentar passar o crachá no ESP32, o INSERT deve falhar.
CREATE OR REPLACE FUNCTION check_operador_ativo_antes_registo()
RETURNS TRIGGER AS $$
DECLARE
    operador_status VARCHAR(20);
BEGIN
    -- Vamos buscar o status atual do RH correspondente a este RFID picado
    SELECT status INTO operador_status
    FROM public.operadores
    WHERE tag_rfid_operador = NEW.operador_rfid;

    -- Se não existir o cartão no DB, falhar com restrição de Auth (Prevenção Intrusão)
    IF operador_status IS NULL THEN
        RAISE EXCEPTION 'Acesso Negado: Cartão RFID Ausente da Base de Dados de RH.';
    END IF;

    -- A Tranca: Se o RH desativou o colaborador, não pode registar inícios em linha.
    IF operador_status != 'Ativo' THEN
         RAISE EXCEPTION 'Acesso Bloqueado: Operador (RFID: %) encontra-se inativo no sistema RH.', NEW.operador_rfid;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O evento Trigger que interseta as inserções "à porta" da Base de Dados.
DROP TRIGGER IF EXISTS block_inativados_iot_insert ON public.registos_rfid_realtime;
CREATE TRIGGER block_inativados_iot_insert
BEFORE INSERT ON public.registos_rfid_realtime
FOR EACH ROW
EXECUTE FUNCTION check_operador_ativo_antes_registo();
