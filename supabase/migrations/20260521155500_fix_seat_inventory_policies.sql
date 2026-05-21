-- Fix seat_inventory policies
ALTER TABLE public.seat_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view seat inventory" ON public.seat_inventory;
CREATE POLICY "Public can view seat inventory" ON public.seat_inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can lock seats" ON public.seat_inventory;
CREATE POLICY "Authenticated users can lock seats" ON public.seat_inventory
    FOR UPDATE USING (auth.uid() IS NOT NULL AND status IN ('available', 'temp_locked'))
    WITH CHECK (locked_by = auth.uid());

DROP POLICY IF EXISTS "Service role full access seat inventory" ON public.seat_inventory;
CREATE POLICY "Service role full access seat inventory" ON public.seat_inventory FOR ALL USING (auth.role() = 'service_role');
