"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();
    
    const isMeetingRoute = pathname && /^\/[a-zA-Z0-9]{6,12}$/.test(pathname) && ![
        '/events', '/services', '/admin', '/organiser', '/vendor', '/signin', '/login', '/profile', '/movies', '/branding', '/advertising', '/checkout', '/careers', '/terms', '/privacy', '/about', '/contact'
    ].includes(pathname);

    if (
        isMeetingRoute ||
        pathname === '/services' ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/organiser") ||
        pathname?.startsWith("/vendor") ||
        pathname?.startsWith("/signin") ||
        pathname?.startsWith("/login") ||
        pathname?.startsWith("/movies") ||
        pathname?.startsWith("/branding") ||
        pathname?.startsWith("/advertising") ||
        pathname?.startsWith("/events") ||
        pathname?.startsWith("/services/") ||
        pathname?.startsWith("/profile") ||
        pathname?.startsWith("/meeting") ||
        pathname?.startsWith("/pwa-scan") ||
        pathname?.startsWith("/turfs") ||
        pathname?.startsWith("/reset-password") ||
        pathname?.startsWith("/careers") ||
        pathname?.startsWith("/terms") ||
        pathname?.startsWith("/privacy") || pathname === "/contact" ||
        pathname?.includes("/checkout")
    ) {
        return null;
    }
    return <Navbar />;
}
