-- Add phone support to OTPS table
ALTER TABLE public."otps" ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public."otps" DROP CONSTRAINT IF EXISTS "otps_email_key"; -- Prevent unique email constraint if we use phone
