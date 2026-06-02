import { createClient } from '@supabase/supabase-js';
import MarathonRegistrationClient from './MarathonRegistrationClient';
import { redirect } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const metadata = {
  title: 'Register for Marathon | BookMyTicket',
};

export default async function MarathonRegistrationPage({ params }) {
  const { slug } = await params;

  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
    let mQuery = supabase.from('marathon_events').select('*');
    mQuery = isUuid ? mQuery.eq('id', slug) : mQuery.eq('slug', slug);
    const { data: marathon } = await mQuery.maybeSingle();

    if (!marathon) {
      const { data: evt } = await supabase
        .from('events')
        .select('*')
        .eq(isUuid ? 'id' : 'slug', slug)
        .eq('type', 'Marathon')
        .maybeSingle();

      if (!evt) return redirect('/');
      Object.assign(marathon || {}, evt);
    }

    const marathonId = marathon?.id;

    const [catsRes, formFieldsRes] = await Promise.all([
      supabase.from('marathon_categories').select('*').eq('marathon_id', marathonId).order('distance_km'),
      supabase.from('registration_fields').select('*').eq('event_id', marathonId).order('sort_order'),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const categories = (catsRes.data || []).map(cat => {
      const isEarlyBird = cat.early_bird_start && cat.early_bird_end
        && today >= cat.early_bird_start && today <= cat.early_bird_end;
      return { ...cat, effective_price: isEarlyBird ? cat.early_bird_price : cat.price, is_early_bird: isEarlyBird };
    });

    return (
      <MarathonRegistrationClient
        marathon={marathon}
        categories={categories}
        customFields={formFieldsRes.data || []}
        slug={slug}
      />
    );
  } catch (err) {
    console.error('[MarathonRegistrationPage]', err);
    return <div className="text-white p-8">Error loading registration. Please try again.</div>;
  }
}
