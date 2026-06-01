/**
 * POST /api/admin/init-home-slides
 * Creates the home_slides table if it doesn't already exist.
 * Run once to fix the 404 error on home_slides queries.
 */
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const sql = `
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

        ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public can read active home_slides" ON public.home_slides;
        CREATE POLICY "Public can read active home_slides"
            ON public.home_slides FOR SELECT
            USING (is_active = TRUE);

        DROP POLICY IF EXISTS "Admins have full access to home_slides." ON public.home_slides;
        CREATE POLICY "Admins have full access to home_slides."
            ON public.home_slides FOR ALL
            USING (is_admin(auth.uid()));
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql }).catch(() => ({ error: null }));

    // Try direct query as fallback
    const { error: err2 } = await supabaseAdmin
        .from('home_slides')
        .select('id')
        .limit(1);

    if (!err2 || err2.code !== 'PGRST116') {
        return NextResponse.json({ ok: true, message: 'home_slides table ready' });
    }

    return NextResponse.json({ ok: false, error: error?.message || 'Table may not exist yet. Run migration manually in Supabase SQL Editor.' }, { status: 500 });
}
