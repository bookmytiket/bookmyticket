-- Migration: Automatic Ticket Generation
-- Automatically creates individual ticket records when a booking is confirmed.

CREATE OR REPLACE FUNCTION public.handle_booking_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i INTEGER := 0;
BEGIN
    -- Check if the booking has just been confirmed
    -- (Status changes to 'Confirmed' from something else, or is inserted as 'Confirmed')
    IF (NEW.status = 'Confirmed' AND (OLD.status IS NULL OR OLD.status <> 'Confirmed')) THEN
        -- Generate N tickets based on ticket_count
        FOR i IN 1..NEW.ticket_count LOOP
            INSERT INTO public.tickets (booking_id, ticket_number, status)
            VALUES (NEW.id, generate_ticket_number(), 'active');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_confirmed ON public.bookings;
CREATE TRIGGER on_booking_confirmed
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_confirmation();
