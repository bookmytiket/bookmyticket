"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/organiser") || pathname?.startsWith("/signin") || pathname?.startsWith("/login") || pathname?.startsWith("/movies")) return null;
    return <Navbar />;
}
