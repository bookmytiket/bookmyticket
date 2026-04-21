import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBrandingBucket() {
  const { data, error } = await supabase.storage.createBucket('branding', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
    fileSizeLimit: 5242880 // 5MB
  });
  
  if (error) {
    console.error('Error creating bucket:', error);
  } else {
    console.log('Bucket created:', data);
  }
}

createBrandingBucket();
