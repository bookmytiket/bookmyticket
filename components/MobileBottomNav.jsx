"use client";
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, Calendar, Ticket, User } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const handleBookNow = () => {
    // If we're on a turf or service page, scroll to booking section
    if (pathname.includes('/turfs/') || pathname.includes('/services/')) {
      const section = document.getElementById('booking-section') || document.getElementById('booking-form');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // If we're on an event detail page, route to the event book page
    if (pathname.includes('/events/detail')) {
      const eventId = searchParams.get('id');
      if (eventId) {
        const bookUrl = `/events/book?id=${eventId}`;
        if (!user) {
          router.push(`/signin?redirect=${encodeURIComponent(bookUrl)}`);
        } else {
          router.push(bookUrl);
        }
        return;
      }
    }

    // Default behavior
    if (!user) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    } else {
      router.push('/#explore-popular-events');
    }
  };

  const isBookHidden = pathname.includes('/events/book') || pathname.includes('/checkout');

  return (
    <nav className="mobile-bottom-nav">
      <div className="bottom-nav-container">
        {/* Column 1: Home */}
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <Home size={20} strokeWidth={2.5} className="nav-icon" />
          <span className="nav-label">Home</span>
        </Link>

        {/* Column 2: Events */}
        <Link href="/#explore-popular-events" className={`nav-item ${pathname.includes('#explore') || pathname.includes('/events') && !pathname.includes('/events/book') ? 'active' : ''}`}>
          <Calendar size={20} strokeWidth={2.5} className="nav-icon" />
          <span className="nav-label">Events</span>
        </Link>

        {/* Column 3: Floating Action Button */}
        <div className="nav-item-action">
          {!isBookHidden && (
            <button 
              onClick={handleBookNow}
              className="book-now-floating"
              aria-label="Book Now"
            >
              <span className="book-now-text">Book</span>
              <span className="book-now-subtext">Now</span>
            </button>
          )}
        </div>

        {/* Column 4: Tickets */}
        <Link 
          href={user ? "/profile?tab=my_booking" : `/signin?redirect=${encodeURIComponent('/profile?tab=my_booking')}`} 
          className={`nav-item ${pathname.includes('my_booking') || (pathname.includes('/profile') && searchParams.get('tab') === 'my_booking') ? 'active' : ''}`}
        >
          <Ticket size={20} strokeWidth={2.5} className="nav-icon" />
          <span className="nav-label">Tickets</span>
        </Link>

        {/* Column 5: Profile */}
        <Link 
          href={user ? "/profile" : "/signin?redirect=/profile"} 
          className={`nav-item ${pathname === '/profile' && !searchParams.get('tab') ? 'active' : ''}`}
        >
          <User size={20} strokeWidth={2.5} className="nav-icon" />
          <span className="nav-label">Profile</span>
        </Link>
      </div>

      <style jsx>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 10000;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          display: none;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block;
          }
        }

        .bottom-nav-container {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: center;
          height: 60px;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 0 8px;
          box-sizing: border-box;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #94a3b8;
          height: 100%;
          width: 100%;
          transition: color 0.2s ease, transform 0.1s ease;
          cursor: pointer;
        }

        .nav-item:active {
          transform: scale(0.95);
        }

        .nav-item.active {
          color: #f84464;
        }

        .nav-icon {
          margin-bottom: 4px;
          transition: transform 0.2s ease;
        }

        .nav-item.active .nav-icon {
          transform: scale(1.05);
        }

        .nav-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }

        .nav-item-action {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .book-now-floating {
          position: absolute;
          top: -24px;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f844a4 0%, #a855f7 100%);
          border: 4px solid #fff;
          box-shadow: 0 8px 24px rgba(248, 68, 164, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          outline: none;
          z-index: 10001;
        }

        .book-now-floating:active {
          transform: scale(0.9) translateY(2px);
          box-shadow: 0 4px 12px rgba(248, 68, 164, 0.3);
        }

        .book-now-text {
          color: #fff;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1;
        }

        .book-now-subtext {
          color: rgba(255, 255, 255, 0.9);
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          margin-top: 1px;
          line-height: 1;
        }
      `}</style>
    </nav>
  );
}
