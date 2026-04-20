"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Ticket, User, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/#explore-popular-events', label: 'Events', icon: Calendar },
  { href: '/profile?tab=my_booking', label: 'Tickets', icon: Ticket },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      <div className="bottom-nav-container">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.label} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="icon-wrapper"
              >
                <Icon size={22} className="nav-icon" strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="nav-indicator"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <style jsx>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          z-index: 9999;
          padding-bottom: env(safe-area-inset-bottom, 10px);
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block;
          }
        }

        .bottom-nav-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 65px;
          max-width: 500px;
          margin: 0 auto;
        }

        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #64748b;
          position: relative;
          transition: all 0.2s ease;
        }

        .nav-item.active {
          color: #f84464;
        }

        .icon-wrapper {
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .nav-icon {
          z-index: 2;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .nav-indicator {
          position: absolute;
          width: 35px;
          height: 35px;
          background: rgba(248, 68, 100, 0.1);
          border-radius: 12px;
          z-index: 1;
        }
      `}</style>
    </nav>
  );
}
