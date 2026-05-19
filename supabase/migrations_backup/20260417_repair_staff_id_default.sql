-- Migration: Repair Staff ID Column
-- Ensures the id column has a proper default value to prevent null constraint violations.

DO $$ 
BEGIN
    -- Ensure gen_random_uuid() is available (PG 13+) or uuid_generate_v4() (requires extension)
    -- We'll try gen_random_uuid() first as it's more standard now.
    ALTER TABLE public.staff ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN
    -- Fallback to uuid_generate_v4() if gen_random_uuid() fails
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ALTER TABLE public.staff ALTER COLUMN id SET DEFAULT uuid_generate_v4();
END $$;
