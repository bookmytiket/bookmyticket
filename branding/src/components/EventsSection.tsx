"use client";

import Reveal from "./Reveal";
import { Music, Landmark, Trophy, Palette, Globe, PartyPopper } from "lucide-react";

const categories = [
  { name: "Music Festivals", icon: Music, color: "bg-pink-100 text-pink-600" },
  { name: "Tech Conferences", icon: Globe, color: "bg-blue-100 text-blue-600" },
  { name: "Sports Events", icon: Trophy, color: "bg-green-100 text-green-600" },
  { name: "Art Exhibitions", icon: Palette, color: "bg-purple-100 text-purple-600" },
  { name: "Workshops", icon: Landmark, color: "bg-yellow-100 text-yellow-600" },
  { name: "Social Mixers", icon: PartyPopper, color: "bg-orange-100 text-orange-600" },
];

export default function EventsSection() {
  return (
    <section className="py-24 bg-[#FFF9F5] dark:bg-zinc-900/50 relative overflow-hidden">
      {/* Decorative Floating Shape */}
      <div className="absolute top-1/4 right-10 w-32 h-32 bg-[#FDE68A] blur-[40px] rounded-full opacity-30 animate-pulse pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="px-4 py-1.5 rounded-full bg-[#fce7f3] text-[#be185d] text-xs font-bold uppercase tracking-widest mb-6 inline-block">
              Events
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Events You Can Sponsor or <br/> Distribute Coupons In
            </h2>
            <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
              Browse through a wide range of event categories to find the perfect match 
              for your brand's distribution goals.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="group bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all cursor-pointer">
                <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-gray-500">Discover premium sponsorship opportunities in {cat.name.toLowerCase()}.</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 text-center">
            <button className="bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-bold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-brand-indigo/20 transition-all active:scale-95">
              Explore All Categories
            </button>
        </div>
      </div>
    </section>
  );
}
