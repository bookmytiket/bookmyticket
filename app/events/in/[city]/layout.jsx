import { supabase } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { city } = await params;
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);

  let title = `Best Events in ${capitalizedCity} - Book Tickets Online | BookMyTicket`;
  let description = `Discover upcoming concerts, comedy shows, sports events, and festivals in ${capitalizedCity}. Book your tickets instantly on BookMyTicket, the most trusted ticketing platform.`;
  let keywords = [`events in ${city}`, `book tickets ${city}`, `${city} concerts`, `${city} nightlife`, `things to do in ${city}`];

  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'seo_analytics')
      .single();

    if (data?.value?.city_seo_overrides?.[city.toLowerCase()]) {
      const override = data.value.city_seo_overrides[city.toLowerCase()];
      if (override.title) title = override.title;
      if (override.description) description = override.description;
      if (override.keywords) keywords = override.keywords.split(',').map(k => k.trim());
    }
  } catch (error) {
    console.error("Error fetching SEO overrides:", error);
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `Upcoming Events in ${capitalizedCity} | BookMyTicket`,
      description: description,
      url: `https://bookmyticket.net/events/in/${city}`,
    },
  };
}

export default function CityEventsLayout({ children }) {
  return <>{children}</>;
}
