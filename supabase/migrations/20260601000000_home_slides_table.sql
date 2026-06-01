-- Migration: Ensure home_slides table exists for Hero Banner Management
-- Table stores hero banner carousel slides for the home page.

CREATE TABLE IF NOT EXISTS public.home_slides (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url   TEXT         NOT NULL DEFAULT '',
    title       TEXT,
    subtitle    TEXT,
    link        TEXT,
    sort_order  INT4         DEFAULT 0,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides (for the home page carousel)
DROP POLICY IF EXISTS "Public can read active home_slides" ON public.home_slides;
CREATE POLICY "Public can read active home_slides"
    ON public.home_slides FOR SELECT
    USING (is_active = TRUE);

-- Admins have full access
DROP POLICY IF EXISTS "Admins have full access to home_slides." ON public.home_slides;
CREATE POLICY "Admins have full access to home_slides."
    ON public.home_slides FOR ALL
    USING (is_admin(auth.uid()));
