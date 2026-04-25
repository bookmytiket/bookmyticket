import HomeClient from '@/components/HomeClient';
import Footer from '@/components/Footer';
import SubscriptionBanner from '@/components/SubscriptionBanner';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      {/* 
        🎬 CINEMATIC VIDEO FIRST
        The HomeClient contains the VideoHeroBanner at its top.
        This ensures a high-impact, visual first impression.
      */}
      <HomeClient />

      {/* 
        📊 SEO FOUNDATION BLOCK (SERVER-SIDE)
        This block ensures the 85+ SEO score by providing:
        - H1 heading (BookMyTicket – Book Events, Turf & Professional Services)
        - H2/H3 structure
        - 500+ words of rich content
        - Internal link matrix
      */}
      <div style={{ backgroundColor: '#ffffff', padding: '100px 0', borderTop: '1px solid #e2e8f0' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 900, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              BookMyTicket – <br />
              <span style={{ background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Book Events, Turf & Services
              </span>
            </h1>
            <p style={{ fontSize: '20px', color: '#475569', lineHeight: 1.6, maxWidth: '850px', marginBottom: '40px', fontWeight: 500 }}>
              BookMyTicket helps you discover and book live events, sports turf slots, and professional services near you. 
              Find concerts, local events, and trusted service providers easily in India's top cities.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { name: 'Browse Events', url: '/events' },
                { name: 'Find Services', url: '/services' },
                { name: 'Events in Coimbatore', url: '/events/in/coimbatore' },
                { name: 'Book Turf Slots', url: '/events?category=Sports' },
                { name: 'Join Now', url: '/become-partner' }
              ].map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  style={{ 
                    padding: '8px 20px', 
                    borderRadius: '100px', 
                    background: '#f1f5f9', 
                    color: '#475569', 
                    textDecoration: 'none', 
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'inline-block'
                  }}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '20px' }}>Online Event Ticketing</h2>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8 }}>
                BookMyTicket is the premier destination for **online ticket sales** in India. We help fans find the best **concerts near me**, live shows, and community events with the **lowest platform fees**. Sell tickets online free with our advanced **event ticketing software**.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '24px', marginBottom: '12px' }}>Events in Coimbatore & Chennai</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                Discover regional theaters, local art exhibits, and sports matches. Whether it's a cricket tournament in Coimbatore or a music gala in Chennai, BookMyTicket is your trusted partner.
              </p>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '20px' }}>Sports Turf Booking</h2>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8 }}>
                Looking to play? Our platform offers the easiest way to **book cricket turfs**, football grounds, and badminton courts. Get real-time availability and instant confirmation for the top sports venues in **Hyderabad, Bangalore, and Chennai**.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '24px', marginBottom: '12px' }}>Best Sports Venues Near You</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                We partner with top-rated sports facilities across India to ensure you play on the best surfaces. From floodlit night matches to weekend morning drills, find the perfect slot today.
              </p>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '20px' }}>Professional Services</h2>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8 }}>
                Beyond tickets, we connect you with **professional artist booking** services. Hire verified Mehendi artists, wedding photographers, and event planners. Browse portfolios and book experts directly on **BookMyTicket**.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '24px', marginBottom: '12px' }}>Verified & Rated Providers</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                Every service provider on our platform undergoes a verification process. Read real reviews, browse portfolios, and book with confidence knowing you are getting the best talent in the industry.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '80px', padding: '60px', backgroundColor: '#f8fafc', borderRadius: '48px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '24px' }}>Why Choose BookMyTicket?</h2>
            <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.8, margin: 0 }}>
              BookMyTicket is a complete platform for **event booking, turf reservations, and professional services**. 
              Whether you are looking for concerts, sports venues, or service providers, we make booking simple and fast. 
              Our mission is to bring people together through shared experiences and reliable service connections. 
              With the lowest platform fees and a 24/7 support team, we are committed to being India's most trusted booking destination.
            </p>
          </div>
        </div>
      </div>
      <SubscriptionBanner />
      <Footer />
    </>
  );
}
