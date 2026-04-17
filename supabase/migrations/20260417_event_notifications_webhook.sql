-- 20260417_event_notifications_webhook.sql
-- Creates an HTTP Webhook trigger invoking the email-service Edge Function upon event insertions/updates.
-- Note: Replace XXXXXXXXXXXXXXXXXXXX with your actual project reference if running manually. 
-- Alternatively, set this up cleanly via Dashboard -> Database -> Webhooks.

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;

-- Assuming webhook creation via trigger function for raw SQL.
CREATE OR REPLACE FUNCTION public.notify_email_service_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  -- IMPORTANT: Replace [SUPABASE_PROJECT_REF] with your actual Supabase URL prefix
  -- Example: https://abcxyz.supabase.co/functions/v1/email-service
  -- Fallback logic checks for the default LOCALHOST when running via CLI
  PERFORM net.http_post(
      url := COALESCE(current_setting('app.settings.supabase_url', true), 'http://127.0.0.1:54321') || '/functions/v1/email-service',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_email_trigger ON public.events;
CREATE TRIGGER events_email_trigger
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_service_on_event();
