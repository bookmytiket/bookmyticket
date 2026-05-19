const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; // standard local supabase
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.bulk_discounts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          min_tickets INTEGER NOT NULL DEFAULT 1,
          max_tickets INTEGER,
          discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
          discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
          event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      ALTER TABLE public.bulk_discounts ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Enable read access for all users" ON public.bulk_discounts;
      CREATE POLICY "Enable read access for all users" ON public.bulk_discounts
          FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Enable all access for admins" ON public.bulk_discounts;
      CREATE POLICY "Enable all access for admins" ON public.bulk_discounts
          FOR ALL USING (
              EXISTS (
                  SELECT 1 FROM public.profiles 
                  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
              )
          );
    `);

    // Only insert if empty to prevent duplicates running this twice
    await client.query(`
      INSERT INTO public.bulk_discounts (name, min_tickets, discount_type, discount_value)
      SELECT '10% Off for 5+ Tickets', 5, 'percentage', 10
      WHERE NOT EXISTS (SELECT 1 FROM public.bulk_discounts WHERE name = '10% Off for 5+ Tickets');
      
      INSERT INTO public.bulk_discounts (name, min_tickets, discount_type, discount_value)
      SELECT '15% Off for 10+ Tickets', 10, 'percentage', 15
      WHERE NOT EXISTS (SELECT 1 FROM public.bulk_discounts WHERE name = '15% Off for 10+ Tickets');
    `);

    console.log('Database migrated successfully!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    await client.end();
  }
}
run();
