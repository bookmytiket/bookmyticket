-- ============================================================
-- Security Alert: RLS policies for failed_login_attempts
-- ============================================================
-- Allows anonymous (unauthenticated) requests from the API
-- route (using service-role key) to insert rows, and restricts
-- reads to admins only.
-- ============================================================

-- 1. Allow service-role / server-side inserts (no auth.uid needed)
CREATE POLICY "Service role can insert failed login attempts."
  ON public.failed_login_attempts
  FOR INSERT
  WITH CHECK (true);

-- 2. Only admins can read the audit log
CREATE POLICY "Admins can view failed login attempts."
  ON public.failed_login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid()
    )
  );

-- 3. Index for fast look-ups by identifier (email) — idempotent
CREATE INDEX IF NOT EXISTS idx_failed_logins_identifier
  ON public.failed_login_attempts (identifier);

CREATE INDEX IF NOT EXISTS idx_failed_logins_created_at
  ON public.failed_login_attempts (created_at DESC);
