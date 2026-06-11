-- Add atomic counters
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bib_current_number INTEGER;
ALTER TABLE public.marathon_categories ADD COLUMN IF NOT EXISTS bib_current_number INTEGER;
ALTER TABLE public.marathon_categories ADD COLUMN IF NOT EXISTS bib_prefix TEXT;
ALTER TABLE public.marathon_categories ADD COLUMN IF NOT EXISTS bib_start_number INTEGER;

-- Create atomic RPC for BIB assignment
CREATE OR REPLACE FUNCTION public.assign_bib_number(p_booking_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_category_name TEXT;
    v_bib_enabled BOOLEAN;
    v_bib_per_category BOOLEAN;
    v_bib_prefix TEXT;
    v_bib_start_number INTEGER;
    v_bib_padding INTEGER;
    
    v_current_number INTEGER;
    v_new_bib TEXT;
    v_cat_id UUID;
BEGIN
    -- 1. Get booking details
    SELECT event_id, package_name INTO v_event_id, v_category_name
    FROM public.bookings
    WHERE id = p_booking_id;

    IF v_event_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Get event bib config
    SELECT bib_enabled, bib_per_category, bib_prefix, bib_start_number, bib_padding, bib_current_number
    INTO v_bib_enabled, v_bib_per_category, v_bib_prefix, v_bib_start_number, v_bib_padding, v_current_number
    FROM public.events
    WHERE id = v_event_id
    FOR UPDATE;

    IF NOT COALESCE(v_bib_enabled, false) THEN
        RETURN NULL;
    END IF;

    -- 3. Category-level counter logic
    IF v_bib_per_category THEN
        -- Find the category id from marathon_categories using the package_name
        SELECT id, bib_current_number, bib_prefix, bib_start_number
        INTO v_cat_id, v_current_number, v_bib_prefix, v_bib_start_number
        FROM public.marathon_categories
        WHERE marathon_id = v_event_id AND (category_name = v_category_name OR title = v_category_name)
        LIMIT 1
        FOR UPDATE;

        IF v_cat_id IS NOT NULL THEN
            IF v_current_number IS NULL THEN
                v_current_number := COALESCE(v_bib_start_number, 1);
            END IF;

            -- Format BIB
            v_new_bib := COALESCE(v_bib_prefix, '') || LPAD(v_current_number::TEXT, COALESCE(v_bib_padding, 4), '0');

            -- Update category counter
            UPDATE public.marathon_categories
            SET bib_current_number = v_current_number + 1
            WHERE id = v_cat_id;
        ELSE
            -- Fallback to event level if category not found
            IF v_current_number IS NULL THEN
                v_current_number := COALESCE(v_bib_start_number, 1);
            END IF;
            v_new_bib := COALESCE(v_bib_prefix, '') || LPAD(v_current_number::TEXT, COALESCE(v_bib_padding, 4), '0');
            
            UPDATE public.events
            SET bib_current_number = v_current_number + 1
            WHERE id = v_event_id;
        END IF;
    ELSE
        -- Event-level counter logic
        IF v_current_number IS NULL THEN
            v_current_number := COALESCE(v_bib_start_number, 1);
        END IF;

        v_new_bib := COALESCE(v_bib_prefix, '') || LPAD(v_current_number::TEXT, COALESCE(v_bib_padding, 4), '0');

        UPDATE public.events
        SET bib_current_number = v_current_number + 1
        WHERE id = v_event_id;
    END IF;

    -- 4. Update the booking record
    UPDATE public.bookings
    SET bib_number = v_new_bib
    WHERE id = p_booking_id;

    RETURN v_new_bib;
END;
$$;
