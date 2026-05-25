require('dotenv').config({ path: '.env.local' });
console.log("Postgres string available?", !!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL);
