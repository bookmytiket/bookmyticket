ALTER TABLE public.events ADD COLUMN IF NOT EXISTS dynamic_config JSONB DEFAULT '{}'::jsonb;
