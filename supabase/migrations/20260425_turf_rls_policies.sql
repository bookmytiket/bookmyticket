-- 0. SCHEMA UPDATES
-- Add missing city column if it doesn't exist
ALTER TABLE public.turfs ADD COLUMN IF NOT EXISTS city TEXT;

-- RLS Policies for Turf Management System

-- 1. TURFS
-- Everyone can view active turfs
CREATE POLICY "Turfs are viewable by everyone" ON public.turfs
    FOR SELECT USING (status = 'active');

-- Organisers can manage their own turfs
CREATE POLICY "Organisers can insert own turfs" ON public.turfs
    FOR INSERT WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Organisers can update own turfs" ON public.turfs
    FOR UPDATE USING (auth.uid() = organiser_id);

CREATE POLICY "Organisers can delete own turfs" ON public.turfs
    FOR DELETE USING (auth.uid() = organiser_id);


-- 2. TURF_SLOTS
-- Everyone can view slots
CREATE POLICY "Turf slots are viewable by everyone" ON public.turf_slots
    FOR SELECT USING (true);

-- Organisers can manage slots for their turfs
CREATE POLICY "Organisers can manage own turf slots" ON public.turf_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.turfs
            WHERE public.turfs.id = public.turf_slots.turf_id
            AND public.turfs.organiser_id = auth.uid()
        )
    );


-- 3. TURF_BOOKINGS
-- Users can view their own bookings
CREATE POLICY "Users can view own turf bookings" ON public.turf_bookings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.turfs
            WHERE public.turfs.id = public.turf_bookings.turf_id
            AND public.turfs.organiser_id = auth.uid()
        )
    );

-- Authenticated users can create bookings
CREATE POLICY "Authenticated users can create turf bookings" ON public.turf_bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Organisers can update status
CREATE POLICY "Organisers can update own turf booking status" ON public.turf_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.turfs
            WHERE public.turfs.id = public.turf_bookings.turf_id
            AND public.turfs.organiser_id = auth.uid()
        )
    );
