-- Ensure columns exist in marathon_config
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_config' AND column_name='distance_pricing') THEN
        ALTER TABLE public.marathon_config ADD COLUMN distance_pricing JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_config' AND column_name='age_pricing') THEN
        ALTER TABLE public.marathon_config ADD COLUMN age_pricing JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_config' AND column_name='category_configs') THEN
        ALTER TABLE public.marathon_config ADD COLUMN category_configs JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_config' AND column_name='amenities') THEN
        ALTER TABLE public.marathon_config ADD COLUMN amenities JSONB DEFAULT '[]';
    END IF;
END $$;

-- Tournament Config updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_config' AND column_name='schedule_json') THEN
        ALTER TABLE public.tournament_config ADD COLUMN schedule_json JSONB DEFAULT '[]';
    END IF;
END $$;
