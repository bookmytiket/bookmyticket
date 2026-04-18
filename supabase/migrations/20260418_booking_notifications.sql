-- 20260418_booking_notifications.sql
-- 1. Ensure all booking tables exist with consistent schemas
-- 2. Sets up triggers to notify the email-service edge function on booking confirmations.

-- A. Create missing table: vendor_bookings (Professional Services)
CREATE TABLE IF NOT EXISTS public.vendor_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES public.profiles(id),
    user_id UUID REFERENCES public.profiles(id), -- Changed from user_id to align with auth
    service_type TEXT,
    booking_date DATE,
    booking_time TEXT,
    total_amount FLOAT8,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_details JSONB, -- Added for forward compatibility
    remarks TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Ensure bookings (Events) exists
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    user_id UUID REFERENCES public.profiles(id),
    ticket_count INT4 NOT NULL,
    total_price FLOAT8 NOT NULL,
    customer_details JSONB,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Ensure turf_bookings exists
CREATE TABLE IF NOT EXISTS public.turf_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID REFERENCES public.turfs(id),
    user_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    total_amount FLOAT8 NOT NULL,
    customer_details JSONB,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    booking_status TEXT DEFAULT 'pending',
    status TEXT, -- Fallback column
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create a generic notification function
CREATE OR REPLACE FUNCTION public.notify_email_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  supabase_url text;
BEGIN
  -- Get supabase URL from settings or fallback to localhost
  supabase_url := COALESCE(current_setting('app.settings.supabase_url', true), 'http://127.0.0.1:54321');

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
      url := supabase_url || '/functions/v1/email-service',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
  );

  RETURN NEW;
END;
$$;

-- 4. Apply Triggers
-- Events
DROP TRIGGER IF EXISTS bookings_email_trigger ON public.bookings;
CREATE TRIGGER bookings_email_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_service();

-- Turf
DROP TRIGGER IF EXISTS turf_bookings_email_trigger ON public.turf_bookings;
CREATE TRIGGER turf_bookings_email_trigger
  AFTER INSERT OR UPDATE ON public.turf_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_service();

-- Vendor/Professional Services
DROP TRIGGER IF EXISTS vendor_bookings_email_trigger ON public.vendor_bookings;
CREATE TRIGGER vendor_bookings_email_trigger
  AFTER INSERT OR UPDATE ON public.vendor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_service();
