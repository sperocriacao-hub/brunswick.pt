-- 1. Create the 'funcoes' table
CREATE TABLE IF NOT EXISTS funcoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_funcao TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Clean up trailing spaces in current table to ensure grouping efficiency
UPDATE operadores
SET funcao = TRIM(funcao)
WHERE funcao IS NOT NULL AND funcao LIKE '% ';

-- 3. Pre-populate dictionary table with unique existing distinct roles
INSERT INTO funcoes (nome_funcao)
SELECT DISTINCT funcao
FROM operadores
WHERE funcao IS NOT NULL AND funcao != ''
ON CONFLICT (nome_funcao) DO NOTHING;

-- Security / RLS policies for 'funcoes' (allow public read access for dropdown population)
ALTER TABLE funcoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON funcoes FOR SELECT USING (true);
