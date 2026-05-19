-- ============================================================
-- HOTFIX: Fix is_staff_of() — wrong column (user_id → auth_user_id)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_staff_of(target_organiser_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.auth_user_id = auth.uid()
      AND staff.organiser_id = target_organiser_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
