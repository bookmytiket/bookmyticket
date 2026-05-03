import { createClient } from "@supabase/supabase-js";
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Initialize Admin client safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * Optimized metadata for service category pages.
 * Drives organic growth for local service searches like "Mehendi artist in Chennai".
 */
export async function generateMetadata({ params }) {
    const { category, city } = await params;
    const readableCategory = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const readableCity = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const title = `Best ${readableCategory} in ${readableCity} | Reviews & Booking | BookMyTicket`;
    const description = `Discover and book top-rated ${readableCategory} professionals in ${readableCity}. View portfolios, verified reviews, and instant pricing on BookMyTicket.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://bookmyticket.net/services/in/${category}/${city}`,
        },
        alternates: {
            canonical: `https://bookmyticket.net/services/in/${category}/${city}`,
        }
    };
}

/**
 * Service Location Landing Page (SEO Gold)
 * This page ranks for high-intent local service keywords.
 */
export default async function ServiceLocationPage({ params }) {
    const { category, city } = await params;
    const readableCategory = category.replace(/-/g, ' ');
    const readableCity = city.replace(/-/g, ' ');

    // Fetch verified professionals matching the criteria
    const vendors = supabaseAdmin ? (await supabaseAdmin
        .from('service_providers')
        .select('*')
        .ilike('category', `%${readableCategory}%`)
        .ilike('city', `%${readableCity}%`)
        .in('status', ['Active', 'Approved', 'KYC Completed'])
        .limit(50)).data : [];

    return (
        <main className="min-h-screen bg-slate-50">
            {/* SEO Optimized Header */}
            <section className="bg-slate-900 py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-600/10 opacity-50" />
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter leading-tight">
                        Top <span className="text-pink-500">{readableCategory}s</span> <br />
                        in {readableCity}
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {vendors?.length || 0} Verified Professionals Found in your region
                    </p>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Grid of Service Providers */}
                    {vendors && vendors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {vendors.map(vendor => (
                                <div key={vendor.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-4">{vendor.category}</div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-pink-500 transition-colors">{vendor.business_name || vendor.name}</h2>
                                    <p className="text-slate-500 font-medium text-sm mb-8 line-clamp-3 leading-relaxed">{vendor.bio || `Premium ${vendor.category} professional serving ${vendor.city}.`}</p>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verified Profile</div>
                                        <Link 
                                            href={`/services/${vendor.id}`} 
                                            className="py-3 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
                                        >
                                            View Booking
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <div className="text-5xl mb-6">🏙️</div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Coming Soon to {readableCity}</h2>
                            <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto">
                                We are currently onboarding the best {readableCategory}s in this area. Check back soon or browse neighboring cities.
                            </p>
                            <Link href="/services" className="inline-block mt-8 text-pink-500 font-black uppercase tracking-widest text-xs">
                                ← Explore All Services
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* SEO Footer Context */}
            <section className="py-20 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-6 text-slate-600">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">How to Book a {readableCategory} in {readableCity}?</h2>
                    <div className="prose prose-slate max-w-none space-y-6">
                        <p>Finding a reliable <strong>{readableCategory}</strong> in <strong>{readableCity}</strong> is now easier than ever with BookMyTicket. Our platform connects you with verified professionals who have been handpicked for their quality and reliability.</p>
                        <p>Simply browse the listings above, view their portfolios and pricing, and book your appointment directly through our secure platform. We handle the logistics so you can focus on enjoying your event.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
