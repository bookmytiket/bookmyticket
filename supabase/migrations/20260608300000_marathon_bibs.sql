-- Marathon Bib Configuration Table
CREATE TABLE IF NOT EXISTS public.marathon_bib_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    prefix TEXT,
    start_number INTEGER NOT NULL,
    end_number INTEGER NOT NULL,
    current_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Participant Bibs (Assigned Bibs)
CREATE TABLE IF NOT EXISTS public.participant_bibs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL,
    bib_number TEXT NOT NULL UNIQUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ticket PDFs Table
CREATE TABLE IF NOT EXISTS public.ticket_pdfs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Event Notifications
CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscriber Lists
CREATE TABLE IF NOT EXISTS public.subscriber_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subscribed BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.marathon_bib_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_bibs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_lists ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone
CREATE POLICY "Enable read access for all" ON public.marathon_bib_config FOR SELECT USING (true);
CREATE POLICY "Enable read access for all" ON public.participant_bibs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all" ON public.ticket_pdfs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all" ON public.subscriber_lists FOR SELECT USING (true);

-- Allow full access to admins
CREATE POLICY "Enable full access for admins" ON public.marathon_bib_config USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for admins" ON public.participant_bibs USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for admins" ON public.ticket_pdfs USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for admins" ON public.event_notifications USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for admins" ON public.subscriber_lists USING (auth.role() = 'authenticated');
