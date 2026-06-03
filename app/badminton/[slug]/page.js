import { createClient } from '@supabase/supabase-js';
import { Trophy, Calendar, MapPin, Users, Award, Shield, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function generateMetadata({ params }) {
  const { slug } = params;
  const { data } = await supabase.from('badminton_events').select('event_name, description, banner_url').eq('slug', slug).single();
  return {
    title: data ? `${data.event_name} | BookMyTicket` : 'Badminton Championship',
    description: data?.description || 'Register for the badminton championship.',
    openGraph: { images: data?.banner_url ? [data.banner_url] : [] }
  };
}

export default async function BadmintonEventPage({ params }) {
  const { slug } = params;
  
  const { data: event, error } = await supabase
    .from('badminton_events')
    .select('*, badminton_categories(*), badminton_sponsors(*)')
    .eq('slug', slug)
    .single();

  if (error || !event) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-[#0f172a]">Event Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 font-sans selection:bg-pink-500/30">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent z-10" />
        {event.banner_url && (
          <Image 
            src={event.banner_url} 
            alt={event.event_name} 
            fill 
            className="object-cover opacity-70"
            priority
          />
        )}
        <div className="absolute bottom-0 left-0 w-full z-20 p-6 md:p-16 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
            <Trophy size={14} /> Official Championship
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none mb-6 text-shadow-xl">
            {event.event_name}
          </h1>
          <div className="flex flex-wrap gap-6 text-sm md:text-base font-bold text-slate-300">
            <div className="flex items-center gap-2"><Calendar className="text-pink-500" /> {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric'})}</div>
            <div className="flex items-center gap-2"><MapPin className="text-pink-500" /> {event.venue}, {event.city}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-30">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-16">
          {/* About */}
          <section>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span> About Event
            </h2>
            <div className="text-slate-400 leading-relaxed space-y-4 text-lg">
              {event.description?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {/* Highlights */}
          <section>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span> Tournament Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.highlight_feather_shuttle && <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4"><CheckCircle2 className="text-emerald-500" /> <span className="font-bold text-slate-200">Feather Shuttle Matches</span></div>}
              {event.highlight_knockout && <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4"><CheckCircle2 className="text-emerald-500" /> <span className="font-bold text-slate-200">Knockout Format</span></div>}
              {event.highlight_participation_medal && <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4"><CheckCircle2 className="text-emerald-500" /> <span className="font-bold text-slate-200">Participation Medals</span></div>}
              {event.highlight_bai_rules && <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4"><CheckCircle2 className="text-emerald-500" /> <span className="font-bold text-slate-200">BAI Rules Applied</span></div>}
              {event.highlight_live_scoring && <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4"><CheckCircle2 className="text-emerald-500" /> <span className="font-bold text-slate-200">Live Match Scoring</span></div>}
              {event.highlight_referee_monitoring && <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4"><CheckCircle2 className="text-emerald-500" /> <span className="font-bold text-slate-200">Official Referees</span></div>}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span> Categories
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {event.badminton_categories?.map(c => (
                <div key={c.id} className="bg-gradient-to-r from-[#0f172a] to-[#020817] border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-pink-500/30 transition-all">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">{c.category_name}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Users size={14} /> {c.gender}</span>
                      {c.age_rule && <span className="flex items-center gap-1"><Shield size={14} /> {c.age_rule}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Registration Fee</div>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                      ₹{c.registration_fee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sponsors */}
          {event.badminton_sponsors?.length > 0 && (
            <section>
              <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span> Sponsors & Partners
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {event.badminton_sponsors.map(s => (
                  <div key={s.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.sponsor_name} className="w-20 h-20 object-contain" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <Award size={32} />
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-black text-sm text-slate-200">{s.sponsor_name}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.sponsor_type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-gradient-to-b from-[#0f172a] to-[#020817] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Starts From</p>
              <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                ₹{Math.min(...(event.badminton_categories?.map(c => c.registration_fee) || [0]))}
              </h3>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Match Starts</span>
                <span className="font-bold text-slate-200">{event.match_start_time}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Reg Deadline</span>
                <span className="font-bold text-pink-500">{new Date(event.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>

            <Link href={`/badminton/${slug}/register`} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-pink-500/25 hover:-translate-y-1 transition-all duration-300">
              Register Now <ChevronRight size={18} />
            </Link>
            
            <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">
              Secure Checkout • Instant Confirmation
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
