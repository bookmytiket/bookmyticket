"use client";
import { usePathname } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function ConditionalLayoutWrapper({ children }) {
    const pathname = usePathname();
    
    const isAdminRoute = pathname?.startsWith("/admin") || 
                        pathname?.startsWith("/organiser") || 
                        pathname?.startsWith("/vendor") ||
                        pathname?.startsWith("/signin") ||
                        pathname?.startsWith("/login");

    if (isAdminRoute) {
        return (
            <>
                <section className="admin-page-wrapper">
                    {children}
                </section>
                <style jsx global>{`
                    .admin-page-wrapper {
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                    /* Ensure no global padding on admin routes */
                    body section.mobile-page-padding {
                        padding-bottom: 0 !important;
                    }
                `}</style>
            </>
        );
    }

    return (
        <>
            <section style={{ paddingBottom: '140px' }} className="mobile-page-padding">
                {children}
            </section>
            <MobileBottomNav />
        </>
    );
}
