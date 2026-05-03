import Link from 'next/link';
import { INDIAN_STATES, INDIAN_DISTRICTS } from '@/app/data/indianLocations';
import { notFound } from 'next/navigation';

export default function StatePage({ params }) {
  const { state: stateSlug } = params;
  const state = INDIAN_STATES.find(s => s.slug === stateSlug);
  
  if (!state) notFound();

  const districts = INDIAN_DISTRICTS[stateSlug] || [];

  return (
    <main className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/india" className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 block hover:text-slate-900">← Back to India</Link>
        <h1 className="text-4xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Explore {state.name}</h1>
        
        {districts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {districts.map(district => (
              <Link 
                key={district} 
                href={`/india/${stateSlug}/${district}`}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:scale-105 transition-transform font-bold text-slate-600 hover:text-blue-500 capitalize"
              >
                {district.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[2rem] text-center border border-slate-100">
            <p className="text-slate-400 font-bold">Discover events and professional services coming soon to {state.name}.</p>
          </div>
        )}
      </div>
    </main>
  );
}
