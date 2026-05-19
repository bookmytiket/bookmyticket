-- This script fixes the "already exists" errors by dropping existing policies before recreating them.
-- Run this in your Supabase SQL Editor.

-- 1. Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Marathon
    DROP POLICY IF EXISTS "Organisers can manage own marathon_config" ON public.marathon_config;
    DROP POLICY IF EXISTS "Everyone can view marathon_config" ON public.marathon_config;
    
    -- Tournament
    DROP POLICY IF EXISTS "Organisers can manage own tournament_config" ON public.tournament_config;
    DROP POLICY IF EXISTS "Everyone can view tournament_config" ON public.tournament_config;
    
    -- Coaching
    DROP POLICY IF EXISTS "Organisers can manage own coaching_config" ON public.coaching_config;
    DROP POLICY IF EXISTS "Everyone can view coaching_config" ON public.coaching_config;
END $$;

-- 2. Create Policies with correct permissions
-- Marathon
CREATE POLICY "Organisers can manage own marathon_config" ON public.marathon_config 
FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = marathon_config.event_id AND (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Everyone can view marathon_config" ON public.marathon_config FOR SELECT USING (true);

-- Tournament
CREATE POLICY "Organisers can manage own tournament_config" ON public.tournament_config 
FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = tournament_config.event_id AND (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Everyone can view tournament_config" ON public.tournament_config FOR SELECT USING (true);

-- Coaching
CREATE POLICY "Organisers can manage own coaching_config" ON public.coaching_config 
FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = coaching_config.event_id AND (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Everyone can view coaching_config" ON public.coaching_config FOR SELECT USING (true);
