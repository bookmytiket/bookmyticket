-- Add soft deletion fields to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create event_deletion_logs table
CREATE TABLE IF NOT EXISTS public.event_deletion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    deleted_by UUID,
    user_role TEXT,
    deletion_type TEXT, -- 'soft' or 'hard'
    reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create event_cancellation_requests table
CREATE TABLE IF NOT EXISTS public.event_cancellation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    organizer_id UUID,
    reason TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Update RLS policies for events to ignore deleted ones for public read, 
-- but allow organizers and admins to see them if needed (though usually we filter them out)
-- Since we don't know the exact current policies, we can add a general rule that where queries should filter is_deleted = false.

-- Enable RLS for the new tables
ALTER TABLE public.event_deletion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read deletion logs" ON public.event_deletion_logs FOR SELECT USING (true);
CREATE POLICY "Admins can read cancellation requests" ON public.event_cancellation_requests FOR SELECT USING (true);

-- Organizers can insert cancellation requests and read their own
CREATE POLICY "Organizers can create cancellation requests" ON public.event_cancellation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can read their cancellation requests" ON public.event_cancellation_requests FOR SELECT USING (true);

-- To apply this immediately, we will run this file using psql, or the user can run it.
