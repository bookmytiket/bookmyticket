-- =============================================================
-- RUNNER REGISTRATIONS + DYNAMIC REGISTRATION FIELDS SYSTEM
-- BookMyTicket | 2026-05-11
-- =============================================================

-- 1. RUNNER REGISTRATIONS TABLE
--    Stores structured participant details per booking
-- =============================================================
CREATE TABLE IF NOT EXISTS runner_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Core Identity Fields (Step 2 - Runner Identity)
    full_name       TEXT,
    email           TEXT,
    phone           TEXT,
    dob             DATE,
    gender          TEXT,

    -- Event-Specific Fields
    category        TEXT,             -- selected KM/run category
    tshirt_size     TEXT,             -- S/M/L/XL/XXL

    -- Dynamic custom fields captured from organiser-defined form_fields
    -- Stored as { "Field Label": "value", ... }
    custom_fields   JSONB DEFAULT '{}',

    -- Status
    status          TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    payment_status  TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_runner_reg_event_id   ON runner_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_runner_reg_booking_id ON runner_registrations(booking_id);
CREATE INDEX IF NOT EXISTS idx_runner_reg_user_id    ON runner_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_runner_reg_email      ON runner_registrations(email);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_runner_registration_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_runner_reg_updated_at ON runner_registrations;
CREATE TRIGGER trg_runner_reg_updated_at
    BEFORE UPDATE ON runner_registrations
    FOR EACH ROW EXECUTE FUNCTION update_runner_registration_updated_at();

-- =============================================================
-- 2. REGISTRATION FIELDS TABLE
--    Stores organiser-defined custom form fields per event.
--    When organiser adds a new field via the panel, an API call
--    inserts/upserts a row here AND updates dynamic_config.form_fields.
-- =============================================================
CREATE TABLE IF NOT EXISTS registration_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    field_key       TEXT NOT NULL,     -- unique key per event e.g. "gender", "tshirt_size"
    label           TEXT NOT NULL,     -- display label e.g. "Gender", "T-Shirt Size"
    field_type      TEXT NOT NULL DEFAULT 'text'
                    CHECK (field_type IN ('text', 'email', 'phone', 'number', 'select', 'date', 'textarea', 'checkbox')),
    options         JSONB,             -- for select: ["Male","Female","Other"]
    is_required     BOOLEAN DEFAULT false,
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(event_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_reg_fields_event_id ON registration_fields(event_id);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS trg_reg_fields_updated_at ON registration_fields;
CREATE TRIGGER trg_reg_fields_updated_at
    BEFORE UPDATE ON registration_fields
    FOR EACH ROW EXECUTE FUNCTION update_runner_registration_updated_at();

-- =============================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE runner_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_fields   ENABLE ROW LEVEL SECURITY;

-- runner_registrations: users can read their own, organisers can read their event's
DROP POLICY IF EXISTS "users_read_own_registrations"    ON runner_registrations;
DROP POLICY IF EXISTS "service_manage_registrations"    ON runner_registrations;
DROP POLICY IF EXISTS "public_read_reg_fields"          ON registration_fields;
DROP POLICY IF EXISTS "service_manage_reg_fields"       ON registration_fields;

CREATE POLICY "users_read_own_registrations"
    ON runner_registrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "service_manage_registrations"
    ON runner_registrations FOR ALL
    USING (true) WITH CHECK (true);   -- service role bypasses RLS

CREATE POLICY "public_read_reg_fields"
    ON registration_fields FOR SELECT
    USING (is_active = true);

CREATE POLICY "service_manage_reg_fields"
    ON registration_fields FOR ALL
    USING (true) WITH CHECK (true);

-- =============================================================
-- 4. SEED DEFAULT FIELDS for existing marathon events
--    (backfill from existing dynamic_config.form_fields)
-- =============================================================
DO $$
DECLARE
    ev RECORD;
    field JSONB;
    field_order INT;
BEGIN
    FOR ev IN SELECT id, dynamic_config FROM events WHERE type = 'Marathon' LOOP
        field_order := 0;
        IF ev.dynamic_config IS NOT NULL AND ev.dynamic_config ? 'form_fields' THEN
            FOR field IN SELECT * FROM jsonb_array_elements(ev.dynamic_config->'form_fields') LOOP
                field_order := field_order + 1;
                INSERT INTO registration_fields (
                    event_id, field_key, label, field_type, options, is_required, sort_order
                ) VALUES (
                    ev.id,
                    LOWER(REGEXP_REPLACE(field->>'label', '\s+', '_', 'g')),
                    field->>'label',
                    COALESCE(field->>'type', 'text'),
                    CASE WHEN field ? 'options' THEN field->'options' ELSE NULL END,
                    COALESCE((field->>'required')::boolean, false),
                    field_order
                )
                ON CONFLICT (event_id, field_key) DO UPDATE
                    SET label      = EXCLUDED.label,
                        field_type = EXCLUDED.field_type,
                        options    = EXCLUDED.options,
                        is_required = EXCLUDED.is_required;
            END LOOP;
        END IF;
    END LOOP;
END $$;
