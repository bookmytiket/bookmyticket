import { createClient } from '@supabase/supabase-js';
import MarathonEventClient from './MarathonEventClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
    let query = supabase.from('marathon_events').select('title, description, banner_image, venue, event_date');
    query = isUuid ? query.eq('id', slug) : query.eq('slug', slug);
    const { data } = await query.maybeSingle();
    if (!data) return { title: 'Marathon Event | BookMyTicket' };
    return {
      title: `${data.title} | BookMyTicket`,
      description: data.description?.substring(0, 160) || `Register for ${data.title} at ${data.venue}`,
      openGraph: {
        images: [{ url: data.banner_image }],
        title: data.title,
      },
    };
  } catch { return { title: 'Marathon Event | BookMyTicket' }; }
}

export default async function MarathonEventPage({ params }) {
  const { slug } = await params;

  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
    let mQuery = supabase.from('marathon_events').select('*');
    mQuery = isUuid ? mQuery.eq('id', slug) : mQuery.eq('slug', slug);
    const { data: marathon } = await mQuery.maybeSingle();

    if (!marathon) {
      // Try events table fallback
      const { data: evt } = await supabase
        .from('events')
        .select('*')
        .eq(isUuid ? 'id' : 'slug', slug)
        .eq('type', 'Marathon')
        .maybeSingle();

      if (!evt) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-black mb-4">Event Not Found</h1>
              <p className="text-slate-400">This marathon event does not exist or has been removed.</p>
            </div>
          </div>
        );
      }
    }

    const marathonId = marathon?.id;

    const [catsRes, spRes, benRes] = await Promise.all([
      supabase.from('marathon_categories').select('*').eq('marathon_id', marathonId).order('distance_km'),
      supabase.from('marathon_sponsors').select('*').eq('marathon_id', marathonId).order('rank_order'),
      supabase.from('marathon_benefits').select('*').eq('marathon_id', marathonId),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const categories = (catsRes.data || []).map(cat => {
      const isEarlyBird = cat.early_bird_start && cat.early_bird_end
        && today >= cat.early_bird_start && today <= cat.early_bird_end;
      return { ...cat, effective_price: isEarlyBird ? cat.early_bird_price : cat.price, is_early_bird: isEarlyBird };
    });

    return (
      <MarathonEventClient
        marathon={marathon}
        categories={categories}
        sponsors={spRes.data || []}
        benefits={benRes.data || []}
        slug={slug}
      />
    );
  } catch (err) {
    console.error('[MarathonEventPage]', err);
    return <div className="text-white p-8">Error loading event</div>;
  }
}
