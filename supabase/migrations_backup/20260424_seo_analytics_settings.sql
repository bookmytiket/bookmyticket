-- Migration to add SEO and Analytics settings to system_config
-- These will be managed via the Admin Panel

INSERT INTO system_config (key, value)
VALUES 
  ('seo_analytics', '{
    "ga_id": "G-XXXXXXXXXX",
    "ga_enabled": false,
    "city_seo_overrides": {},
    "backlink_tracking": [],
    "sitemap_last_ping": null
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
