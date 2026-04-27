import { supabase } from '@/lib/supabase';
import Script from 'next/script';
import { notFound } from 'next/navigation';


export default async function ServiceLayout({ children, params }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Debug: ID Missing</h1>
                    <pre className="text-left bg-slate-50 p-4 rounded-xl text-xs">{JSON.stringify(resolvedParams, null, 2)}</pre>
                </div>
            </div>
        );
    }
    
    const { data: service } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Debug: Service Not Found</h1>
                    <p className="text-slate-500">ID from params: {id}</p>
                    <p className="text-slate-400 text-xs mt-2">Checking service_providers table...</p>
                </div>
            </div>
        );
    }

    const jsonLd = service ? {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.name,
        "description": service.about_me || service.description,
        "provider": {
            "@type": "LocalBusiness",
            "name": service.name,
            "image": service.portfolio ? service.portfolio[0] : "https://bookmyticket.net/logo.png"
        },
        "areaServed": {
            "@type": "Country",
            "name": "India"
        },
        "category": service.category
    } : null;

    return (
        <>
            {jsonLd && (
                <Script
                    id="service-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
