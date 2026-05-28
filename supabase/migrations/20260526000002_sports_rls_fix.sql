-- Fix RLS Policies for Competition and Sports tables to allow Organisers to manage their own event data

-- Policy for sports_events
ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organiser can manage sports_events" ON sports_events
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = sports_events.event_id AND events.organiser_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = sports_events.event_id AND events.organiser_id = auth.uid())
);

-- Policy for competition_categories
CREATE POLICY "Organiser can manage competition_categories" ON competition_categories
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = competition_categories.event_id AND events.organiser_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = competition_categories.event_id AND events.organiser_id = auth.uid())
);

-- Policy for competition_events
CREATE POLICY "Organiser can manage competition_events" ON competition_events
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = competition_events.event_id AND events.organiser_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = competition_events.event_id AND events.organiser_id = auth.uid())
);

-- Also add policy for registration_fields
ALTER TABLE registration_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organiser can manage registration_fields" ON registration_fields
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = registration_fields.event_id AND events.organiser_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = registration_fields.event_id AND events.organiser_id = auth.uid())
);

-- Public read for registration_fields
CREATE POLICY "Public read registration_fields" ON registration_fields FOR SELECT USING (true);
