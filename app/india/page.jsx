import Link from 'next/link';
import { INDIAN_STATES } from '@/app/data/indianLocations';

export default function IndiaPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Events & Services across India</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INDIAN_STATES.map(state => (
            <Link 
              key={state.slug} 
              href={`/india/${state.slug}`}
              className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:scale-105 transition-transform font-bold text-slate-600 hover:text-pink-500"
            >
              {state.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
