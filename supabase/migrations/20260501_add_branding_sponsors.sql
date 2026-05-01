-- Add sponsor and partner logo columns to site_branding table
ALTER TABLE IF EXISTS site_branding 
ADD COLUMN IF NOT EXISTS sponsor_logo_1 TEXT,
ADD COLUMN IF NOT EXISTS sponsor_logo_2 TEXT,
ADD COLUMN IF NOT EXISTS partner_logo_1 TEXT,
ADD COLUMN IF NOT EXISTS partner_logo_2 TEXT;
