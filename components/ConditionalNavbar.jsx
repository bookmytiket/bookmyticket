"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();
    
    const isMeetingRoute = pathname && /^\/[a-zA-Z0-9]{6,12}$/.test(pathname) && ![
        '/events', '/services', '/admin', '/organiser', '/vendor', '/signin', '/login', '/profile', '/movies', '/branding', '/advertising', '/checkout'
    ].includes(pathname);

    if (
        isMeetingRoute ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/organiser") ||
        pathname?.startsWith("/vendor") ||
        pathname?.startsWith("/signin") ||
        pathname?.startsWith("/login") ||
        pathname?.startsWith("/movies") ||
        pathname?.startsWith("/branding") ||
        pathname?.startsWith("/advertising") ||
        pathname?.startsWith("/events/detail") ||
        pathname?.startsWith("/events/book") ||
        pathname?.startsWith("/services/") ||
        pathname?.startsWith("/profile") ||
        pathname?.startsWith("/meeting") ||
        pathname?.includes("/checkout")
    ) {
        return null;
    }
    return <Navbar />;
}
