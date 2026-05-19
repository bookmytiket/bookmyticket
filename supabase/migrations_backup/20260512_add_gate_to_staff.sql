-- Enable Multi-Gate support for staff
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS gate_name TEXT;

-- Update existing staff entries if needed
COMMENT ON COLUMN public.staff.gate_name IS 'Specific entry gate assigned to this staff member for scanning.';
