-- Explicitly link subscription_payments to profiles for better joining support
ALTER TABLE public.subscription_payments
DROP CONSTRAINT IF EXISTS subscription_payments_organiser_id_fkey,
ADD CONSTRAINT subscription_payments_organiser_id_fkey 
FOREIGN KEY (organiser_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Also update subscription_logs for consistency
ALTER TABLE public.subscription_logs
DROP CONSTRAINT IF EXISTS subscription_logs_organiser_id_fkey,
ADD CONSTRAINT subscription_logs_organiser_id_fkey 
FOREIGN KEY (organiser_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
