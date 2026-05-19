-- Migration: Smart Location & Venue Management System
-- This adds structured location fields and creates a master table for location data.

-- 1. Update events table with structured location fields
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Create location_master table
CREATE TABLE IF NOT EXISTS public.location_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for location_master
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_master;

-- Add RLS for location_master
ALTER TABLE public.location_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.location_master FOR SELECT USING (true);
CREATE POLICY "Enable insert for admins" ON public.location_master FOR INSERT WITH CHECK (true); -- Simplified for now

-- 3. Seed some initial data for India (Sample Districts and Cities)
INSERT INTO public.location_master (country, state, district, city, pincode) VALUES
('India', 'Tamil Nadu', 'Coimbatore', 'Coimbatore North', '641001'),
('India', 'Tamil Nadu', 'Coimbatore', 'Coimbatore South', '641002'),
('India', 'Tamil Nadu', 'Coimbatore', 'RS Puram', '641003'),
('India', 'Tamil Nadu', 'Coimbatore', 'Gandhipuram', '641012'),
('India', 'Tamil Nadu', 'Chennai', 'Adyar', '600020'),
('India', 'Tamil Nadu', 'Chennai', 'Anna Nagar', '600040'),
('India', 'Karnataka', 'Bangalore', 'Indiranagar', '560038'),
('India', 'Karnataka', 'Bangalore', 'Koramangala', '560034'),
('India', 'Kerala', 'Kochi', 'Ernakulam', '682011'),
('India', 'Kerala', 'Kochi', 'Fort Kochi', '682001');
