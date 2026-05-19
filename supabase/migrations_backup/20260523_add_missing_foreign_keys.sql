-- Add missing foreign keys to support relational joins in the PostgREST schema cache

-- 1. Link event_coupon_mapping.event_id to public.events(id)
ALTER TABLE public.event_coupon_mapping 
ADD CONSTRAINT event_coupon_mapping_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 2. Link user_coupon_rewards.user_id to public.profiles(id)
ALTER TABLE public.user_coupon_rewards 
ADD CONSTRAINT user_coupon_rewards_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Link user_coupon_rewards.booking_id to public.bookings(id)
ALTER TABLE public.user_coupon_rewards 
ADD CONSTRAINT user_coupon_rewards_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

-- 4. Link coupon_redemption_logs.user_id to public.profiles(id)
ALTER TABLE public.coupon_redemption_logs 
ADD CONSTRAINT coupon_redemption_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Link coupon_notifications.user_id to public.profiles(id)
ALTER TABLE public.coupon_notifications 
ADD CONSTRAINT coupon_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
