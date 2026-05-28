-- Migration: Add General Events, Audit, and Realtime Inventory

-- 1. Alter Events table to support event_type
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'reserved';

-- 2. Event Updates Audit Table
CREATE TABLE IF NOT EXISTS public.event_updates_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES auth.users(id),
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Event Ticket Categories (for General Events)
CREATE TABLE IF NOT EXISTS public.event_ticket_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_name VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(100) DEFAULT 'general',
    price DECIMAL(10,2) DEFAULT 0,
    capacity INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    remaining_count INT DEFAULT 0,
    min_qty INT DEFAULT 1,
    max_qty INT DEFAULT 10,
    booking_open TIMESTAMP WITH TIME ZONE,
    booking_close TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. General Inventory (for tracking realtime capacity for General Events)
CREATE TABLE IF NOT EXISTS public.general_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_category_id UUID REFERENCES public.event_ticket_categories(id) ON DELETE CASCADE,
    total_capacity INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    reserved_count INT DEFAULT 0,
    remaining_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Realtime settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_ticket_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_inventory;

-- RLS Policies
ALTER TABLE public.event_updates_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can read their audits" ON public.event_updates_audit FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_updates_audit.event_id AND events.organiser_id = auth.uid()));

ALTER TABLE public.event_ticket_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read ticket categories" ON public.event_ticket_categories FOR SELECT USING (true);
CREATE POLICY "Organizers manage ticket categories" ON public.event_ticket_categories FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_ticket_categories.event_id AND events.organiser_id = auth.uid()));

ALTER TABLE public.general_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read general inventory" ON public.general_inventory FOR SELECT USING (true);
CREATE POLICY "Organizers manage general inventory" ON public.general_inventory FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = general_inventory.event_id AND events.organiser_id = auth.uid()));

-- Transactional RPC to Update Event Safely
CREATE OR REPLACE FUNCTION public.update_event_transaction(
    p_event_id UUID,
    p_update_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_event JSONB;
    v_new_event JSONB;
    v_organiser_id UUID;
    v_query TEXT;
    v_key TEXT;
    v_value TEXT;
BEGIN
    -- Verify ownership
    SELECT row_to_json(e), organiser_id INTO v_old_event, v_organiser_id 
    FROM public.events e WHERE id = p_event_id;
    
    IF v_old_event IS NULL THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    IF v_organiser_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Construct dynamic update query (excluding id and organiser_id if present)
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_update_payload)
    LOOP
        IF v_key NOT IN ('id', 'organiser_id', 'created_at') THEN
            EXECUTE format('UPDATE public.events SET %I = %L WHERE id = %L', v_key, v_value, p_event_id);
        END IF;
    END LOOP;

    -- Fetch updated event
    SELECT row_to_json(e) INTO v_new_event FROM public.events e WHERE id = p_event_id;

    -- Log to audit
    INSERT INTO public.event_updates_audit (event_id, updated_by, changed_fields, old_values, new_values)
    VALUES (p_event_id, auth.uid(), (SELECT coalesce(jsonb_agg(k), '[]'::jsonb) FROM jsonb_object_keys(p_update_payload) k), v_old_event, v_new_event);

    RETURN v_new_event;
END;
$$;
