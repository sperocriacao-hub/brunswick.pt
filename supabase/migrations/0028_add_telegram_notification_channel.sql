ALTER TABLE public.sys_notificacoes_reportes DROP CONSTRAINT IF EXISTS "sys_notificacoes_reportes_tipo_canal_check";

ALTER TABLE public.sys_notificacoes_reportes ADD CONSTRAINT "sys_notificacoes_reportes_tipo_canal_check" 
CHECK (tipo_canal IN ('EMAIL', 'SMS', 'WEBHOOK', 'TELEGRAM'));
