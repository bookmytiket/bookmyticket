-- Migration: Seed Database with Sample Events
-- Run this in the Supabase SQL Editor if your Home Page is empty.
-- This will insert 3 sample events that appear immediately on the home page.

INSERT INTO public.events (
  title, 
  description, 
  date, 
  time, 
  location, 
  city, 
  img, 
  status, 
  featured, 
  trending, 
  spotlight, 
  type,
  price,
  virtual
) VALUES 
(
  'Sunburn Arena ft. Alan Walker', 
  'Experience the magic of Alan Walker live in Mumbai! A night of electrifying music and stunning visuals.', 
  '2026-09-28', 
  '18:00', 
  'DY Patil Stadium', 
  'Mumbai', 
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&h=600&fit=crop', 
  'published', 
  true, 
  true, 
  false, 
  'Paid',
  1500,
  false
),
(
  'Zomaland Food Festival', 
  'The grandest food and entertainment carnival is back! Multi-city tour starting with Delhi.', 
  '2026-10-15', 
  '12:00', 
  'JLN Stadium', 
  'Delhi', 
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1000&h=600&fit=crop', 
  'published', 
  true, 
  false, 
  true, 
  'Paid',
  799,
  false
),
(
  'Tech Innovation Summit', 
  'Join industry leaders for the biggest tech conference of the year, streamed live globally.', 
  '2026-11-20', 
  '10:00', 
  'Online', 
  'Global', 
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&h=600&fit=crop', 
  'published', 
  true, 
  true, 
  false, 
  'Free',
  0,
  true
),
(
  'Test Event', 
  'A sample test event for platform validation and testing the booking flow.', 
  '2026-04-18', 
  '13:00', 
  'KKG Arena', 
  'Coimbatore', 
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&h=600&fit=crop', 
  'published', 
  true, 
  false, 
  false, 
  'Free',
  0,
  false
);
