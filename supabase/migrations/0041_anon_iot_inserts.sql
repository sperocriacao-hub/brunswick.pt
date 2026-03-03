-- Allow anonymous inserts for IoT endpoints since ESP32 does not have auth cookies
-- and the local environment might be missing the Service Role Key

CREATE POLICY "Permitir ESP32 Inserir Ponto" ON public.log_ponto_diario FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir ESP32 Inserir Pausas" ON public.log_pausas_operador FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir ESP32 Inserir Conclusao" ON public.log_estacao_conclusao FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir ESP32 Atualizar Pausas" ON public.log_pausas_operador FOR UPDATE TO anon USING (true);
