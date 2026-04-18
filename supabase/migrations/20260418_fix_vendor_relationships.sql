-- Explicitly link vendorReviews to public.profiles for easy joining
ALTER TABLE public."vendorReviews" 
DROP CONSTRAINT IF EXISTS "vendorReviews_user_id_fkey",
ADD CONSTRAINT "vendorReviews_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also link vendorBookings to public.profiles
ALTER TABLE public."vendorBookings"
DROP CONSTRAINT IF EXISTS "vendorBookings_user_id_fkey",
ADD CONSTRAINT "vendorBookings_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
