-- 1. Modify events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_mode TEXT DEFAULT 'single_show'; -- 'single_show', 'multi_show', 'recurring'

-- 2. Create event_showtimes table
CREATE TABLE IF NOT EXISTS public.event_showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    show_name TEXT NOT NULL,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    hall_name TEXT,
    status TEXT DEFAULT 'active', -- active, cancelled, sold_out, disabled
    booking_open_at TIMESTAMPTZ,
    booking_close_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Modify seat_inventory to support showtimes
ALTER TABLE public.seat_inventory ADD COLUMN IF NOT EXISTS showtime_id UUID REFERENCES public.event_showtimes(id) ON DELETE CASCADE;

-- 4. Modify bookings and tickets to support showtimes
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS showtime_id UUID REFERENCES public.event_showtimes(id) ON DELETE CASCADE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS showtime_id UUID REFERENCES public.event_showtimes(id) ON DELETE CASCADE;

-- Enable RLS for event_showtimes
ALTER TABLE public.event_showtimes ENABLE ROW LEVEL SECURITY;

-- Policies for event_showtimes
CREATE POLICY "Public can view active event_showtimes"
    ON public.event_showtimes
    FOR SELECT
    USING (status = 'active');

CREATE POLICY "Organisers can manage their event_showtimes"
    ON public.event_showtimes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_showtimes.event_id
            AND events.organiser_id = auth.uid()
        )
    );

-- Trigger for updated_at on event_showtimes
CREATE OR REPLACE FUNCTION update_event_showtimes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_showtimes_updated_at
BEFORE UPDATE ON public.event_showtimes
FOR EACH ROW
EXECUTE FUNCTION update_event_showtimes_updated_at();

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_showtimes;
