-- Add unique constraint to event_coupon_mapping table to support upsert operations
ALTER TABLE public.event_coupon_mapping 
ADD CONSTRAINT event_campaign_unique UNIQUE (event_id, campaign_id);
