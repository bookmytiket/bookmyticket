const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'ajayrathinam1998@gmail.com');
  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'TempPassword123!'
    });
    console.log("Password updated successfully:", data, error);
  } else {
    console.log("User not found!");
  }
}
run();
