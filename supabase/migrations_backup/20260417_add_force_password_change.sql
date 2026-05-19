-- Fix: Add missing column to prevent trigger crash on profile upserts
-- Run this in the Supabase SQL Editor at: supabase.com → SQL Editor
-- This ensures the sync_is_temporary_password trigger does not crash when users are updated or created.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
