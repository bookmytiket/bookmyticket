"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';

export default function MaintenanceGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const [maintenanceActive, setMaintenanceActive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkMaintenance = async () => {
            // Bypass for certain routes
            const isBypassRoute = 
                pathname === '/maintenance' || 
                pathname.startsWith('/signin') || 
                pathname.startsWith('/api') ||
                pathname.startsWith('/admin') ||
                pathname.startsWith('/reset-password'); // Important for current user tasks

            if (isBypassRoute) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('systemConfig')
                    .select('maintenance_mode')
                    .maybeSingle();

                if (data?.maintenance_mode) {
                    // Check if current user is admin
                    if (!user || user.role !== 'admin') {
                        setMaintenanceActive(true);
                        router.replace('/maintenance');
                    } else {
                        setMaintenanceActive(false);
                    }
                } else {
                    setMaintenanceActive(false);
                }
            } catch (err) {
                console.error("Maintenance check error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            checkMaintenance();
        }
    }, [pathname, user, authLoading, router]);

    // Simple loading or blank state while checking
    if (loading && pathname !== '/maintenance') {
        return null;
    }

    // Only prevent rendering if maintenance is active and user is NOT admin and NOT on a bypass route
    if (maintenanceActive && pathname !== '/maintenance' && user?.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
}
