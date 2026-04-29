const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase.rpc('inspect_table', { table_name: 'job_applications' });
  // If rpc doesn't exist, we'll try a simple query and check the returned fields
  if (error) {
    const { data: sample, error: sampleError } = await supabase.from('job_applications').select('*').limit(1);
    if (sampleError) {
      console.log("Error querying job_applications:", sampleError.message);
    } else {
      console.log("Columns in job_applications:", Object.keys(sample[0] || {}));
    }
  } else {
    console.log("Schema info:", data);
  }
}

checkSchema();
