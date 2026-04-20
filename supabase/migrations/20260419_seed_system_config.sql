-- Seed system_config with default data for mobile/web
-- This resolves the PGRST116 (no rows returned) error when using .single()

-- 1. Hero Banner Slides
INSERT INTO public.system_config (key, value)
VALUES ('banner_slides', '[
  { "id": 1, "imageUrl": "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200", "title": "Live Events & Experiences", "subtitle": "Book tickets for concerts, sports & more" },
  { "id": 2, "imageUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200", "title": "Live Concerts", "subtitle": "Book your favourite artists" }
]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Home Coupons
INSERT INTO public.system_config (key, value)
VALUES ('home_coupons', '[
  {
      "id": "nykaa",
      "brandName": "Nykaa",
      "title": "Get ₹250 Off on Nykaa Beauty Products!",
      "description": "Bold lipsticks to skin-loving serums.",
      "bannerUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800",
      "discountValue": 250, 
      "redemptionMethod": "Online"
  },
  {
      "id": "amazon",
      "brandName": "Amazon",
      "title": "Up to 50% Off on Electronics",
      "description": "Upgrade your tech with the latest deals.",
      "bannerUrl": "https://images.unsplash.com/photo-1526733170375-bc8147d7ed7c?w=800",
      "discountValue": 50,
      "redemptionMethod": "Online"
  }
]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Default Categories (if missing)
-- Ensure name is unique to support search, though slug is the primary unique field
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);

INSERT INTO public.categories (name, slug, icon)
VALUES 
('Music', 'music', 'musical-notes'),
('Comedy', 'comedy', 'happy'),
('Sports', 'sports', 'football'),
('Workshop', 'workshop', 'construct'),
('Online', 'online', 'videocam')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon;
