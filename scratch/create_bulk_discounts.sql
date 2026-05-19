CREATE TABLE IF NOT EXISTS public.bulk_discount_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_tickets INTEGER NOT NULL DEFAULT 1,
    max_tickets INTEGER,
    discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.bulk_discount_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.bulk_discount_rules
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for admins" ON public.bulk_discount_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert defaults
INSERT INTO public.bulk_discount_rules (name, min_tickets, max_tickets, discount_type, discount_value)
VALUES 
('10% Off for 5+ Tickets', 5, 9, 'percentage', 10),
('15% Off for 10+ Tickets', 10, NULL, 'percentage', 15)
ON CONFLICT DO NOTHING;
