-- Add unique constraint to organiser_subscriptions for upsert support
ALTER TABLE public.organiser_subscriptions 
ADD CONSTRAINT organiser_subscriptions_organiser_id_key UNIQUE (organiser_id);
