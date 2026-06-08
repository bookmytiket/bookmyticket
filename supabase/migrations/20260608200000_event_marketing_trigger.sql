-- Create function to trigger marketing job
CREATE OR REPLACE FUNCTION trigger_event_marketing_job()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.background_jobs (job_type, payload, status)
        VALUES (
            'event_marketing',
            json_build_object(
                'eventId', NEW.id,
                'eventName', NEW.title,
                'category', NEW.category,
                'date', NEW.date,
                'venue', NEW.location,
                'posterUrl', NEW.img
            ),
            'pending'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_event_approved_trigger ON public.events;
CREATE TRIGGER on_event_approved_trigger
AFTER UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION trigger_event_marketing_job();
