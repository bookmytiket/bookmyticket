"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export const eventCategories = [
  { id: "music", name: "Music Concerts", icon: "🎵", description: "Live performances, bands, and solo artists" },
  { id: "marathon", name: "Marathons", icon: "🏃", description: "Running events, relays, and triathlons" },
  { id: "tournament", name: "Tournaments", icon: "🏆", description: "Knockout matches, team sports, leagues" },
  { id: "competition", name: "Competitions", icon: "⚔️", description: "Athletic competitions and challenges" },
  { id: "coaching", name: "Coaching", icon: "🏅", description: "Sports camps and training clinics" },
  { id: "racing", name: "Racing", icon: "🏎️", description: "Track racing, motorsports, and karting" },
  { id: "college", name: "College Events", icon: "🎓", description: "Fests, competitions, and college gatherings" },
  { id: "conference", name: "Conferences & Seminars", icon: "🎤", description: "Tech talks, business summits, and workshops" },
  { id: "theatre", name: "Theatre & Cultural Shows", icon: "🎭", description: "Plays, standup comedy, and cultural performances" },
  { id: "festival", name: "Festivals & Celebrations", icon: "🎉", description: "Food fests, new year parties, and seasonal celebrations" },
  { id: "corporate", name: "Corporate Events", icon: "🏢", description: "Networking, team building, and corporate retreats" }
];

export default function CategorySelection({ onSelectCategory }) {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight">
          Select Event Category
        </h2>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
          Choose the best category for your event to get a customized form tailored to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventCategories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.03, translateY: -5 }}
            onClick={() => onSelectCategory(cat.id)}
            className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-pink-500 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all group flex flex-col h-full"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 group-hover:bg-pink-50 flex items-center justify-center text-4xl mb-6 transition-colors shadow-inner border border-slate-100 group-hover:border-pink-200">
              {cat.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{cat.name}</h3>
            <p className="text-slate-500 text-sm font-medium mb-6 flex-1">
              {cat.description}
            </p>
            <div className="mt-auto flex items-center text-pink-500 font-bold text-sm tracking-wide group-hover:text-pink-600">
              <span>Create {cat.name.split(' ')[0]}</span>
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
