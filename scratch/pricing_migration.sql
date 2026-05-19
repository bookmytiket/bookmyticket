-- Create Tax Settings Table
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_name VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) DEFAULT 'percentage',
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
    apply_on VARCHAR(50) NOT NULL DEFAULT 'platform_fee', -- platform_fee, ticket_price, full_order
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Tax Setting
INSERT INTO tax_settings (tax_name, tax_percentage, apply_on)
VALUES ('GST (18%)', 18.00, 'platform_fee')
ON CONFLICT DO NOTHING;

-- Safely migrate existing fee_settings table
DO $$ 
BEGIN
    -- Rename old columns if they exist from the legacy schema
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'convenience_fee_type') THEN
        ALTER TABLE fee_settings RENAME COLUMN convenience_fee_type TO fee_type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'convenience_fee_value') THEN
        ALTER TABLE fee_settings RENAME COLUMN convenience_fee_value TO fee_value;
    END IF;

    -- Add missing columns for the new schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'calculation_mode') THEN
        ALTER TABLE fee_settings ADD COLUMN calculation_mode VARCHAR(50) DEFAULT 'per_booking';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'event_id') THEN
        ALTER TABLE fee_settings ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'organizer_id') THEN
        ALTER TABLE fee_settings ADD COLUMN organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'is_active') THEN
        ALTER TABLE fee_settings ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_settings' AND column_name = 'created_at') THEN
        ALTER TABLE fee_settings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

END $$;

-- Drop old gst_percent from fee_settings as it is now managed by tax_settings
ALTER TABLE fee_settings DROP COLUMN IF EXISTS gst_percent;

-- Create Fee Settings Table if it didn't exist at all
CREATE TABLE IF NOT EXISTS fee_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fee_type VARCHAR(50) NOT NULL DEFAULT 'fixed',
    fee_value DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
    calculation_mode VARCHAR(50) DEFAULT 'per_booking',
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delete existing default to avoid conflicts, then re-insert
DELETE FROM fee_settings WHERE fee_type = 'percent' OR event_id IS NULL;

-- Insert Default Platform Fee
INSERT INTO fee_settings (fee_type, fee_value, calculation_mode)
VALUES ('fixed', 40.00, 'per_booking')
ON CONFLICT DO NOTHING;

-- Create Booking Price Breakdown Table
CREATE TABLE IF NOT EXISTS booking_price_breakdown (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    ticket_subtotal DECIMAL(10, 2) NOT NULL,
    platform_fee_base DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    addon_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
