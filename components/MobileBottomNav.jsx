"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, Ticket, User, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/#explore-popular-events', label: 'Events', icon: Calendar },
  { href: '/profile?tab=my_booking', label: 'Tickets', icon: Ticket, isAction: true }, // Special handling for Tickets
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="mobile-bottom-nav">
      <div className="bottom-nav-container">
        {/* Home */}
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <Home size={22} className="nav-icon" />
          <span className="nav-label">Home</span>
        </Link>

        {/* Events */}
        <Link href="/#explore-popular-events" className={`nav-item ${pathname.includes('#explore') ? 'active' : ''}`}>
          <Calendar size={22} className="nav-icon" />
          <span className="nav-label">Events</span>
        </Link>

        {/* Floating Book Now Action */}
        <div className="nav-item-action">
          <button 
            onClick={() => router.push('/#explore-popular-events')}
            className="book-now-floating"
          >
            <div className="book-now-inner">
              <span className="book-now-text">Book</span>
              <span className="book-now-subtext">Now</span>
            </div>
          </button>
        </div>

        {/* Tickets */}
        <Link href="/profile?tab=my_booking" className={`nav-item ${pathname.includes('my_booking') ? 'active' : ''}`}>
          <Ticket size={22} className="nav-icon" />
          <span className="nav-label">Tickets</span>
        </Link>

        {/* Profile */}
        <Link href="/profile" className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
          <User size={22} className="nav-icon" />
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
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          z-index: 900;
          padding-bottom: env(safe-area-inset-bottom, 20px);
          display: none;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.08);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block;
          }
        }

        .bottom-nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 85px;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 25px; /* More side padding */
          gap: 35px; /* Even larger gap */
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #64748b;
          height: 100%;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding-top: 5px;
          min-width: 50px;
        }

        .nav-item.active {
          color: #f84464;
          transform: translateY(-2px);
        }

        .nav-icon {
          margin-bottom: 6px; /* More space */
          stroke-width: 2.5px;
        }

        .nav-label {
          font-size: 11px; /* Larger font */
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          white-space: nowrap;
          opacity: 0.9;
        }

        .nav-item-action {
          flex: 1.5; /* More space for center button */
          display: flex;
          justify-content: center;
          position: relative;
        }

        .book-now-floating {
          width: 72px; /* Larger button */
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f844a4 0%, #a855f7 100%);
          border: 5px solid #fff;
          box-shadow: 0 10px 25px rgba(248, 68, 164, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(-25px);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .book-now-floating:active {
          transform: translateY(-22px) scale(0.9);
        }

        .book-now-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }

        .book-now-text {
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .book-now-subtext {
          color: rgba(255, 255, 255, 0.95);
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          margin-top: 2px;
        }
      `}</style>
    </nav>
  );
}
