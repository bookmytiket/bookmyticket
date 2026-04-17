-- Migration to unify event status states to 'published', 'draft', and 'expired'

-- First, convert 'Active' to 'published'
UPDATE events
SET status = 'published'
WHERE status = 'Active' OR status = 'active';

-- Next, convert 'Inactive' and similar variations to 'draft'
UPDATE events
SET status = 'draft'
WHERE status = 'Inactive' OR status = 'inactive' OR status = 'Draft';

-- Convert any existing 'Expired' to lowercase 'expired' for consistency
UPDATE events
SET status = 'expired'
WHERE status = 'Expired';
