
CREATE OR REPLACE FUNCTION public.atomic_confirm_and_assign_bib(
    p_booking_id UUID,
    p_category_name TEXT DEFAULT NULL,
    p_is_auto BOOLEAN DEFAULT FALSE,
    p_payment_status TEXT DEFAULT 'paid',
    p_booking_ref TEXT DEFAULT NULL,
    p_customer_details JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_booking_category TEXT;
    v_existing_bib TEXT;
    v_bib_enabled BOOLEAN;
    v_bib_per_category BOOLEAN;
    v_bib_prefix TEXT;
    v_bib_start_number INTEGER;
    v_bib_padding INTEGER;
    v_dynamic_config JSONB;
    v_current_number INTEGER;
    v_new_bib TEXT;
    v_cat_id UUID;
    v_final_bib TEXT;
BEGIN
    -- 1. Get booking details
    SELECT event_id, COALESCE(p_category_name, category, race_category_id, package_name), bib_number
    INTO v_event_id, v_booking_category, v_existing_bib
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF v_event_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
    END IF;

    v_final_bib := v_existing_bib;

    IF v_final_bib IS NULL THEN
        -- 2. Get event bib config
        SELECT bib_enabled, bib_per_category, bib_prefix, bib_start_number, bib_padding, bib_current_number, dynamic_config
        INTO v_bib_enabled, v_bib_per_category, v_bib_prefix, v_bib_start_number, v_bib_padding, v_current_number, v_dynamic_config
        FROM public.events
        WHERE id = v_event_id
        FOR UPDATE;

        IF COALESCE(v_bib_enabled, false) AND NOT (p_is_auto AND (v_dynamic_config->>'auto_bib_generation' = 'false' OR v_dynamic_config->>'auto_bib_generation' = 'false')) THEN
            -- 3. Category-level counter logic
            IF v_bib_per_category THEN
                SELECT id, bib_current_number, bib_prefix, bib_start_number
                INTO v_cat_id, v_current_number, v_bib_prefix, v_bib_start_number
                FROM public.marathon_categories
                WHERE marathon_id = v_event_id AND (category_name = v_booking_category OR title = v_booking_category OR id::text = v_booking_category)
                LIMIT 1
                FOR UPDATE;

                IF v_cat_id IS NOT NULL THEN
                    IF v_current_number IS NULL THEN
                        v_current_number := COALESCE(v_bib_start_number, 1);
                    END IF;

                    v_new_bib := COALESCE(v_bib_prefix, '') || CASE WHEN (v_bib_prefix IS NOT NULL AND v_bib_prefix != '' AND RIGHT(v_bib_prefix, 1) != '-') THEN '-' ELSE '' END || LPAD(v_current_number::TEXT, COALESCE(v_bib_padding, 4), '0');

                    UPDATE public.marathon_categories
                    SET bib_current_number = v_current_number + 1
                    WHERE id = v_cat_id;
                ELSE
                    IF v_current_number IS NULL THEN
                        v_current_number := COALESCE(v_bib_start_number, 1);
                    END IF;
                    v_new_bib := COALESCE(v_bib_prefix, '') || CASE WHEN (v_bib_prefix IS NOT NULL AND v_bib_prefix != '' AND RIGHT(v_bib_prefix, 1) != '-') THEN '-' ELSE '' END || LPAD(v_current_number::TEXT, COALESCE(v_bib_padding, 4), '0');
                    
                    UPDATE public.events
                    SET bib_current_number = v_current_number + 1
                    WHERE id = v_event_id;
                END IF;
            ELSE
                -- Event-level counter logic
                IF v_current_number IS NULL THEN
                    v_current_number := COALESCE(v_bib_start_number, 1);
                END IF;

                v_new_bib := COALESCE(v_bib_prefix, '') || CASE WHEN (v_bib_prefix IS NOT NULL AND v_bib_prefix != '' AND RIGHT(v_bib_prefix, 1) != '-') THEN '-' ELSE '' END || LPAD(v_current_number::TEXT, COALESCE(v_bib_padding, 4), '0');

                UPDATE public.events
                SET bib_current_number = v_current_number + 1
                WHERE id = v_event_id;
            END IF;

            v_final_bib := v_new_bib;
        END IF;
    END IF;

    -- Add bib_number to customer_details if needed
    IF v_final_bib IS NOT NULL AND p_customer_details IS NOT NULL THEN
        p_customer_details := jsonb_set(p_customer_details, '{bib_number}', to_jsonb(v_final_bib));
    END IF;

    -- 4. Update the booking record atomically
    UPDATE public.bookings
    SET 
        status = 'Confirmed',
        payment_status = COALESCE(p_payment_status, 'paid'),
        confirmed_at = COALESCE(confirmed_at, now()),
        booking_ref = COALESCE(p_booking_ref, booking_ref),
        customer_details = COALESCE(p_customer_details, customer_details),
        bib_number = v_final_bib
    WHERE id = p_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'bib_number', v_final_bib
    );
END;
$$;
