import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/Footer';

// Helper to parse dates
const parseEventDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    let dt = String(dateStr).trim();
    if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
        const separator = dt.includes('/') ? '/' : '-';
        const [day, month, year] = dt.split(separator);
        dt = `${year}-${month}-${day}`;
    }
    const eventDate = new Date(`${dt}T${timeStr || '00:00'}`);
    return isNaN(eventDate.getTime()) ? null : eventDate;
  } catch (e) { return null; }
};

export async function generateMetadata({ params }) {
  const { city } = await params;
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
  
  // Fetch SEO config
  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'seo_analytics')
    .single();
  
  const config = data?.value || {};
  const override = config.city_seo_overrides?.[city.toLowerCase()];

  return {
    title: override?.title || `Events, Movies, Plays, Sports & Activities in ${capitalizedCity} - BookMyTicket ${capitalizedCity}`,
    description: override?.description || `BookMyTicket offers upcoming events, showtimes, concert tickets, and cultural activities near ${capitalizedCity}. Explore promotional offers and book tickets online for the best experiences in ${capitalizedCity}.`,
    keywords: override?.keywords || `events in ${city}, movie tickets ${city}, bookmyshow ${city}, movie ticket discounts ${city}, bookmyticket ${city}`,
    alternates: {
      canonical: `https://bookmyticket.net/events/in/${city.toLowerCase()}`,
    }
  };
}

export default async function CityEventsPage({ params }) {
  const { city } = await params;
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
  
  // Fetch SEO config
  const { data: configData } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'seo_analytics')
    .single();
  
  const config = configData?.value || {};
  const override = config.city_seo_overrides?.[city.toLowerCase()];

  // Fetch events from Supabase
  const { data: events = [] } = await supabase
    .from('events')
    .select('*')
    .or(`city.ilike.%${city}%,location.ilike.%${city}%,venue.ilike.%${city}%`)
    .order('date', { ascending: true });

  const activeEvents = (events || []).filter(ev => {
    const s = String(ev.status || '').toLowerCase();
    if (s === "inactive" || s === "expired" || s === "draft") return false;
    
    // Check if event belongs to this city (robust check)
    const cityLower = city.toLowerCase();
    const inTopLevel = ev.city?.toLowerCase().includes(cityLower) || 
                       ev.location?.toLowerCase().includes(cityLower) || 
                       ev.venue?.toLowerCase().includes(cityLower);
    const inDynConfig = ev.dynamic_config?.location?.city?.toLowerCase() === cityLower;
    
    if (!inTopLevel && !inDynConfig) return false;

    const eventDate = parseEventDate(ev.date, ev.time);
    return !eventDate || eventDate >= new Date();
  });

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://bookmyticket.net"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Events",
                "item": "https://bookmyticket.net/events"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": capitalizedCity,
                "item": `https://bookmyticket.net/events/in/${city.toLowerCase()}`
              }
            ]
          })
        }}
      />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px' }}>
        <div style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
            ← Back to Home
          </Link>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            {override?.h1 || <>Exciting Events in <span style={{ background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{capitalizedCity}</span></>}
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', marginTop: '12px', maxWidth: '600px' }}>
            {override?.subheading || `Showing ${activeEvents.length} upcoming events happening in ${capitalizedCity}. Book your tickets now for the best experiences.`}
          </p>
        </div>

        {activeEvents.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {activeEvents.map(event => (
              <Link key={event.id} href={`/events/detail?id=${event.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', 
                  border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ height: '180px', position: 'relative' }}>
                    <img 
                      src={event.img || event.bannerPreview || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&fit=crop'} 
                      alt={event.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#f84464', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                      {event.category || 'Event'}
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px', lineHeight: 1.3 }}>{event.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>📅 {event.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>📍 {event.venue || event.location}</span>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#f84464' }}>{event.price === 0 ? 'FREE' : `₹${event.price || 'TBA'}`}</span>
                      <button style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>Book Now</button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏙️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>No events listed for {capitalizedCity} yet</h2>
            <p style={{ color: '#64748b', maxWidth: '400px', margin: '12px auto' }}>
              We're constantly adding new events. Check back soon or explore events in nearby cities.
            </p>
            <Link href="/" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', background: '#f84464', color: '#fff', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
              Explore All Events
            </Link>
          </div>
        )}

        {/* Local SEO Content */}
        <section style={{ marginTop: '80px', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>
            {override?.about_title || `Discover the Best Experiences in ${capitalizedCity}`}
          </h2>
          {override?.about_content ? (
            <div 
              style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: override.about_content }} 
            />
          ) : (
            <>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.8, marginBottom: '20px' }}>
                {capitalizedCity} is a vibrant city with a rich cultural scene and a wide variety of activities. From international music tours and local theatrical performances to high-adrenaline sports and networking workshops, there is always something happening in the heart of {capitalizedCity}.
              </p>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.8 }}>
                At BookMyTicket, we make it our mission to connect you with the most memorable events in {capitalizedCity}. Our platform provides a secure and easy way to browse upcoming schedules, compare ticket prices, and secure your spot at the most anticipated shows in town. Whether you're a resident or just visiting, explore {capitalizedCity} like never before with BookMyTicket.
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
