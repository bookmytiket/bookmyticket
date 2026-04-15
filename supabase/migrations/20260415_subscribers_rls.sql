-- Migration: Add missing RLS policies for the subscribers table
-- Run this in the Supabase SQL Editor at: supabase.com → SQL Editor

-- Allow anyone (including unauthenticated/anon users) to subscribe
CREATE POLICY "Public can insert subscribers"
  ON public.subscribers
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to read all subscribers
CREATE POLICY "Admins can read subscribers"
  ON public.subscribers
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to delete subscribers
CREATE POLICY "Admins can delete subscribers"
  ON public.subscribers
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
