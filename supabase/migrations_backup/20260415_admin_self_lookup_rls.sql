
-- Allow users to view their own administrative record
-- This is essential for the front-end to identify the user's role during login
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admins;
CREATE POLICY "Users can view own admin status" ON public.admins
    FOR SELECT USING (id = auth.uid());

-- Ensure admins can see the entire admins table (re-affirming existing logic)
DROP POLICY IF EXISTS "Admins can view admins table" ON public.admins;
CREATE POLICY "Admins can view admins table" ON public.admins
    FOR SELECT USING (is_admin(auth.uid()));
