-- Create event_requests table
CREATE TABLE IF NOT EXISTS public.event_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    organizer_id UUID,
    request_type TEXT, -- 'CANCELLATION', 'DELETION'
    reason TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create event_status_history table
CREATE TABLE IF NOT EXISTS public.event_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT,
    changed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add fields to events table (if not already added by previous migration)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- Drop event_cancellation_requests if it was created by the earlier script (to consolidate into event_requests)
DROP TABLE IF EXISTS public.event_cancellation_requests;

-- Enable RLS
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for event_requests
CREATE POLICY "Admins can manage event_requests" ON public.event_requests FOR ALL USING (true);
CREATE POLICY "Organizers can insert and view their own requests" ON public.event_requests 
    FOR ALL USING (organizer_id = auth.uid() OR event_id IN (SELECT id FROM public.events WHERE organiser_id = auth.uid()));

-- Policies for event_status_history
CREATE POLICY "Admins can manage event_status_history" ON public.event_status_history FOR ALL USING (true);
CREATE POLICY "Organizers can view their event history" ON public.event_status_history 
    FOR SELECT USING (event_id IN (SELECT id FROM public.events WHERE organiser_id = auth.uid()));

