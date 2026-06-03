-- Add RPC for incrementing category slots

CREATE OR REPLACE FUNCTION public.increment_badminton_category_slots(cat_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.badminton_categories
  SET slots_booked = slots_booked + 1
  WHERE id = cat_id;
END;
$$;
