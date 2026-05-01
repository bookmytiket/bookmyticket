-- Migration: Fix Bookings RLS, Schema and Notifications
-- 1. Ensure RLS is enabled for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2. Ensure Bookings Table has all required columns (Revenue, Taxes, Coupons)
DO $$ 
BEGIN
    -- Core Revenue Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='base_amount') THEN
        ALTER TABLE public.bookings ADD COLUMN base_amount FLOAT8 DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='platform_charge') THEN
        ALTER TABLE public.bookings ADD COLUMN platform_charge FLOAT8 DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='gst_amount') THEN
        ALTER TABLE public.bookings ADD COLUMN gst_amount FLOAT8 DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='gst_percent') THEN
        ALTER TABLE public.bookings ADD COLUMN gst_percent FLOAT8 DEFAULT 0;
    END IF;
    
    -- Partner/Revenue Sharing Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='partner_bonus') THEN
        ALTER TABLE public.bookings ADD COLUMN partner_bonus FLOAT8 DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='platform_revenue') THEN
        ALTER TABLE public.bookings ADD COLUMN platform_revenue FLOAT8 DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='partner_total') THEN
        ALTER TABLE public.bookings ADD COLUMN partner_total FLOAT8 DEFAULT 0;
    END IF;

    -- Coupon Integration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='coupon_id') THEN
        ALTER TABLE public.bookings ADD COLUMN coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='discount_amount') THEN
        ALTER TABLE public.bookings ADD COLUMN discount_amount FLOAT8 DEFAULT 0;
    END IF;

    -- Metadata & UI Helpers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='event_name') THEN
        ALTER TABLE public.bookings ADD COLUMN event_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='location') THEN
        ALTER TABLE public.bookings ADD COLUMN location TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='scanned') THEN
        ALTER TABLE public.bookings ADD COLUMN scanned BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='selected_seats') THEN
        ALTER TABLE public.bookings ADD COLUMN selected_seats JSONB DEFAULT '[]';
    END IF;
END $$;

-- 3. Allow authenticated users to insert their own bookings
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow users to view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" 
ON public.bookings FOR SELECT 
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- 5. Fix trigger function to be more robust and handle potential auth issues
-- Note: Edge functions usually require an Authorization header.
-- We'll add a check to only call if we're not in a transaction that should be fast, 
-- or we'll wrap it in a way that doesn't crash the insert if the notification fails.

CREATE OR REPLACE FUNCTION public.notify_email_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  supabase_url text;
  anon_key text;
BEGIN
  -- Get supabase URL and Anon Key from settings
  supabase_url := COALESCE(current_setting('app.settings.supabase_url', true), 'http://localhost:54321');
  anon_key := COALESCE(current_setting('app.settings.supabase_anon_key', true), '');

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  -- Use a try-catch equivalent or just perform. 
  -- In Postgres, we can't easily try-catch a network call without extensions,
  -- but we can ensure pg_net is used which is asynchronous.
  
  BEGIN
    PERFORM net.http_post(
        url := supabase_url || '/functions/v1/email-service',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || anon_key
        ),
        body := payload
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but DO NOT fail the transaction
    RAISE WARNING 'Notification failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
