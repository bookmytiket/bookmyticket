-- Add starting_price column to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS starting_price NUMERIC DEFAULT 1999;

-- Create function to update starting_price
CREATE OR REPLACE FUNCTION public.sync_starting_price()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.service_providers
    SET starting_price = (
        SELECT COALESCE(MIN(price), 1999)
        FROM public."artistPackages"
        WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    )
    WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on artistPackages
DROP TRIGGER IF EXISTS trigger_sync_starting_price ON public."artistPackages";
CREATE TRIGGER trigger_sync_starting_price
AFTER INSERT OR UPDATE OR DELETE ON public."artistPackages"
FOR EACH ROW EXECUTE FUNCTION public.sync_starting_price();

-- Initial backfill
UPDATE public.service_providers sp
SET starting_price = (
    SELECT COALESCE(MIN(price), 1999)
    FROM public."artistPackages" ap
    WHERE ap.vendor_id = sp.id
);
