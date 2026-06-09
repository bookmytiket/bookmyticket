import { useState, useEffect } from 'react';

export function useSocialLinks() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchLinks = async () => {
            try {
                const res = await fetch('/api/social-links');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setLinks(data);
                }
            } catch (err) {
                console.error("Failed to fetch social links", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchLinks();
        return () => { isMounted = false; };
    }, []);

    const trackClick = (platform, source) => {
        fetch('/api/social-links/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, source })
        }).catch(err => console.error("Track failed:", err));
    };

    return {
        links,
        loading,
        trackClick,
        navbarLinks: links.filter(l => l.show_in_navbar && l.is_enabled),
        footerLinks: links.filter(l => l.show_in_footer && l.is_enabled),
        eventLinks: links.filter(l => l.show_on_event_page && l.is_enabled),
        bookingLinks: links.filter(l => l.show_on_booking_success && l.is_enabled),
        whatsapp: links.find(l => l.platform === 'whatsapp' && l.is_enabled),
        instagram: links.find(l => l.platform === 'instagram' && l.is_enabled),
    };
}
